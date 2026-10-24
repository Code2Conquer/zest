import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "../phone";
import { audit, HttpError } from "./approvals";
import { updateCustomer } from "./customer-updates";
import { db } from "./db";
import { dinePrice } from "./dining";
import { customers, menuItems, orderLines, orders, plans, type Outlet, type PlanRow } from "./schema";
import { indiaNow } from "./stock";

// Weekly tiffin plans: a regular gets the same dish on chosen days, paid for the week. Each morning the
// day's orders are created from the active plans (once per plan per day), so they show up in the kitchen
// like any other order and follow the same updates and delivery.

export const PlanInput = z.object({
  name: z.string().trim().min(1, "Enter the customer's name").max(60),
  phone: z.string().trim().min(10).max(20),
  itemId: z.string(),
  qty: z.number().int().min(1).max(10),
  days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day").max(7),
  fulfilment: z.enum(["delivery", "pickup"]),
  address: z.string().trim().max(300).optional(),
  note: z.string().trim().max(200).optional(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeks: z.number().int().min(1).max(8),
});

const addDays = (date: string, n: number) => new Date(new Date(`${date}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** The dates a plan covers, from its start to its end, on its days, less the skipped ones. */
export function planDates(p: Pick<PlanRow, "startsOn" | "endsOn" | "days" | "skips">) {
  const out: string[] = [];
  for (let d = p.startsOn; d <= p.endsOn; d = addDays(d, 1)) if (p.days.includes(weekday(d)) && !p.skips.includes(d)) out.push(d);
  return out;
}

export async function createPlan(outlet: Outlet, raw: unknown) {
  const input = PlanInput.parse(raw);
  if (input.fulfilment === "delivery" && (!input.address || input.address.length < 8)) throw new HttpError(400, "Enter the delivery address.");
  let phone: string;
  try {
    phone = normalizePhone(input.phone);
  } catch {
    throw new HttpError(400, "Enter a 10-digit mobile number.");
  }
  const [dish] = await db.select().from(menuItems).where(and(eq(menuItems.id, input.itemId), eq(menuItems.outletId, outlet.id)));
  if (!dish) throw new HttpError(400, "Pick a dish from your menu.");
  const now = new Date().toISOString();
  const [customer] = await db
    .insert(customers)
    .values({ brandId: outlet.brandId!, phone, name: input.name, firstOrderAt: now, lastOrderAt: now })
    .onConflictDoUpdate({ target: [customers.brandId, customers.phone], set: { name: input.name } })
    .returning();
  const endsOn = addDays(input.startsOn, input.weeks * 7 - 1);
  const base = { startsOn: input.startsOn, endsOn, days: input.days, skips: [] as string[] };
  const meals = planDates(base).length;
  if (!meals) throw new HttpError(400, "Those days don't fall in the weeks chosen.");
  const [row] = await db
    .insert(plans)
    .values({ outletId: outlet.id, customerId: customer.id, itemId: dish.id, qty: input.qty, days: input.days, fulfilment: input.fulfilment, address: input.address ?? "", note: input.note ?? "", startsOn: input.startsOn, endsOn, amount: meals * input.qty * dinePrice(dish) })
    .returning();
  await audit(outlet.id, "owner", "plan.created", { planId: row.id, customer: customer.name, meals });
  return planDTO(row, customer, dish.name);
}

export const planDTO = (p: PlanRow, c: { name: string; phone: string }, dish: string) => ({
  id: p.id,
  customer: { name: c.name, phone: c.phone },
  dish,
  qty: p.qty,
  days: p.days,
  fulfilment: p.fulfilment,
  address: p.address,
  note: p.note,
  startsOn: p.startsOn,
  endsOn: p.endsOn,
  amount: p.amount,
  paymentStatus: p.paymentStatus,
  skips: p.skips,
  active: p.active,
  meals: planDates(p).length,
});

export async function listPlans(outletId: string) {
  const rows = await db
    .select({ p: plans, name: customers.name, phone: customers.phone, dish: menuItems.name })
    .from(plans)
    .innerJoin(customers, eq(customers.id, plans.customerId))
    .innerJoin(menuItems, eq(menuItems.id, plans.itemId))
    .where(eq(plans.outletId, outletId))
    .orderBy(asc(plans.endsOn));
  return rows.map((r) => planDTO(r.p, { name: r.name, phone: r.phone }, r.dish));
}

export const PlanChange = z.union([
  z.object({ action: z.literal("skip"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal("unskip"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal("paid") }),
  z.object({ action: z.literal("stop") }),
]);

export async function changePlan(outletId: string, id: string, raw: unknown) {
  const change = PlanChange.parse(raw);
  const [p] = await db.select().from(plans).where(and(eq(plans.id, id), eq(plans.outletId, outletId)));
  if (!p) throw new HttpError(404, "Plan not found.");
  const set: Partial<PlanRow> =
    change.action === "skip"
      ? { skips: [...new Set([...p.skips, change.date])] }
      : change.action === "unskip"
        ? { skips: p.skips.filter((d) => d !== change.date) }
        : change.action === "paid"
          ? { paymentStatus: "paid" }
          : { active: false };
  await db.update(plans).set(set).where(eq(plans.id, id));
  await audit(outletId, "owner", `plan.${change.action}`, { planId: id });
  return { ok: true };
}

/**
 * Creates today's orders from active plans (India date), once each: a plan's order for a day has the
 * external id "P-<plan>-<date>", which is unique per outlet, so running this twice changes nothing.
 */
export async function ordersFromPlans(outletId?: string, at = new Date()) {
  const { date } = indiaNow(at);
  const due = await db
    .select({ p: plans, dish: menuItems })
    .from(plans)
    .innerJoin(menuItems, eq(menuItems.id, plans.itemId))
    .where(and(eq(plans.active, true), sql`${plans.startsOn} <= ${date}`, sql`${plans.endsOn} >= ${date}`, ...(outletId ? [eq(plans.outletId, outletId)] : [])));
  let made = 0;
  for (const { p, dish } of due) {
    if (!planDates(p).includes(date)) continue;
    const externalId = `P-${p.id.slice(0, 6)}-${date}`;
    const [exists] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.outletId, p.outletId), eq(orders.externalId, externalId)));
    if (exists) continue;
    const orderId = crypto.randomUUID();
    const unit = dinePrice(dish);
    const [row] = await db
      .insert(orders)
      .values({
        id: orderId,
        outletId: p.outletId,
        channel: "web",
        externalId,
        items: `${p.qty} ${dish.name}`,
        amount: unit * p.qty,
        placedAt: new Date().toISOString(),
        status: "accepted",
        customerId: p.customerId,
        fulfilment: p.fulfilment,
        paymentStatus: p.paymentStatus === "paid" ? "paid" : "unpaid",
        paymentMethod: "upi",
        note: p.note || null,
        ...(p.fulfilment === "delivery" ? { deliveryAddress: p.address, deliveryBy: "own_staff" as const, deliveryFee: 0 } : {}),
        publicToken: randomBytes(16).toString("base64url"),
        planId: p.id,
      })
      .returning();
    await db.insert(orderLines).values({ orderId, itemId: dish.id, name: dish.name, qty: p.qty, unitPrice: unit, lineTotal: unit * p.qty });
    await updateCustomer(row, "accepted");
    made++;
  }
  return made;
}
