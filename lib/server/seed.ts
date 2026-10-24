import "server-only";
import { and, asc, eq, gte, isNull, lt } from "drizzle-orm";
import { MEENA, MEENA_MENU, MENU, ORDERS, OUTLET, PAYOUTS, RATINGS, REVIEWS, SALES_YESTERDAY } from "../data";
import { fromLegacyStatus, type OrderStatus } from "../orders";
import { createApproval } from "./approvals";
import { db } from "./db";
import { dinePrice, ensureTables } from "./dining";
import { dayBounds } from "./queries";
import { campaigns, connections, customers, plans, diningTables, dineTabs, menuItems, orders, outlets, payouts, reservations, reviews, brands, outletHours, type TabLine } from "./schema";

export const DEMO_OUTLET_ID = "demo";
export const MEENA_OUTLET_ID = "demo-meena";
export const DEMO_BRAND_ID = "demo-brand";
// The sample restaurant opens 11 am to 11:30 pm every day.
const DEFAULT_HOURS = (outletId: string) => [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ outletId, weekday, opens: "11:00", closes: "23:30" }));

/**
 * The homepage's sample seller: Meena's Kitchen, a home kitchen that sells only on its own page.
 * Kept out of search like the sample restaurant; its page is /r/meenas-kitchen.
 */
export async function seedMeena() {
  const [existing] = await db.select({ id: outlets.id }).from(outlets).where(eq(outlets.id, MEENA_OUTLET_ID));
  if (existing) return;
  await db.insert(brands).values({ id: `${MEENA_OUTLET_ID}-brand`, name: MEENA.name }).onConflictDoNothing();
  await db.insert(outlets).values({
    id: MEENA_OUTLET_ID,
    brandId: `${MEENA_OUTLET_ID}-brand`,
    slug: "meenas-kitchen",
    ordering: true,
    name: MEENA.name,
    area: "Green Park",
    city: MEENA.city,
    cuisines: "Home-style North Indian, Pure veg",
    ownerName: MEENA.ownerFirstName,
    journey: "new",
    isDemo: true,
  });
  await db.insert(outletHours).values([0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ outletId: MEENA_OUTLET_ID, weekday, opens: "08:00", closes: "21:30" }))).onConflictDoNothing();
  await db.insert(menuItems).values(
    MEENA_MENU.map((m, i) => ({
      outletId: MEENA_OUTLET_ID,
      name: m.name,
      category: m.category,
      kind: m.kind,
      veg: true,
      bestseller: !!m.bestseller,
      description: m.description,
      photoUrl: m.photo,
      rating: 0,
      votes: 0,
      price: { zomato: m.price, swiggy: m.price },
      available: { zomato: true, swiggy: true },
      ordersLast7: 0,
      sort: i,
    })),
  );
}

