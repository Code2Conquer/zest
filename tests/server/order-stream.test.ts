import { beforeEach, describe, expect, it } from "vitest";
import { GET as stream } from "@/app/api/orders/stream/route";
import { signIn } from "@/lib/server/auth";
import { sign } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";
import { ordersChangedSince } from "@/lib/server/queries";
import { orders } from "@/lib/server/schema";
import { cookieJar } from "../cookies";
import { freshOutlet } from "../helpers";

const add = (outletId: string, externalId: string, updatedAt = new Date().toISOString()) =>
  db.insert(orders).values({ outletId, channel: "zomato", externalId, items: "Thali", amount: 279, placedAt: new Date().toISOString(), status: "preparing", updatedAt }).returning();

describe("order changes", () => {
  beforeEach(() => cookieJar.clear());

  it("returns only orders changed after the cursor", async () => {
    const o = await freshOutlet();
    await add(o.id, "A", new Date(Date.now() - 1000).toISOString());
    const { cursor } = await ordersChangedSince(o.id, null);
    const [b] = await add(o.id, "B");
    expect((await ordersChangedSince(o.id, cursor)).orders.map((x) => x.id)).toEqual([b.id]);
  });

  it("orders the same timestamp deterministically", async () => {
    const o = await freshOutlet();
    const t = new Date().toISOString();
    await add(o.id, "X", t);
    await add(o.id, "Y", t);
    const first = await ordersChangedSince(o.id, null, 1);
    const second = await ordersChangedSince(o.id, first.cursor, 1);
    expect(new Set([...first.orders, ...second.orders].map((x) => x.externalId))).toEqual(new Set(["X", "Y"]));
  });

  it("streams a change as an SSE event", async () => {
    const o = await freshOutlet();
    cookieJar.set("zest_outlet", sign(o.id));
    await signIn({ email: `stream-${o.id}@example.in`, name: "S" });
    const abort = new AbortController();
    const res = await stream(new Request("http://x/api/orders/stream", { signal: abort.signal }), { params: Promise.resolve({}) });
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const [order] = await add(o.id, "S1");
    const reader = res.body!.getReader();
    let text = "";
    while (!text.includes("event: orders")) text += new TextDecoder().decode((await reader.read()).value);
    abort.abort();
    await reader.cancel();
    expect(text).toContain(order.id);
  });
});
