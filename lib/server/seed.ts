import "server-only";
import { eq } from "drizzle-orm";
import { MENU, ORDERS, OUTLET, PAYOUTS, RATINGS, REVIEWS, SALES_YESTERDAY } from "../data";
import type { Channel } from "../platforms";
import { createApproval } from "./approvals";
import { db } from "./db";
import { connections, menuItems, orders, outlets, payouts, reviews } from "./schema";

export const DEMO_OUTLET_ID = "demo";

/** A sample restaurant so the app has something to show before anything is connected. */
export async function seedDemo() {
  const existing = await db.select({ id: outlets.id }).from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  if (existing.length) return;

  await db.insert(outlets).values({
    id: DEMO_OUTLET_ID,
    name: OUTLET.name,
    area: OUTLET.area,
    cuisines: "North Indian, Biryani, Desserts",
    ownerName: OUTLET.ownerFirstName,
    journey: "live",
    livePlatforms: ["zomato", "swiggy"],
    email: "gmail",
    whatsapp: true,
    ratings: RATINGS,
    isDemo: true,
  });
  await seedRestaurantData(DEMO_OUTLET_ID);
  await db.insert(connections).values([
    { outletId: DEMO_OUTLET_ID, platform: "zomato", method: "sandbox", publicInfo: { note: "Sample data" }, lastSyncAt: new Date().toISOString() },
    { outletId: DEMO_OUTLET_ID, platform: "swiggy", method: "sandbox", publicInfo: { note: "Sample data" }, lastSyncAt: new Date().toISOString() },
  ]);
  await seedDemoApprovals(DEMO_OUTLET_ID);
}

/** The drafts the agents "made overnight" for the demo. */
async function seedDemoApprovals(outletId: string) {
  const items = await db.select().from(menuItems).where(eq(menuItems.outletId, outletId));
  const revs = await db.select().from(reviews).where(eq(reviews.outletId, outletId));
  await createApproval(outletId, {
    agent: "finance",
    kind: "dispute",
    title: "Dispute ₹412 with Swiggy",
    summary: "Order #3381 was cancelled by the customer 6 minutes after acceptance, while it was being prepared. Requesting reversal of the cancellation charge.",
    payload: { platform: "swiggy", orderId: "3381", amount: 412, reason: "Customer cancelled 6 minutes after acceptance, while the order was being prepared." },
  });
  const karthik = revs.find((r) => r.stars <= 2);
  if (karthik?.draftReply) {
    await createApproval(outletId, {
      agent: "reviews",
      kind: "review_reply",
      title: `Reply to ${karthik.author}`,
      summary: karthik.draftReply.en,
      payload: { reviewId: karthik.id, text: karthik.draftReply.en },
    });
  }
  const thali = items.find((m) => m.name === "Veg thali");
  if (thali) {
    await createApproval(outletId, {
      agent: "menu",
      kind: "menu_change",
      title: "Veg thali: turn back on",
      summary: "Lunch stock is in. Turn veg thali back on for Swiggy.",
      payload: { changes: [{ itemId: thali.id, available: { zomato: true, swiggy: true } }] },
    });
  }
}

/** A day of orders that adds up to the sample totals, spread from 11 am to 11 pm. */
function yesterdaysOrders(outletId: string) {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(11, 0, 0, 0);
  const dishes = MENU.map((m) => m.name);
  const rows = [];
  for (const ch of ["zomato", "swiggy", "dine"] as Channel[]) {
    const { amount, orders: n } = SALES_YESTERDAY[ch];
    let left = amount;
    for (let i = 0; i < n; i++) {
      const share = i === n - 1 ? left : Math.round((amount / n) * (0.7 + ((i * 37) % 60) / 100));
      left -= share;
      rows.push({
        outletId,
        channel: ch,
        externalId: `${ch === "dine" ? "T" : ch === "zomato" ? "Z" : "S"}y${i + 1}`,
        items: `${dishes[(i * 3) % dishes.length]}, ${dishes[(i * 5 + 2) % dishes.length]}`,
        amount: share,
        placedAt: new Date(start.getTime() + ((i * 7919 + ch.length * 1000) % (12 * 3600)) * 1000).toISOString(),
        status: "delivered" as const,
        prepMins: 9 + ((i * 7) % 9),
      });
    }
  }
  return rows;
}

/** Copies the sample menu, orders, payouts and reviews to an outlet. */
export async function seedRestaurantData(outletId: string) {
  const today = new Date();
  const at = (time: string) => {
    const [hm, ampm] = time.split(" ");
    const [h, m] = hm.split(":").map(Number);
    const d = new Date(today);
    d.setHours((h % 12) + (ampm === "pm" ? 12 : 0), m, 0, 0);
    return d.toISOString();
  };

  await db.insert(menuItems).values(
    MENU.map((m, i) => ({
      outletId,
      name: m.name,
      category: m.category,
      kind: m.kind,
      veg: m.veg,
      bestseller: !!m.bestseller,
      description: m.description,
      rating: m.rating,
      votes: m.votes,
      price: m.price,
      available: m.available,
      ordersLast7: m.ordersLast7,
      sort: i,
    })),
  );
  await db.insert(orders).values(yesterdaysOrders(outletId));
  await db.insert(orders).values(
    ORDERS.map((o) => ({ outletId, channel: o.channel, externalId: o.id, items: o.items, amount: o.amount, placedAt: at(o.placedAt), status: o.status, prepMins: o.prepMins })),
  );
  await db.insert(payouts).values(
    PAYOUTS.map((p) => ({
      outletId,
      platform: p.platform,
      periodLabel: p.period,
      periodStart: p.dateISO,
      gross: p.gross,
      commission: p.commission,
      ads: p.ads,
      deductions: p.deductions,
      net: p.net,
      status: p.status,
      payDate: p.dateISO,
      source: p.source.en,
    })),
  );
  await db.insert(reviews).values(
    REVIEWS.map((r, i) => ({ outletId, platform: r.platform, externalId: r.id, author: r.author, stars: r.stars, text: r.text, postedAt: new Date(Date.now() - (i + 1) * 3 * 3600_000).toISOString(), draftReply: r.draft })),
  );
}
