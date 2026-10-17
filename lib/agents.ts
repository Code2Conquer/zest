// Orchestrator + specialist agents.
//
// This prototype routes by keyword and answers from sample data so the UI can be
// built and tested end to end. The contract (request in, AgentReply out, typed
// cards) is the one the real orchestrator will keep: swap `orchestrate` for a
// model call that picks a specialist and lets it call MCP tools.

import type { Bi, Lang } from "./i18n";
import type { Platform } from "./platforms";
import { PAYOUTS, REVIEWS, SALES_YESTERDAY, MENU, rupees } from "./data";

export type AgentId = "orchestrator" | "finance" | "reviews" | "menu" | "orders" | "growth" | "onboarding";

export const AGENT_NAME: Record<AgentId, Bi> = {
  orchestrator: { en: "Zest", hi: "Zest" },
  finance: { en: "Money agent", hi: "पैसे वाला एजेंट" },
  reviews: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
  menu: { en: "Menu agent", hi: "मेन्यू एजेंट" },
  orders: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
  growth: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
  onboarding: { en: "Onboarding agent", hi: "ऑनबोर्डिंग एजेंट" },
};

export type Card =
  | { type: "payout-compare"; platform: Platform; lastWeek: number; thisWeek: number; lines: { label: Bi; amount: number }[]; source: Bi }
  | { type: "dispute"; id: string; platform: Platform; amount: number; reason: Bi }
  | { type: "review-reply"; id: string; reviewId: string }
  | { type: "menu-change"; id: string; item: string; platforms: Platform[]; change: Bi }
  | { type: "sales"; platforms: Platform[] }
  | { type: "promo"; id: string; platform: Platform; offer: Bi; window: Bi; cost: number; expectedOrders: number };

export type AgentReply = {
  agent: AgentId;
  text: Bi;
  cards: Card[];
  suggestions: Bi[];
};

export type CopilotRequest = { message: string; lang: Lang; live: Platform[] };

const DEVANAGARI = /[ऀ-ॿ]/;
const HINGLISH = /\b(kyun|kyu|kitna|kitne|hafte|aaj|kal|paisa|paise|kya|hai|karo|kar do|band|batao)\b/i;

/** Reply in Hindi when the owner writes in Devanagari or Hinglish, whatever the UI language. */
export function replyLang(req: CopilotRequest): Lang {
  if (DEVANAGARI.test(req.message) || HINGLISH.test(req.message)) return "hi";
  return req.lang;
}

const has = (msg: string, words: string[]) => words.some((w) => msg.includes(w));

export const STARTER_SUGGESTIONS: Bi[] = [
  { en: "Why is my Swiggy payout lower this week?", hi: "इस हफ़्ते Swiggy पेआउट कम क्यों है?" },
  { en: "Reply to new reviews", hi: "नए रिव्यू का जवाब दो" },
  { en: "Paneer is finished, turn off paneer dishes", hi: "पनीर ख़त्म है, पनीर वाली डिश बंद करो" },
  { en: "How did we do yesterday?", hi: "कल का दिन कैसा रहा?" },
  { en: "Suggest a promo for the weekend", hi: "वीकेंड के लिए प्रोमो बताओ" },
];

