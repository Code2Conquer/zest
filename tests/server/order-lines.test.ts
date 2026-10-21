import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { ensureTables, seat, setLine, settle } from "@/lib/server/dining";
import { addOrderLines, linesFor, summariseLines } from "@/lib/server/order-lines";
import { diningTables, menuItems, orders } from "@/lib/server/schema";
import { freshOutlet } from "../helpers";

async function anOrder() {
  const o = await freshOutlet();
  const [order] = await db.insert(orders).values({ outletId: o.id, channel: "web", externalId: crypto.randomUUID(), items: "", amount: 0, placedAt: new Date().toISOString(), status: "new" }).returning();
  return { outlet: o, order };
}

describe("order lines", () => {
  it("computes line totals including option prices", async () => {
    const { order } = await anOrder();
    await addOrderLines(order.id, [{ itemId: null, name: "Thali", qty: 2, unitPrice: 279, options: [{ group: "Extra", choice: "Raita", priceDelta: 40 }] }]);
    expect((await linesFor([order.id])).get(order.id)![0].lineTotal).toBe(638);
  });

  it("summarises lines the way the board shows them", () => {
    expect(
      summariseLines([
        { itemId: null, name: "Butter naan", qty: 2, unitPrice: 59 },
        { itemId: null, name: "Dal makhani", qty: 1, unitPrice: 249 },
      ]),
    ).toBe("2 butter naan, dal makhani");
  });

  it("rejects zero or negative quantities", async () => {
    const { order } = await anOrder();
    await expect(addOrderLines(order.id, [{ itemId: null, name: "x", qty: 0, unitPrice: 10 }])).rejects.toThrow();
  });

  it("writes lines when a dine-in tab is settled", async () => {
    const o = await freshOutlet();
    await ensureTables(o.id);
    const [table] = await db.select().from(diningTables).where(eq(diningTables.outletId, o.id)).limit(1);
    const [a, b] = await db
      .insert(menuItems)
      .values([
        { outletId: o.id, name: "Paneer tikka", category: "Starters", price: { zomato: 289, swiggy: 289 }, available: { zomato: true, swiggy: true } },
        { outletId: o.id, name: "Butter naan", category: "Breads", price: { zomato: 59, swiggy: 59 }, available: { zomato: true, swiggy: true } },
      ])
      .returning();
    const tab = await seat(o.id, { tableId: table.id, partyName: "Mehta", partySize: 2 });
    await setLine(o.id, tab.id, a.id, 1);
    await setLine(o.id, tab.id, b.id, 3);
    await settle(o.id, tab.id, "upi");
    const [order] = await db.select().from(orders).where(and(eq(orders.outletId, o.id), eq(orders.channel, "dine")));
    const lines = (await linesFor([order.id])).get(order.id)!;
    expect(lines).toHaveLength(2);
    expect(lines.reduce((s, l) => s + l.lineTotal, 0)).toBe(order.amount);
  });
});
