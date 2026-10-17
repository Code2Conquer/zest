import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Lang } from "../i18n";
import type { Channel, Platform } from "../platforms";
import type { CopilotCard, CopilotReply } from "../types";
import { createApproval, type MenuChange } from "./approvals";
import { claude, describeClaudeError, hasClaude, MODEL } from "./claude";
import { db } from "./db";
import { approvalDTO, getMenu, getOrders, getPayouts, getReviews, salesForDay } from "./queries";
import { approvals, chatMessages, menuItems, reviews, type Outlet } from "./schema";

type Agent = CopilotReply["agent"];

const DEVANAGARI = /[ऀ-ॿ]/;
const HINGLISH = /\b(kyun|kyu|kitna|kitne|hafte|aaj|kal|paisa|paise|kya|hai|karo|kar do|band|batao|khatam)\b/i;
export const replyLang = (message: string, uiLang: Lang): Lang => (DEVANAGARI.test(message) || HINGLISH.test(message) ? "hi" : uiLang);

const SUGGESTIONS: Record<Agent, { en: string[]; hi: string[] }> = {
  orchestrator: {
    en: ["Why is my Swiggy payout lower this week?", "Reply to new reviews", "How did we do yesterday?", "Suggest a promo for the weekend"],
    hi: ["इस हफ़्ते Swiggy पेआउट कम क्यों है?", "नए रिव्यू का जवाब दो", "कल का दिन कैसा रहा?", "वीकेंड के लिए प्रोमो बताओ"],
  },
  finance: { en: ["Show all deductions this month", "When does the next payout land?"], hi: ["इस महीने की सारी कटौतियाँ दिखाओ", "अगला पेआउट कब आएगा?"] },
  reviews: { en: ["Which complaints are still open?", "What are customers unhappy about?"], hi: ["कौन सी शिकायतें अभी खुली हैं?", "ग्राहक किस बात से नाख़ुश हैं?"] },
  menu: { en: ["Turn them back on at 6 pm", "Which dishes have no description?"], hi: ["शाम 6 बजे वापस चालू कर देना", "किन डिश का विवरण नहीं है?"] },
  orders: { en: ["Which orders are running late?", "Which dishes sold best?"], hi: ["कौन से ऑर्डर देर से चल रहे हैं?", "क्या सबसे ज़्यादा बिका?"] },
  growth: { en: ["What did last month's promo return?", "Lower the spend cap to ₹1,500"], hi: ["पिछले महीने के प्रोमो से क्या मिला?", "ख़र्च सीमा ₹1,500 कर दो"] },
  onboarding: { en: ["What documents do I still need?"], hi: ["मुझे और कौन से दस्तावेज़ चाहिए?"] },
};

const platformName = (p: Platform) => (p === "zomato" ? "Zomato" : "Swiggy");
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Runs one owner message through the copilot and stores both sides of the exchange. */
export async function runCopilot(outlet: Outlet, message: string, uiLang: Lang): Promise<CopilotReply> {
  const lang = replyLang(message, uiLang);
  const history = await db.select().from(chatMessages).where(eq(chatMessages.outletId, outlet.id)).orderBy(desc(chatMessages.createdAt)).limit(16);
  await db.insert(chatMessages).values({ outletId: outlet.id, role: "user", content: { text: message } });

  let reply: CopilotReply;
  if (hasClaude()) {
    try {
      reply = await withClaude(outlet, message, lang, history.reverse());
    } catch (err) {
      console.error(err);
      reply = { agent: "orchestrator", text: describeClaudeError(err), cards: [], suggestions: [], engine: "claude" };
    }
  } else {
    reply = await withRules(outlet, message, lang);
  }
  await db.insert(chatMessages).values({ outletId: outlet.id, role: "assistant", content: reply as unknown as Record<string, unknown> });
  return reply;
}

export async function chatHistory(outletId: string) {
  const rows = await db.select().from(chatMessages).where(eq(chatMessages.outletId, outletId)).orderBy(asc(chatMessages.createdAt)).limit(100);
  return rows.map((r) => (r.role === "user" ? { id: r.id, role: "user" as const, text: String(r.content.text ?? "") } : { id: r.id, role: "assistant" as const, reply: r.content as unknown as CopilotReply }));
}

// ---------------------------------------------------------------------------
// Claude

