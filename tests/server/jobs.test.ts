import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/server/db";
import { enqueue, registerHandler, runDueJobs } from "@/lib/server/jobs";
import { jobs } from "@/lib/server/schema";

const MIN = 60_000;
const kind = () => `test.${crypto.randomUUID()}`;
const row = async (id: string) => (await db.select().from(jobs).where(eq(jobs.id, id)))[0];

describe("jobs", () => {
  afterEach(() => vi.useRealTimers());

  it("runs a due job once", async () => {
    const k = kind();
    let calls = 0;
    registerHandler(k, async () => void calls++);
    const job = await enqueue(k, {});
    await runDueJobs({ limit: 10, deadlineMs: 50_000 });
    await runDueJobs({ limit: 10, deadlineMs: 50_000 });
    expect(calls).toBe(1);
    expect((await row(job!.id)).status).toBe("done");
  });

  it("skips jobs not yet due", async () => {
    const k = kind();
    let calls = 0;
    registerHandler(k, async () => void calls++);
    await enqueue(k, {}, { runAt: new Date(Date.now() + 10 * MIN) });
    await runDueJobs({ limit: 10, deadlineMs: 50_000 });
    expect(calls).toBe(0);
  });

  it("dedupes by key", async () => {
    const k = kind();
    registerHandler(k, async () => {});
    expect(await enqueue(k, {}, { dedupeKey: `${k}:a` })).not.toBeNull();
    expect(await enqueue(k, {}, { dedupeKey: `${k}:a` })).toBeNull();
  });

  it("retries with backoff then fails after 5 attempts", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const k = kind();
    registerHandler(k, async () => {
      throw new Error("boom");
    });
    const job = await enqueue(k, {});
    for (const waitMin of [0, 1, 5, 25, 60]) {
      vi.setSystemTime(Date.now() + waitMin * MIN + 1000);
      await runDueJobs({ limit: 10, deadlineMs: 50_000 });
    }
    const r = await row(job!.id);
    expect(r.status).toBe("failed");
    expect(r.attempts).toBe(5);
    expect(r.lastError).toBe("boom");
  });

  it("reclaims a job whose run was cut off", async () => {
    const k = kind();
    let calls = 0;
    registerHandler(k, async () => void calls++);
    const job = await enqueue(k, {});
    await db.update(jobs).set({ status: "running", lockedUntil: new Date(Date.now() - MIN).toISOString() }).where(eq(jobs.id, job!.id));
    await runDueJobs({ limit: 10, deadlineMs: 50_000 });
    expect(calls).toBe(1);
    expect((await row(job!.id)).status).toBe("done");
  });
});

describe("scheduled syncs", () => {
  it("queues one sync per connected outlet per 5 minutes", async () => {
    const { enqueueDueSyncs } = await import("@/lib/server/job-handlers");
    const { connections } = await import("@/lib/server/schema");
    const { freshOutlet } = await import("../helpers");
    const o = await freshOutlet();
    await db.insert(connections).values({ outletId: o.id, platform: "zomato", method: "mcp" });
    const at = new Date("2026-10-21T10:01:00Z");
    await enqueueDueSyncs(at);
    await enqueueDueSyncs(new Date("2026-10-21T10:04:00Z"));
    await enqueueDueSyncs(new Date("2026-10-21T10:06:00Z"));
    const { and, like } = await import("drizzle-orm");
    const rows = await db.select().from(jobs).where(and(eq(jobs.kind, "sync.outlet"), like(jobs.dedupeKey, `sync:${o.id}:%`)));
    expect(rows).toHaveLength(2);
  });
});
