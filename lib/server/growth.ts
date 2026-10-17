import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { CHANNEL_NAME, type Platform } from "../platforms";
import type { CampaignDTO, CampaignInput, EstimateDTO, GrowthDTO, SuggestionDTO } from "../types";
import { audit, createApproval, HttpError } from "./approvals";
import { db } from "./db";
import { campaigns, menuItems, orders, type Campaign, type Outlet } from "./schema";
import { notify } from "./whatsapp";

// Promos and ads with a hard spend cap: estimates from the outlet's own orders,
// suggestions, approval, and an automatic pause when a campaign stops paying off.

export const MAX_SPEND = Number(process.env.MAX_PROMO_SPEND ?? 10000);
const HISTORY_DAYS = 14;
// Used until an outlet has orders of its own, and said so on screen.
const FALLBACK = { ordersPerDay: 30, avgOrder: 350 };
// Paused automatically once this much is spent and the return is below the campaign's floor.
const PAUSE_AFTER = 500;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const campaignDTO = (c: Campaign): CampaignDTO => ({
  id: c.id,
  platform: c.platform,
  kind: c.kind,
  goal: c.goal,
  title: c.title,
  window: c.window,
  spendCap: c.spendCap,
  spent: c.spent,
  orders: c.orders,
  revenue: c.revenue,
  expectedOrders: c.expectedOrders,
  minReturn: c.minReturn,
  status: c.status,
  statusDetail: c.statusDetail,
  startsAt: c.startsAt,
  endsAt: c.endsAt,
});

/** Orders per day and average order value on one platform, from the last two weeks. */
async function basis(outletId: string, platform: Platform) {
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  const rows = await db
    .select({
      amount: orders.amount,
      placedAt: orders.placedAt,
      status: orders.status,
    })
    .from(orders)
    .where(and(eq(orders.outletId, outletId), eq(orders.channel, platform), gte(orders.placedAt, since)));
  const good = rows.filter((r) => r.status !== "cancelled");
  if (good.length < 10) return { ...FALLBACK, days: 0, fromHistory: false };
  const days = new Set(good.map((r) => r.placedAt.slice(0, 10))).size;
  return {
    ordersPerDay: Math.round(good.length / days),
    avgOrder: Math.round(good.reduce((s, r) => s + r.amount, 0) / good.length),
    days,
    fromHistory: true,
  };
}

export function offerText(i: CampaignInput) {
  const min = i.minOrder > 0 ? ` on orders above ₹${i.minOrder}` : "";
  if (i.offer === "percent") return `${i.value}% off up to ₹${i.upTo}${min}`;
  if (i.offer === "flat") return `Flat ₹${i.value} off${min}`;
  if (i.offer === "freebie") return `Free ${i.dish || "dessert"}${min}`;
  return `Ad boost${i.dish ? ` for ${i.dish}` : ""}`;
}

// Share of orders that use an offer, and how strongly it lifts orders, by goal.
const GOAL = {
  new_customers: { redeem: 0.25, lift: 1 },
  slow_hours: { redeem: 0.3, lift: 0.7 },
  bigger_orders: { redeem: 0.35, lift: 0.6 },
  dish: { redeem: 0.15, lift: 0.5 },
  festival: { redeem: 0.35, lift: 1.3 },
} as const;

/**
 * A plain, explainable estimate. Deeper discounts lift orders more (capped at
 * +35%); spend is the discount on every order that uses the offer, stopping at
 * the budget. Ads: about ₹10 a click and 8% of clicks ordering.
 */
