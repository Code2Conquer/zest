import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { normalizePhone } from "../phone";
import { db } from "./db";
import { consents, type ConsentPurpose } from "./schema";

// Append-only: this module only ever inserts into `consents`.

export type ConsentInput = { brandId: string; phone: string; purpose: ConsentPurpose; granted: boolean; wording: string; source: string; actor: string };

export async function recordConsent(input: ConsentInput): Promise<void> {
  if (!input.wording.trim()) throw new Error("Record the exact words the person agreed to.");
  if (!input.source.trim()) throw new Error("Record where the consent was given.");
  await db.insert(consents).values({ ...input, phone: normalizePhone(input.phone) });
}

/** Whether the latest record for this purpose is a yes. No record means no. */
export async function hasConsent(brandId: string, phone: string, purpose: ConsentPurpose): Promise<boolean> {
  const [latest] = await db
    .select({ granted: consents.granted })
    .from(consents)
    .where(and(eq(consents.brandId, brandId), eq(consents.phone, normalizePhone(phone)), eq(consents.purpose, purpose)))
    // rowid breaks ties between records made in the same millisecond.
    .orderBy(desc(consents.createdAt), desc(sql`rowid`))
    .limit(1);
  return latest?.granted ?? false;
}

/** "STOP": withdraws marketing on every channel. Messages about orders they place still go out. */
export async function optOutAll(brandId: string, phone: string, source: string): Promise<void> {
  for (const purpose of ["whatsapp_marketing", "sms_marketing"] as const) {
    await recordConsent({ brandId, phone, purpose, granted: false, wording: "Opted out (STOP)", source, actor: "customer" });
  }
}

const STOP_WORDS = new Set(["stop", "unsubscribe", "रुको", "बंद करो"]);

/** A reply that means "stop messaging me", in English or Hindi. */
export function isStopMessage(text: string): boolean {
  return STOP_WORDS.has(text.trim().toLowerCase().replace(/[.!।\s]+$/u, "").trim());
}