/** A sample restaurant so the app has something to show before anything is connected. */
export async function seedDemo() {
  const existing = await db.select({ id: outlets.id }).from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  if (existing.length) {
    // Demo seeded before brands existed: give it the fixed demo brand.
    await db.insert(brands).values({ id: DEMO_BRAND_ID, name: OUTLET.name }).onConflictDoNothing();
    await db.update(outlets).set({ brandId: DEMO_BRAND_ID }).where(and(eq(outlets.id, DEMO_OUTLET_ID), isNull(outlets.brandId)));
    // The sample restaurant shows the ordering site; payment at the counter (no real UPI ID).
    await db.update(outlets).set({ ordering: true }).where(eq(outlets.id, DEMO_OUTLET_ID));
    // Demo seeded before opening hours existed.
    const [anyHours] = await db.select({ id: outletHours.id }).from(outletHours).where(eq(outletHours.outletId, DEMO_OUTLET_ID)).limit(1);
    if (!anyHours) await db.insert(outletHours).values(DEFAULT_HOURS(DEMO_OUTLET_ID)).onConflictDoNothing();
    return backfillDemoPhotos();
  }

  await db.insert(brands).values({ id: DEMO_BRAND_ID, name: OUTLET.name }).onConflictDoNothing();
  await db.insert(outlets).values({
    id: DEMO_OUTLET_ID,
    brandId: DEMO_BRAND_ID,
    ordering: true,
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

// Demo dishes renamed since the live demo was seeded, so their photos need no credit line.
const RENAMED: Record<string, string> = { "Rajma chawal": "Dal tadka with rice", "Gulab jamun (2 pc)": "Gajar halwa" };

/** Brings the live demo's dishes in line with MENU: renamed dishes, and the current photo for each. */
async function backfillDemoPhotos() {
  const rows = await db.select({ id: menuItems.id, name: menuItems.name, photoUrl: menuItems.photoUrl }).from(menuItems).where(eq(menuItems.outletId, DEMO_OUTLET_ID));
  for (const row of rows) {
    const name = RENAMED[row.name] ?? row.name;
    const m = MENU.find((x) => x.name === name);
    if (!m) continue;
    // Only sample photos are replaced; a photo someone uploaded stays.
    const stale = !row.photoUrl || (row.photoUrl.startsWith("/photos/menu-") && row.photoUrl !== m.photo);
    if (name !== row.name || stale) {
      await db
        .update(menuItems)
        .set({ name, ...(name !== row.name ? { description: m.description } : {}), ...(stale ? { photoUrl: m.photo ?? null } : {}) })
        .where(eq(menuItems.id, row.id));
    }
  }
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
  for (const ch of ["zomato", "swiggy", "dine"] as const) {
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
        status: ch === "dine" ? ("served" as const) : ("completed" as const),
        prepMins: 9 + ((i * 7) % 9),
      });
    }
  }
  return rows;
}

/** Copies the sample menu, orders, payouts and reviews to an outlet. */
export async function seedRestaurantData(outletId: string) {
  await db.insert(outletHours).values(DEFAULT_HOURS(outletId)).onConflictDoNothing();
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
      photoUrl: m.photo ?? null,
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
    ORDERS.map((o) => ({ outletId, channel: o.channel, externalId: o.id, items: o.items, amount: o.amount, placedAt: at(o.placedAt), ...fromLegacyStatus(o.status), prepMins: o.prepMins })),
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

/**
 * The demo floor for today: a few tables seated, one waiting for the bill, a booking
 * coming up, two walk-ins waiting, and the lunch service already settled. Rebuilt the
 * first time Dining is opened each day so the sample always looks like a live service.
 */
export async function refreshDemoDining(outletId: string) {
  const [from, to] = dayBounds(0);
  const [today] = await db.select({ id: reservations.id }).from(reservations).where(and(eq(reservations.outletId, outletId), gte(reservations.at, from), lt(reservations.at, to))).limit(1);
  if (today) return;
  await db.delete(dineTabs).where(eq(dineTabs.outletId, outletId));
  await db.delete(reservations).where(eq(reservations.outletId, outletId));
  await ensureTables(outletId);
  const tables = await db.select().from(diningTables).where(eq(diningTables.outletId, outletId)).orderBy(asc(diningTables.sort));
  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, outletId));
  const dish = (name: string, qty: number): TabLine => {
    const m = menu.find((x) => x.name === name)!;
    return { itemId: m.id, name: m.name, price: dinePrice(m), qty, veg: m.veg };
  };
  const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
  const ahead = (mins: number) => new Date(Date.now() + mins * 60_000).toISOString();
  const byLabel = (l: string) => tables.find((t) => t.label === l)!;
  const total = (lines: TabLine[]) => lines.reduce((s, l) => s + l.price * l.qty, 0);

  const open: { table: string; party: string; size: number; mins: number; lines: TabLine[]; status: "open" | "billed" }[] = [
    { table: "T3", party: "Mehta family", size: 4, mins: 34, lines: [dish("Paneer tikka", 1), dish("Dal makhani", 1), dish("Butter naan", 4)], status: "open" },
    { table: "T6", party: "Office lunch", size: 6, mins: 52, lines: [dish("Veg thali", 4), dish("Chicken biryani", 2), dish("Gajar halwa", 3)], status: "billed" },
    { table: "O1", party: "", size: 2, mins: 12, lines: [dish("Chole bhature", 2)], status: "open" },
  ];
  for (const t of open) {
    await db.insert(dineTabs).values({ outletId, tableId: byLabel(t.table).id, partyName: t.party, partySize: t.size, lines: t.lines, status: t.status, total: total(t.lines), openedAt: ago(t.mins) });
  }
  const settled: [string, number, number, TabLine[], "cash" | "upi" | "card"][] = [
    ["T1", 2, 240, [dish("Veg thali", 2)], "upi"],
    ["T4", 3, 220, [dish("Chicken biryani", 2), dish("Malai tikka", 1)], "card"],
    ["T2", 2, 200, [dish("Dal tadka with rice", 2), dish("Gajar halwa", 2)], "cash"],
    ["T5", 4, 170, [dish("Paneer tikka", 2), dish("Veg dum biryani", 2), dish("Garlic naan", 2)], "upi"],
  ];
  for (const [label, size, mins, lines, paidVia] of settled) {
    await db.insert(dineTabs).values({ outletId, tableId: byLabel(label).id, partySize: size, lines, status: "closed", paidVia, total: total(lines), openedAt: ago(mins), closedAt: ago(mins - 48) });
  }
  await db.insert(reservations).values([
    { outletId, kind: "booking", name: "Priya Nair", phone: "+91 98450 11223", partySize: 4, at: ahead(40), status: "booked", tableId: byLabel("T5").id, note: "Birthday, a candle with dessert" },
    { outletId, kind: "booking", name: "Arjun Rao", phone: "+91 99001 44567", partySize: 2, at: ahead(150), status: "booked", tableId: null, note: "" },
    { outletId, kind: "waitlist", name: "Sana", phone: "+91 90080 77821", partySize: 2, at: ago(9), quotedMins: 10, status: "waiting", tableId: null, note: "" },
    { outletId, kind: "waitlist", name: "Kapoor", phone: null, partySize: 5, at: ago(4), quotedMins: 25, status: "waiting", tableId: null, note: "Needs a high chair" },
  ]);
}

