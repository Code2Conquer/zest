import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ready } from "@/lib/server/db";
import { outlets } from "@/lib/server/schema";
import { upsertOrders } from "@/lib/server/sync";

const Body = z.object({
  outletId: z.string(),
  orders: z.array(
    z.object({
      externalId: z.string(),
      items: z.string(),
      amount: z.number(),
      placedAt: z.string().optional(),
      status: z.enum(["preparing", "ready", "picked", "delivered", "delayed", "cancelled"]).optional(),
      prepMins: z.number().optional(),
    }),
  ),
});

/**
 * Order events pushed by a platform, POS or middleware. The sender signs the raw
 * body with WEBHOOK_SECRET (HMAC-SHA256, hex) in the X-Zest-Signature header.
 */
export async function POST(req: Request, ctx: { params: Promise<{ platform: string }> }) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhooks aren't configured (WEBHOOK_SECRET)." }, { status: 503 });
  const { platform } = await ctx.params;
  const channel = z.enum(["zomato", "swiggy", "dine"]).safeParse(platform);
  if (!channel.success) return NextResponse.json({ error: "Unknown platform." }, { status: 404 });

  const raw = await req.text();
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const given = Buffer.from(req.headers.get("x-zest-signature") ?? "");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return NextResponse.json({ error: "Bad signature." }, { status: 401 });

  const body = Body.safeParse(JSON.parse(raw));
  if (!body.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  await ready();
  const [outlet] = await db.select({ id: outlets.id }).from(outlets).where(eq(outlets.id, body.data.outletId));
  if (!outlet) return NextResponse.json({ error: "Unknown outlet." }, { status: 404 });
  const n = await upsertOrders(outlet.id, channel.data, body.data.orders.map((o) => ({ ...o, placedAt: o.placedAt ?? new Date().toISOString(), status: o.status ?? "preparing" })));
  return NextResponse.json({ received: n });
}
