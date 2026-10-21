import "server-only";
import { and, eq } from "drizzle-orm";
import { isDirect } from "../platforms";
import type { OrderStatus } from "../orders";
import { audit, HttpError } from "./approvals";
import { db } from "./db";
import { orders } from "./schema";

// Staff moving the restaurant's own (direct) orders along. Aggregator orders follow their platform.

export type OrderAction = "accept" | "reject" | "prepare" | "ready" | "complete" | "paid";

const NEXT: Record<Exclude<OrderAction, "paid">, { from: OrderStatus[]; to: OrderStatus }> = {
  accept: { from: ["new"], to: "accepted" },
  reject: { from: ["new"], to: "rejected" },
  prepare: { from: ["new", "accepted"], to: "preparing" },
  ready: { from: ["accepted", "preparing"], to: "ready" },
  complete: { from: ["ready"], to: "completed" },
};

export async function advanceOrder(outletId: string, orderId: string, action: OrderAction, actor: string) {
  const [o] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.outletId, outletId)));
  if (!o) throw new HttpError(404, "Order not found.");
  if (!isDirect(o.channel)) throw new HttpError(400, "Update this order in the platform's partner app.");
  const now = new Date().toISOString();
  let set: Partial<typeof orders.$inferInsert>;
  if (action === "paid") {
    if (o.status === "rejected") throw new HttpError(409, "This order was rejected.");
    set = { paymentStatus: "paid" };
  } else {
    const step = NEXT[action];
    if (!step.from.includes(o.status)) throw new HttpError(409, `Can't ${action} an order that is ${o.status.replace(/_/g, " ")}.`);
    // A table order is served at the table rather than collected.
    set = { status: action === "complete" && o.fulfilment === "table" ? "served" : step.to };
  }
  const [row] = await db.update(orders).set({ ...set, updatedAt: now }).where(eq(orders.id, o.id)).returning();
  await audit(outletId, actor, `order.${action}`, { orderId, number: o.externalId });
  return row;
}
