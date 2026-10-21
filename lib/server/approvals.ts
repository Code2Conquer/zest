import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Platform } from "../platforms";
import { connectorFor, type ActionResult } from "./connectors";
import { db } from "./db";
import { approvals, auditLog, campaigns, connections, menuItems, outlets, reviews, type ApprovalKind, type ApprovalRow, type MenuItemRow, type Outlet } from "./schema";

export type MenuChange = {
  itemId: string;
  available?: Partial<Record<Platform, boolean>>;
  price?: Partial<Record<Platform, number>>;
  fields?: Partial<Pick<MenuItemRow, "name" | "description" | "veg" | "bestseller" | "photoUrl">>;
};

export type ApprovalPayload = {
  menu_change: { changes: MenuChange[] };
  review_reply: { reviewId: string; text: string };
  dispute: { platform: Platform; orderId: string; amount: number; reason: string };
  promo: { platform: Platform; offer: string; window: string; spendCap: number; expectedOrders: number; kind?: "promo" | "ad"; goal?: string; days?: number; minReturn?: number };
  listing_application: { platforms: Platform[] };
};

// Hard ceiling on any single promo, whatever an agent proposes.
const MAX_PROMO_SPEND = Number(process.env.MAX_PROMO_SPEND ?? 10000);

export async function audit(outletId: string, actor: string, action: string, detail: Record<string, unknown> = {}) {
  await db.insert(auditLog).values({ outletId, actor, action, detail });
}

export async function createApproval<K extends ApprovalKind>(
  outletId: string,
  input: { agent: string; kind: K; title: string; summary?: string; payload: ApprovalPayload[K] },
): Promise<ApprovalRow> {
  if (input.kind === "promo") {
    const p = input.payload as ApprovalPayload["promo"];
    if (p.spendCap > MAX_PROMO_SPEND) throw new Error(`Spend cap ₹${p.spendCap} is above the ₹${MAX_PROMO_SPEND} limit.`);
  }
  const [row] = await db
    .insert(approvals)
    .values({ outletId, agent: input.agent, kind: input.kind, title: input.title, summary: input.summary ?? "", payload: input.payload as Record<string, unknown> })
    .returning();
  await audit(outletId, input.agent, "approval.created", { approvalId: row.id, kind: input.kind, title: input.title });
  return row;
}

export async function listApprovals(outletId: string, status?: ApprovalRow["status"]) {
  const where = status ? and(eq(approvals.outletId, outletId), eq(approvals.status, status)) : eq(approvals.outletId, outletId);
  return db.select().from(approvals).where(where).orderBy(desc(approvals.createdAt)).limit(50);
}