export async function estimate(outletId: string, i: CampaignInput): Promise<EstimateDTO> {
  const b = await basis(outletId, i.platform);
  const notes: EstimateDTO["notes"] = [];
  if (!b.fromHistory)
    notes.push({
      en: `No order history on ${CHANNEL_NAME[i.platform]} yet, so this uses a typical small restaurant: ${FALLBACK.ordersPerDay} orders a day at ${inr(FALLBACK.avgOrder)}.`,
      hi: `${CHANNEL_NAME[i.platform]} पर अभी ऑर्डर का इतिहास नहीं है, इसलिए एक आम छोटे रेस्टोरेंट का अनुमान: दिन में ${FALLBACK.ordersPerDay} ऑर्डर, ${inr(FALLBACK.avgOrder)} औसत।`,
    });

  if (i.offer === "ads") {
    const clicks = i.budget / 10;
    const extra = Math.round(clicks * 0.08);
    const revenue = extra * b.avgOrder;
    notes.push({
      en: "Ads are charged per click, at about ₹10 a click, with roughly 8 in 100 clicks ordering.",
      hi: "ऐड का ख़र्च हर क्लिक पर, क़रीब ₹10 प्रति क्लिक; 100 में से क़रीब 8 क्लिक ऑर्डर बनते हैं।",
    });
    return {
      basis: b,
      extraOrders: extra,
      redeemedOrders: 0,
      spend: i.budget,
      revenue,
      returnOnSpend: i.budget ? +(revenue / i.budget).toFixed(1) : 0,
      daysCovered: i.days,
      offerText: offerText(i),
      notes,
    };
  }

  const perOrder = i.offer === "percent" ? Math.min((b.avgOrder * i.value) / 100, i.upTo || Infinity) : i.value;
  const g = GOAL[i.goal];
  const lift = Math.min(0.35, Math.max(0.03, (perOrder / b.avgOrder) * 1.2)) * g.lift;
  // A time window covers part of the day's orders.
  const share = /all day/i.test(i.window) || !i.window ? 1 : 0.35;
  const extraPerDay = b.ordersPerDay * share * lift;
  const redeemedPerDay = (b.ordersPerDay * share + extraPerDay) * g.redeem;
  const spendPerDay = redeemedPerDay * perOrder;
  const daysCovered = spendPerDay > 0 ? Math.min(i.days, i.budget / spendPerDay) : i.days;
  const extra = Math.round(extraPerDay * daysCovered);
  const spend = Math.round(Math.min(i.budget, spendPerDay * daysCovered));
  const revenue = Math.round(extra * b.avgOrder);
  if (daysCovered < i.days)
    notes.push({
      en: `The budget runs out after about ${Math.max(1, Math.round(daysCovered))} of ${i.days} days. Raise it or lower the discount to cover them all.`,
      hi: `बजट ${i.days} में से क़रीब ${Math.max(1, Math.round(daysCovered))} दिन में ख़त्म होगा। सारे दिन चलाने के लिए बजट बढ़ाएँ या छूट कम करें।`,
    });
  if (i.minOrder > b.avgOrder)
    notes.push({
      en: `The minimum order (₹${i.minOrder}) is above your average order (${inr(b.avgOrder)}), which nudges people to add a dish.`,
      hi: `न्यूनतम ऑर्डर (₹${i.minOrder}) आपके औसत ऑर्डर (${inr(b.avgOrder)}) से ज़्यादा है, जिससे लोग एक डिश और जोड़ते हैं।`,
    });
  return {
    basis: b,
    extraOrders: extra,
    redeemedOrders: Math.round(redeemedPerDay * daysCovered),
    spend,
    revenue,
    returnOnSpend: spend ? +(revenue / spend).toFixed(1) : 0,
    daysCovered: Math.round(daysCovered),
    offerText: offerText(i),
    notes,
  };
}

/** Turns a campaign plan into an approval ticket. Nothing goes live until the owner approves. */
export async function propose(outlet: Outlet, i: CampaignInput) {
  if (!outlet.livePlatforms.includes(i.platform)) throw new HttpError(400, `You aren't live on ${CHANNEL_NAME[i.platform]}.`);
  if (i.budget > MAX_SPEND) throw new HttpError(400, `The most any one campaign can spend is ₹${MAX_SPEND.toLocaleString("en-IN")}.`);
  const e = await estimate(outlet.id, i);
  return createApproval(outlet.id, {
    agent: "growth",
    kind: "promo",
    title: `${e.offerText} on ${CHANNEL_NAME[i.platform]}`,
    summary: `${i.window || "All day"} for ${i.days} days, spend capped at ${inr(i.budget)}. Expected about ${e.extraOrders} extra orders and ${inr(e.revenue)} in sales (${e.returnOnSpend}× the spend). Pauses itself if it returns less than 3×.`,
    payload: {
      platform: i.platform,
      offer: e.offerText,
      window: i.window || "All day",
      spendCap: i.budget,
      expectedOrders: e.extraOrders,
      kind: i.offer === "ads" ? "ad" : "promo",
      goal: i.goal,
      days: i.days,
      minReturn: 3,
    },
  });
}

