import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, ready } from "@/lib/server/db";
import { verifyWebhook } from "@/lib/server/payments";
import { orders } from "@/lib/server/schema";
import { markPaidOnline } from "@/lib/server/storefront";

/**
 * Razorpay's webhook (payment.captured / order.paid), the safety net for a customer who paid and closed the
 * tab before the checkout reported back. Signed with RAZORPAY_WEBHOOK_SECRET; anything unsigned is refused.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature"))) return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  await ready();
  const body = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string; status: string } } } };
  const p = body.payload?.payment?.entity;
  if (p?.order_id && (body.event === "payment.captured" || body.event === "order.paid")) {
    const [row] = await db.select().from(orders).where(eq(orders.pgOrderId, p.order_id));
    if (row) await markPaidOnline(row, p.id);
  }
  return NextResponse.json({ ok: true });
}
