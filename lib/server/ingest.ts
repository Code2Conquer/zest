import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Platform } from "../platforms";
import { audit } from "./approvals";
import { claude, hasClaude, MODEL } from "./claude";
import { db } from "./db";
import { emails, payouts } from "./schema";
import { notify } from "./whatsapp";

export type InboundEmail = { from: string; subject: string; text: string; receivedAt?: string };

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

async function parsePayoutWithClaude(mail: InboundEmail): Promise<ParsedPayout | null> {
  const res = await claude().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(PayoutSchema) },
    messages: [
      {
        role: "user",
        content: `Extract the payout details from this email to an Indian restaurant. Amounts are rupees as plain numbers. If it isn't a payout or settlement email, set is_payout to false.\n\n<email>\nFrom: ${mail.from}\nSubject: ${mail.subject}\n\n${mail.text.slice(0, 20000)}\n</email>`,
      },
    ],
  });
  if (res.stop_reason === "refusal") return null;
  return res.parsed_output ?? null;
}

/** Stores an inbound email and, if it's a payout mail, records the payout. */
export async function ingestEmail(outletId: string, mail: InboundEmail) {
  let parsed = parsePayoutWithRules(mail);
  let via = "rules";
  if (!parsed && hasClaude() && /payout|settlement|payment|statement/i.test(`${mail.subject} ${mail.text}`)) {
    parsed = await parsePayoutWithClaude(mail);
    via = "claude";
  }
  const isPayout = !!parsed?.is_payout && parsed.platform !== "other";
  await db.insert(emails).values({ outletId, fromAddr: mail.from, subject: mail.subject, receivedAt: mail.receivedAt, parsedAs: isPayout ? "payout" : null, parsed: parsed ? { ...parsed, via } : null });
  if (!isPayout || !parsed) return { kind: "ignored" as const };

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
    })
    .returning();
  await audit(outletId, "email", "payout.ingested", { payoutId: row.id, via });
  if (row.status === "credited") {
    await notify(outletId, "payout", `₹${row.net.toLocaleString("en-IN")} from ${row.platform === "zomato" ? "Zomato" : "Swiggy"} has been credited for ${row.periodLabel}.`);
  }
  return { kind: "payout" as const, payout: row, via };
}