// Festivals and events worth planning a promo for. Dates are when the rush starts.
const EVENTS: {
  date: string;
  name: { en: string; hi: string };
  offer: Partial<CampaignInput>;
}[] = [
  {
    date: "2026-10-20",
    name: { en: "Dussehra", hi: "दशहरा" },
    offer: { offer: "percent", value: 15, upTo: 75 },
  },
  {
    date: "2026-11-08",
    name: { en: "Diwali", hi: "दिवाली" },
    offer: { offer: "freebie", value: 60, dish: "dessert" },
  },
  {
    date: "2026-12-25",
    name: { en: "Christmas", hi: "क्रिसमस" },
    offer: { offer: "percent", value: 20, upTo: 100 },
  },
  {
    date: "2026-12-31",
    name: { en: "New Year's Eve", hi: "नए साल की शाम" },
    offer: { offer: "flat", value: 75, minOrder: 499 },
  },
  {
    date: "2027-01-26",
    name: { en: "Republic Day", hi: "गणतंत्र दिवस" },
    offer: { offer: "percent", value: 15, upTo: 75 },
  },
  {
    date: "2027-02-14",
    name: { en: "Valentine's Day", hi: "वैलेंटाइन डे" },
    offer: { offer: "freebie", value: 60, dish: "dessert" },
  },
  {
    date: "2027-03-22",
    name: { en: "Holi", hi: "होली" },
    offer: { offer: "percent", value: 20, upTo: 80 },
  },
];

/** What Zest would try next, from this outlet's own orders and the calendar. */
export async function suggestions(outlet: Outlet): Promise<SuggestionDTO[]> {
  const platform = outlet.livePlatforms[0];
  if (!platform) return [];
  const out: SuggestionDTO[] = [];
  const base: CampaignInput = {
    platform,
    goal: "new_customers",
    offer: "percent",
    value: 20,
    upTo: 80,
    minOrder: 0,
    budget: 2500,
    days: 7,
    window: "All day",
  };

  // Slowest three-hour stretch between noon and 11 pm.
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  const rows = await db
    .select({ placedAt: orders.placedAt })
    .from(orders)
    .where(and(eq(orders.outletId, outlet.id), gte(orders.placedAt, since)));
  if (rows.length >= 20) {
    // Hours in India time, which is where these restaurants are.
    const byHour = Array<number>(24).fill(0);
    for (const r of rows) byHour[new Date(Date.parse(r.placedAt) + 330 * 60_000).getUTCHours()]++;
    // Hours with no orders at all are closed, not slow.
    const sum = (h: number) => byHour[h] + byHour[h + 1] + byHour[h + 2];
    const open = Array.from({ length: 9 }, (_, k) => 12 + k).filter((h) => byHour[h] && byHour[h + 1] && byHour[h + 2]);
    const best = open.sort((a, b) => sum(a) - sum(b))[0];
    if (best !== undefined) {
      const label = (h: number) => `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
      const share = Math.round(((byHour[best] + byHour[best + 1] + byHour[best + 2]) / rows.length) * 100);
      out.push({
        id: "slow-hours",
        title: {
          en: `Fill ${label(best)} to ${label(best + 3)}`,
          hi: `${label(best)} से ${label(best + 3)} का समय भरें`,
        },
        why: {
          en: `Only ${share}% of your orders come in these three hours. A happy-hours offer there costs little and keeps the kitchen busy.`,
          hi: `इन तीन घंटों में आपके सिर्फ़ ${share}% ऑर्डर आते हैं। यहाँ हैप्पी-आवर्स ऑफ़र सस्ता पड़ता है और किचन चलती रहती है।`,
        },
        input: {
          ...base,
          goal: "slow_hours",
          value: 15,
          upTo: 75,
          budget: 2000,
          days: 14,
          window: `${label(best)} to ${label(best + 3)}, Mon to Thu`,
        },
      });
    }
  }

  // A well-rated dish that few people order.
  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, outlet.id));
  const gem = menu.filter((m) => m.rating >= 4.2 && m.votes >= 20).sort((a, b) => a.ordersLast7 - b.ordersLast7)[0];
  if (gem) {
    out.push({
      id: "hidden-gem",
      title: { en: `Get ${gem.name} noticed`, hi: `${gem.name} को आगे लाएँ` },
      why: {
        en: `It's rated ${gem.rating}★ but sold only ${gem.ordersLast7} times last week. An ad boost puts it in front of people browsing nearby.`,
        hi: `इसकी रेटिंग ${gem.rating}★ है पर पिछले हफ़्ते सिर्फ़ ${gem.ordersLast7} बार बिका। ऐड बूस्ट से आस-पास के लोग इसे देखेंगे।`,
      },
      input: {
        ...base,
        goal: "dish",
        offer: "ads",
        value: 0,
        upTo: 0,
        budget: 1500,
        days: 7,
        dish: gem.name,
      },
    });
  }

  out.push({
    id: "new-customers",
    title: { en: "Win first-time customers", hi: "नए ग्राहक लाएँ" },
    why: {
      en: "New-customer offers bring people who haven't tried you yet. Most who like the first order come back without a discount.",
      hi: "नए ग्राहक वाले ऑफ़र उन लोगों को लाते हैं जिन्होंने आपको अभी तक नहीं आज़माया। पहला ऑर्डर पसंद आने पर ज़्यादातर बिना छूट के लौटते हैं।",
    },
    input: base,
  });

  const today = Date.now();
  for (const ev of EVENTS) {
    const days = Math.round((Date.parse(ev.date) - today) / 86_400_000);
    if (days < -1 || days > 45) continue;
    out.push({
      id: `event-${ev.date}`,
      title: {
        en: `${ev.name.en} is ${days <= 0 ? "today" : `in ${days} days`}`,
        hi: `${ev.name.hi} ${days <= 0 ? "आज है" : `${days} दिन में है`}`,
      },
      why: {
        en: `Orders jump around ${ev.name.en}. Set the offer up now so it's live when people start ordering.`,
        hi: `${ev.name.hi} के आस-पास ऑर्डर बढ़ते हैं। ऑफ़र अभी तैयार करें ताकि लोगों के ऑर्डर शुरू होते ही चालू रहे।`,
      },
      input: {
        ...base,
        goal: "festival",
        budget: 3000,
        days: 3,
        window: "All day",
        ...ev.offer,
        minOrder: ev.offer.minOrder ?? 0,
        value: ev.offer.value ?? 15,
        upTo: ev.offer.upTo ?? 0,
      },
    });
    if (out.filter((s) => s.id.startsWith("event-")).length >= 2) break;
  }
  return out;
}