/** Demo campaigns: two running well, one paused automatically, one finished at its cap. */
export async function refreshDemoGrowth(outletId: string) {
  const [any] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.outletId, outletId)).limit(1);
  if (any) return;
  const day = 86_400_000;
  const at = (d: number) => new Date(Date.now() + d * day).toISOString();
  await db.insert(campaigns).values([
    { outletId, platform: "swiggy", kind: "promo", goal: "new_customers", title: "20% off up to ₹80 for new customers", window: "All day", spendCap: 3000, spent: 1840, orders: 41, revenue: 15500, expectedOrders: 48, status: "live", startsAt: at(-4), endsAt: at(3) },
    { outletId, platform: "swiggy", kind: "ad", goal: "dish", title: "Ad boost for Chicken biryani", window: "Lunch and dinner", spendCap: 1500, spent: 730, orders: 14, revenue: 5040, expectedOrders: 12, status: "live", startsAt: at(-3), endsAt: at(4) },
    { outletId, platform: "zomato", kind: "promo", goal: "slow_hours", title: "15% off up to ₹75, 3 to 6 pm", window: "3 to 6 pm, Mon to Thu", spendCap: 2000, spent: 620, orders: 9, revenue: 1550, expectedOrders: 22, status: "paused", statusDetail: "Paused automatically: returning 2.5× against a 3× floor", startsAt: at(-6), endsAt: at(8) },
    { outletId, platform: "zomato", kind: "promo", goal: "bigger_orders", title: "Flat ₹60 off on orders above ₹499", window: "Fri to Sun, 7 to 11 pm", spendCap: 2500, spent: 2500, orders: 52, revenue: 27100, expectedOrders: 45, status: "ended", statusDetail: "Spend cap reached", startsAt: at(-12), endsAt: at(-5) },
  ]);
}

/**
 * Meena's Kitchen as a busy day looks: yesterday's orders, today's so far (two waiting for her OK, one
 * cooking, one with a Zomato rider), and the regulars behind them. All on her own page, WhatsApp and
 * phone. Rebuilt the first time her dashboard is opened each day so the sample always looks current.
 */