async function getApproval(outletId: string, id: string) {
  const [row] = await db.select().from(approvals).where(and(eq(approvals.id, id), eq(approvals.outletId, outletId)));
  if (!row) throw new HttpError(404, "No such approval.");
  return row;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function connectorsFor(outlet: Outlet, platforms: Platform[]) {
  const rows = await db.select().from(connections).where(eq(connections.outletId, outlet.id));
  const map = new Map<Platform, ReturnType<typeof connectorFor>>();
  for (const p of platforms) {
    const conn = rows.find((r) => r.platform === p);
    if (conn) map.set(p, connectorFor(conn));
  }
  return map;
}

type Step = { platform?: Platform; what: string } & ActionResult;

/** Applies menu changes on every live platform, then saves them. Returns the before-state for undo. */
async function applyMenuChanges(outlet: Outlet, changes: MenuChange[]) {
  const live = outlet.livePlatforms;
  const conns = await connectorsFor(outlet, live);
  const steps: Step[] = [];
  const before: MenuChange[] = [];
  const items = await db.select().from(menuItems).where(and(eq(menuItems.outletId, outlet.id), inArray(menuItems.id, changes.map((c) => c.itemId))));

  for (const change of changes) {
    const item = items.find((i) => i.id === change.itemId);
    if (!item) {
      steps.push({ ok: false, error: `Dish ${change.itemId} not found`, what: "lookup" });
      continue;
    }
    const prev: MenuChange = { itemId: item.id, available: {}, price: {}, fields: {} };
    const next = { ...item, available: { ...item.available }, price: { ...item.price } };
    let itemOk = true;

    for (const p of live) {
      const conn = conns.get(p);
      const wantsAvail = change.available?.[p];
      const wantsPrice = change.price?.[p];
      const touches = (wantsAvail !== undefined && wantsAvail !== item.available[p]) || (wantsPrice !== undefined && wantsPrice !== item.price[p]) || (change.fields && Object.keys(change.fields).length > 0);
      if (!touches) continue;
      if (!conn) {
        steps.push({ platform: p, what: item.name, ok: false, error: `${p} isn't connected` });
        itemOk = false;
        continue;
      }
      if (wantsAvail !== undefined && wantsAvail !== item.available[p]) {
        const r = await conn.setAvailability(item, wantsAvail);
        steps.push({ platform: p, what: `${item.name}: ${wantsAvail ? "in stock" : "out of stock"}`, ...r });
        if (r.ok) {
          prev.available![p] = item.available[p];
          next.available[p] = wantsAvail;
        } else itemOk = false;
      }
      if (wantsPrice !== undefined && wantsPrice !== item.price[p]) {
        const r = await conn.setPrice(item, wantsPrice);
        steps.push({ platform: p, what: `${item.name}: ₹${wantsPrice}`, ...r });
        if (r.ok) {
          prev.price![p] = item.price[p];
          next.price[p] = wantsPrice;
        } else itemOk = false;
      }
      if (change.fields && Object.keys(change.fields).length) {
        const r = await conn.updateItem(item, change.fields);
        steps.push({ platform: p, what: `${item.name}: details`, ...r });
        if (!r.ok) itemOk = false;
      }
    }

    if (change.fields && Object.keys(change.fields).length && itemOk) {
      for (const k of Object.keys(change.fields) as (keyof NonNullable<MenuChange["fields"]>)[]) {
        (prev.fields as Record<string, unknown>)[k] = item[k];
      }
      Object.assign(next, change.fields);
    }
    await db
      .update(menuItems)
      .set({ available: next.available, price: next.price, name: next.name, description: next.description, veg: next.veg, bestseller: next.bestseller, photoUrl: next.photoUrl, updatedAt: new Date().toISOString() })
      .where(eq(menuItems.id, item.id));
    before.push(prev);
  }
  return { steps, before };
}

async function execute(outlet: Outlet, row: ApprovalRow): Promise<{ steps: Step[]; before?: MenuChange[] }> {
  const kind = row.kind;
  if (kind === "menu_change") {
    return applyMenuChanges(outlet, (row.payload as ApprovalPayload["menu_change"]).changes);
  }
  if (kind === "review_reply") {
    const p = row.payload as ApprovalPayload["review_reply"];
    const [review] = await db.select().from(reviews).where(and(eq(reviews.id, p.reviewId), eq(reviews.outletId, outlet.id)));
    if (!review) return { steps: [{ ok: false, error: "Review not found", what: "lookup" }] };
    const conn = (await connectorsFor(outlet, [review.platform])).get(review.platform);
    if (!conn) return { steps: [{ platform: review.platform, ok: false, error: `${review.platform} isn't connected`, what: "reply" }] };
    const r = await conn.replyToReview(review.externalId ?? review.id, p.text);
    if (r.ok) await db.update(reviews).set({ reply: p.text, repliedAt: new Date().toISOString() }).where(eq(reviews.id, review.id));
    return { steps: [{ platform: review.platform, what: `Reply to ${review.author}`, ...r }] };
  }
  if (kind === "dispute") {
    const p = row.payload as ApprovalPayload["dispute"];
    const conn = (await connectorsFor(outlet, [p.platform])).get(p.platform);
    if (!conn) return { steps: [{ platform: p.platform, ok: false, error: `${p.platform} isn't connected`, what: "dispute" }] };
    return { steps: [{ platform: p.platform, what: `Dispute #${p.orderId}`, ...(await conn.raiseDispute(p.orderId, p.amount, p.reason)) }] };
  }
  if (kind === "promo") {
    const p = row.payload as ApprovalPayload["promo"];
    if (p.spendCap > MAX_PROMO_SPEND) return { steps: [{ ok: false, error: `Above the ₹${MAX_PROMO_SPEND} limit`, what: "promo" }] };
    const conn = (await connectorsFor(outlet, [p.platform])).get(p.platform);
    if (!conn) return { steps: [{ platform: p.platform, ok: false, error: `${p.platform} isn't connected`, what: "promo" }] };
    const result = await conn.createPromo(p);
    if (result.ok) {
      // Track it as a campaign: spend against the cap, results, and the automatic pause.
      await db.insert(campaigns).values({
        outletId: outlet.id,
        platform: p.platform,
        kind: p.kind ?? "promo",
        goal: p.goal ?? "new_customers",
        title: p.offer,
        window: p.window,
        spendCap: p.spendCap,
        expectedOrders: p.expectedOrders,
        minReturn: p.minReturn ?? 3,
        approvalId: row.id,
        endsAt: p.days ? new Date(Date.now() + p.days * 86_400_000).toISOString() : null,
      });
    }
    return { steps: [{ platform: p.platform, what: p.offer, ...result }] };
  }
  // listing_application: neither platform exposes an onboarding API, so the
  // application is queued with everything checked for the onboarding team.
  const p = row.payload as ApprovalPayload["listing_application"];
  return { steps: p.platforms.map((platform) => ({ platform, what: "Listing application", ok: true as const, note: "Queued for submission" })) };
}

/** `actor` is "user:<id>" of whoever decided, or "owner" where no person is signed in (the sample restaurant). */
export async function approve(outlet: Outlet, id: string, actor = "owner") {
  const row = await getApproval(outlet.id, id);
  if (row.status !== "pending") throw new HttpError(409, `This was already ${row.status}.`);
  // Re-read so a platform added or removed since drafting is respected.
  const [fresh] = await db.select().from(outlets).where(eq(outlets.id, outlet.id));
  const { steps, before } = await execute(fresh, row);
  const ok = steps.length > 0 && steps.every((s) => s.ok);
  const [updated] = await db
    .update(approvals)
    .set({ status: ok ? "executed" : "failed", result: { steps, before: before ?? null }, decidedAt: new Date().toISOString(), decidedBy: actor })
    .where(eq(approvals.id, id))
    .returning();
  await audit(outlet.id, actor, ok ? "approval.executed" : "approval.failed", { approvalId: id, steps });
  return updated;
}

export async function skip(outlet: Outlet, id: string, actor = "owner") {
  const row = await getApproval(outlet.id, id);
  if (row.status !== "pending") throw new HttpError(409, `This was already ${row.status}.`);
  const [updated] = await db.update(approvals).set({ status: "skipped", decidedAt: new Date().toISOString(), decidedBy: actor }).where(eq(approvals.id, id)).returning();
  await audit(outlet.id, actor, "approval.skipped", { approvalId: id });
  return updated;
}

/** Undo is supported for menu changes; a posted reply or a raised dispute can't be recalled. */
export async function undo(outlet: Outlet, id: string, actor = "owner") {
  const row = await getApproval(outlet.id, id);
  if (row.status === "skipped") {
    const [updated] = await db.update(approvals).set({ status: "pending", decidedAt: null, decidedBy: null }).where(eq(approvals.id, id)).returning();
    return updated;
  }
  if (row.kind !== "menu_change" || row.status !== "executed") throw new HttpError(409, "This can't be undone once sent.");
  const before = (row.result?.before ?? []) as MenuChange[];
  const [fresh] = await db.select().from(outlets).where(eq(outlets.id, outlet.id));
  const { steps } = await applyMenuChanges(fresh, before);
  const [updated] = await db.update(approvals).set({ status: "undone", result: { ...(row.result ?? {}), undoSteps: steps }, decidedBy: actor }).where(eq(approvals.id, id)).returning();
  await audit(outlet.id, actor, "approval.undone", { approvalId: id, steps });
  return updated;
}
