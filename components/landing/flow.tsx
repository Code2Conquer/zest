"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Globe, IndianRupee, Mail, Megaphone, MessageCircle, Mic, Phone, Search, Star, Store, Truck, Users, type LucideIcon } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The agents at work: something comes in on a channel, Zest understands it, and five agents pass the
// job around the loop, each doing its part, until "What changed" shows the result. Two casts: the
// "seller" one (Meena's Kitchen, homepage) and the "restaurant" one (Rasoi 27 on Zomato and Swiggy).
// Scenarios play in turn while the panel is on screen; picking one stops the rotation.

type AgentId = "storefront" | "orders" | "regulars" | "reviews" | "growth" | "payouts";
export const AGENT_INFO: Record<AgentId, { name: Bi; icon: LucideIcon }> = {
  storefront: { name: { en: "Storefront", hi: "स्टोरफ़्रंट" }, icon: Store },
  orders: { name: { en: "Orders and delivery", hi: "ऑर्डर और डिलीवरी" }, icon: Truck },
  regulars: { name: { en: "Regulars", hi: "पुराने ग्राहक" }, icon: Users },
  reviews: { name: { en: "Reviews", hi: "रिव्यू" }, icon: Star },
  growth: { name: { en: "Growth", hi: "ग्रोथ" }, icon: Megaphone },
  payouts: { name: { en: "Payouts", hi: "पेआउट" }, icon: IndianRupee },
};

type InputId = "web" | "whatsapp" | "google" | "instagram" | "phone" | "soundbox" | "zomato" | "swiggy" | "email";
const SELLER_INPUTS: { id: InputId; icon: LucideIcon; name: Bi }[] = [
  { id: "web", icon: Globe, name: { en: "Your page", hi: "आपका पेज" } },
  { id: "whatsapp", icon: MessageCircle, name: { en: "WhatsApp", hi: "WhatsApp" } },
  { id: "google", icon: Search, name: { en: "Google", hi: "Google" } },
  { id: "instagram", icon: Camera, name: { en: "Instagram", hi: "Instagram" } },
  { id: "phone", icon: Phone, name: { en: "Phone calls", hi: "फ़ोन कॉल" } },
  { id: "soundbox", icon: Mic, name: { en: "Zest Soundbox", hi: "Zest Soundbox" } },
];
const RESTAURANT_INPUTS: { id: InputId; icon: LucideIcon; name: Bi }[] = [
  { id: "zomato", icon: Store, name: { en: "Zomato", hi: "Zomato" } },
  { id: "swiggy", icon: Store, name: { en: "Swiggy", hi: "Swiggy" } },
  { id: "web", icon: Globe, name: { en: "Your page", hi: "आपका पेज" } },
  { id: "email", icon: Mail, name: { en: "Email from the apps", hi: "ऐप के ईमेल" } },
  { id: "google", icon: Search, name: { en: "Google", hi: "Google" } },
  { id: "soundbox", icon: Mic, name: { en: "Zest Soundbox", hi: "Zest Soundbox" } },
];

