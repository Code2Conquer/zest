import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { orderDTO } from "@/lib/server/queries";
import { customers, menuItems, orders } from "@/lib/server/schema";

// A test order on a sample, so a visitor can take it through the whole flow: it arrives, they accept
// it, cook it, mark it ready and hand it to a rider. Only ever on a sample; no text comes from the visitor.

const MAX_WAITING = 6;

export const POST = handler(async (_req, outlet) => {
  if (!outlet.isDemo) throw new HttpError(400, "Test orders are only for samples.");
  assertWritable(outlet, { sample: true });
  // Keep the board tidy when many visitors try it: drop the oldest test orders beyond a handful.
  const waiting = await db.select({ id: orders.id, placedAt: orders.placedAt }).from(orders).where(and(eq(orders.outletId, outlet.id), eq(orders.status, "new")));
  if (waiting.length >= MAX_WAITING) {
    const old = waiting.sort((a, b) => a.placedAt.localeCompare(b.placedAt)).slice(0, waiting.length - MAX_WAITING + 1).map((o) => o.id);
    await db.delete(orders).where(inArray(orders.id, old));
  }
  const menu = await db.select().from(menuItems).where(and(eq(menuItems.outletId, outlet.id), eq(menuItems.veg, true)));
  const pool = menu.filter((m) => (m.price.zomato ?? m.price.swiggy ?? 0) > 0 && (m.price.zomato ?? m.price.swiggy ?? 0) < 400);
  if (!pool.length) throw new HttpError(400, "This sample has no dishes to order.");
  const pickDish = () => pool[Math.floor(Math.random() * pool.length)];
  const a = pickDish(), b = pickDish();
  const qa = 1 + Math.floor(Math.random() * 2);
  const price = (m: typeof a) => m.price.zomato ?? m.price.swiggy ?? 0;
  const lines = a.id === b.id ? [`${qa + 1} ${a.name}`] : [`${qa} ${a.name}`, `1 ${b.name}`];
  const amount = a.id === b.id ? (qa + 1) * price(a) : qa * price(a) + price(b);
  const [person] = outlet.brandId ? await db.select({ id: customers.id }).from(customers).where(eq(customers.brandId, outlet.brandId)).limit(1) : [];
  const [row] = await db
    .insert(orders)
    .values({
      outletId: outlet.id, channel: "web", externalId: `T-${String(Date.now()).slice(-4)}`, items: lines.join(", "), amount: amount + 35, placedAt: new Date().toISOString(), status: "new", prepMins: 20,
      customerId: person?.id ?? null, fulfilment: "delivery", paymentStatus: "paid", paymentMethod: "upi", deliveryBy: "zomato_rider", deliveryFee: 35, deliveryKm: 2.4,
    })
    .returning();
  return orderDTO(row);
});
