import "server-only";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import type { DiningDTO, ReservationDTO, TabDTO } from "../types";
import { audit, HttpError } from "./approvals";
import { db } from "./db";
import { dayBounds } from "./queries";
import { orderLineRows, summariseLines } from "./order-lines";
import { diningTables, dineTabs, menuItems, orderLines, orders, reservations, type DineTab, type MenuItemRow, type Reservation, type TabLine } from "./schema";
import { notify } from "./whatsapp";

// Dine-in for a small restaurant without a POS: tables, running bills that become
// dine-in orders when paid, bookings and a walk-in waitlist.

const OPEN = ["open", "billed"] as const;

/** Dine-in price: the lowest platform price, since aggregator prices carry their commission. */
export const dinePrice = (m: Pick<MenuItemRow, "price">) => Math.min(...Object.values(m.price));

const tabDTO = (t: DineTab): TabDTO => ({ id: t.id, tableId: t.tableId, partyName: t.partyName, partySize: t.partySize, lines: t.lines, status: t.status, total: totalOf(t.lines), openedAt: t.openedAt });
const reservationDTO = (r: Reservation): ReservationDTO => ({ id: r.id, kind: r.kind, name: r.name, phone: r.phone, partySize: r.partySize, at: r.at, quotedMins: r.quotedMins, status: r.status, tableId: r.tableId, note: r.note });
const totalOf = (lines: TabLine[]) => lines.reduce((s, l) => s + l.price * l.qty, 0);

/** Everything the Dining screen shows. */
export async function getDining(outletId: string): Promise<DiningDTO> {
  const [from, to] = dayBounds(0);
  const tables = await db.select().from(diningTables).where(eq(diningTables.outletId, outletId)).orderBy(asc(diningTables.sort), asc(diningTables.label));
  const open = await db.select().from(dineTabs).where(and(eq(dineTabs.outletId, outletId), inArray(dineTabs.status, [...OPEN])));
  const closedToday = await db.select().from(dineTabs).where(and(eq(dineTabs.outletId, outletId), eq(dineTabs.status, "closed"), gte(dineTabs.closedAt, from), lt(dineTabs.closedAt, to)));
  const today = await db.select().from(reservations).where(and(eq(reservations.outletId, outletId), gte(reservations.at, from), lt(reservations.at, to))).orderBy(asc(reservations.at));
  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, outletId)).orderBy(asc(menuItems.sort));

  const soon = Date.now() + 90 * 60_000;
  const bookings = today.filter((r) => r.kind === "booking");
  return {
    tables: tables.map((t) => {
      const tab = open.find((x) => x.tableId === t.id) ?? null;
      // A table is held for a booking assigned to it within the next 90 minutes.
      const booking = bookings.find((r) => r.tableId === t.id && r.status === "booked" && Date.parse(r.at) <= soon) ?? null;
      return {
        id: t.id,
        label: t.label,
        seats: t.seats,
        zone: t.zone,
        status: tab ? (tab.status === "billed" ? "billing" : "seated") : booking ? "reserved" : "free",
        tab: tab ? tabDTO(tab) : null,
        booking: booking ? reservationDTO(booking) : null,
      };
    }),
    bookings: bookings.filter((r) => r.status !== "cancelled").map(reservationDTO),
    waitlist: today.filter((r) => r.kind === "waitlist" && (r.status === "waiting" || r.status === "notified")).map(reservationDTO),
    stats: {
      covers: closedToday.reduce((s, t) => s + t.partySize, 0),
      sales: closedToday.reduce((s, t) => s + t.total, 0),
      bills: closedToday.length,
      avgMins: closedToday.length ? Math.round(closedToday.reduce((s, t) => s + (Date.parse(t.closedAt!) - Date.parse(t.openedAt)), 0) / closedToday.length / 60_000) : null,
      openTables: open.length,
      seatedGuests: open.reduce((s, t) => s + t.partySize, 0),
    },
    menu: menu.map((m) => ({ id: m.id, name: m.name, category: m.category, price: dinePrice(m), veg: m.veg, photo: m.photoUrl, available: Object.values(m.available).some(Boolean) })),
  };
}

async function getTab(outletId: string, tabId: string) {
  const [tab] = await db.select().from(dineTabs).where(and(eq(dineTabs.id, tabId), eq(dineTabs.outletId, outletId)));
  if (!tab) throw new HttpError(404, "That bill isn't open any more.");
  return tab;
}

