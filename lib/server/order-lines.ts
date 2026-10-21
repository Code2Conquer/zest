import "server-only";
import { inArray } from "drizzle-orm";
import type { OrderLineDTO } from "../types";
import { db } from "./db";
import { orderLines, type LineOption } from "./schema";

export type OrderLineInput = { itemId: string | null; name: string; qty: number; unitPrice: number; options?: LineOption[] };

/** Rows ready to insert, priced: (unit price + option prices) × quantity. Throws on a bad quantity or price. */
export function orderLineRows(orderId: string, lines: OrderLineInput[]): (typeof orderLines.$inferInsert)[] {
  return lines.map((l) => {
    if (!Number.isInteger(l.qty) || l.qty < 1) throw new Error(`Quantity for ${l.name} must be at least 1.`);
    if (!Number.isInteger(l.unitPrice) || l.unitPrice < 0) throw new Error(`Price for ${l.name} must be a whole number of rupees.`);
    const options = l.options ?? [];
    const each = l.unitPrice + options.reduce((s, o) => s + o.priceDelta, 0);
    return { orderId, itemId: l.itemId, name: l.name, qty: l.qty, unitPrice: l.unitPrice, options, lineTotal: each * l.qty };
  });
}

export async function addOrderLines(orderId: string, lines: OrderLineInput[]): Promise<void> {
  const rows = orderLineRows(orderId, lines);
  if (rows.length) await db.insert(orderLines).values(rows);
}

/** Lines for many orders in one query, keyed by order id. */
export async function linesFor(orderIds: string[]): Promise<Map<string, OrderLineDTO[]>> {
  const out = new Map<string, OrderLineDTO[]>();
  if (!orderIds.length) return out;
  for (const r of await db.select().from(orderLines).where(inArray(orderLines.orderId, orderIds))) {
    const list = out.get(r.orderId) ?? [];
    list.push({ id: r.id, itemId: r.itemId, name: r.name, qty: r.qty, unitPrice: r.unitPrice, options: r.options, lineTotal: r.lineTotal });
    out.set(r.orderId, list);
  }
  return out;
}

/** The short text kept in `orders.items`, e.g. "2 butter naan, dal makhani". */
export function summariseLines(lines: Pick<OrderLineInput, "name" | "qty">[]): string {
  return lines.map((l) => (l.qty > 1 ? `${l.qty} ${l.name.toLowerCase()}` : l.name.toLowerCase())).join(", ");
}
