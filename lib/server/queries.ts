import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import type { DishKind } from "@/components/dishes";
import type { ApprovalDTO, ApprovalStep, MenuItemDTO, OrderDTO, OutletDTO, PayoutDTO, ReviewDTO, TodayDTO } from "../types";
import type { Channel } from "../platforms";
import { listApprovals } from "./approvals";
import { hasClaude } from "./claude";
import { db } from "./db";
import { connections, menuItems, orders, payouts, reviews, type ApprovalRow, type Connection, type MenuItemRow, type OrderRow, type Outlet, type PayoutRow, type ReviewRow } from "./schema";

export function connectionDTO(c: Connection) {
  return { platform: c.platform, method: c.method, status: c.status, statusDetail: c.statusDetail, lastSyncAt: c.lastSyncAt, info: c.publicInfo };
}

export async function outletDTO(o: Outlet): Promise<OutletDTO> {
  const conns = await db.select().from(connections).where(eq(connections.outletId, o.id));
  return {
    id: o.id,
    name: o.name,
    area: o.area,
    city: o.city,
    address: o.address,
    fssai: o.fssai,
    gstin: o.gstin,
    listings: o.listings,
    cuisines: o.cuisines,
    ownerName: o.ownerName,
    ownerPhone: o.ownerPhone,
    lang: o.lang,
    journey: o.journey,
    live: o.livePlatforms,
    email: o.email,
    whatsapp: o.whatsapp,
    ratings: o.ratings,
    isDemo: o.isDemo,
    connections: conns.map(connectionDTO),
    claude: hasClaude(),
  };
}

export const menuDTO = (m: MenuItemRow): MenuItemDTO => ({
  id: m.id,
  name: m.name,
  category: m.category,
  kind: m.kind as DishKind,
  veg: m.veg,
  bestseller: m.bestseller,
  description: m.description,
  rating: m.rating,
  votes: m.votes,
  photo: m.photoUrl ?? undefined,
  price: m.price,
  available: m.available,
  ordersLast7: m.ordersLast7,
});

export const orderDTO = (o: OrderRow): OrderDTO => ({ id: o.id, externalId: o.externalId, channel: o.channel, items: o.items, amount: o.amount, placedAt: o.placedAt, status: o.status, prepMins: o.prepMins });

export const payoutDTO = (p: PayoutRow): PayoutDTO => ({
  id: p.id,
  platform: p.platform,
  periodLabel: p.periodLabel,
  gross: p.gross,
  commission: p.commission,
  ads: p.ads,
  deductions: p.deductions,
  net: p.net,
  status: p.status,
  payDate: p.payDate,
  source: p.source,
});

export const reviewDTO = (r: ReviewRow): ReviewDTO => ({ id: r.id, platform: r.platform, author: r.author, stars: r.stars, text: r.text, postedAt: r.postedAt, draft: r.draftReply ?? null, reply: r.reply, repliedAt: r.repliedAt });

export const approvalDTO = (a: ApprovalRow): ApprovalDTO => ({
  id: a.id,
  agent: a.agent,
  kind: a.kind,
  title: a.title,
  summary: a.summary,
  payload: a.payload,
  status: a.status,
  steps: ((a.result?.steps as ApprovalStep[] | undefined) ?? []).concat((a.result?.undoSteps as ApprovalStep[] | undefined) ?? []),
  createdAt: a.createdAt,
});

export async function getMenu(outletId: string) {
  return (await db.select().from(menuItems).where(eq(menuItems.outletId, outletId)).orderBy(asc(menuItems.sort))).map(menuDTO);
}

export async function getOrders(outletId: string, limit = 60) {
  return (await db.select().from(orders).where(eq(orders.outletId, outletId)).orderBy(desc(orders.placedAt)).limit(limit)).map(orderDTO);
}

export async function getPayouts(outletId: string) {
  return (await db.select().from(payouts).where(eq(payouts.outletId, outletId)).orderBy(desc(payouts.payDate))).map(payoutDTO);
}

export async function getReviews(outletId: string) {
  return (await db.select().from(reviews).where(eq(reviews.outletId, outletId)).orderBy(desc(reviews.postedAt))).map(reviewDTO);
}

function dayBounds(offsetDays: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start.toISOString(), end.toISOString()] as const;
}

/** Sales by channel for a day (0 = today, -1 = yesterday), excluding cancelled orders. */
export async function salesForDay(outletId: string, offsetDays: number) {
  const [from, to] = dayBounds(offsetDays);
  const rows = await db.select().from(orders).where(and(eq(orders.outletId, outletId), gte(orders.placedAt, from), lt(orders.placedAt, to)));
  const sales: Record<Channel, { amount: number; orders: number }> = { zomato: { amount: 0, orders: 0 }, swiggy: { amount: 0, orders: 0 }, dine: { amount: 0, orders: 0 } };
  for (const o of rows) {
    if (o.status === "cancelled") continue;
    sales[o.channel].amount += o.amount;
    sales[o.channel].orders += 1;
  }
  return { sales, cancelled: rows.filter((o) => o.status === "cancelled").length };
}

export async function getToday(outlet: Outlet): Promise<TodayDTO> {
  const { sales } = await salesForDay(outlet.id, -1);
  const lastWeek = await salesForDay(outlet.id, -8);
  const channels: Channel[] = [...outlet.livePlatforms, "dine"];
  const total = channels.reduce((s, c) => s + sales[c].amount, 0);
  const prevTotal = channels.reduce((s, c) => s + lastWeek.sales[c].amount, 0);
  const allPayouts = await getPayouts(outlet.id);
  const nextPayout = allPayouts.filter((p) => p.status === "upcoming" && outlet.livePlatforms.includes(p.platform)).sort((a, b) => a.payDate.localeCompare(b.payDate))[0] ?? null;
  const revs = await getReviews(outlet.id);
  const menu = await getMenu(outlet.id);
  return {
    sales,
    total,
    changePct: prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null,
    nextPayout,
    openComplaints: revs.filter((r) => r.stars <= 2 && !r.reply && outlet.livePlatforms.includes(r.platform)).length,
    topDishes: [...menu].sort((a, b) => b.ordersLast7 - a.ordersLast7).slice(0, 4).map((item) => ({ item, orders: Math.round(item.ordersLast7 / 7) })),
    approvals: (await listApprovals(outlet.id, "pending")).map(approvalDTO),
  };
}