type Scenario = { id: string; tab: Bi; input: InputId; heard: Bi; steps: { agent: AgentId; text: Bi; ask?: boolean }[]; outcomes: { label: Bi; value: Bi }[]; from?: Bi; raw?: Bi; reply?: Bi };
const SELLER_SCENARIOS: Scenario[] = [
  {
    id: "order",
    tab: { en: "A new order", hi: "नया ऑर्डर" },
    input: "whatsapp",
    heard: { en: "2 aloo paratha, 1 rajma chawal, from Flat 302", hi: "फ़्लैट 302 से 2 आलू पराठा, 1 राजमा चावल" },
    from: { en: "WhatsApp · Flat 302", hi: "WhatsApp · फ़्लैट 302" },
    raw: { en: "Hi aunty, 2 aloo paratha and 1 rajma chawal please. Flat 302. Paid on UPI.", hi: "नमस्ते आंटी, 2 आलू पराठा और 1 राजमा चावल भेज दीजिए। फ़्लैट 302। UPI से पैसे भेज दिए।" },
    steps: [
      { agent: "storefront", text: { en: "Order taken on WhatsApp, ₹270 paid by UPI", hi: "WhatsApp पर ऑर्डर लिया, UPI से ₹270 मिले" } },
      { agent: "orders", text: { en: "Soundbox spoke it, KOT printed, rider booked for 1:05", hi: "Soundbox ने बोला, KOT छपा, 1:05 के लिए राइडर बुक" } },
      { agent: "regulars", text: { en: "Noted: Flat 302 likes it less spicy", hi: "याद रखा: फ़्लैट 302 को कम मिर्च पसंद है" } },
      { agent: "reviews", text: { en: "Delivered. Asked how it was", hi: "पहुँच गया। पूछा कि कैसा लगा" } },
    ],
    outcomes: [
      { label: { en: "Accepted in", hi: "मंज़ूर हुआ" }, value: { en: "6 sec", hi: "6 सेकंड में" } },
      { label: { en: "Rider at the door", hi: "राइडर दरवाज़े पर" }, value: { en: "1:05 pm", hi: "1:05 बजे" } },
      { label: { en: "Orders missed", hi: "छूटे ऑर्डर" }, value: { en: "0", hi: "0" } },
    ],
  },
  {
    id: "rush",
    tab: { en: "A lunch rush", hi: "लंच की भीड़" },
    input: "web",
    heard: { en: "Six lunch orders from Green Park in 20 minutes", hi: "20 मिनट में ग्रीन पार्क से छह लंच ऑर्डर" },
    from: { en: "Your page · 12:20 to 12:40", hi: "आपका पेज · 12:20 से 12:40" },
    raw: { en: "6 new orders from Green Park: 3 thali, 2 rajma chawal, 1 aloo paratha", hi: "ग्रीन पार्क से 6 नए ऑर्डर: 3 थाली, 2 राजमा चावल, 1 आलू पराठा" },
    steps: [
      { agent: "orders", text: { en: "Grouped into one delivery, one rider at 12:45", hi: "सब एक डिलीवरी में, 12:45 पर एक राइडर" } },
      { agent: "storefront", text: { en: "Thali paused at 30 plates, so no promise is broken", hi: "30 थाली के बाद थाली रोकी, ताकि कोई वादा न टूटे" } },
      { agent: "reviews", text: { en: "All six asked how lunch was", hi: "छहों से पूछा कि लंच कैसा था" } },
    ],
    outcomes: [
      { label: { en: "Lunch orders", hi: "लंच ऑर्डर" }, value: { en: "6", hi: "6" } },
      { label: { en: "Riders needed", hi: "राइडर लगे" }, value: { en: "1", hi: "1" } },
      { label: { en: "Late deliveries", hi: "देर से पहुँचे" }, value: { en: "0", hi: "0" } },
    ],
  },
  {
    id: "quiet",
    tab: { en: "A quiet Tuesday", hi: "सुस्त मंगलवार" },
    input: "google",
    heard: { en: "Lunch orders are slower than a usual Tuesday", hi: "आज लंच ऑर्डर आम मंगलवार से कम हैं" },
    from: { en: "Zest · 12:30 pm", hi: "Zest · 12:30 बजे" },
    raw: { en: "Only 3 lunch orders so far. A usual Tuesday has 11 by now.", hi: "अब तक सिर्फ़ 3 लंच ऑर्डर। आम मंगलवार को इस वक़्त तक 11 होते हैं।" },
    reply: { en: "Post it", hi: "पोस्ट कर दो" },
    steps: [
      { agent: "growth", text: { en: "Drafted an Instagram post: today's thali", hi: "Instagram पोस्ट तैयार: आज की थाली" }, ask: true },
      { agent: "regulars", text: { en: "Today's menu sent to 12 regulars who order on Tuesdays", hi: "मंगलवार वाले 12 पुराने ग्राहकों को आज का मेन्यू भेजा" } },
      { agent: "storefront", text: { en: "Thali moved to the top of your page", hi: "थाली आपके पेज पर सबसे ऊपर" } },
    ],
    outcomes: [
      { label: { en: "Extra orders", hi: "ज़्यादा ऑर्डर" }, value: { en: "+9", hi: "+9" } },
      { label: { en: "Spent", hi: "ख़र्च" }, value: { en: "₹0", hi: "₹0" } },
      { label: { en: "Your part", hi: "आपका काम" }, value: { en: "1 tap", hi: "1 टैप" } },
    ],
  },
  {
    id: "complaint",
    tab: { en: "A complaint", hi: "एक शिकायत" },
    input: "whatsapp",
    heard: { en: "“The roti was hard,” on WhatsApp", hi: "WhatsApp पर: “रोटी सख़्त थी”" },
    from: { en: "WhatsApp · Priya", hi: "WhatsApp · प्रिया" },
    raw: { en: "Aunty, the roti was really hard today.", hi: "आंटी, आज रोटी बहुत सख़्त थी।" },
    reply: { en: "Send it, and give her the free roti", hi: "भेज दो, और रोटी मुफ़्त दे दो" },
    steps: [
      { agent: "reviews", text: { en: "Apology drafted in your voice", hi: "आपकी भाषा में माफ़ी का जवाब तैयार" }, ask: true },
      { agent: "regulars", text: { en: "A free roti added to Priya's next order", hi: "प्रिया के अगले ऑर्डर में एक रोटी मुफ़्त" } },
      { agent: "orders", text: { en: "Note on tomorrow's KOTs: pack rotis in foil", hi: "कल के KOT पर नोट: रोटी फ़ॉइल में पैक करें" } },
    ],
    outcomes: [
      { label: { en: "Reply ready", hi: "जवाब तैयार" }, value: { en: "1 min", hi: "1 मिनट" } },
      { label: { en: "Same problem before", hi: "पहले भी यही" }, value: { en: "2 times", hi: "2 बार" } },
      { label: { en: "Waiting for you", hi: "आपका इंतज़ार" }, value: { en: "1 yes", hi: "1 हाँ" } },
    ],
  },
  {
    id: "festival",
    tab: { en: "A festival is coming", hi: "त्योहार आ रहा है" },
    input: "instagram",
    heard: { en: "Diwali is in 8 days", hi: "दिवाली में 8 दिन बचे हैं" },
    from: { en: "Calendar", hi: "कैलेंडर" },
    raw: { en: "Diwali is in 8 days.", hi: "दिवाली में 8 दिन बचे हैं।" },
    reply: { en: "Yes, ₹500 is fine", hi: "हाँ, ₹500 ठीक है" },
    steps: [
      { agent: "growth", text: { en: "Suggested a ₹450 sweets box and a ₹500 ad within 3 km", hi: "₹450 का मिठाई डिब्बा और 3 किमी में ₹500 का विज्ञापन सुझाया" }, ask: true },
      { agent: "storefront", text: { en: "Sweets box on your page, pre-orders open", hi: "मिठाई का डिब्बा पेज पर, प्री-ऑर्डर खुले" } },
      { agent: "regulars", text: { en: "38 regulars told, a day before", hi: "38 पुराने ग्राहकों को एक दिन पहले बताया" } },
    ],
    outcomes: [
      { label: { en: "Pre-orders", hi: "प्री-ऑर्डर" }, value: { en: "41", hi: "41" } },
      { label: { en: "Ad spend", hi: "विज्ञापन ख़र्च" }, value: { en: "₹500", hi: "₹500" } },
      { label: { en: "Your part", hi: "आपका काम" }, value: { en: "2 taps", hi: "2 टैप" } },
    ],
  },
];

