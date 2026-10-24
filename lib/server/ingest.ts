import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Platform } from "../platforms";
import { audit } from "./approvals";
import { aiProvider, claude, MODEL } from "./claude";
import { openStructured } from "./open-llm";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { emails, payouts, type MailKind } from "./schema";
import { notify } from "./whatsapp";

export type InboundAttachment = { filename: string; mimeType: string; data: string /* base64 */ };

export type InboundEmail = {
  from: string;
  subject: string;
  text: string;
  receivedAt?: string;
  attachments?: InboundAttachment[];
  origin?: "paste" | "gmail";
  externalId?: string;
};

const PayoutSchema = z.object({
  is_payout: z.boolean().describe("True only if this email reports a restaurant payout or settlement"),
  platform: z.enum(["zomato", "swiggy", "other"]),
  period_label: z.string().describe("Settlement period as written, e.g. '7 to 13 Oct'"),
  gross: z.number().describe("Total order value / sales in rupees"),
  commission: z.number(),
  ads: z.number(),
  deductions: z.number().describe("Other deductions: cancellations, penalties, TDS, etc."),
  net: z.number().describe("Amount paid or to be paid to the restaurant"),
  status: z.enum(["upcoming", "credited"]),
  pay_date: z.string().describe("Payout date as YYYY-MM-DD"),
});
type ParsedPayout = z.infer<typeof PayoutSchema>;

const rupee = (label: RegExp, text: string) => {
  const m = text.match(new RegExp(label.source + String.raw`[^\d₹]*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)`, "i"));
  return m ? Math.round(Number(m[1].replace(/,/g, ""))) : null;
};

function platformFrom(from: string, text: string): Platform | null {
  const s = `${from} ${text}`.toLowerCase();
  if (s.includes("zomato")) return "zomato";
  if (s.includes("swiggy")) return "swiggy";
  return null;
}

/** Fast path for the common payout mail layout; returns null when it can't be sure. */
export function parsePayoutWithRules(mail: InboundEmail): ParsedPayout | null {
  const text = `${mail.subject}\n${mail.text}`;
  if (!/payout|settlement|payment advice/i.test(text)) return null;
  const platform = platformFrom(mail.from, text);
  const net = rupee(/(?:net payout|amount (?:credited|transferred|payable)|net settlement)/, text);
  const gross = rupee(/(?:total (?:order value|sales)|gross (?:sales|order value))/, text);
  if (!platform || net === null || gross === null) return null;
  const period = text.match(/(?:for|period)[:\s]+(\d{1,2}\s*\w{3}[^\n]*?(?:to|-|–)\s*\d{1,2}\s*\w{3})/i)?.[1] ?? "";
  const date = text.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? new Date().toISOString().slice(0, 10);
  return {
    is_payout: true,
    platform,
    period_label: period.replace(/\s*(?:-|–)\s*/, " to ").trim(),
    gross,
    commission: rupee(/commission/, text) ?? 0,
    ads: rupee(/(?:ads|advertis\w*|marketing)/, text) ?? 0,
    deductions: rupee(/(?:other deductions|deductions|penalt\w*|cancellation charges?)/, text) ?? 0,
    net,
    status: /credited|transferred|has been paid/i.test(text) ? "credited" : "upcoming",
    pay_date: date,
  };
}

// Attachments the AI can read: PDFs as documents (Claude only), CSV and plain text inline.
const readable = (a: InboundAttachment) => a.mimeType === "application/pdf" || a.mimeType === "text/csv" || a.mimeType === "text/plain" || /\.csv$/i.test(a.filename);

