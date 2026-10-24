import "server-only";
import { and, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { VOID_STATUSES } from "../orders";
import { db } from "./db";
import { orderLines, orders } from "./schema";

// "Cook to the count": a daily limit per dish and a daily cut-off per menu section. The ordering page shows
// what's left and stops taking orders past the cut-off; placeOrder checks both again on the server.

/** Today's date and the time now in India, as "YYYY-MM-DD" and "HH:MM". */
export function indiaNow(at = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) };
}

/** The start and end of today in India, as ISO instants. */
export function indiaDayBounds(at = new Date()) {
  const { date } = indiaNow(at);
  const start = new Date(`${date}T00:00:00+05:30`);
  return [start.toISOString(), new Date(start.getTime() + 86_400_000).toISOString()] as const;
}

/** Has this menu section's order cut-off passed today? Sections with no cut-off never close. */
export function sectionClosed(cutoffs: Record<string, string> | null | undefined, category: string, at = new Date()) {
  const c = cutoffs?.[category];
  return !!c && indiaNow(at).time >= c;
}

/** How many of each dish have been ordered today (cancelled and rejected orders don't count). */
export async function soldToday(outletId: string, itemIds: string[]): Promise<Map<string, number>> {
  if (!itemIds.length) return new Map();
  const [from, to] = indiaDayBounds();
  const rows = await db
    .select({ itemId: orderLines.itemId, qty: sql<number>`sum(${orderLines.qty})` })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.orderId))
    .where(and(eq(orders.outletId, outletId), gte(orders.placedAt, from), lt(orders.placedAt, to), notInArray(orders.status, VOID_STATUSES), inArray(orderLines.itemId, itemIds)))
    .groupBy(orderLines.itemId);
  return new Map(rows.map((r) => [r.itemId!, Number(r.qty)]));
}

/** What's left of each limited dish today; dishes without a limit are absent. */
export async function leftToday(outletId: string, items: { id: string; dailyLimit: number | null }[]) {
  const limited = items.filter((m) => m.dailyLimit != null);
  const sold = await soldToday(outletId, limited.map((m) => m.id));
  return new Map(limited.map((m) => [m.id, Math.max(0, m.dailyLimit! - (sold.get(m.id) ?? 0))]));
}