const RESTAURANT_SCENARIOS: Scenario[] = [
  {
    id: "rush",
    tab: { en: "A Swiggy rush", hi: "स्विगी पर भीड़" },
    input: "swiggy",
    heard: { en: "14 Swiggy orders in 30 minutes", hi: "30 मिनट में स्विगी के 14 ऑर्डर" },
    from: { en: "Swiggy · 1:00 to 1:30 pm", hi: "स्विगी · 1:00 से 1:30 बजे" },
    raw: { en: "14 new orders in 30 minutes", hi: "30 मिनट में 14 नए ऑर्डर" },
    steps: [
      { agent: "orders", text: { en: "Soundbox read each one; KOTs printed in order", hi: "Soundbox ने हर ऑर्डर बोला; KOT क्रम से छपे" } },
      { agent: "growth", text: { en: "Paused the Swiggy lunch offer until the rush clears", hi: "भीड़ कम होने तक स्विगी लंच ऑफ़र रोका" } },
      { agent: "reviews", text: { en: "Two ran late: apologies ready before the reviews come", hi: "दो ऑर्डर देर से गए: रिव्यू आने से पहले माफ़ी तैयार" } },
    ],
    outcomes: [
      { label: { en: "Orders missed", hi: "छूटे ऑर्डर" }, value: { en: "0", hi: "0" } },
      { label: { en: "Ran late", hi: "देर से गए" }, value: { en: "2", hi: "2" } },
      { label: { en: "Your part", hi: "आपका काम" }, value: { en: "1 tap", hi: "1 टैप" } },
    ],
  },
  {
    id: "payout",
    tab: { en: "A low payout", hi: "कम पेआउट" },
    input: "email",
    heard: { en: "Swiggy paid ₹4,502 less than last week", hi: "स्विगी ने पिछले हफ़्ते से ₹4,502 कम दिए" },
    from: { en: "Email · Swiggy payouts", hi: "ईमेल · स्विगी पेआउट" },
    raw: { en: "Your weekly payout: ₹38,214. Statement attached.", hi: "आपका साप्ताहिक पेआउट: ₹38,214। स्टेटमेंट साथ में।" },
    reply: { en: "File the dispute", hi: "डिस्प्यूट भेज दो" },
    steps: [
      { agent: "payouts", text: { en: "Statement read: commission, ads, and ₹412 taken for a cancelled order", hi: "स्टेटमेंट पढ़ा: कमीशन, विज्ञापन, और कैंसल ऑर्डर पर ₹412 कटे" } },
      { agent: "growth", text: { en: "Ads cost ₹4,500 and brought 31 orders", hi: "विज्ञापन पर ₹4,500 लगे, 31 ऑर्डर आए" } },
      { agent: "payouts", text: { en: "Dispute drafted for the ₹412", hi: "₹412 के लिए डिस्प्यूट तैयार" }, ask: true },
    ],
    outcomes: [
      { label: { en: "Every line", hi: "हर लाइन" }, value: { en: "Explained", hi: "समझाई" } },
      { label: { en: "Taken by mistake", hi: "ग़लती से कटे" }, value: { en: "₹412", hi: "₹412" } },
      { label: { en: "Waiting for you", hi: "आपका इंतज़ार" }, value: { en: "1 yes", hi: "1 हाँ" } },
    ],
  },
  {
    id: "review",
    tab: { en: "A bad review", hi: "ख़राब रिव्यू" },
    input: "zomato",
    heard: { en: "2 stars on Zomato: “the dal was cold”", hi: "ज़ोमैटो पर 2 स्टार: “दाल ठंडी थी”" },
    from: { en: "Zomato review · Karthik, 2 stars", hi: "ज़ोमैटो रिव्यू · कार्तिक, 2 स्टार" },
    raw: { en: "The dal was cold when it reached.", hi: "दाल पहुँची तो ठंडी थी।" },
    reply: { en: "Post the reply", hi: "जवाब पोस्ट कर दो" },
    steps: [
      { agent: "reviews", text: { en: "Reply drafted in your voice", hi: "आपकी भाषा में जवाब तैयार" }, ask: true },
      { agent: "orders", text: { en: "Third cold-dal review: KOTs now say “pack dal sealed”", hi: "ठंडी दाल का तीसरा रिव्यू: अब KOT पर “दाल सील करके पैक करें”" } },
      { agent: "regulars", text: { en: "A ₹75 credit for Karthik on your own page", hi: "आपके अपने पेज पर कार्तिक के लिए ₹75 का क्रेडिट" } },
    ],
    outcomes: [
      { label: { en: "Reply ready", hi: "जवाब तैयार" }, value: { en: "1 min", hi: "1 मिनट" } },
      { label: { en: "Same problem", hi: "यही परेशानी" }, value: { en: "3 times", hi: "3 बार" } },
      { label: { en: "Waiting for you", hi: "आपका इंतज़ार" }, value: { en: "1 yes", hi: "1 हाँ" } },
    ],
  },
  {
    id: "slow",
    tab: { en: "A slow weekday", hi: "सुस्त दिन" },
    input: "google",
    heard: { en: "Weekday lunch orders are below usual", hi: "आज लंच ऑर्डर आम दिनों से कम हैं" },
    from: { en: "Zest · 12:45 pm", hi: "Zest · 12:45 बजे" },
    raw: { en: "Weekday lunch orders are 30% below usual.", hi: "आज लंच ऑर्डर आम दिनों से 30% कम हैं।" },
    reply: { en: "Run it, keep the cap", hi: "चलाओ, सीमा वही रखो" },
    steps: [
      { agent: "growth", text: { en: "Weekday lunch offer on Swiggy, capped at ₹3,000", hi: "स्विगी पर वीकडे लंच ऑफ़र, ₹3,000 तक सीमित" }, ask: true },
      { agent: "regulars", text: { en: "Lunch menu sent to 40 regulars from your page", hi: "आपके पेज के 40 पुराने ग्राहकों को लंच मेन्यू भेजा" } },
      { agent: "orders", text: { en: "Kitchen told to prep 20 extra thalis", hi: "किचन को 20 थाली ज़्यादा तैयार रखने को कहा" } },
    ],
    outcomes: [
      { label: { en: "Extra orders", hi: "ज़्यादा ऑर्डर" }, value: { en: "+18", hi: "+18" } },
      { label: { en: "Spent of your cap", hi: "सीमा में से ख़र्च" }, value: { en: "₹1,840", hi: "₹1,840" } },
      { label: { en: "Your part", hi: "आपका काम" }, value: { en: "1 tap", hi: "1 टैप" } },
    ],
  },
];

