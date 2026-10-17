import { NextResponse } from "next/server";
import { db, ready } from "@/lib/server/db";
import { syncMailbox } from "@/lib/server/gmail";
import { mailboxes } from "@/lib/server/schema";
import { syncOutlet } from "@/lib/server/sync";

export const maxDuration = 60;

/**
 * Scheduled sync of every connected inbox and platform. Called by Vercel Cron
 * or any scheduler with "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  await ready();
  const started = Date.now();
  const boxes = await db.select({ outletId: mailboxes.outletId }).from(mailboxes);
  const results: Record<string, unknown> = {};
  for (const { outletId } of boxes) {
    const left = 50_000 - (Date.now() - started);
    if (left < 5_000) break;
    results[outletId] = { mail: await syncMailbox(outletId, Math.min(20_000, left - 3_000)), platforms: await syncOutlet(outletId) };
  }
  return NextResponse.json({ outlets: Object.keys(results).length, results });
}
