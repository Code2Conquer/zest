import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Online payment through Razorpay: the order is created with Razorpay, the customer pays in Razorpay's
// checkout (UPI, cards, wallets), and the payment is confirmed by its signature or Razorpay's webhook,
// never by the browser's word. Rejected paid orders are refunded the same way.
// Configure RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET. Without them the ordering
// page keeps the direct UPI link (paid to the seller's own UPI ID, confirmed by staff).

const API = "https://api.razorpay.com/v1";

export const paymentsConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const paymentsKeyId = () => process.env.RAZORPAY_KEY_ID ?? null;

async function call<T>(path: string, body: unknown): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(json.error?.description ?? `Razorpay returned ${res.status}`);
  return json;
}

/** Creates the payment for an order, in paise. */
export async function createPayment(amountRupees: number, receipt: string, notes: Record<string, string>) {
  return call<{ id: string; amount: number; currency: string }>("/orders", { amount: Math.round(amountRupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes });
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** The checkout's own proof of payment: HMAC of "<order_id>|<payment_id>" with the key secret. */
export function verifyCheckout(pgOrderId: string, paymentId: string, signature: string) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${pgOrderId}|${paymentId}`).digest("hex");
  return same(expected, signature);
}

/** A webhook's proof: HMAC of the raw body with the webhook secret. */
export function verifyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return same(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

/** Refunds a captured payment in full. */
export async function refund(paymentId: string) {
  return call<{ id: string; status: string }>(`/payments/${paymentId}/refund`, {});
}