const CAST = {
  seller: { agents: ["storefront", "orders", "regulars", "reviews", "growth"] as AgentId[], inputs: SELLER_INPUTS, scenarios: SELLER_SCENARIOS, group: { en: "Meena's Kitchen · Zest team", hi: "मीना की रसोई · Zest टीम" } },
  restaurant: { agents: ["orders", "payouts", "reviews", "regulars", "growth"] as AgentId[], inputs: RESTAURANT_INPUTS, scenarios: RESTAURANT_SCENARIOS, group: { en: "Rasoi 27 · Zest team", hi: "रसोई 27 · Zest टीम" } },
};

// Each agent's name colour in the chat, like names in a WhatsApp group.
const TINT: Record<AgentId, string> = { storefront: "#1d6fd8", orders: "#b54708", regulars: "#7a3fd0", reviews: "#b4235f", growth: "#0f7466", payouts: "#4a7311" };
const STEP_MS = 2000;
const TYPING_MS = 700;

export function AgentFlow({ cast = "seller" }: { cast?: keyof typeof CAST }) {
  const { pick } = useApp();
  const { agents: ORDER, inputs: INPUTS, scenarios: SCENARIOS, group } = CAST[cast];
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const sc = SCENARIOS[s % SCENARIOS.length];
  // Messages after the incoming one: each agent's post, then your answer if one was asked for.
  const total = sc.steps.length + (sc.reply ? 1 : 0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still) {
      setStep(total + 1);
      setTyping(false);
      return;
    }
    if (!visible) return;
    // step 0: only the incoming message. 1..total: one more message each, after a moment of "typing".
    if (step >= 1 && step <= total && typing) {
      const t = setTimeout(() => setTyping(false), TYPING_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        if (step < total) {
          setTyping(step + 1 <= sc.steps.length);
          setStep(step + 1);
        } else if (step === total) setStep(total + 1);
        else if (auto) {
          setS((v) => (v + 1) % SCENARIOS.length);
          setStep(0);
        }
      },
      step === 0 ? 1200 : step > total ? 3600 : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [step, typing, total, auto, visible, still, sc.steps.length, SCENARIOS.length]);

  function choose(k: number) {
    setAuto(false);
    setS(k);
    setTyping(false);
    setStep(still ? total + 1 : 0);
  }

  const shown = typing ? step - 1 : Math.min(step, total);
  const posts = sc.steps.slice(0, Math.min(shown, sc.steps.length));
  const answered = !!sc.reply && shown > sc.steps.length;
  const finished = step > total;
  const inp = INPUTS.find((x) => x.id === sc.input)!;
  const typer = typing ? sc.steps[step - 1]?.agent : null;
  const time = (k: number) => `${12 + Math.floor((14 + k) / 60)}:${String((14 + k) % 60).padStart(2, "0")}`;

  return (
    <div ref={box} data-ui className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-[28px] bg-[var(--lp-sunken)] p-4 sm:p-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* What happened: pick one, or let them play in turn */}
      <div>
        <p className="text-[14px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Pick what happens", hi: "चुनिए क्या होता है" })}</p>
        <div role="tablist" aria-label={pick({ en: "Scenarios", hi: "हालात" })} className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 lg:flex-col">
          {SCENARIOS.map((x, k) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={k === s}
              onClick={() => choose(k)}
              className={`lp-tab min-h-11 shrink-0 rounded-2xl border px-4 py-2 text-left text-[15px] font-semibold transition-colors ${k === s ? "border-[var(--lp-ink)] bg-[var(--lp-surface)]" : "border-[var(--lp-line)] text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}`}
            >
              {pick(x.tab)}
            </button>
          ))}
        </div>
      </div>

      {/* The team chat */}
      <div className="mx-auto w-full max-w-[24rem] overflow-hidden rounded-[30px] border-[6px] border-[#1c1f23] bg-[#1c1f23]">
        <div className="flex items-center gap-3 bg-[#0b6e5f] px-4 py-3 text-white">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e9a31a] text-[15px] font-bold text-[#1c1f23]">Z</span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{pick(group)}</p>
            <p className="truncate text-[12.5px] text-[#d2ece6]">{typer ? pick({ en: `${AGENT_INFO[typer].name.en} is typing…`, hi: `${AGENT_INFO[typer].name.hi} लिख रहा है…` }) : [...ORDER.map((a) => pick(AGENT_INFO[a].name)), pick({ en: "You", hi: "आप" })].join(", ")}</p>
          </div>
        </div>
        <ol aria-live="polite" className="flex h-[29rem] flex-col justify-end gap-2 overflow-hidden bg-[#efe7dc] px-3 py-3 text-[#1c1f23]">
          {/* what came in */}
          <li key={`${s}-in`} className="lp-arrive mx-auto w-[92%] rounded-xl border border-[#e2d6c3] bg-[#fff8e6] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8a6100]">
              <inp.icon aria-hidden size={13} /> {pick(sc.from ?? inp.name)}
            </p>
            <p className="mt-0.5 text-[14.5px] leading-snug">{pick(sc.raw ?? sc.heard)}</p>
          </li>
          {posts.map((x, k) => {
            const info = AGENT_INFO[x.agent];
            return (
              <li key={`${s}-${k}`} className="lp-arrive max-w-[86%] self-start rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-[0_1px_0_rgb(0_0_0/0.08)]">
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: TINT[x.agent] }}>
                  <info.icon aria-hidden size={13} /> {pick(info.name)}
                </p>
                <p className="mt-0.5 text-[14.5px] leading-snug">{pick(x.text)}</p>
                {x.ask && (
                  <p className="mt-2 flex gap-2 text-[13px] font-semibold">
                    <span className={`rounded-full px-3 py-1 ${answered ? "bg-[#d9fdd3] text-[#0b6e5f]" : "bg-[#0b6e5f] text-white"}`}>{answered ? pick({ en: "Approved", hi: "मंज़ूर" }) : pick({ en: "Approve", hi: "मंज़ूर करें" })}</span>
                    {!answered && <span className="rounded-full border border-[#c9c2b4] px-3 py-1 text-[#4a4f55]">{pick({ en: "Change", hi: "बदलें" })}</span>}
                  </p>
                )}
                <p className="mt-0.5 text-right text-[11px] text-[#7c8288]">{time(k)}</p>
              </li>
            );
          })}
          {typer && (
            <li key={`${s}-typing-${step}`} aria-hidden className="self-start rounded-xl rounded-tl-sm bg-white px-3 py-2.5">
              <span className="lp-typing flex gap-1">
                <i className="size-1.5 rounded-full bg-[#9aa0a6]" />
                <i className="size-1.5 rounded-full bg-[#9aa0a6]" />
                <i className="size-1.5 rounded-full bg-[#9aa0a6]" />
              </span>
            </li>
          )}
          {answered && (
            <li key={`${s}-reply`} className="lp-arrive max-w-[80%] self-end rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2">
              <p className="text-[14.5px] leading-snug">{pick(sc.reply!)}</p>
              <p className="mt-0.5 text-right text-[11px] text-[#5d7a62]">{time(sc.steps.length)} ✓✓</p>
            </li>
          )}
        </ol>
      </div>

      {/* What changed */}
      <div>
        <p className="text-[14px] font-semibold text-[var(--lp-muted)]">{pick({ en: "What changed", hi: "क्या बदला" })}</p>
        <ul className="mt-3 grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-5">
          {sc.outcomes.map((o) => (
            <li key={`${s}-${o.label.en}`}>
              <p className={`lp-display text-[clamp(26px,3vw,40px)] leading-none ${finished ? "lp-arrive" : "text-[var(--lp-muted)]"}`}>{finished ? pick(o.value) : "–"}</p>
              <p className="mt-1 text-[14px] leading-snug text-[var(--lp-muted)]">{pick(o.label)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[22rem] text-[15px] leading-snug">
          {sc.reply
            ? pick({ en: "The agents did the work. The one decision came to you, as a WhatsApp message.", hi: "काम एजेंट ने किया। फ़ैसला एक WhatsApp मैसेज बनकर आपके पास आया।" })
            : pick({ en: "Nothing needed you. The agents handled it and told you what they did.", hi: "आपकी ज़रूरत नहीं पड़ी। एजेंट ने संभाला और बताया क्या किया।" })}
        </p>
      </div>
    </div>
  );
}
