import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { setHours } from "@/lib/server/hours";
import { advanceOrder } from "@/lib/server/order-actions";
import { customers, menuItems, orders, outlets } from "@/lib/server/schema";
import { ensureSlugs, getStorefront, orderStatus, placeOrder, slugify, upiLink } from "@/lib/server/storefront";
import { linesFor } from "@/lib/server/order-lines";
import { cookieJar } from "../cookies";
import { freshOutlet } from "../helpers";

async function shop(overrides: Partial<typeof outlets.$inferInsert> = {}) {
  const o = await freshOutlet({ ordering: true, upiId: "testkitchen@okhdfc", ...overrides });
  await ensureSlugs();
  const [row] = await db.select().from(outlets).where(eq(outlets.id, o.id));
  const [naan, dal, gone] = await db
    .insert(menuItems)
    .values([
      { outletId: o.id, name: "Butter naan", category: "Breads", price: { zomato: 59, swiggy: 55 }, available: { zomato: true, swiggy: true } },
      { outletId: o.id, name: "Dal makhani", category: "Main course", price: { zomato: 249, swiggy: 259 }, available: { zomato: true, swiggy: false } },
      { outletId: o.id, name: "Gajar halwa", category: "Desserts", price: { zomato: 99, swiggy: 99 }, available: { zomato: false, swiggy: false } },
    ])
    .returning();
  return { outlet: row, naan, dal, gone };
}

const order = (lines: { itemId: string; qty: number }[], extra = {}) => ({ name: "Asha", phone: "98450 12345", fulfilment: "pickup" as const, pay: "upi" as const, lines, ...extra });
const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (e) {
    return (e as { status?: number }).status ?? 500;
  }
};

describe("storefront", () => {
  beforeEach(() => cookieJar.clear());

  it("turns names into web addresses", () => {
    expect(slugify("Rasoi 27")).toBe("rasoi-27");
    expect(slugify("  Dosa & Chai Point!! ")).toBe("dosa-chai-point");
    expect(slugify("राजू ढाबा")).toBe("restaurant");
  });

  it("gives two restaurants with one name different addresses", async () => {
    const a = await freshOutlet({ name: "Same Name Cafe" });
    const b = await freshOutlet({ name: "Same Name Cafe" });
    await ensureSlugs();
    const [ra] = await db.select().from(outlets).where(eq(outlets.id, a.id));
    const [rb] = await db.select().from(outlets).where(eq(outlets.id, b.id));
    expect(ra.slug).toMatch(/^same-name-cafe/);
    expect(rb.slug).toMatch(/^same-name-cafe/);
    expect(ra.slug).not.toBe(rb.slug);
  });

  it("shows only dishes on sale, at the lowest platform price", async () => {
    const { outlet } = await shop();
    const s = await getStorefront(outlet.slug!);
    expect(s.menu.map((m) => [m.name, m.price])).toEqual([
      ["Butter naan", 55],
      ["Dal makhani", 249],
    ]);
    expect(s.open).toBe(true);
  });

  it("is not found when ordering is off", async () => {
    const { outlet } = await shop({ ordering: false });
    expect(await statusOf(getStorefront(outlet.slug!))).toBe(404);
  });

  it("prices an order on the server and records it as a website order", async () => {
    const { outlet, naan, dal } = await shop();
    const r = await placeOrder(outlet.slug!, { ...order([{ itemId: naan.id, qty: 3 }, { itemId: dal.id, qty: 1 }]), price: 1 } as never);
    expect(r.total).toBe(3 * 55 + 249);
    const [row] = await db.select().from(orders).where(eq(orders.id, r.orderId));
    expect(row).toMatchObject({ channel: "web", status: "new", paymentStatus: "unpaid", paymentMethod: "upi", fulfilment: "pickup", amount: 414 });
    expect((await linesFor([row.id])).get(row.id)).toHaveLength(2);
  });

  it("refuses a dish that isn't on sale", async () => {
    const { outlet, gone } = await shop();
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: gone.id, qty: 1 }])))).toBe(400);
  });

  it("refuses orders while closed, and takes them when no hours are set", async () => {
    const { outlet, naan } = await shop();
    await setHours(outlet.id, [], [{ date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()), closed: true }]);
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }])))).toBe(409);
    await setHours(outlet.id, [], []);
    expect(await statusOf(placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }])))).toBe(200);
  });

  it("builds a UPI link to the restaurant's own UPI ID", () => {
    expect(upiLink("rasoi27@okhdfc", "Rasoi 27", 414, "W-0001")).toBe("upi://pay?pa=rasoi27%40okhdfc&pn=Rasoi+27&am=414.00&cu=INR&tn=Zest+order+W-0001");
  });

  it("keeps one customer per phone number per brand", async () => {
    const { outlet, naan } = await shop();
    await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }]));
    await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 2 }], { phone: "+91 98450-12345" }));
    const rows = await db.select().from(customers).where(and(eq(customers.brandId, outlet.brandId!), eq(customers.phone, "+919845012345")));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ orders: 2, spent: 55 * 3, name: "Asha" });
  });

  it("shows an order's status only with its token", async () => {
    const { outlet, naan } = await shop();
    const r = await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }]));
    expect((await orderStatus(outlet.slug!, r.orderId, r.token)).status).toBe("new");
    expect(await statusOf(orderStatus(outlet.slug!, r.orderId, "wrong"))).toBe(404);
  });

  it("moves a website order through the kitchen and records payment", async () => {
    const { outlet, naan } = await shop();
    const r = await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }]));
    expect(await statusOf(advanceOrder(outlet.id, r.orderId, "complete", "user:x"))).toBe(409);
    for (const a of ["accept", "prepare", "ready", "complete"] as const) await advanceOrder(outlet.id, r.orderId, a, "user:x");
    await advanceOrder(outlet.id, r.orderId, "paid", "user:x");
    const [row] = await db.select().from(orders).where(eq(orders.id, r.orderId));
    expect(row).toMatchObject({ status: "completed", paymentStatus: "paid" });
  });

  it("leaves aggregator orders to their platform", async () => {
    const o = await freshOutlet();
    const [z] = await db.insert(orders).values({ outletId: o.id, channel: "zomato", externalId: "Z1", items: "x", amount: 100, placedAt: new Date().toISOString(), status: "new" }).returning();
    expect(await statusOf(advanceOrder(o.id, z.id, "accept", "user:x"))).toBe(400);
  });
});

