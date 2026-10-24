// One order lifecycle for every channel. Aggregator states are mapped onto it;
// "delayed" is a flag on an order, not a state of its own.

export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "picked_up"
  | "served"
  | "completed"
  | "rejected"
  | "cancelled";

export const ORDER_STATUSES: readonly OrderStatus[] = ["new", "accepted", "preparing", "ready", "out_for_delivery", "picked_up", "served", "completed", "rejected", "cancelled"];

/** Statuses from before the lifecycle was widened, still sent by older webhook senders and connectors. */
export const LEGACY_STATUSES = ["preparing", "ready", "picked", "delivered", "delayed", "cancelled"] as const;
export type LegacyStatus = (typeof LEGACY_STATUSES)[number];

/** Orders the kitchen still has to deal with. */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "accepted", "preparing", "ready", "out_for_delivery"];

/** Orders that don't count towards sales. */
export const VOID_STATUSES: OrderStatus[] = ["rejected", "cancelled"];

export function fromLegacyStatus(s: string): { status: OrderStatus; delayed: boolean } {
  switch (s) {
    case "delayed":
      return { status: "preparing", delayed: true };
    case "picked":
      return { status: "out_for_delivery", delayed: false };
    case "delivered":
      return { status: "completed", delayed: false };
  }
  if ((ORDER_STATUSES as readonly string[]).includes(s)) return { status: s as OrderStatus, delayed: false };
  throw new Error(`Unknown order status "${s}".`);
}
