import "server-only";
import { eq } from "drizzle-orm";
import { client, db } from "./db";
import { jobs, type JobRow } from "./schema";

// Durable background work: a row per job, claimed with a lock that expires, retried with backoff.

type Handler = (payload: Record<string, unknown>) => Promise<void>;
const handlers = new Map<string, Handler>();

const LOCK_MS = 2 * 60_000;
/** Minutes to wait before attempts 2, 3, 4 and 5. */
const BACKOFF_MIN = [1, 5, 25, 60];
const MAX_ATTEMPTS = 5;

export function registerHandler(kind: string, fn: Handler) {
  handlers.set(kind, fn);
}

/** Queues a job. With a dedupe key already used, nothing is queued and null comes back. */
export async function enqueue(kind: string, payload: Record<string, unknown>, opts: { runAt?: Date; dedupeKey?: string } = {}): Promise<JobRow | null> {
  const [row] = await db
    .insert(jobs)
    .values({ kind, payload, runAt: (opts.runAt ?? new Date()).toISOString(), dedupeKey: opts.dedupeKey ?? null, createdAt: new Date().toISOString() })
    .onConflictDoNothing({ target: jobs.dedupeKey })
    .returning();
  return row ?? null;
}

/** Claims due jobs (and running ones whose lock expired) in one statement, so two runners never take the same job. */
async function claim(limit: number, now: Date): Promise<JobRow[]> {
  const iso = now.toISOString();
  const rs = await client().execute({
    sql: `UPDATE jobs SET status = 'running', locked_until = ?
          WHERE id IN (SELECT id FROM jobs WHERE (status = 'queued' AND run_at <= ?) OR (status = 'running' AND locked_until < ?) ORDER BY run_at LIMIT ?)
          RETURNING id`,
    args: [new Date(now.getTime() + LOCK_MS).toISOString(), iso, iso, limit],
  });
  const ids = rs.rows.map((r) => String(r.id));
  if (!ids.length) return [];
  const rows = await Promise.all(ids.map(async (id) => (await db.select().from(jobs).where(eq(jobs.id, id)))[0]));
  return rows.sort((a, b) => a.runAt.localeCompare(b.runAt));
}

/** Runs due jobs until `limit` are done or `deadlineMs` has passed. Jobs not reached go back in the queue. */
export async function runDueJobs(opts: { limit: number; deadlineMs: number; now?: Date }): Promise<{ ran: number; failed: number }> {
  const started = Date.now();
  const claimed = await claim(opts.limit, opts.now ?? new Date());
  let ran = 0;
  let failed = 0;
  for (const job of claimed) {
    if (Date.now() - started > opts.deadlineMs) {
      await db.update(jobs).set({ status: "queued", lockedUntil: null }).where(eq(jobs.id, job.id));
      continue;
    }
    const attempts = job.attempts + 1;
    try {
      const fn = handlers.get(job.kind);
      if (!fn) throw new Error(`No handler for "${job.kind}".`);
      await fn(job.payload);
      await db.update(jobs).set({ status: "done", attempts, lockedUntil: null, lastError: null, finishedAt: new Date().toISOString() }).where(eq(jobs.id, job.id));
      ran++;
    } catch (err) {
      const message = (err as Error).message || "Failed";
      const giveUp = attempts >= MAX_ATTEMPTS;
      await db
        .update(jobs)
        .set({
          status: giveUp ? "failed" : "queued",
          attempts,
          lastError: message,
          lockedUntil: null,
          runAt: giveUp ? job.runAt : new Date(Date.now() + BACKOFF_MIN[attempts - 1] * 60_000).toISOString(),
          finishedAt: giveUp ? new Date().toISOString() : null,
        })
        .where(eq(jobs.id, job.id));
      failed++;
    }
  }
  return { ran, failed };
}
