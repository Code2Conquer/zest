import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/[platform]/route";
import { fromLegacyStatus } from "@/lib/orders";
import { client, db, migrate } from "@/lib/server/db";
import { salesForDay } from "@/lib/server/queries";
import { orders } from "@/lib/server/schema";
import { freshOutlet } from "../helpers";

describe("order model", () => {
  it("maps every legacy status", () => {
    expect(fromLegacyStatus("preparing")).toEqual({ status: "preparing", delayed: false });
    expect(fromLegacyStatus("delayed")).toEqual({ status: "preparing", delayed: true });
    expect(fromLegacyStatus("picked")).toEqual({ status: "out_for_delivery", delayed: false });
    expect(fromLegacyStatus("delivered")).toEqual({ status: "completed", delayed: false });
    expect(fromLegacyStatus("cancelled")).toEqual({ status: "cancelled", delayed: false });
    expect(fromLegacyStatus("ready")).toEqual({ status: "ready", delayed: false });
  });

  it("passes new statuses through", () => {
    expect(fromLegacyStatus("served")).toEqual({ status: "served", delayed: false });
  });

  it("migrates stored rows idempotently", async () => {
    const o = await freshOutlet();
    const at = new Date().toISOString();
    for (const [ext, status] of [["a", "picked"], ["b", "delivered"], ["c", "delayed"]]) {
      await client().execute({
        sql: "INSERT INTO orders (id, outlet_id, channel, external_id, items, amount, placed_at, status, prep_mins, updated_at) VALUES (?, ?, 'zomato', ?, 'x', 100, ?, ?, 0, ?)",
        args: [crypto.randomUUID(), o.id, ext, at, status, at],
      });
    }
    await migrate(client());
    await migrate(client());
    const rows = await db.select().from(orders).where(eq(orders.outletId, o.id));
    const by = Object.fromEntries(rows.map((r) => [r.externalId, r]));
    expect(by.a.status).toBe("out_for_delivery");
    expect(by.b.status).toBe("completed");
    expect(by.c.status).toBe("preparing");
    expect(by.c.delayed).toBe(true);
  });

  it("accepts a legacy webhook status", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    const o = await freshOutlet();
    const body = JSON.stringify({ outletId: o.id, orders: [{ externalId: "w1", items: "Thali", amount: 279, status: "picked" }] });
    const sig = createHmac("sha256", "test-secret").update(body).digest("hex");
    const res = await webhook(new Request("http://x/api/webhooks/zomato", { method: "POST", body, headers: { "x-zest-signature": sig } }), {
      params: Promise.resolve({ platform: "zomato" }),
    });
    expect(res.status).toBe(200);
    const [row] = await db.select().from(orders).where(eq(orders.outletId, o.id));
    expect(row.status).toBe("out_for_delivery");
  });

  it("counts sales for every channel", async () => {
    const o = await freshOutlet();
    await db.insert(orders).values({ outletId: o.id, channel: "web", externalId: "s1", items: "Thali", amount: 300, placedAt: new Date().toISOString(), status: "completed" });
    const { sales } = await salesForDay(o.id, 0);
    expect(sales.web).toEqual({ amount: 300, orders: 1 });
  });
});
