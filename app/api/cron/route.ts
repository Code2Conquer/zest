import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ready } from "@/lib/server/db";
import "@/lib/server/job-handlers";
import { enqueue, runDueJobs } from "@/lib/server/jobs";
import { campaigns, mailboxes } from "@/lib/server/schema";

export const maxDuration = 60;

/**
 * Daily housekeeping (Vercel Cron): queues an inbox sync per connected mailbox and a campaign check
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
  const result = await runDueJobs({ limit: 25, deadlineMs: 50_000 });
  return NextResponse.json({ mailboxes: boxes.length, campaigns: live.length, ...result });
}
