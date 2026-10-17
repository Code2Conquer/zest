import "server-only";
import { and, eq } from "drizzle-orm";
import type { Channel } from "../platforms";
import { audit } from "./approvals";
import { connectorFor, type IncomingOrder } from "./connectors";
import { db } from "./db";
import { connections, orders } from "./schema";

/** Inserts new orders and updates the status of known ones. */
export async function upsertOrders(outletId: string, channel: Channel, incoming: IncomingOrder[]) {
  let n = 0;
  for (const o of incoming) {
    if (!o?.externalId || typeof o.amount !== "number") continue;
    await db
      .insert(orders)
      .values({ outletId, channel, externalId: String(o.externalId), items: o.items ?? "", amount: Math.round(o.amount), placedAt: o.placedAt ?? new Date().toISOString(), status: o.status ?? "preparing", prepMins: o.prepMins ?? 0 })
      .onConflictDoUpdate({ target: [orders.outletId, orders.channel, orders.externalId], set: { status: o.status ?? "preparing", prepMins: o.prepMins ?? 0, updatedAt: new Date().toISOString() } });
    n++;
  }
  return n;
}

/** Pulls active orders from every connected platform that can list them. */
export async function syncOutlet(outletId: string) {
  const conns = await db.select().from(connections).where(and(eq(connections.outletId, outletId), eq(connections.status, "connected")));
  const results: { platform: string; orders: number; error?: string }[] = [];
  for (const c of conns) {
    try {
      const count = await upsertOrders(outletId, c.platform, await connectorFor(c).listOrders());
      await db.update(connections).set({ lastSyncAt: new Date().toISOString(), statusDetail: null }).where(eq(connections.id, c.id));
      results.push({ platform: c.platform, orders: count });
    } catch (err) {
      results.push({ platform: c.platform, orders: 0, error: (err as Error).message });
    }
  }
  await audit(outletId, "system", "sync.ran", { results });
  return results;
}