describe("ordering routes", () => {
  beforeEach(() => cookieJar.clear());
  const ctx = <P extends Record<string, string>>(p = {} as P) => ({ params: Promise.resolve(p) });

  it("masks customer phones for managers and shows them to the owner", async () => {
    const { GET } = await import("@/app/api/customers/route");
    const { signIn } = await import("@/lib/server/auth");
    const { addManagerByEmail } = await import("@/lib/server/staff");
    const { sign } = await import("@/lib/server/crypto");
    const { outlet, naan } = await shop();
    await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }]));
    cookieJar.set("zest_outlet", sign(outlet.id));
    await signIn({ email: `own-${outlet.id}@example.in`, name: "O" });
    expect(((await (await GET(new Request("http://x"), ctx())).json()) as { phone: string }[])[0].phone).toBe("+919845012345");
    await addManagerByEmail(outlet.brandId!, { name: "M", email: `mgr-${outlet.id}@example.in`, outletIds: null });
    cookieJar.clear();
    await signIn({ email: `mgr-${outlet.id}@example.in`, name: "M" });
    expect(((await (await GET(new Request("http://x"), ctx())).json()) as { phone: string }[])[0].phone).toBe("+91 ••••• 12345");
  });

  it("refuses a UPI ID that isn't one", async () => {
    const { PATCH } = await import("@/app/api/outlet/route");
    const { signIn } = await import("@/lib/server/auth");
    const { sign } = await import("@/lib/server/crypto");
    const o = await freshOutlet();
    cookieJar.set("zest_outlet", sign(o.id));
    await signIn({ email: `upi-${o.id}@example.in`, name: "U" });
    const bad = await PATCH(new Request("http://x", { method: "PATCH", body: JSON.stringify({ upiId: "not a upi" }) }), ctx());
    expect(bad.status).toBe(400);
    const good = await PATCH(new Request("http://x", { method: "PATCH", body: JSON.stringify({ upiId: "Rasoi27@OKHDFC", ordering: true }) }), ctx());
    expect(((await good.json()) as { upiId: string; ordering: boolean })).toMatchObject({ upiId: "rasoi27@okhdfc", ordering: true });
  });

  it("lets kitchen staff move a website order along", async () => {
    const { PATCH } = await import("@/app/api/orders/[id]/route");
    const { addStaff, pinSignIn } = await import("@/lib/server/staff");
    const { outlet, naan } = await shop();
    const r = await placeOrder(outlet.slug!, order([{ itemId: naan.id, qty: 1 }]));
    await addStaff(outlet.brandId!, { name: "K", role: "kitchen", outletIds: null, pin: "1122" });
    await pinSignIn(outlet.staffCode!, "1122");
    const res = await PATCH(new Request("http://x", { method: "PATCH", body: JSON.stringify({ action: "accept" }) }), ctx({ id: r.orderId }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("accepted");
  });
});
