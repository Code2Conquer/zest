import "server-only";
import { asc, eq } from "drizzle-orm";
import type { SpecialHours, WeeklyHours } from "../hours";
import { db } from "./db";
import { outletHours, specialHours } from "./schema";

export async function getHours(outletId: string): Promise<{ weekly: WeeklyHours; special: SpecialHours }> {
  const weekly = await db.select().from(outletHours).where(eq(outletHours.outletId, outletId)).orderBy(asc(outletHours.weekday), asc(outletHours.opens));
  const special = await db.select().from(specialHours).where(eq(specialHours.outletId, outletId)).orderBy(asc(specialHours.date));
  return {
    weekly: weekly.map((h) => ({ weekday: h.weekday, opens: h.opens, closes: h.closes, channel: h.channel })),
    special: special.map((s) => ({ date: s.date, closed: s.closed, ...(s.opens ? { opens: s.opens } : {}), ...(s.closes ? { closes: s.closes } : {}), note: s.note })),
  };
}

/** Replaces the outlet's hours with these, as one batch. */
export async function setHours(outletId: string, weekly: WeeklyHours, special: SpecialHours) {
  await db.batch([
    db.delete(outletHours).where(eq(outletHours.outletId, outletId)),
    db.delete(specialHours).where(eq(specialHours.outletId, outletId)),
    ...(weekly.length ? [db.insert(outletHours).values(weekly.map((h) => ({ outletId, weekday: h.weekday, opens: h.opens, closes: h.closes, channel: h.channel ?? null })))] : []),
    ...(special.length ? [db.insert(specialHours).values(special.map((s) => ({ outletId, date: s.date, closed: s.closed, opens: s.opens ?? null, closes: s.closes ?? null, note: s.note ?? "" })))] : []),
    // db.batch is typed for a non-empty tuple; this list always starts with the two deletes.
  ] as unknown as Parameters<typeof db.batch>[0]);
}
