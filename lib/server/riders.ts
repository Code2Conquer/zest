import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { orders, outlets, type OrderRow } from "./schema";

// Booking a Zomato rider for a delivery from a seller's own page, once the food is ready. One connection
// point: set ZOMATO_DELIVERY_API_URL and ZOMATO_DELIVERY_API_KEY when Zomato's delivery API is available
// to Zest, and riders are booked there (the response's rider name, phone, ETA and tracking link are kept).
// Until then, sample outlets get a simulated rider so the whole flow can be tried, and real outlets are told
// the rider couldn't be booked, so they send their own helper.

type Rider = NonNullable<OrderRow["rider"]>;
const SAMPLE_RIDERS = ["Ravi", "Imran", "Suresh", "Arjun", "Manoj", "Deepak"];

export const ridersConfigured = () => !!(process.env.ZOMATO_DELIVERY_API_URL && process.env.ZOMATO_DELIVERY_API_KEY);

async function bookWithZomato(order: OrderRow, outlet: typeof outlets.$inferSelect): Promise<Rider> {
  const res = await fetch(process.env.ZOMATO_DELIVERY_API_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ZOMATO_DELIVERY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: order.id,
      pickup: { name: outlet.name, address: outlet.address, lat: outlet.lat, lng: outlet.lng, phone: outlet.ownerPhone },
      drop: { address: order.deliveryAddress },
      orderValue: order.amount,
    }),
  });
  if (!res.ok) return { name: "", status: "unavailable" };
  const r = (await res.json()) as { riderName?: string; riderPhone?: string; eta?: string; trackingUrl?: string };
  return { name: r.riderName ?? "", phone: r.riderPhone, eta: r.eta, trackUrl: r.trackingUrl, status: r.riderName ? "assigned" : "requested" };
}

/** Books a rider for a ready delivery order that a Zomato rider is meant to carry. Returns the order's rider. */
export async function bookRider(order: OrderRow): Promise<Rider | null> {
  if (order.fulfilment !== "delivery" || order.deliveryBy !== "zomato_rider" || order.rider) return order.rider ?? null;
  const [outlet] = await db.select().from(outlets).where(eq(outlets.id, order.outletId));
  if (!outlet) return null;
  let rider: Rider;
  if (ridersConfigured()) rider = await bookWithZomato(order, outlet);
  else if (outlet.isDemo) {
    const eta = new Date(Date.now() + 12 * 60_000).toISOString();
    rider = { name: SAMPLE_RIDERS[order.externalId.length % SAMPLE_RIDERS.length], phone: "+91 98XXX XXX12", eta, status: "assigned" };
  } else rider = { name: "", status: "unavailable" };
  await db.update(orders).set({ rider }).where(eq(orders.id, order.id));
  return rider;
}

/** Marks the rider's progress as the order moves (picked up when it leaves, delivered when it's done). */
export async function riderProgress(orderId: string, status: Rider["status"]) {
  const [o] = await db.select({ rider: orders.rider }).from(orders).where(eq(orders.id, orderId));
  if (o?.rider && o.rider.status !== "unavailable") await db.update(orders).set({ rider: { ...o.rider, status } }).where(eq(orders.id, orderId));
}
