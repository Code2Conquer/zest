import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { isOpenAt } from "../hours";
import { normalizePhone } from "../phone";
import { audit, HttpError } from "./approvals";
import { db } from "./db";
import { dinePrice } from "./dining";
import { getHours } from "./hours";
import { orderLineRows, summariseLines } from "./order-lines";
import { checkRate } from "./rate-limit";
import { customers, menuItems, orderLines, orders, outlets, type Outlet } from "./schema";

// The restaurant's own ordering site at /r/{slug}: pickup or table orders, paid by UPI to the
// restaurant's own UPI ID or at the counter. Staff confirm payment; nothing moves money through Zest.

/** "Dosa & Chai Point!" → "dosa-chai-point". Names with no Latin letters fall back to "restaurant". */
export function slugify(name: string): string {
  const s = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s || "restaurant";
}

/** Gives every outlet without one a web address, unique across Zest. */
export async function ensureSlugs() {
  for (const o of await db.select({ id: outlets.id, name: outlets.name }).from(outlets).where(isNull(outlets.slug))) {
    const base = slugify(o.name);
    for (let n = 1; ; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const [taken] = await db.select({ id: outlets.id }).from(outlets).where(eq(outlets.slug, slug));
      if (taken) continue;
      await db.update(outlets).set({ slug }).where(and(eq(outlets.id, o.id), isNull(outlets.slug)));
      break;
    }
  }
}

export function upiLink(upiId: string, payee: string, amount: number, orderNo: string): string {
  const q = new URLSearchParams({ pa: upiId, pn: payee, am: amount.toFixed(2), cu: "INR", tn: `Zest order ${orderNo}` });
  return `upi://pay?${q}`;
}

async function shopBySlug(slug: string): Promise<Outlet> {
  const [o] = await db.select().from(outlets).where(eq(outlets.slug, slug));
  if (!o || !o.ordering) throw new HttpError(404, "This restaurant isn't taking orders online.");
  return o;
}

/** Open when no hours are set yet (not set ≠ closed), otherwise by the outlet's hours for the website channel. */
async function openNow(outletId: string) {
  const { weekly, special } = await getHours(outletId);
  if (!weekly.length && !special.length) return true;
  return isOpenAt(weekly, special, new Date(), "web");
}

export async function getStorefront(slug: string) {
  const o = await shopBySlug(slug);
  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, o.id)).orderBy(asc(menuItems.sort));
  return {
    name: o.name,
    area: [o.area, o.city].filter(Boolean).join(", "),
    cuisines: o.cuisines,
    fssai: o.fssai,
    open: await openNow(o.id),
    upi: !!o.upiId,
    menu: menu
      .filter((m) => Object.values(m.available).some(Boolean))
      .map((m) => ({ id: m.id, name: m.name, category: m.category, description: m.description, veg: m.veg, bestseller: m.bestseller, photo: m.photoUrl, price: dinePrice(m) })),
  };
}

export const OrderInput = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  phone: z.string().trim().min(10).max(20),
  fulfilment: z.enum(["pickup", "table"]),
  table: z.string().trim().max(20).optional(),
  pay: z.enum(["upi", "counter"]),
  note: z.string().trim().max(200).optional(),
  lines: z.array(z.object({ itemId: z.string(), qty: z.number().int().min(1).max(20) })).min(1, "Add a dish").max(30),
});

/** Places a website order. Prices come from the menu on the server; whatever the browser sent is ignored. */
export async function placeOrder(slug: string, raw: unknown, ip?: string) {
  const input = OrderInput.parse(raw);
  if (ip && !(await checkRate(`order:${ip}`, 10, 600))) throw new HttpError(429, "Too many orders from this connection. Try again in a few minutes.");
  const o = await shopBySlug(slug);
  if (!(await openNow(o.id))) throw new HttpError(409, "The restaurant is closed right now.");
  if (input.fulfilment === "table" && !input.table) throw new HttpError(400, "Which table are you at?");
  if (input.pay === "upi" && !o.upiId) throw new HttpError(400, "This restaurant takes payment at the counter.");
  let phone: string;
  try {
    phone = normalizePhone(input.phone);
  } catch {
    throw new HttpError(400, "Enter a 10-digit mobile number.");
  }

  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, o.id));
  const lines = input.lines.map((l) => {
    const m = menu.find((x) => x.id === l.itemId);
    if (!m || !Object.values(m.available).some(Boolean)) throw new HttpError(400, `${m?.name ?? "A dish"} isn't available right now.`);
    return { itemId: m.id, name: m.name, qty: l.qty, unitPrice: dinePrice(m) };
  });
  const rows = orderLineRows("pending", lines);
  const total = rows.reduce((s, r) => s + r.lineTotal, 0);

  const [{ n }] = await db.select({ n: count() }).from(orders).where(and(eq(orders.outletId, o.id), eq(orders.channel, "web")));
  const number = `W-${String(n + 1).padStart(4, "0")}`;
  const now = new Date().toISOString();
  const [customer] = await db
    .insert(customers)
    .values({ brandId: o.brandId!, phone, name: input.name, orders: 1, spent: total, firstOrderAt: now, lastOrderAt: now })
    .onConflictDoUpdate({ target: [customers.brandId, customers.phone], set: { name: input.name, orders: sql`${customers.orders} + 1`, spent: sql`${customers.spent} + ${total}`, lastOrderAt: now } })
    .returning();

  const orderId = crypto.randomUUID();
  const token = randomBytes(16).toString("base64url");
  await db.batch([
    db.insert(orders).values({
      id: orderId,
      outletId: o.id,
      channel: "web",
      externalId: number,
      items: summariseLines(lines),
      amount: total,
      placedAt: now,
      status: "new",
      customerId: customer.id,
      fulfilment: input.fulfilment,
      tableLabel: input.fulfilment === "table" ? input.table! : null,
      paymentStatus: "unpaid",
      paymentMethod: input.pay,
      note: input.note || null,
      publicToken: token,
    }),
    db.insert(orderLines).values(rows.map((r) => ({ ...r, orderId }))),
  ]);
  await audit(o.id, "customer", "web.order", { orderId, number, total });
  return { orderId, number, total, token, upiLink: input.pay === "upi" && o.upiId ? upiLink(o.upiId, o.name, total, number) : null };
}

/** One order's progress for the customer who placed it, by its private token. */
export async function orderStatus(slug: string, orderId: string, token: string) {
  const o = await shopBySlug(slug);
  const [row] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.outletId, o.id)));
  if (!row || !row.publicToken || row.publicToken !== token) throw new HttpError(404, "Order not found.");
  return {
    number: row.externalId,
    status: row.status,
    total: row.amount,
    items: row.items,
    paymentStatus: row.paymentStatus,
    fulfilment: row.fulfilment,
    table: row.tableLabel,
    upiLink: row.paymentMethod === "upi" && row.paymentStatus === "unpaid" && o.upiId ? upiLink(o.upiId, o.name, row.amount, row.externalId) : null,
  };
}