/** Seats a party at a free table and opens its bill. */
export async function seat(outletId: string, input: { tableId: string; partyName: string; partySize: number; reservationId?: string }) {
  const [table] = await db.select().from(diningTables).where(and(eq(diningTables.id, input.tableId), eq(diningTables.outletId, outletId)));
  if (!table) throw new HttpError(404, "Table not found.");
  const [busy] = await db.select({ id: dineTabs.id }).from(dineTabs).where(and(eq(dineTabs.tableId, table.id), inArray(dineTabs.status, [...OPEN])));
  if (busy) throw new HttpError(409, `${table.label} already has guests.`);
  const [tab] = await db.insert(dineTabs).values({ outletId, tableId: table.id, partyName: input.partyName, partySize: input.partySize, reservationId: input.reservationId ?? null }).returning();
  if (input.reservationId) {
    await db.update(reservations).set({ status: "seated", tableId: table.id }).where(and(eq(reservations.id, input.reservationId), eq(reservations.outletId, outletId)));
  }
  await audit(outletId, "staff", "dining.seated", { table: table.label, partySize: input.partySize });
  return tabDTO(tab);
}

/** Sets the quantity of a dish on a bill (0 removes it). */
export async function setLine(outletId: string, tabId: string, itemId: string, qty: number) {
  const tab = await getTab(outletId, tabId);
  if (tab.status !== "open") throw new HttpError(409, "The bill has been printed. Reopen it to change dishes.");
  const [item] = await db.select().from(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.outletId, outletId)));
  if (!item) throw new HttpError(404, "Dish not found.");
  const others = tab.lines.filter((l) => l.itemId !== itemId);
  const lines = qty > 0 ? [...others, { itemId, name: item.name, price: tab.lines.find((l) => l.itemId === itemId)?.price ?? dinePrice(item), qty, veg: item.veg }] : others;
  // Keep the order dishes were first added in.
  const position = (itemId: string | null) => {
    const i = tab.lines.findIndex((l) => l.itemId === itemId);
    return i < 0 ? Infinity : i;
  };
  lines.sort((a, b) => position(a.itemId) - position(b.itemId));
  const [row] = await db.update(dineTabs).set({ lines, total: totalOf(lines) }).where(eq(dineTabs.id, tab.id)).returning();
  return tabDTO(row);
}

/** Prints the bill (no more changes), or reopens it. */
export async function setBilled(outletId: string, tabId: string, billed: boolean) {
  const tab = await getTab(outletId, tabId);
  if (tab.status !== "open" && tab.status !== "billed") throw new HttpError(409, "That bill is already settled.");
  if (billed && tab.lines.length === 0) throw new HttpError(400, "Add a dish before printing the bill.");
  const [row] = await db.update(dineTabs).set({ status: billed ? "billed" : "open" }).where(eq(dineTabs.id, tab.id)).returning();
  return tabDTO(row);
}

/** Settles the bill and records it as a dine-in order, so it counts in sales. */
export async function settle(outletId: string, tabId: string, paidVia: "cash" | "upi" | "card") {
  const tab = await getTab(outletId, tabId);
  if (tab.status !== "billed" && tab.status !== "open") throw new HttpError(409, "That bill is already settled.");
  if (tab.lines.length === 0) throw new HttpError(400, "There's nothing on this bill.");
  const closedAt = new Date().toISOString();
  const total = totalOf(tab.lines);
  const [row] = await db.update(dineTabs).set({ status: "closed", paidVia, total, closedAt }).where(eq(dineTabs.id, tab.id)).returning();
  const [table] = await db.select().from(diningTables).where(eq(diningTables.id, tab.tableId));
  // The order and its lines are written together, so a dine-in sale never exists without its dishes.
  const orderId = crypto.randomUUID();
  const lines = tab.lines.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.qty, unitPrice: l.price }));
  await db.batch([
    db.insert(orders).values({
      id: orderId,
      outletId,
      channel: "dine",
      externalId: `T-${tab.id.slice(0, 8)}`,
      items: summariseLines(lines),
      amount: total,
      placedAt: tab.openedAt,
      status: "served",
      prepMins: Math.round((Date.parse(closedAt) - Date.parse(tab.openedAt)) / 60_000),
    }),
    db.insert(orderLines).values(orderLineRows(orderId, lines)),
  ]);
  await audit(outletId, "staff", "dining.settled", { table: table?.label, total, paidVia });
  return tabDTO(row);
}

