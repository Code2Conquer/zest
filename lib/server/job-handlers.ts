import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { syncMailbox } from "./gmail";
import { checkCampaigns } from "./growth";
import { enqueue, registerHandler } from "./jobs";
import { campaigns, connections, mailboxes } from "./schema";
import { syncOutlet } from "./sync";

// Every kind of background job and what runs it. Imported by the job runner route.

const outletOf = (p: Record<string, unknown>) => {
  if (typeof p.outletId !== "string") throw new Error("Job payload is missing outletId.");
  return p.outletId;
};

registerHandler("sync.outlet", async (p) => void (await syncOutlet(outletOf(p))));
registerHandler("mail.sync", async (p) => void (await syncMailbox(outletOf(p), 40_000)), { budgetMs: 45_000 });
registerHandler("growth.check", async (p) => void (await checkCampaigns(outletOf(p))));

const bucket = (now: Date, minutes: number) => Math.floor(now.getTime() / (minutes * 60_000));

/**
 * Queues recurring work: an order sync per outlet with a platform connection every 5 minutes, and an inbox
 * sync per connected mailbox and a spend-cap check per outlet with a live campaign every 15 minutes.
 */
export async function enqueueDueSyncs(now = new Date()) {
  const synced = await db.selectDistinct({ outletId: connections.outletId }).from(connections);
  for (const { outletId } of synced) await enqueue("sync.outlet", { outletId }, { runAt: now, dedupeKey: `sync:${outletId}:${bucket(now, 5)}` });
  const boxes = await db.select({ outletId: mailboxes.outletId }).from(mailboxes);
  for (const { outletId } of boxes) await enqueue("mail.sync", { outletId }, { runAt: now, dedupeKey: `mail:${outletId}:${bucket(now, 15)}` });
  const live = await db.selectDistinct({ outletId: campaigns.outletId }).from(campaigns).where(eq(campaigns.status, "live"));
  for (const { outletId } of live) await enqueue("growth.check", { outletId }, { runAt: now, dedupeKey: `growth:${outletId}:${bucket(now, 15)}` });
  return synced.length;
}
