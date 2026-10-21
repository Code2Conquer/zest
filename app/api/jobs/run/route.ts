import { NextResponse } from "next/server";
import { ready } from "@/lib/server/db";
import { enqueueDueSyncs } from "@/lib/server/job-handlers";
import { runDueJobs } from "@/lib/server/jobs";

export const maxDuration = 60;

/**
 * Runs background jobs. Called every minute by an external scheduler (cron-job.org) and every
 * 15 minutes by GitHub Actions as a backup, with "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  await ready();
  const queued = await enqueueDueSyncs();
  const result = await runDueJobs({ limit: 25, deadlineMs: 50_000 });
  return NextResponse.json({ queuedSyncs: queued, ...result });
}
