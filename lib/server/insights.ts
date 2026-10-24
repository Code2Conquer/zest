import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import type { Bi } from "../i18n";
import { CHANNEL_NAME, PLATFORMS, type Platform } from "../platforms";
import type { MailInsightsDTO } from "../types";
import { hasClaude } from "./claude";
import { db } from "./db";
import { emails, payouts, type EmailRow } from "./schema";

export const INSIGHT_DAYS = 30;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function platformOf(e: Pick<EmailRow, "fromAddr" | "subject">): Platform | null {
  const s = `${e.fromAddr} ${e.subject}`.toLowerCase();
  return PLATFORMS.find((p) => s.includes(p)) ?? null;
}

/** What the last 30 days of Zomato and Swiggy mail say, in plain words. */
export async function mailInsights(outletId: string): Promise<MailInsightsDTO> {
  const since = new Date(Date.now() - INSIGHT_DAYS * 86_400_000).toISOString();
  const mails = await db.select().from(emails).where(and(eq(emails.outletId, outletId), gte(emails.receivedAt, since))).orderBy(desc(emails.receivedAt));
  const ids = mails.map((m) => m.id);
  const paid = ids.length ? await db.select().from(payouts).where(and(eq(payouts.outletId, outletId), inArray(payouts.emailId, ids))) : [];

  const byKind = { payout: 0, report: 0, complaint: 0, onboarding: 0, other: 0 };
  const byPlatform: Record<Platform, number> = { zomato: 0, swiggy: 0 };
  for (const m of mails) {
    byKind[m.kind ?? "other"]++;
    const p = platformOf(m);
    if (p) byPlatform[p]++;
  }

  const platforms = PLATFORMS.map((platform) => {
    const rows = paid.filter((p) => p.platform === platform);
    const sum = (k: "gross" | "commission" | "ads" | "deductions" | "net") => rows.reduce((t, r) => t + r[k], 0);
    return {
      platform,
      payouts: rows.length,
      gross: sum("gross"),
      commission: sum("commission"),
      ads: sum("ads"),
      deductions: sum("deductions"),
      net: sum("net"),
      upcoming: rows.filter((r) => r.status === "upcoming").reduce((t, r) => t + r.net, 0),
    };
  }).filter((p) => p.payouts > 0);

  const pick = (kind: EmailRow["kind"]) =>
    mails.filter((m) => m.kind === kind).slice(0, 5).map((m) => ({ id: m.id, subject: m.subject, receivedAt: m.receivedAt, platform: platformOf(m) }));
  const unreadPayouts = mails.filter((m) => m.kind === "payout" && m.parsedAs !== "payout").length;

  const highlights: MailInsightsDTO["highlights"] = [];
  const say = (tone: "good" | "warn" | "info", en: string, hi: string) => highlights.push({ tone, text: { en, hi } satisfies Bi });

  if (mails.length === 0) {
    say(
      "info",
      `No Zomato or Swiggy mail reached this inbox in the last ${INSIGHT_DAYS} days. Is this the email you registered with the partner apps?`,
      `पिछले ${INSIGHT_DAYS} दिनों में इस इनबॉक्स में Zomato या Swiggy का कोई मेल नहीं आया। क्या यही ईमेल पार्टनर ऐप में रजिस्टर्ड है?`,
    );
  }
  const upcoming = platforms.reduce((t, p) => t + p.upcoming, 0);
  if (upcoming > 0) say("good", `${inr(upcoming)} is on its way to your bank.`, `${inr(upcoming)} आपके बैंक में आने वाले हैं।`);
  for (const p of platforms) {
    const name = CHANNEL_NAME[p.platform];
    const kept = pct(p.net, p.gross);
    say(
      "info",
      `${name} paid ${inr(p.net)} across ${p.payouts} payout${p.payouts === 1 ? "" : "s"} on ${inr(p.gross)} of sales. You kept ${kept}%; commission took ${pct(p.commission, p.gross)}%.`,
      `${name} ने ${p.payouts} पेआउट में ${inr(p.gross)} की बिक्री पर ${inr(p.net)} दिए। आपको ${kept}% मिला; कमीशन ${pct(p.commission, p.gross)}% गया।`,
    );
    if (pct(p.ads, p.gross) >= 8) {
      say(
        "warn",
        `Ads took ${pct(p.ads, p.gross)}% of your ${name} sales (${inr(p.ads)}). Check they bring orders that pay for themselves.`,
        `${name} पर ऐड में बिक्री का ${pct(p.ads, p.gross)}% (${inr(p.ads)}) गया। देख लें कि ऐड से आए ऑर्डर उतना कमा रहे हैं।`,
      );
    }
    if (pct(p.deductions, p.gross) >= 5) {
      say(
        "warn",
        `${inr(p.deductions)} in other deductions on ${name} (${pct(p.deductions, p.gross)}% of sales): cancellations, penalties or TDS. Worth checking line by line.`,
        `${name} पर ${inr(p.deductions)} की दूसरी कटौती (बिक्री का ${pct(p.deductions, p.gross)}%): कैंसलेशन, पेनल्टी या TDS। एक-एक करके जाँचें।`,
      );
    }
  }
  if (platforms.length === 2) {
    const [a, b] = platforms.map((p) => ({ name: CHANNEL_NAME[p.platform], kept: pct(p.net, p.gross) }));
    if (Math.abs(a.kept - b.kept) >= 3) {
      const [hiK, loK] = a.kept > b.kept ? [a, b] : [b, a];
      say("info", `You keep more of each sale on ${hiK.name} (${hiK.kept}%) than on ${loK.name} (${loK.kept}%).`, `हर बिक्री में से ${hiK.name} पर ज़्यादा मिलता है (${hiK.kept}%), ${loK.name} पर कम (${loK.kept}%)।`);
    }
  }
  if (unreadPayouts > 0) {
    const fix = hasClaude() ? "" : " Connecting Claude lets Zest read PDF statements.";
    const fixHi = hasClaude() ? "" : " Claude चालू करने पर Zest PDF स्टेटमेंट पढ़ पाएगा।";
    say(
      "warn",
      `${unreadPayouts} payout mail${unreadPayouts === 1 ? " has its" : "s have their"} numbers in an attachment Zest couldn't read yet.${fix}`,
      `${unreadPayouts} पेआउट मेल के आँकड़े अटैचमेंट में हैं जो Zest अभी नहीं पढ़ पाया।${fixHi}`,
    );
  }
  if (byKind.complaint > 0) {
    const latest = mails.find((m) => m.kind === "complaint")!;
    say("warn", `${byKind.complaint} complaint mail${byKind.complaint === 1 ? "" : "s"}. Latest: “${latest.subject}”.`, `${byKind.complaint} शिकायत वाले मेल। सबसे नया: “${latest.subject}”।`);
  }
  if (byKind.onboarding > 0) {
    say("info", `${byKind.onboarding} mail${byKind.onboarding === 1 ? "" : "s"} about your listing or documents. Check whether they need anything from you.`, `आपकी लिस्टिंग या दस्तावेज़ों के बारे में ${byKind.onboarding} मेल। देख लें कि कुछ करना तो नहीं है।`);
  }

  return {
    days: INSIGHT_DAYS,
    since,
    mails: { total: mails.length, byKind, byPlatform },
    platforms,
    unreadPayouts,
    complaints: pick("complaint"),
    actions: pick("onboarding"),
    highlights,
  };
}
