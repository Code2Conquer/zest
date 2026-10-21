import "server-only";
import { eq } from "drizzle-orm";
import { client, db } from "./db";
import { jobs, type JobRow } from "./schema";

// Durable background work: a row per job, claimed with a lock that expires, retried with backoff.

type Handler = (payload: Record<string, unknown>) => Promise<void>;
const handlers = new Map<string, { fn: Handler; budgetMs: number }>();
const DEFAULT_BUDGET_MS = 10_000;

const LOCK_MS = 2 * 60_000;
/** Minutes to wait before attempts 2, 3, 4 and 5. */
const BACKOFF_MIN = [1, 5, 25, 60];
const MAX_ATTEMPTS = 5;

/** `budgetMs`: how long one run may take; a job only starts when that much time is left before the deadline. */
export function registerHandler(kind: string, fn: Handler, opts: { budgetMs?: number } = {}) {
  handlers.set(kind, { fn, budgetMs: opts.budgetMs ?? DEFAULT_BUDGET_MS });
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

/**
 * Claims due jobs (and running ones whose lock expired) in one statement, so two runners never take the same job.
 * Claiming counts as an attempt, so a job that is cut off every time still reaches the limit.
 */
async function claim(limit: number, now: Date): Promise<JobRow[]> {
  const iso = now.toISOString();
  const rs = await client().execute({
    sql: `UPDATE jobs SET status = 'running', locked_until = ?, attempts = attempts + 1
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
    const attempts = job.attempts;
    if (attempts > MAX_ATTEMPTS) {
      // Reclaimed after its run was cut off on the last allowed attempt.
      await db.update(jobs).set({ status: "failed", attempts: MAX_ATTEMPTS, lockedUntil: null, lastError: job.lastError ?? "Cut off before finishing, too many times.", finishedAt: new Date().toISOString() }).where(eq(jobs.id, job.id));
      failed++;
      continue;
    }
    const handler = handlers.get(job.kind);
    if (Date.now() - started + (handler?.budgetMs ?? DEFAULT_BUDGET_MS) > opts.deadlineMs) {
      // Not enough time left in this run: back in the queue, and the claim doesn't count as an attempt.
      await db.update(jobs).set({ status: "queued", lockedUntil: null, attempts: attempts - 1 }).where(eq(jobs.id, job.id));
      continue;
    }
    try {
      if (!handler) throw new Error(`No handler for "${job.kind}".`);
      await handler.fn(job.payload);
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