/** Clears a table without a sale (guests left, or seated by mistake). */
export async function cancelTab(outletId: string, tabId: string) {
  const tab = await getTab(outletId, tabId);
  if (tab.status === "closed") throw new HttpError(409, "That bill is already settled.");
  await db.update(dineTabs).set({ status: "cancelled", closedAt: new Date().toISOString() }).where(eq(dineTabs.id, tab.id));
  await audit(outletId, "staff", "dining.cleared", { tabId });
  return { ok: true };
}

/** Adds a booking or a walk-in to the waitlist. */
export async function addReservation(outletId: string, input: { kind: "booking" | "waitlist"; name: string; phone: string | null; partySize: number; at?: string; quotedMins?: number; tableId?: string | null; note?: string }) {
  if (input.kind === "booking" && !input.at) throw new HttpError(400, "Pick a time for the booking.");
  const [row] = await db
    .insert(reservations)
    .values({
      outletId,
      kind: input.kind,
      name: input.name,
      phone: input.phone,
      partySize: input.partySize,
      at: input.kind === "booking" ? input.at! : new Date().toISOString(),
      quotedMins: input.kind === "waitlist" ? (input.quotedMins ?? 15) : null,
      status: input.kind === "booking" ? "booked" : "waiting",
      tableId: input.tableId ?? null,
      note: input.note ?? "",
    })
    .returning();
  await audit(outletId, "staff", input.kind === "booking" ? "dining.booked" : "dining.waitlisted", { partySize: input.partySize });
  return reservationDTO(row);
}

/** Tells a waiting guest their table is ready, on WhatsApp. */
export async function notifyGuest(outletId: string, reservationId: string, restaurantName: string) {
  const [r] = await db.select().from(reservations).where(and(eq(reservations.id, reservationId), eq(reservations.outletId, outletId)));
  if (!r) throw new HttpError(404, "Guest not found.");
  if (!r.phone) throw new HttpError(400, "There's no phone number for this guest.");
  const sent = await notify(outletId, "table_ready", `Hi ${r.name}, your table for ${r.partySize} at ${restaurantName} is ready. Please come to the front desk.`, r.phone);
  const [row] = await db.update(reservations).set({ status: "notified" }).where(eq(reservations.id, r.id)).returning();
  return { reservation: reservationDTO(row), message: sent ? { status: sent.status, error: sent.error ?? null } : null };
}

export async function setReservationStatus(outletId: string, reservationId: string, status: "cancelled" | "no_show" | "booked" | "waiting") {
  const [row] = await db.update(reservations).set({ status }).where(and(eq(reservations.id, reservationId), eq(reservations.outletId, outletId))).returning();
  if (!row) throw new HttpError(404, "Booking not found.");
  return reservationDTO(row);
}

/** Adds a table to the floor plan. */
export async function addTable(outletId: string, input: { label: string; seats: number; zone: string }) {
  const existing = await db.select({ id: diningTables.id }).from(diningTables).where(eq(diningTables.outletId, outletId));
  const [row] = await db.insert(diningTables).values({ outletId, ...input, sort: existing.length + 1 }).returning();
  return row;
}

/** Removes a table. Tables with guests can't be removed. */
export async function removeTable(outletId: string, tableId: string) {
  const [busy] = await db.select({ id: dineTabs.id }).from(dineTabs).where(and(eq(dineTabs.tableId, tableId), inArray(dineTabs.status, [...OPEN])));
  if (busy) throw new HttpError(409, "That table has guests. Settle or clear the bill first.");
  await db.delete(diningTables).where(and(eq(diningTables.id, tableId), eq(diningTables.outletId, outletId)));
  return { ok: true };
}

/** A starter floor plan for a restaurant setting up dine-in. */
export async function ensureTables(outletId: string) {
  const [any] = await db.select({ id: diningTables.id }).from(diningTables).where(eq(diningTables.outletId, outletId)).limit(1);
  if (any) return false;
  const plan = [
    ["T1", 2, "Indoor"],
    ["T2", 2, "Indoor"],
    ["T3", 4, "Indoor"],
    ["T4", 4, "Indoor"],
    ["T5", 4, "Indoor"],
    ["T6", 6, "Indoor"],
    ["O1", 4, "Outdoor"],
    ["O2", 4, "Outdoor"],
  ] as const;
  await db.insert(diningTables).values(plan.map(([label, seats, zone], i) => ({ outletId, label, seats, zone, sort: i })));
  return true;
}
