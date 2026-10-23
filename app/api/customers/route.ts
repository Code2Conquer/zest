import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { handler, MANAGERS } from "@/lib/server/http";
import { customers } from "@/lib/server/schema";
import { MEENA_OUTLET_ID, refreshMeenaDay } from "@/lib/server/seed";

const mask = (phone: string) => `${phone.slice(0, 3)} ••••• ${phone.slice(-5)}`;

/** People who ordered directly, newest first. Only the owner sees full phone numbers. */
export const GET = handler({ roles: MANAGERS }, async (_req, outlet, _p, session) => {
  if (!outlet.brandId) return [];
  if (outlet.id === MEENA_OUTLET_ID) await refreshMeenaDay();
  const rows = await db.select().from(customers).where(eq(customers.brandId, outlet.brandId)).orderBy(desc(customers.lastOrderAt)).limit(500);
  const full = !session || session.membership.role === "owner";
  return rows.map((c) => ({ id: c.id, name: c.name, phone: full ? c.phone : mask(c.phone), orders: c.orders, spent: c.spent, firstOrderAt: c.firstOrderAt, lastOrderAt: c.lastOrderAt }));
});
