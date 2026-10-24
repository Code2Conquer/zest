import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { client, db, ready } from "@/lib/server/db";
import "@/lib/server/job-handlers";
import { enqueue, runDueJobs } from "@/lib/server/jobs";
import { ordersFromPlans } from "@/lib/server/plans";
import { campaigns, mailboxes } from "@/lib/server/schema";

export const maxDuration = 60;

/**
 * Daily housekeeping (Vercel Cron): creates the day's tiffin orders from weekly plans, queues an inbox
 * sync per connected mailbox and a campaign check
 * per outlet with a live campaign, then runs what it can as a safety net. The every-minute job runner
 * (/api/jobs/run) does the rest. Needs "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  await ready();
  const day = new Date().toISOString().slice(0, 10);
  const boxes = await db.select({ outletId: mailboxes.outletId }).from(mailboxes);
  for (const { outletId } of boxes) await enqueue("mail.sync", { outletId }, { dedupeKey: `mail:${outletId}:${day}` });
  const live = await db.selectDistinct({ outletId: campaigns.outletId }).from(campaigns).where(eq(campaigns.status, "live"));
  for (const { outletId } of live) await enqueue("growth.check", { outletId }, { dedupeKey: `growth:${outletId}:${day}` });
  // The day's tiffin orders from weekly plans.
  const tiffins = await ordersFromPlans();
  const result = await runDueJobs({ limit: 25, deadlineMs: 50_000 });
  const summary = { mailboxes: boxes.length, campaigns: live.length, tiffins, ...result };
  // Remembered for /api/status, so anyone can see the daily run is happening.
  const at = new Date().toISOString();
  await client().execute({ sql: "INSERT INTO app_state (key, value, updated_at) VALUES ('last_cron', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", args: [JSON.stringify(summary), at] });
  return NextResponse.json(summary);
}
