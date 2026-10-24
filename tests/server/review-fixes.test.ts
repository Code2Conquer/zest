import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as payoutsGet } from "@/app/api/payouts/route";
import { GET as ordersGet } from "@/app/api/orders/route";
import { POST as staffPost } from "@/app/api/staff/route";
import { client, db } from "@/lib/server/db";
import { enqueue, registerHandler, runDueJobs } from "@/lib/server/jobs";
import { safeReturn } from "@/lib/server/oauth-state";
import { campaigns, jobs, mailboxes, memberships } from "@/lib/server/schema";
import { addStaff, pinSignIn } from "@/lib/server/staff";
import { shouldPoll } from "@/lib/use-order-stream";
import { cookieJar } from "../cookies";
import { freshOutlet, signInAsOwner } from "../helpers";

const ctx = { params: Promise.resolve({}) };
const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (err) {
    return (err as { status?: number }).status ?? 500;
  }
};

describe("review fixes", () => {
  beforeEach(() => cookieJar.clear());

  it("locks the PIN even when guesses arrive at once", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "A", role: "kitchen", outletIds: null, pin: "4821" });
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => statusOf(pinSignIn(o.staffCode!, String(5000 + i)))));
    expect(results.filter((s) => s !== 429).length).toBeLessThanOrEqual(5);
  });

  it("does not use up a try for a right PIN", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "A", role: "kitchen", outletIds: null, pin: "4821" });
    for (let i = 0; i < 4; i++) expect(await statusOf(pinSignIn(o.staffCode!, "0000"))).toBe(401);
    expect(await statusOf(pinSignIn(o.staffCode!, "4821"))).toBe(200);
    expect(await statusOf(pinSignIn(o.staffCode!, "0000"))).toBe(401);
  });

  it("limits PIN attempts per address across restaurant codes", async () => {
    const ip = `10.9.${Math.floor(Math.random() * 250)}.1`;
    const codes = await Promise.all(Array.from({ length: 5 }, async () => (await freshOutlet()).staffCode!));
    const results: number[] = [];
    for (let i = 0; i < 21; i++) results.push(await statusOf(pinSignIn(codes[i % 5], "0000", ip)));
    expect(results.at(-1)).toBe(429);
  });

  it("refuses return paths that leave the site", () => {
    for (const p of ["/\\evil.com", "/\t/evil.com", "//evil.com", "/%5Cevil.com", "https://evil.com"]) expect(safeReturn(p)).toBe("/connect");
    expect(safeReturn("/app/orders?f=1")).toBe("/app/orders?f=1");
  });

  it("gives up on a job that keeps getting cut off", async () => {
    const k = `cut.${crypto.randomUUID()}`;
    let calls = 0;
    registerHandler(k, async () => void calls++);
    const job = await enqueue(k, {});
    await db.update(jobs).set({ status: "running", attempts: 5, lockedUntil: new Date(Date.now() - 60_000).toISOString() }).where(eq(jobs.id, job!.id));
    await runDueJobs({ limit: 10, deadlineMs: 5_000 });
    const [row] = await db.select().from(jobs).where(eq(jobs.id, job!.id));
    expect(calls).toBe(0);
    expect(row.status).toBe("failed");
  });

  it("doesn't start a job that can't finish before the deadline", async () => {
    const k = `slow.${crypto.randomUUID()}`;
    let calls = 0;
    registerHandler(k, async () => void calls++, { budgetMs: 40_000 });
    await enqueue(k, {});
    await runDueJobs({ limit: 10, deadlineMs: 10_000 });
    expect(calls).toBe(0);
  });

  it("queues inbox syncs and campaign checks every 15 minutes", async () => {
    const { enqueueDueSyncs } = await import("@/lib/server/job-handlers");
    const o = await freshOutlet();
    await db.insert(mailboxes).values({ outletId: o.id, provider: "gmail", address: `m-${o.id}@example.in`, secret: "x" });
    await db.insert(campaigns).values({ outletId: o.id, platform: "zomato", title: "t", spendCap: 1000 });
    await enqueueDueSyncs(new Date("2026-10-21T10:01:00Z"));
    await enqueueDueSyncs(new Date("2026-10-21T10:14:00Z"));
    await enqueueDueSyncs(new Date("2026-10-21T10:16:00Z"));
    const rows = await db.select().from(jobs);
    expect(rows.filter((j) => j.kind === "mail.sync" && j.dedupeKey?.includes(o.id))).toHaveLength(2);
    expect(rows.filter((j) => j.kind === "growth.check" && j.dedupeKey?.includes(o.id))).toHaveLength(2);
  });

  it("reads changed orders through an index", async () => {
    const plan = await client().execute("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE outlet_id = 'x' AND updated_at > '2026' ORDER BY updated_at, id");
    expect(JSON.stringify(plan.rows)).toContain("orders_outlet_updated");
  });

  it("falls back to polling when the stream closes for good", () => {
    expect(shouldPoll(2 /* CLOSED */, [Date.now()], Date.now())).toBe(true);
    expect(shouldPoll(0 /* CONNECTING */, [Date.now()], Date.now())).toBe(false);
    expect(shouldPoll(0, [Date.now() - 1000, Date.now()], Date.now())).toBe(true);
  });

  it("keeps kitchen staff to the orders screen", async () => {
    const o = await freshOutlet();
    await addStaff(o.brandId!, { name: "K", role: "kitchen", outletIds: null, pin: "2468" });
    await pinSignIn(o.staffCode!, "2468");
    expect((await payoutsGet(new Request("http://x/api/payouts"), ctx)).status).toBe(403);
    expect((await ordersGet(new Request("http://x/api/orders"), ctx)).status).toBe(200);
  });

  it("lets the owner add a manager who logs in with their mobile", async () => {
    const o = await freshOutlet();
    await signInAsOwner(o);
    const res = await staffPost(new Request("http://x/api/staff", { method: "POST", body: JSON.stringify({ name: "Meena", role: "manager", phone: "98110 22233" }) }), ctx);
    expect(res.status).toBe(200);
    cookieJar.clear();
    const { signInByPhone } = await import("@/lib/server/auth");
    const s = await signInByPhone("+919811022233");
    expect(s?.membership.role).toBe("manager");
    expect(s?.outlet.id).toBe(o.id);
    const [m] = await db.select().from(memberships).where(eq(memberships.id, s!.membership.id));
    expect(m.pinHash).toBeNull();
  });
});