function systemPrompt(outlet: Outlet, lang: Lang) {
  const live = outlet.livePlatforms.map(platformName).join(" and ") || "no delivery platform yet";
  return `You are Zest, the AI operations team for ${outlet.name}${outlet.area ? `, a restaurant in ${outlet.area}` : ""}. The owner${outlet.ownerName ? `, ${outlet.ownerName},` : ""} sells on ${live} and through dine-in. Today is ${new Date().toDateString()}.

You coordinate specialist work: payouts and statements, reviews and complaints, the menu on every platform, live orders, and promos. Use the tools to look things up rather than guessing; quote real numbers from them.

Changes to platforms are never made directly. The propose_* tools create a draft that the owner approves with one tap, and the draft card is shown under your reply. So say what you've drafted and that it's waiting for their OK; never say it's done.

Reply in ${lang === "hi" ? "Hindi (Devanagari), or Hinglish if the owner wrote in Hinglish" : "English"}. Keep replies to two to four short sentences: cards under your message show the details. Write money as ₹ with Indian digit grouping (₹1,23,456). Don't use Markdown headings or tables.`;
}

async function withClaude(outlet: Outlet, message: string, lang: Lang, history: (typeof chatMessages.$inferSelect)[]): Promise<CopilotReply> {
  const cards: CopilotCard[] = [];
  const used = new Map<Agent, number>();
  const mark = (a: Agent) => used.set(a, (used.get(a) ?? 0) + 1);
  const live = outlet.livePlatforms;
  const Platform = z.enum(["zomato", "swiggy"]);

  const tools = [
    betaZodTool({
      name: "get_sales",
      description: "Sales and order counts by channel (zomato, swiggy, dine) for today or yesterday, excluding cancelled orders.",
      inputSchema: z.object({ day: z.enum(["today", "yesterday"]) }),
      run: async ({ day }) => {
        mark("orders");
        const { sales, cancelled } = await salesForDay(outlet.id, day === "today" ? 0 : -1);
        cards.push({ type: "sales", sales, channels: [...live, "dine"] as Channel[] });
        return JSON.stringify({ day, sales, cancelled });
      },
    }),
    betaZodTool({
      name: "get_orders",
      description: "Recent orders, newest first. Filter by status (e.g. delayed, preparing, cancelled) or channel.",
      inputSchema: z.object({ status: z.enum(["preparing", "ready", "picked", "delivered", "delayed", "cancelled"]).optional(), channel: z.enum(["zomato", "swiggy", "dine"]).optional() }),
      run: async ({ status, channel }) => {
        mark("orders");
        const rows = (await getOrders(outlet.id, 200)).filter((o) => (!status || o.status === status) && (!channel || o.channel === channel)).slice(0, 25);
        return JSON.stringify(rows.map(({ id: _id, ...o }) => o));
      },
    }),
    betaZodTool({
      name: "get_payouts",
      description: "Payouts per platform with sales, commission, ads, deductions and net, newest first. Use to explain why a payout changed.",
      inputSchema: z.object({ platform: Platform.optional() }),
      run: async ({ platform }) => {
        mark("finance");
        const rows = (await getPayouts(outlet.id)).filter((p) => !platform || p.platform === platform);
        if (rows[0]) cards.push({ type: "payout", payout: rows[0], previous: rows.find((p, i) => i > 0 && p.platform === rows[0].platform) ?? null });
        return JSON.stringify(rows.slice(0, 8).map(({ id: _id, ...p }) => p));
      },
    }),
    betaZodTool({
      name: "get_reviews",
      description: "Customer reviews with stars, text and whether they've been replied to. Each has an id to use with propose_review_reply.",
      inputSchema: z.object({ unreplied_only: z.boolean() }),
      run: async ({ unreplied_only }) => {
        mark("reviews");
        const rows = (await getReviews(outlet.id)).filter((r) => live.includes(r.platform) && (!unreplied_only || !r.reply));
        return JSON.stringify(rows.slice(0, 20).map((r) => ({ id: r.id, platform: r.platform, author: r.author, stars: r.stars, text: r.text, postedAt: r.postedAt, replied: !!r.reply })));
      },
    }),
    betaZodTool({
      name: "get_menu",
      description: "Menu dishes with id, category, price and availability per platform. Optionally filter by a word in the name.",
      inputSchema: z.object({ search: z.string().optional() }),
      run: async ({ search }) => {
        mark("menu");
        const q = search?.toLowerCase();
        const rows = (await getMenu(outlet.id)).filter((m) => !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
        return JSON.stringify(rows.map((m) => ({ id: m.id, name: m.name, category: m.category, veg: m.veg, price: m.price, available: m.available, has_description: !!m.description, orders_last_7_days: m.ordersLast7 })));
      },
    }),
    betaZodTool({
      name: "propose_menu_change",
      description: "Draft a change to dishes on the owner's platforms: mark in or out of stock and/or set a price. Get item ids from get_menu first. Creates a draft for the owner to approve.",
      inputSchema: z.object({
        item_ids: z.array(z.string()).min(1),
        available: z.boolean().optional(),
        price: z.number().int().positive().optional(),
        platforms: z.array(Platform).optional().describe("Defaults to every platform the owner is live on"),
        reason: z.string().describe("One line the owner will read, e.g. 'Paneer has run out'"),
      }),
      run: async ({ item_ids, available, price, platforms, reason }) => {
        mark("menu");
        if (available === undefined && price === undefined) return "Error: set available and/or price.";
        const targets = (platforms ?? live).filter((p) => live.includes(p));
        const items = await db.select().from(menuItems).where(and(eq(menuItems.outletId, outlet.id), inArray(menuItems.id, item_ids)));
        if (!items.length) return "Error: none of those item ids exist. Call get_menu.";
        const each = <T,>(v: T) => Object.fromEntries(targets.map((p) => [p, v])) as Partial<Record<Platform, T>>;
        const changes: MenuChange[] = items.map((i) => ({ itemId: i.id, ...(available !== undefined ? { available: each(available) } : {}), ...(price !== undefined ? { price: each(price) } : {}) }));
        const what = available === false ? "out of stock" : available ? "back in stock" : `₹${price}`;
        const row = await createApproval(outlet.id, { agent: "menu", kind: "menu_change", title: `${items.map((i) => i.name).join(", ")}: ${what}`, summary: reason, payload: { changes } });
        cards.push({ type: "approval", approval: approvalDTO(row) });
        return `Draft created (${row.id}) for ${targets.map(platformName).join(" and ")}. Waiting for the owner's approval.`;
      },
    }),
    betaZodTool({
      name: "propose_review_reply",
      description: "Draft a reply to a review in the owner's warm, specific voice. For complaints, apologise once, say what will change, and offer a fix only if it fits. Creates a draft for approval.",
      inputSchema: z.object({ review_id: z.string(), reply: z.string().min(10).max(900) }),
      run: async ({ review_id, reply }) => {
        mark("reviews");
        const [r] = await db.select().from(reviews).where(and(eq(reviews.id, review_id), eq(reviews.outletId, outlet.id)));
        if (!r) return "Error: no review with that id. Call get_reviews.";
        if (r.reply) return "This review already has a reply.";
        const pending = await db.select().from(approvals).where(and(eq(approvals.outletId, outlet.id), eq(approvals.kind, "review_reply"), eq(approvals.status, "pending")));
        const existing = pending.find((a) => (a.payload as { reviewId?: string }).reviewId === r.id);
        if (existing) {
          cards.push({ type: "approval", approval: approvalDTO(existing) });
          return "A reply to this review is already waiting for approval.";
        }
        const row = await createApproval(outlet.id, { agent: "reviews", kind: "review_reply", title: `Reply to ${r.author}`, summary: reply, payload: { reviewId: r.id, text: reply } });
        cards.push({ type: "approval", approval: approvalDTO(row) });
        return `Draft reply created (${row.id}).`;
      },
    }),
    betaZodTool({
      name: "propose_dispute",
      description: "Draft a dispute with a platform over a wrong charge or deduction on an order. Creates a draft for approval.",
      inputSchema: z.object({ platform: Platform, order_id: z.string(), amount: z.number().positive(), reason: z.string() }),
      run: async ({ platform, order_id, amount, reason }) => {
        mark("finance");
        const row = await createApproval(outlet.id, { agent: "finance", kind: "dispute", title: `Dispute ${inr(amount)} with ${platformName(platform)}`, summary: reason, payload: { platform, orderId: order_id, amount, reason } });
        cards.push({ type: "approval", approval: approvalDTO(row) });
        return `Dispute drafted (${row.id}).`;
      },
    }),
    betaZodTool({
      name: "propose_promo",
      description: "Draft a time-boxed promo on one platform with a hard spend cap in rupees. Creates a draft for approval.",
      inputSchema: z.object({ platform: Platform, offer: z.string(), window: z.string(), spend_cap: z.number().int().positive(), expected_orders: z.number().int().min(0) }),
      run: async ({ platform, offer, window, spend_cap, expected_orders }) => {
        mark("growth");
        if (!live.includes(platform)) return `Error: the owner isn't live on ${platformName(platform)}.`;
        try {
          const row = await createApproval(outlet.id, { agent: "growth", kind: "promo", title: offer, summary: `${platformName(platform)}, ${window}`, payload: { platform, offer, window, spendCap: spend_cap, expectedOrders: expected_orders } });
          cards.push({ type: "approval", approval: approvalDTO(row) });
          return `Promo drafted (${row.id}).`;
        } catch (err) {
          return `Error: ${(err as Error).message}`;
        }
      },
    }),
  ];

  const messages: Anthropic.Beta.BetaMessageParam[] = history
    .map((h): Anthropic.Beta.BetaMessageParam => ({ role: h.role, content: String(h.role === "user" ? h.content.text : (h.content as { text?: string }).text ?? "") || "…" }))
    .concat([{ role: "user", content: message }]);
  // The API needs alternating turns starting with the owner.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const final = await claude().beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 8,
    system: systemPrompt(outlet, lang),
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    tools,
    messages,
  });

  const text =
    final.stop_reason === "refusal"
      ? lang === "hi"
        ? "माफ़ कीजिए, मैं इसमें मदद नहीं कर सकता।"
        : "Sorry, I can't help with that one."
      : final.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();

  const agent = ([...used.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "orchestrator") as Agent;
  return { agent, text, cards, suggestions: SUGGESTIONS[agent][lang], engine: "claude" };
}

