import "server-only";
import { and, eq } from "drizzle-orm";
import { isDirect } from "../platforms";
import type { OrderStatus } from "../orders";
import { audit, HttpError } from "./approvals";
import { db } from "./db";
import { updateCustomer, type Update } from "./customer-updates";
import { paymentsConfigured, refund } from "./payments";
import { bookRider, riderProgress } from "./riders";
import { orders } from "./schema";

// Staff moving the restaurant's own (direct) orders along. Aggregator orders follow their platform.

export type OrderAction = "accept" | "reject" | "prepare" | "ready" | "dispatch" | "complete" | "paid";

const NEXT: Record<Exclude<OrderAction, "paid">, { from: OrderStatus[]; to: OrderStatus }> = {
  accept: { from: ["new"], to: "accepted" },
  reject: { from: ["new"], to: "rejected" },
  prepare: { from: ["new", "accepted"], to: "preparing" },
  ready: { from: ["accepted", "preparing"], to: "ready" },
  // A delivery leaves with its rider or helper.
  dispatch: { from: ["ready"], to: "out_for_delivery" },
  complete: { from: ["ready", "out_for_delivery"], to: "completed" },
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
  // A paid online order that's turned down is refunded straight away.
  if (action === "reject" && o.paymentMethod === "online" && o.paymentStatus === "paid" && o.pgPaymentId && paymentsConfigured()) {
    set.refundStatus = await refund(o.pgPaymentId).then(
      () => "refunded" as const,
      () => "failed" as const,
    );
  }
  let [row] = await db.update(orders).set({ ...set, updatedAt: now }).where(eq(orders.id, o.id)).returning();
  await audit(outletId, actor, `order.${action}`, { orderId, number: o.externalId });

  // Ready food going out with a Zomato rider: book one now. Then keep the customer posted.
  if (action === "ready") {
    const rider = await bookRider(row);
    if (rider) row = { ...row, rider };
  }
  if (action === "dispatch") await riderProgress(row.id, "picked_up");
  if (action === "complete" && row.fulfilment === "delivery") await riderProgress(row.id, "delivered");
  const update: Partial<Record<OrderAction, Update>> = { accept: "accepted", ready: "ready", dispatch: "out_for_delivery", reject: "rejected", ...(row.fulfilment === "delivery" ? { complete: "delivered" as const } : {}) };
  if (update[action]) await updateCustomer(row, update[action]);
  if (row.refundStatus === "refunded" && action === "reject") await updateCustomer(row, "refunded");
  return row;
}
