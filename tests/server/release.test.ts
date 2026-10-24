import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/server/db";
import { advanceOrder } from "@/lib/server/order-actions";
import { verifyCheckout, verifyWebhook } from "@/lib/server/payments";
import { createPlan, ordersFromPlans, planDates } from "@/lib/server/plans";
import { customers, menuItems, orders, outlets } from "@/lib/server/schema";
import { indiaNow, sectionClosed } from "@/lib/server/stock";
import { ensureSlugs, getStorefront, placeOrder, trackOrder } from "@/lib/server/storefront";
import { cookieJar } from "../cookies";
import { freshOutlet } from "../helpers";

// The features the website sells: cook to the count, online payment, tracking, riders and weekly plans.

async function kitchen(overrides: Partial<typeof outlets.$inferInsert> = {}) {
  const o = await freshOutlet({ ordering: true, livePlatforms: [], journey: "new", ...overrides });
  await ensureSlugs();
  const [row] = await db.select().from(outlets).where(eq(outlets.id, o.id));
  const [thali, chai] = await db
    .insert(menuItems)
    .values([
      { outletId: o.id, name: "Thali", category: "Lunch", price: { zomato: 120, swiggy: 120 }, available: { zomato: true, swiggy: true }, dailyLimit: 2 },
      { outletId: o.id, name: "Chai", category: "Evening", price: { zomato: 20, swiggy: 20 }, available: { zomato: true, swiggy: true } },
    ])
    .returning();
  return { outlet: row, thali, chai };
}
const order = (lines: { itemId: string; qty: number }[], extra = {}) => ({ name: "Asha", phone: "98450 12345", fulfilment: "pickup" as const, pay: "counter" as const, lines, ...extra });
const statusOf = async (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: { status?: number }) => e.status ?? 500,
  );

describe("cook to the count", () => {
  beforeEach(() => cookieJar.clear());
  afterEach(() => vi.useRealTimers());

  it("counts a dish down and refuses past its daily limit", async () => {
    const { outlet, thali } = await kitchen();
    expect((await getStorefront(outlet.slug!)).menu.find((m) => m.id === thali.id)?.left).toBe(2);
    await placeOrder(outlet.slug!, order([{ itemId: thali.id, qty: 1 }]));
    expect((await getStorefront(outlet.slug!)).menu.find((m) => m.id === thali.id)?.left).toBe(1);
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: thali.id, qty: 2 }])))).toBe(409);
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: thali.id, qty: 1 }])))).toBe(200);
    expect((await getStorefront(outlet.slug!)).menu.find((m) => m.id === thali.id)?.left).toBe(0);
  });

  it("closes a menu section at its cut-off, India time", () => {
    const at = new Date("2026-10-25T06:00:00Z"); // 11:30 am IST
    expect(indiaNow(at).time).toBe("11:30");
    expect(sectionClosed({ Lunch: "11:00" }, "Lunch", at)).toBe(true);
    expect(sectionClosed({ Lunch: "11:00" }, "Evening", at)).toBe(false);
    expect(sectionClosed({ Lunch: "12:00" }, "Lunch", at)).toBe(false);
  });

  it("refuses an order for a section whose cut-off has passed", async () => {
    const { outlet, thali, chai } = await kitchen({ cutoffs: { Lunch: "00:00" } });
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: thali.id, qty: 1 }])))).toBe(409);
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: chai.id, qty: 1 }])))).toBe(200);
    expect((await getStorefront(outlet.slug!)).cutoffs.Lunch.closed).toBe(true);
  });
});

describe("online payment", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only the gateway's own signatures", () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "hook");
    const sig = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
    expect(verifyCheckout("order_1", "pay_1", sig)).toBe(true);
    expect(verifyCheckout("order_1", "pay_2", sig)).toBe(false);
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhook(body, createHmac("sha256", "hook").update(body).digest("hex"))).toBe(true);
    expect(verifyWebhook(body, "forged")).toBe(false);
    expect(verifyWebhook(body, null)).toBe(false);
  });

  it("refuses to pay online when the gateway isn't set up", async () => {
    const { outlet, chai } = await kitchen();
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: chai.id, qty: 1 }], { pay: "online" })))).toBe(400);
  });
});

describe("tracking and riders", () => {
  it("follows an order by its private link through to delivery", async () => {
    const { outlet, chai } = await kitchen({ isDemo: true, lat: 28.55, lng: 77.2, delivery: { zomatoRider: true, ownStaff: false, pickup: true, feePaidBy: "customer", freeAbove: null, maxKm: 7 } });
    const placed = await placeOrder(outlet.slug!, order([{ itemId: chai.id, qty: 2 }], { fulfilment: "delivery", address: "Flat 302, Green Park", location: { lat: 28.56, lng: 77.21 } }));
    expect((await trackOrder(placed.token))?.status).toBe("new");
    for (const a of ["accept", "ready"] as const) await advanceOrder(outlet.id, placed.orderId, a, "test");
    const t = await trackOrder(placed.token);
    expect(t?.rider?.status).toBe("assigned");
    expect(t?.rider?.name).toBeTruthy();
    await advanceOrder(outlet.id, placed.orderId, "dispatch", "test");
    expect((await trackOrder(placed.token))?.status).toBe("out_for_delivery");
    await advanceOrder(outlet.id, placed.orderId, "complete", "test");
    const done = await trackOrder(placed.token);
    expect(done?.status).toBe("completed");
    expect(done?.rider?.status).toBe("delivered");
    expect(await trackOrder("not-a-real-token")).toBeNull();
  });

  it("tells a real seller when no rider could be booked", async () => {
    const { outlet, chai } = await kitchen({ lat: 28.55, lng: 77.2, delivery: { zomatoRider: true, ownStaff: false, pickup: true, feePaidBy: "customer", freeAbove: null, maxKm: 7 } });
    const placed = await placeOrder(outlet.slug!, order([{ itemId: chai.id, qty: 1 }], { fulfilment: "delivery", address: "Flat 9, Green Park", location: { lat: 28.56, lng: 77.21 } }));
    await advanceOrder(outlet.id, placed.orderId, "accept", "test");
    const row = await advanceOrder(outlet.id, placed.orderId, "ready", "test");
    expect(row.rider?.status).toBe("unavailable");
  });
});

describe("weekly tiffin plans", () => {
  it("lists the plan's days, less skipped ones", () => {
    expect(planDates({ startsOn: "2026-10-26", endsOn: "2026-11-01", days: [1, 3, 5], skips: ["2026-10-28"] })).toEqual(["2026-10-26", "2026-10-30"]);
  });

  it("prices the plan for the week and makes each day's order once", async () => {
    const { outlet, thali } = await kitchen();
    const today = indiaNow().date;
    const plan = await createPlan(outlet, { name: "Rohan", phone: "98110 44455", itemId: thali.id, qty: 1, days: [0, 1, 2, 3, 4, 5, 6], fulfilment: "pickup", startsOn: today, weeks: 1 });
    expect(plan.meals).toBe(7);
    expect(plan.amount).toBe(7 * 120);
    expect(await ordersFromPlans(outlet.id)).toBe(1);
    expect(await ordersFromPlans(outlet.id)).toBe(0);
    const made = await db.select().from(orders).where(eq(orders.outletId, outlet.id));
    expect(made).toHaveLength(1);
    expect(made[0].planId).toBe(plan.id);
    const [c] = await db.select().from(customers).where(eq(customers.phone, "+919811044455"));
    expect(c.name).toBe("Rohan");
  });
});