// ---------------------------------------------------------------------------
// Keyword rules, used when the server has no Claude credentials

const has = (msg: string, words: string[]) => words.some((w) => msg.includes(w));

async function withRules(outlet: Outlet, message: string, lang: Lang): Promise<CopilotReply> {
  const msg = message.toLowerCase();
  const live = outlet.livePlatforms.length ? outlet.livePlatforms : (["zomato", "swiggy"] as Platform[]);
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const done = (agent: Agent, text: string, cards: CopilotCard[] = []): CopilotReply => ({ agent, text, cards, suggestions: SUGGESTIONS[agent][lang], engine: "rules" });

  if (has(msg, ["payout", "settlement", "statement", "paisa", "paise", "पेआउट", "पैसे", "deduction"])) {
    const platform: Platform = msg.includes("zomato") ? "zomato" : msg.includes("swiggy") ? "swiggy" : live[0];
    const rows = (await getPayouts(outlet.id)).filter((p) => p.platform === platform);
    if (!rows.length) return done("finance", t(`No ${platformName(platform)} payouts yet. Connect your email and they'll appear as statements arrive.`, `अभी ${platformName(platform)} का कोई पेआउट नहीं है। ईमेल जोड़ें, स्टेटमेंट आते ही दिखेंगे।`));
    const [cur, prev] = rows;
    const diff = prev ? cur.net - prev.net : 0;
    const why = prev ? (cur.gross < prev.gross ? t(`sales fell by ${inr(prev.gross - cur.gross)}`, `बिक्री ${inr(prev.gross - cur.gross)} घटी`) : t("sales were up", "बिक्री बढ़ी")) : "";
    const ded = prev && cur.deductions > prev.deductions ? t(`, and deductions rose to ${inr(cur.deductions)}`, `, और कटौती बढ़कर ${inr(cur.deductions)} हो गई`) : "";
    return done(
      "finance",
      prev
        ? t(`Your ${platformName(platform)} payout for ${cur.periodLabel} is ${inr(cur.net)}, ${diff < 0 ? `${inr(-diff)} lower` : `${inr(diff)} higher`} than the week before: ${why}${ded}.`, `${cur.periodLabel} का आपका ${platformName(platform)} पेआउट ${inr(cur.net)} है, पिछले हफ़्ते से ${diff < 0 ? `${inr(-diff)} कम` : `${inr(diff)} ज़्यादा`}: ${why}${ded}।`)
        : t(`Your latest ${platformName(platform)} payout is ${inr(cur.net)}.`, `आपका ताज़ा ${platformName(platform)} पेआउट ${inr(cur.net)} है।`),
      [{ type: "payout", payout: cur, previous: prev ?? null }],
    );
  }

  if (has(msg, ["review", "reply", "rating", "complaint", "रिव्यू", "जवाब", "शिकायत"])) {
    const open = (await getReviews(outlet.id)).filter((r) => live.includes(r.platform) && !r.reply && r.draft);
    const pending = await db.select().from(approvals).where(and(eq(approvals.outletId, outlet.id), eq(approvals.kind, "review_reply"), eq(approvals.status, "pending")));
    const cards: CopilotCard[] = [];
    for (const r of open) {
      const existing = pending.find((a) => (a.payload as { reviewId?: string }).reviewId === r.id);
      const row = existing ?? (await createApproval(outlet.id, { agent: "reviews", kind: "review_reply", title: `Reply to ${r.author}`, summary: r.draft![lang], payload: { reviewId: r.id, text: r.draft![lang] } }));
      cards.push({ type: "approval", approval: approvalDTO(row) });
    }
    if (!cards.length) return done("reviews", t("Every review has a reply. Nice.", "हर रिव्यू का जवाब दिया जा चुका है।"));
    return done("reviews", t(`${cards.length} reviews need a reply. I've drafted them in your usual tone; approve or edit each one.`, `${cards.length} रिव्यू का जवाब बाक़ी है। मैंने आपके अंदाज़ में ड्राफ़्ट बना दिए हैं।`), cards);
  }

  if (has(msg, ["stock", "turn off", "finished", "khatam", "ख़त्म", "बंद", "band", "unavailable"])) {
    const menu = await getMenu(outlet.id);
    const words = msg.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 3);
    const hit = menu.filter((m) => words.some((w) => m.name.toLowerCase().includes(w)) || (msg.includes("पनीर") && m.name.toLowerCase().includes("paneer")));
    if (!hit.length) return done("menu", t("Which dish? I couldn't match that to your menu.", "कौन सी डिश? मुझे मेन्यू में नहीं मिली।"));
    const row = await createApproval(outlet.id, {
      agent: "menu",
      kind: "menu_change",
      title: `${hit.map((m) => m.name).join(", ")}: out of stock`,
      summary: message,
      payload: { changes: hit.map((m) => ({ itemId: m.id, available: Object.fromEntries(live.map((p) => [p, false])) })) },
    });
    return done("menu", t(`I'll mark ${hit.map((m) => m.name).join(" and ")} out of stock on ${live.map(platformName).join(" and ")} once you approve.`, `मंज़ूरी मिलते ही ${live.map(platformName).join(" और ")} पर ${hit.map((m) => m.name).join(" और ")} आउट ऑफ़ स्टॉक कर दूँगा।`), [{ type: "approval", approval: approvalDTO(row) }]);
  }

  if (has(msg, ["promo", "offer", "discount", "ads", "weekend", "प्रोमो", "ऑफ़र"])) {
    const cards: CopilotCard[] = [];
    for (const p of live) {
      const row = await createApproval(outlet.id, { agent: "growth", kind: "promo", title: t("20% off up to ₹80, new customers", "20% छूट ₹80 तक, नए ग्राहक"), summary: `${platformName(p)}, Sat and Sun 7 to 11 pm`, payload: { platform: p, offer: "20% off up to ₹80, new customers", window: "Sat and Sun, 7 to 11 pm", spendCap: p === "zomato" ? 2400 : 2100, expectedOrders: p === "zomato" ? 34 : 28 } });
      cards.push({ type: "approval", approval: approvalDTO(row) });
    }
    return done("growth", t("Weekend dinners are your busiest slot. A small, time-boxed offer for new customers should pay for itself; each has a hard spend cap.", "वीकेंड डिनर आपका सबसे व्यस्त समय है। नए ग्राहकों के लिए छोटा ऑफ़र अपना ख़र्च निकाल लेगा; हर एक पर पक्की ख़र्च सीमा है।"), cards);
  }

  if (has(msg, ["order", "sales", "yesterday", "today", "kal", "aaj", "कल", "आज", "बिक्री", "ऑर्डर"])) {
    const today = msg.includes("today") || msg.includes("aaj") || msg.includes("आज");
    const { sales, cancelled } = await salesForDay(outlet.id, today ? 0 : -1);
    const channels: Channel[] = [...live, "dine"];
    const total = channels.reduce((s, c) => s + sales[c].amount, 0);
    const count = channels.reduce((s, c) => s + sales[c].orders, 0);
    return done(
      "orders",
      t(`${today ? "So far today" : "Yesterday"} you sold ${inr(total)} across ${count} orders${cancelled ? `, with ${cancelled} cancelled` : ""}.`, `${today ? "आज अब तक" : "कल"} आपने ${count} ऑर्डर में ${inr(total)} की बिक्री की${cancelled ? `, ${cancelled} कैंसल हुए` : ""}।`),
      [{ type: "sales", sales, channels }],
    );
  }

  return done("orchestrator", t("I can look into payouts, reply to reviews, change your menu on every platform, check orders or plan promos. What would help right now?", "मैं पेआउट देख सकता हूँ, रिव्यू का जवाब दे सकता हूँ, हर प्लेटफ़ॉर्म पर मेन्यू बदल सकता हूँ, ऑर्डर देख सकता हूँ या प्रोमो प्लान कर सकता हूँ। अभी किसमें मदद करूँ?"));
}