async function parsePayoutWithAI(mail: InboundEmail): Promise<ParsedPayout | null> {
  const open = aiProvider() === "open";
  // Open models take text only: CSV and plain-text attachments are inlined, PDFs are skipped.
  const files = (mail.attachments ?? []).filter(readable).filter((f) => !open || f.mimeType !== "application/pdf").slice(0, 3);
  if (open) {
    const parts = files.map((f) => `<attachment name="${f.filename}">\n${Buffer.from(f.data, "base64").toString("utf8").slice(0, 30000)}\n</attachment>`);
    const ask = `Extract the payout details from this email to an Indian restaurant${files.length ? " and its attachments" : ""}. Amounts are rupees as plain numbers. If it isn't a payout or settlement, set is_payout to false.\n\n${parts.join("\n")}\n<email>\nFrom: ${mail.from}\nSubject: ${mail.subject}\n\n${mail.text.slice(0, 20000)}\n</email>`;
    return openStructured(PayoutSchema, ask, undefined, 1500);
  }
  const content: Anthropic.ContentBlockParam[] = [];
  for (const f of files) {
    if (f.mimeType === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data }, title: f.filename });
    } else {
      content.push({ type: "text", text: `<attachment name="${f.filename}">\n${Buffer.from(f.data, "base64").toString("utf8").slice(0, 30000)}\n</attachment>` });
    }
  }
  content.push({
    type: "text",
    text: `Extract the payout details from this email to an Indian restaurant${files.length ? " and its attachments" : ""}. Amounts are rupees as plain numbers. If it isn't a payout or settlement, set is_payout to false.\n\n<email>\nFrom: ${mail.from}\nSubject: ${mail.subject}\n\n${mail.text.slice(0, 20000)}\n</email>`,
  });
  const res = await claude().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(PayoutSchema) },
    messages: [{ role: "user", content }],
  });
  if (res.stop_reason === "refusal") return null;
  return res.parsed_output ?? null;
}

/** Sorts a platform mail into the kinds the app acts on. */
export function classifyMail(mail: Pick<InboundEmail, "subject" | "text">): MailKind {
  const s = `${mail.subject}\n${mail.text.slice(0, 3000)}`.toLowerCase();
  if (/payout|settlement|payment advice|amount credited|remittance|statement of account/.test(s)) return "payout";
  if (/complaint|escalat|refund request|customer issue|grievance/.test(s)) return "complaint";
  if (/onboarding|listing|go[- ]live|documents? (?:approved|rejected|pending)|fssai|menu (?:approved|rejected)/.test(s)) return "onboarding";
  if (/weekly|business report|performance|summary for|insights/.test(s)) return "report";
  return "other";
}

/** Stores an inbound email and, if it's a payout mail, records the payout. Skips mail already seen. */
export async function ingestEmail(outletId: string, mail: InboundEmail) {
  if (mail.externalId) {
    const [seen] = await db.select({ id: emails.id }).from(emails).where(and(eq(emails.outletId, outletId), eq(emails.externalId, mail.externalId)));
    if (seen) return { kind: "duplicate" as const };
  }
  const mailKind = classifyMail(mail);
  let parsed: ParsedPayout | null = null;
  let via = "rules";
  if (mailKind === "payout") {
    parsed = parsePayoutWithRules(mail);
    const ai = aiProvider();
    if (!parsed && ai) {
      parsed = await parsePayoutWithAI(mail);
      via = ai;
    }
  }
  const isPayout = !!parsed?.is_payout && parsed.platform !== "other";
  const [email] = await db
    .insert(emails)
    .values({
      outletId,
      fromAddr: mail.from,
      subject: mail.subject,
      receivedAt: mail.receivedAt,
      parsedAs: isPayout ? "payout" : null,
      parsed: parsed ? { ...parsed, via } : null,
      origin: mail.origin ?? "paste",
      externalId: mail.externalId,
      kind: mailKind,
      snippet: mail.text.replace(/\s+/g, " ").trim().slice(0, 240),
      attachments: (mail.attachments ?? []).map((a) => ({ filename: a.filename, mimeType: a.mimeType, read: via === "claude" && readable(a) })),
    })
    .returning();
  if (!isPayout || !parsed) return { kind: "ignored" as const, mailKind, emailId: email.id };

  const [row] = await db
    .insert(payouts)
    .values({
      outletId,
      platform: parsed.platform as Platform,
      periodLabel: parsed.period_label || "this period",
      periodStart: parsed.pay_date,
      gross: parsed.gross,
      commission: parsed.commission,
      ads: parsed.ads,
      deductions: parsed.deductions,
      net: parsed.net,
      status: parsed.status,
      payDate: parsed.pay_date,
      source: `${mail.from}: ${mail.subject}`.slice(0, 200),
      emailId: email.id,
    })
    .returning();
  await audit(outletId, mail.origin === "gmail" ? "gmail" : "email", "payout.ingested", { payoutId: row.id, via });
  if (row.status === "credited") {
    await notify(outletId, "payout", `₹${row.net.toLocaleString("en-IN")} from ${row.platform === "zomato" ? "Zomato" : "Swiggy"} has been credited for ${row.periodLabel}.`);
  }
  return { kind: "payout" as const, payout: row, via, emailId: email.id };
}