export function orchestrate(req: CopilotRequest): AgentReply {
  const msg = req.message.toLowerCase();
  const live = req.live.length ? req.live : (["zomato", "swiggy"] as Platform[]);
  const id = () => Math.random().toString(36).slice(2, 8);

  // Finance: payouts, statements, deductions
  if (has(msg, ["payout", "settlement", "statement", "paisa", "paise", "पेआउट", "पैसे", "deduction", "money"])) {
    const platform: Platform = msg.includes("zomato") || msg.includes("ज़ोमैटो") ? "zomato" : live.includes("swiggy") ? "swiggy" : live[0];
    const [thisWeek, lastWeek] = PAYOUTS.filter((p) => p.platform === platform);
    const drop = lastWeek.net - thisWeek.net;
    const wrong = platform === "swiggy" ? 412 : 180;
    return {
      agent: "finance",
      text:
        drop > 0
          ? {
              en: `Your ${cap(platform)} payout for 7 to 13 Oct is ${rupees(drop)} lower than the week before. Sales fell by ${rupees(lastWeek.gross - thisWeek.gross)}, and deductions rose to ${rupees(thisWeek.deductions)}. ${rupees(wrong)} of that is a cancellation charge for order #3381, which the customer cancelled after we'd started cooking. I've drafted a dispute.`,
              hi: `7 से 13 अक्टूबर का आपका ${cap(platform)} पेआउट पिछले हफ़्ते से ${rupees(drop)} कम है। बिक्री ${rupees(lastWeek.gross - thisWeek.gross)} घटी, और कटौती बढ़कर ${rupees(thisWeek.deductions)} हो गई। इसमें ${rupees(wrong)} ऑर्डर #3381 का कैंसलेशन चार्ज है, जो ग्राहक ने खाना बनना शुरू होने के बाद कैंसल किया था। मैंने डिस्प्यूट का ड्राफ़्ट बना दिया है।`,
            }
          : {
              en: `Your ${cap(platform)} payout for 7 to 13 Oct is ${rupees(-drop)} higher than the week before, mainly from more orders. Here's the breakdown.`,
              hi: `7 से 13 अक्टूबर का आपका ${cap(platform)} पेआउट पिछले हफ़्ते से ${rupees(-drop)} ज़्यादा है, ज़्यादा ऑर्डर की वजह से। ये रहा ब्योरा।`,
            },
      cards: [
        {
          type: "payout-compare",
          platform,
          lastWeek: lastWeek.net,
          thisWeek: thisWeek.net,
          lines: [
            { label: { en: "Sales", hi: "बिक्री" }, amount: thisWeek.gross },
            { label: { en: "Commission", hi: "कमीशन" }, amount: -thisWeek.commission },
            { label: { en: "Ads", hi: "ऐड" }, amount: -thisWeek.ads },
            { label: { en: "Deductions", hi: "कटौती" }, amount: -thisWeek.deductions },
          ],
          source: thisWeek.source,
        },
        ...(drop > 0
          ? [
              {
                type: "dispute" as const,
                id: id(),
                platform,
                amount: wrong,
                reason: {
                  en: "Order #3381 was cancelled by the customer 6 minutes after acceptance, while it was being prepared. Requesting reversal of the cancellation charge.",
                  hi: "ऑर्डर #3381 ग्राहक ने स्वीकार होने के 6 मिनट बाद कैंसल किया, जब वह बन रहा था। कैंसलेशन चार्ज वापस करने का अनुरोध।",
                },
              },
            ]
          : []),
      ],
      suggestions: [
        { en: "Show all deductions this month", hi: "इस महीने की सारी कटौतियाँ दिखाओ" },
        { en: "When does the next payout land?", hi: "अगला पेआउट कब आएगा?" },
      ],
    };
  }

  // Reviews & complaints
  if (has(msg, ["review", "reply", "rating", "complaint", "रिव्यू", "जवाब", "शिकायत"])) {
    const pending = REVIEWS.filter((r) => live.includes(r.platform));
    return {
      agent: "reviews",
      text: {
        en: `${pending.length} reviews since yesterday. I've drafted replies in your usual tone. The 2-star one offers a ₹75 credit, edit it if you'd rather not.`,
        hi: `कल से ${pending.length} रिव्यू आए हैं। मैंने आपके अंदाज़ में जवाब तैयार किए हैं। 2-स्टार वाले में ₹75 की छूट दी है, न देनी हो तो बदल दीजिए।`,
      },
      cards: pending.map((r) => ({ type: "review-reply" as const, id: id(), reviewId: r.id })),
      suggestions: [
        { en: "Auto-reply to 4 and 5 star reviews from now on", hi: "अब से 4 और 5 स्टार रिव्यू का अपने-आप जवाब दो" },
      ],
    };
  }

  // Menu: availability, stock-outs, prices
  if (has(msg, ["menu", "stock", "turn off", "finished", "khatam", "ख़त्म", "बंद", "band", "price", "item"])) {
    const word = MENU.find((m) => msg.includes(m.name.split(" ")[0].toLowerCase()))?.name.split(" ")[0] ?? (msg.includes("पनीर") ? "Paneer" : "Paneer");
    const items = MENU.filter((m) => m.name.toLowerCase().includes(word.toLowerCase()));
    return {
      agent: "menu",
      text: {
        en: `${items.length} dish${items.length === 1 ? "" : "es"} use ${word.toLowerCase()}. I'll mark ${items.length === 1 ? "it" : "them"} out of stock on ${live.map(cap).join(" and ")} until you tell me to turn ${items.length === 1 ? "it" : "them"} back on.`,
        hi: `${items.length} डिश में ${word.toLowerCase()} है। मैं ${live.map(cap).join(" और ")} पर इन्हें आउट ऑफ़ स्टॉक कर दूँगा, जब तक आप वापस चालू करने को न कहें।`,
      },
      cards: items.map((m) => ({
        type: "menu-change" as const,
        id: id(),
        item: m.name,
        platforms: live,
        change: { en: "Mark out of stock", hi: "आउट ऑफ़ स्टॉक करें" },
      })),
      suggestions: [{ en: "Turn them back on at 6 pm", hi: "शाम 6 बजे वापस चालू कर देना" }],
    };
  }

  // Growth: promos and ads
  if (has(msg, ["promo", "offer", "discount", "ads", "ad ", "grow", "weekend", "प्रोमो", "ऑफ़र"])) {
    return {
      agent: "growth",
      text: {
        en: "Saturday and Sunday dinners are your busiest slots, but new customers are down 12% on both platforms. A small, time-boxed offer for new users should pay for itself.",
        hi: "शनिवार-रविवार का डिनर आपका सबसे व्यस्त समय है, पर दोनों प्लेटफ़ॉर्म पर नए ग्राहक 12% कम हुए हैं। नए ग्राहकों के लिए छोटा, सीमित समय का ऑफ़र अपना ख़र्च निकाल लेगा।",
      },
      cards: live.map((p) => ({
        type: "promo" as const,
        id: id(),
        platform: p,
        offer: { en: "20% off up to ₹80, new customers", hi: "20% छूट ₹80 तक, नए ग्राहक" },
        window: { en: "Sat and Sun, 7 to 11 pm", hi: "शनि और रवि, शाम 7 से 11" },
        cost: p === "zomato" ? 2400 : 2100,
        expectedOrders: p === "zomato" ? 34 : 28,
      })),
      suggestions: [{ en: "What did last month's promo return?", hi: "पिछले महीने के प्रोमो से क्या मिला?" }],
    };
  }

  // Orders / sales
  if (has(msg, ["order", "sales", "yesterday", "today", "kal", "aaj", "कल", "आज", "बिक्री", "ऑर्डर"])) {
    const total = live.reduce((s, p) => s + SALES_YESTERDAY[p].amount, 0) + SALES_YESTERDAY.dine.amount;
    return {
      agent: "orders",
      text: {
        en: `Yesterday you sold ${rupees(total)} across ${live.length + 1} channels, 9% more than the Thursday before. One Swiggy order was cancelled and average prep time was 13 minutes.`,
        hi: `कल आपने ${live.length + 1} चैनलों पर ${rupees(total)} की बिक्री की, पिछले गुरुवार से 9% ज़्यादा। Swiggy का एक ऑर्डर कैंसल हुआ और औसत प्रेप टाइम 13 मिनट रहा।`,
      },
      cards: [{ type: "sales", platforms: live }],
      suggestions: [{ en: "Which dishes are slowest to prepare?", hi: "कौन सी डिश सबसे धीरे बनती है?" }],
    };
  }

  return {
    agent: "orchestrator",
    text: {
      en: "I can look into payouts and statements, reply to reviews, change your menu on every platform, check orders, or plan promos. What would help right now?",
      hi: "मैं पेआउट और स्टेटमेंट देख सकता हूँ, रिव्यू का जवाब दे सकता हूँ, हर प्लेटफ़ॉर्म पर मेन्यू बदल सकता हूँ, ऑर्डर देख सकता हूँ, या प्रोमो प्लान कर सकता हूँ। अभी किसमें मदद करूँ?",
    },
    cards: [],
    suggestions: STARTER_SUGGESTIONS.slice(0, 4),
  };
}

function cap(p: Platform) {
  return p === "zomato" ? "Zomato" : "Swiggy";
}