export async function refreshMeenaDay() {
  const [from, to] = dayBounds(0);
  const [today] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.outletId, MEENA_OUTLET_ID), gte(orders.placedAt, from), lt(orders.placedAt, to))).limit(1);
  if (today) return;
  const brandId = `${MEENA_OUTLET_ID}-brand`;
  await db.delete(orders).where(eq(orders.outletId, MEENA_OUTLET_ID));
  await db.delete(customers).where(eq(customers.brandId, brandId));

  // Her regulars: neighbours, an office, a hostel, a family two buildings away.
  const REGULARS = [
    ["Sharma ji · B-14", 31, 4120], ["Priya · Flat 302", 24, 3360], ["Rohan (PG, Hauz Khas)", 19, 1890], ["Kapoor family · C-7", 17, 3980],
    ["Ananya · Green Park Ext", 14, 1640], ["Office lunch · Yusuf Sarai", 12, 5760], ["Neha · D-21", 9, 1080], ["Vikram · Flat 108", 8, 960],
    ["Mrs. Iyer · A-3", 6, 1170], ["Kabir (hostel)", 5, 450], ["Aditi · Safdarjung", 3, 390], ["Fatima · E-2", 2, 240],
  ] as const;
  const day = 86_400_000;
  const people = await db
    .insert(customers)
    .values(REGULARS.map(([name, n, spent], i) => ({ brandId, phone: `+91${["98", "99", "97", "88", "70", "81", "96", "90", "78", "93", "85", "62"][i]}${String(10234567 + i * 7130291).slice(-8)}`, name, orders: n, spent, firstOrderAt: new Date(Date.now() - (60 + i * 9) * day).toISOString(), lastOrderAt: new Date(Date.now() - (i < 6 ? 0 : i - 4) * day).toISOString() })))
    .returning({ id: customers.id });

  const DISHES = ["Rajma chawal|90", "Kadhi chawal|90", "Thali|120", "Aloo paratha|60"];
  const basket = (i: number) => {
    const a = DISHES[i % DISHES.length].split("|"), b = DISHES[(i * 3 + 1) % DISHES.length].split("|");
    const qa = 1 + (i % 3), qb = i % 2;
    return { items: [`${qa} ${a[0]}`, qb ? `${qb} ${b[0]}` : ""].filter(Boolean).join(", "), amount: qa * Number(a[1]) + qb * Number(b[1]) };
  };
  const CH = ["web", "whatsapp", "web", "phone", "whatsapp", "web"] as const;
  const row = (i: number, at: number, status: OrderStatus, ext: string) => {
    const { items, amount } = basket(i);
    const delivery = i % 3 !== 2;
    return {
      outletId: MEENA_OUTLET_ID, channel: CH[i % CH.length], externalId: ext, items, amount: amount + (delivery ? 35 : 0), placedAt: new Date(at).toISOString(), status, prepMins: 15 + (i % 4) * 5,
      customerId: people[i % people.length].id, fulfilment: delivery ? ("delivery" as const) : ("pickup" as const), paymentStatus: "paid" as const, paymentMethod: "upi" as const,
      deliveryBy: delivery ? ("zomato_rider" as const) : null, deliveryFee: delivery ? 35 : null, deliveryKm: delivery ? 1.2 + (i % 5) * 0.9 : null,
    };
  };

  // Yesterday: 16 orders from breakfast to dinner.
  const y0 = new Date(from).getTime() - day;
  const rows = Array.from({ length: 16 }, (_, i) => row(i + 3, y0 + (8 * 60 + i * 47) * 60_000, "completed", `My${i + 1}`));
  // Today: done earlier, then what's on the stove and what's waiting. Kept inside today however early it is.
  const now = Date.now(), start = new Date(from).getTime() + 5 * 60_000;
  const ago = (m: number) => Math.max(start, now - m * 60_000);
  const TODAY: [number, OrderStatus][] = [[290, "completed"], [250, "completed"], [210, "completed"], [170, "completed"], [140, "completed"], [100, "completed"], [55, "out_for_delivery"], [32, "preparing"], [18, "accepted"], [6, "new"], [2, "new"]];
  TODAY.forEach(([m, s], i) => rows.push(row(i, ago(m), s, `Mt${i + 1}`)));
  await db.insert(orders).values(rows);

  // Cook to the count: lunch closes at 11, thali and rajma are made to a number.
  await db.update(outlets).set({ cutoffs: { Lunch: "11:00" } }).where(eq(outlets.id, MEENA_OUTLET_ID));
  for (const [name, n] of [["Thali", 30], ["Rajma chawal", 20]] as const) await db.update(menuItems).set({ dailyLimit: n }).where(and(eq(menuItems.outletId, MEENA_OUTLET_ID), eq(menuItems.name, name)));
  // Notes on two regulars, and three of them on weekly tiffin plans.
  await db.update(customers).set({ note: "Less spicy, no onion" }).where(eq(customers.id, people[2].id));
  await db.update(customers).set({ note: "Leave with the guard if not home" }).where(eq(customers.id, people[5].id));
  await db.delete(plans).where(eq(plans.outletId, MEENA_OUTLET_ID));
  const dish = Object.fromEntries((await db.select().from(menuItems).where(eq(menuItems.outletId, MEENA_OUTLET_ID))).map((m) => [m.name, m]));
  const monday = (() => {
    const d = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  })();
  const sunday = new Date(new Date(`${monday}T00:00:00Z`).getTime() + 6 * day).toISOString().slice(0, 10);
  if (dish.Thali && dish["Rajma chawal"])
    await db.insert(plans).values([
      { outletId: MEENA_OUTLET_ID, customerId: people[2].id, itemId: dish.Thali.id, qty: 1, days: [1, 2, 3, 4, 5], fulfilment: "delivery", address: "PG, Hauz Khas, 2nd floor", note: "Less spicy", startsOn: monday, endsOn: sunday, amount: 600, paymentStatus: "paid" },
      { outletId: MEENA_OUTLET_ID, customerId: people[5].id, itemId: dish.Thali.id, qty: 4, days: [1, 2, 3, 4, 5], fulfilment: "delivery", address: "Office, Yusuf Sarai", note: "", startsOn: monday, endsOn: sunday, amount: 2400, paymentStatus: "paid" },
      { outletId: MEENA_OUTLET_ID, customerId: people[7].id, itemId: dish["Rajma chawal"].id, qty: 1, days: [1, 3, 5], fulfilment: "pickup", address: "", note: "", startsOn: monday, endsOn: sunday, amount: 270, paymentStatus: "unpaid" },
    ]);

  // A week of dish counts for "best sellers".
  for (const [name, n] of [["Thali", 52], ["Rajma chawal", 38], ["Aloo paratha", 31], ["Kadhi chawal", 24], ["Diwali sweets box", 6]] as const) {
    await db.update(menuItems).set({ ordersLast7: n }).where(and(eq(menuItems.outletId, MEENA_OUTLET_ID), eq(menuItems.name, name)));
  }
}

/** The sample restaurant's orders, moved to yesterday and today the first time it's opened each day. */
export async function refreshRestaurantDay() {
  const [from, to] = dayBounds(-1);
  const [yesterday] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.outletId, DEMO_OUTLET_ID), gte(orders.placedAt, from), lt(orders.placedAt, to))).limit(1);
  if (yesterday) return;
  const today = new Date();
  const at = (time: string) => {
    const [hm, ampm] = time.split(" ");
    const [h, m] = hm.split(":").map(Number);
    const d = new Date(today);
    d.setHours((h % 12) + (ampm === "pm" ? 12 : 0), m, 0, 0);
    return d.toISOString();
  };
  await db.delete(orders).where(eq(orders.outletId, DEMO_OUTLET_ID));
  await db.insert(orders).values(yesterdaysOrders(DEMO_OUTLET_ID));
  await db.insert(orders).values(ORDERS.map((o) => ({ outletId: DEMO_OUTLET_ID, channel: o.channel, externalId: o.id, items: o.items, amount: o.amount, placedAt: at(o.placedAt), ...fromLegacyStatus(o.status), prepMins: o.prepMins })));
}
