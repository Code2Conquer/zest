import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { handler, MANAGERS } from "@/lib/server/http";
import { customers, orders } from "@/lib/server/schema";
import { MEENA_OUTLET_ID, refreshMeenaDay } from "@/lib/server/seed";

const mask = (phone: string) => `${phone.slice(0, 3)} ••••• ${phone.slice(-5)}`;

/** People who ordered directly, newest first, with what they usually order. Only the owner sees full phone numbers. */
export const GET = handler({ roles: MANAGERS }, async (_req, outlet, _p, session) => {
  if (!outlet.brandId) return [];
  if (outlet.id === MEENA_OUTLET_ID) await refreshMeenaDay();
  const rows = await db.select().from(customers).where(eq(customers.brandId, outlet.brandId)).orderBy(desc(customers.lastOrderAt)).limit(500);
  // Their usual: the order they've placed most often here.
  const counts = rows.length
    ? await db
        .select({ customerId: orders.customerId, items: orders.items, n: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.outletId, outlet.id), inArray(orders.customerId, rows.map((r) => r.id))))
        .groupBy(orders.customerId, orders.items)
    : [];
  const usual = new Map<string, { items: string; n: number }>();
  for (const c of counts) if (c.customerId && Number(c.n) > (usual.get(c.customerId)?.n ?? 0)) usual.set(c.customerId, { items: c.items, n: Number(c.n) });
  const full = !session || session.membership.role === "owner";
  return rows.map((c) => ({ id: c.id, name: c.name, phone: full ? c.phone : mask(c.phone), orders: c.orders, spent: c.spent, firstOrderAt: c.firstOrderAt, lastOrderAt: c.lastOrderAt, note: c.note, usual: (usual.get(c.id)?.n ?? 0) >= 2 ? usual.get(c.id)!.items : null }));
});
