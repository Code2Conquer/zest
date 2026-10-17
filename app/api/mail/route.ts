import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { disconnectGmail, gmailConfigured, gmailMissing, SENDERS } from "@/lib/server/gmail";
import { assertWritable, handler } from "@/lib/server/http";
import { emails, mailboxes } from "@/lib/server/schema";
import type { MailboxDTO } from "@/lib/types";

/** The connected inbox, what it has read, and the latest mails. */
export const GET = handler(async (_req, outlet): Promise<MailboxDTO> => {
  const [box] = await db.select().from(mailboxes).where(eq(mailboxes.outletId, outlet.id));
  const counts = { payout: 0, report: 0, complaint: 0, onboarding: 0, other: 0 };
  for (const r of await db.select({ kind: emails.kind, n: sql<number>`count(*)` }).from(emails).where(eq(emails.outletId, outlet.id)).groupBy(emails.kind)) {
    if (r.kind && r.kind in counts) counts[r.kind as keyof typeof counts] = Number(r.n);
  }
  const recent = await db.select().from(emails).where(eq(emails.outletId, outlet.id)).orderBy(desc(emails.receivedAt)).limit(15);
  return {
    configured: gmailConfigured(),
    missing: gmailMissing(),
    // Which deployment answered, to tell a stale or preview build from production.
    deployment: { env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown", commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    senders: SENDERS,
    mailbox: box
      ? { provider: box.provider, address: box.address, status: box.status, statusDetail: box.statusDetail, backfillDone: box.backfillDone, lastSyncAt: box.lastSyncAt, counts }
      : null,
    recent: recent.map((e) => ({
      id: e.id,
      from: e.fromAddr,
      subject: e.subject,
      kind: e.kind,
      receivedAt: e.receivedAt,
      snippet: e.snippet,
      payout: e.parsedAs === "payout",
      attachments: (e.attachments ?? []).map((a) => ({ filename: a.filename, read: a.read })),
    })),
  };
});

/** Disconnects Gmail, revokes access, and deletes what was read. */
export const DELETE = handler(async (_req, outlet) => {
  assertWritable(outlet);
  await disconnectGmail(outlet.id);
  return { ok: true };
});