export async function getGrowth(outlet: Outlet): Promise<GrowthDTO> {
  const rows = await db.select().from(campaigns).where(eq(campaigns.outletId, outlet.id)).orderBy(desc(campaigns.createdAt));
  const visible = rows.filter((c) => outlet.livePlatforms.includes(c.platform));
  return {
    campaigns: visible.map(campaignDTO),
    summary: {
      spent: visible.reduce((s, c) => s + c.spent, 0),
      revenue: visible.reduce((s, c) => s + c.revenue, 0),
      orders: visible.reduce((s, c) => s + c.orders, 0),
      live: visible.filter((c) => c.status === "live").length,
    },
    suggestions: await suggestions(outlet),
    limit: MAX_SPEND,
  };
}

/** Owner controls. Pausing here stops tracking; the platform side follows once its connector supports it. */
export async function setCampaignStatus(outletId: string, id: string, action: "pause" | "resume" | "end") {
  const [c] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.outletId, outletId)));
  if (!c) throw new HttpError(404, "Campaign not found.");
  if (c.status === "ended") throw new HttpError(409, "This campaign has ended.");
  const status = action === "pause" ? "paused" : action === "resume" ? "live" : "ended";
  const [row] = await db
    .update(campaigns)
    .set({
      status,
      statusDetail: action === "pause" ? "Paused by you" : action === "end" ? "Ended by you" : null,
    })
    .where(eq(campaigns.id, id))
    .returning();
  await audit(outletId, "owner", `campaign.${action}`, { campaignId: id });
  return campaignDTO(row);
}

/** Ends campaigns that hit their cap or end date, and pauses ones not paying off. */
export async function checkCampaigns(outletId: string) {
  const live = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.outletId, outletId), eq(campaigns.status, "live")));
  const changed: { id: string; status: string; detail: string }[] = [];
  for (const c of live) {
    let status: "paused" | "ended" | null = null;
    let detail = "";
    const ret = c.spent ? c.revenue / c.spent : 0;
    if (c.spent >= c.spendCap) [status, detail] = ["ended", "Spend cap reached"];
    else if (c.endsAt && Date.parse(c.endsAt) < Date.now()) [status, detail] = ["ended", "Finished its run"];
    else if (c.spent >= PAUSE_AFTER && ret < c.minReturn) [status, detail] = ["paused", `Paused automatically: returning ${ret.toFixed(1)}× against a ${c.minReturn}× floor`];
    if (!status) continue;
    await db.update(campaigns).set({ status, statusDetail: detail }).where(eq(campaigns.id, c.id));
    await audit(outletId, "growth", `campaign.${status}`, {
      campaignId: c.id,
      detail,
    });
    if (status === "paused")
      await notify(
        outletId,
        "campaign_paused",
        `Paused "${c.title}" on ${CHANNEL_NAME[c.platform]}: ${inr(c.spent)} spent for ${inr(c.revenue)} in sales (${ret.toFixed(1)}×). Open Growth in Zest to change it.`,
      );
    changed.push({ id: c.id, status, detail });
  }
  return changed;
}
