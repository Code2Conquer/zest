import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { customers, outlets, type OrderRow } from "./schema";
import { siteUrl } from "./site";
import { sendSms } from "./sms";
import { notify } from "./whatsapp";

// Telling the customer how their order is going: on WhatsApp first, by SMS when WhatsApp can't reach them,
// each message with the link to follow the order live (/t/<token>).

export type Update = "placed" | "accepted" | "ready" | "out_for_delivery" | "delivered" | "rejected" | "refunded";

export const trackingLink = (o: Pick<OrderRow, "publicToken">) => (o.publicToken ? `${siteUrl()}/t/${o.publicToken}` : "");

function message(update: Update, o: OrderRow, shop: string): string {
  const n = o.externalId;
  switch (update) {
    case "placed":
      return `${shop} got your order ${n}. We'll tell you when it's accepted.`;
    case "accepted":
      return `${shop} accepted your order ${n} and is cooking it.`;
    case "ready":
      return o.fulfilment === "delivery" ? `Your order ${n} from ${shop} is ready and waiting for the rider.` : `Your order ${n} from ${shop} is ready to collect.`;
    case "out_for_delivery":
      return `Your order ${n} from ${shop} is on the way${o.rider?.name ? ` with ${o.rider.name}` : ""}.`;
    case "delivered":
      return `Your order ${n} from ${shop} was delivered. Enjoy your meal!`;
    case "rejected":
      return `Sorry, ${shop} couldn't take your order ${n}.${o.paymentStatus === "paid" && o.paymentMethod === "online" ? " Your money is being refunded." : ""}`;
    case "refunded":
      return `₹${o.amount} for order ${n} from ${shop} has been refunded to you.`;
  }
}

/** Sends one update about an order to the customer who placed it. Never throws: a failed message mustn't fail the order. */
export async function updateCustomer(o: OrderRow, update: Update) {
  try {
    if (!o.customerId) return;
    const [[c], [shop]] = await Promise.all([db.select().from(customers).where(eq(customers.id, o.customerId)), db.select({ name: outlets.name }).from(outlets).where(eq(outlets.id, o.outletId))]);
    if (!c?.phone || !shop) return;
    const link = trackingLink(o);
    const text = message(update, o, shop.name);
    const wa = await notify(o.outletId, `customer.${update}`, link ? `${text} Track it: ${link}` : text, c.phone);
    if (!wa || wa.status !== "sent") await sendSms(c.phone, "order", { shop: shop.name, update: text, link });
  } catch {
    // Messages are best effort.
  }
}
