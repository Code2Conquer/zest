import "server-only";
import { db } from "./db";
import { syncMailbox } from "./gmail";
import { checkCampaigns } from "./growth";
import { enqueue, registerHandler } from "./jobs";
import { connections } from "./schema";
import { syncOutlet } from "./sync";

// Every kind of background job and what runs it. Imported by the job runner route.

const outletOf = (p: Record<string, unknown>) => {
  if (typeof p.outletId !== "string") throw new Error("Job payload is missing outletId.");
  return p.outletId;
};

registerHandler("sync.outlet", async (p) => void (await syncOutlet(outletOf(p))));
registerHandler("mail.sync", async (p) => void (await syncMailbox(outletOf(p), 40_000)));
registerHandler("growth.check", async (p) => void (await checkCampaigns(outletOf(p))));

const SYNC_EVERY_MIN = 5;

/** Queues an order sync for every outlet with a platform connection, at most once per 5-minute window. */
export async function enqueueDueSyncs(now = new Date()) {
  const bucket = Math.floor(now.getTime() / (SYNC_EVERY_MIN * 60_000));
  const rows = await db.selectDistinct({ outletId: connections.outletId }).from(connections);
  for (const { outletId } of rows) await enqueue("sync.outlet", { outletId }, { runAt: now, dedupeKey: `sync:${outletId}:${bucket}` });
  return rows.length;
}
