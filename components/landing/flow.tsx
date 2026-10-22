"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Globe, Megaphone, MessageCircle, Mic, Phone, Search, Star, Store, Truck, Users, type LucideIcon } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The agents at work: something comes in on a channel, Zest understands it, and the five agents pass
// the job around the loop, each doing its part, until "What changed" shows the result. Five scenarios
// from Meena's Kitchen play in turn while the panel is on screen; picking one stops the rotation.

type AgentId = "storefront" | "orders" | "regulars" | "reviews" | "growth";
export const AGENT_INFO: Record<AgentId, { name: Bi; icon: LucideIcon }> = {
  storefront: { name: { en: "Storefront", hi: "स्टोरफ़्रंट" }, icon: Store },
  orders: { name: { en: "Orders and delivery", hi: "ऑर्डर और डिलीवरी" }, icon: Truck },
  regulars: { name: { en: "Regulars", hi: "पुराने ग्राहक" }, icon: Users },
  reviews: { name: { en: "Reviews", hi: "रिव्यू" }, icon: Star },
  growth: { name: { en: "Growth", hi: "ग्रोथ" }, icon: Megaphone },
};

const ORDER: AgentId[] = ["storefront", "orders", "regulars", "reviews", "growth"];
const ANGLE: Record<AgentId, number> = { storefront: 180, orders: 252, regulars: 324, reviews: 36, growth: 108 };
const CX = 650, CY = 230, RX = 220, RY = 150;
const at = (a: AgentId) => {
  const t = (ANGLE[a] * Math.PI) / 180;
  return { x: Math.round(CX + RX * Math.cos(t)), y: Math.round(CY + RY * Math.sin(t)) };
};

type InputId = "web" | "whatsapp" | "google" | "instagram" | "phone" | "soundbox";
const INPUTS: { id: InputId; icon: LucideIcon; name: Bi }[] = [
  { id: "web", icon: Globe, name: { en: "Your page", hi: "आपका पेज" } },
  { id: "whatsapp", icon: MessageCircle, name: { en: "WhatsApp", hi: "WhatsApp" } },
  { id: "google", icon: Search, name: { en: "Google", hi: "Google" } },
  { id: "instagram", icon: Camera, name: { en: "Instagram", hi: "Instagram" } },
  { id: "phone", icon: Phone, name: { en: "Phone calls", hi: "फ़ोन कॉल" } },
  { id: "soundbox", icon: Mic, name: { en: "Zest Soundbox", hi: "Zest Soundbox" } },
];

type Scenario = { id: string; tab: Bi; input: InputId; heard: Bi; steps: { agent: AgentId; text: Bi }[]; outcomes: { label: Bi; value: Bi }[] };
const SCENARIOS: Scenario[] = [
  {
    id: "order",
    tab: { en: "A new order", hi: "नया ऑर्डर" },
    input: "whatsapp",
    heard: { en: "2 aloo paratha, 1 rajma chawal, from Flat 302", hi: "फ़्लैट 302 से 2 आलू पराठा, 1 राजमा चावल" },
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
    steps: [
      { agent: "growth", text: { en: "Drafted an Instagram post: today's thali", hi: "Instagram पोस्ट तैयार: आज की थाली" } },
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
    steps: [
      { agent: "reviews", text: { en: "Apology drafted in your voice", hi: "आपकी भाषा में माफ़ी का जवाब तैयार" } },
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
    steps: [
      { agent: "growth", text: { en: "Suggested a ₹450 sweets box and a ₹500 ad within 3 km", hi: "₹450 का मिठाई डिब्बा और 3 किमी में ₹500 का विज्ञापन सुझाया" } },
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

const STEP_MS = 1800;

export function AgentFlow() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const sc = SCENARIOS[s];
  const total = sc.steps.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still) {
      setStep(total + 1);
      return;
    }
    if (!visible) return;
    const t = setTimeout(
      () => {
        if (step <= total) setStep(step + 1);
        else if (auto) {
          setS((v) => (v + 1) % SCENARIOS.length);
          setStep(0);
        }
      },
      step === 0 ? 1100 : step > total ? 3200 : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [step, total, auto, visible, still]);

  const done = Math.min(step, total);
  const active = step >= 1 && step <= total ? sc.steps[step - 1].agent : null;
  const lit = new Set(sc.steps.slice(0, done).map((x) => x.agent));
  const finished = step > total;

  const arc = (() => {
    if (!active) return null;
    const from = step >= 2 ? at(sc.steps[step - 2].agent) : { x: CX - RX, y: CY };
    const to = at(active);
    if (Math.hypot(from.x - to.x, from.y - to.y) < 1) return null;
    return `M ${from.x} ${from.y} A ${RX} ${RY} 0 0 1 ${to.x} ${to.y}`;
  })();

  function choose(k: number) {
    setAuto(false);
    setS(k);
    setStep(still ? SCENARIOS[k].steps.length + 1 : 0);
  }

  return (
    <div ref={box} data-ui className="overflow-hidden rounded-[28px] bg-[#1c1f23] text-[#f1f1ec]">
      <div role="tablist" aria-label={pick({ en: "Scenarios", hi: "हालात" })} className="flex flex-wrap justify-center gap-2 px-5 pt-7">
        {SCENARIOS.map((x, k) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={k === s}
            onClick={() => choose(k)}
            className={`lp-tab min-h-11 rounded-full border px-4 text-[15px] transition-colors ${k === s ? "border-[var(--z-turmeric)] bg-[#2a2e33] text-white" : "border-[#3a3f45] text-[#b4b9be] hover:text-white"}`}
          >
            {pick(x.tab)}
          </button>
        ))}
      </div>

      {/* Wide screens: the loop */}
      <div className="relative mx-auto hidden aspect-[1100/460] w-full max-w-[1180px] lg:block">
        <svg aria-hidden viewBox="0 0 1100 460" className="absolute inset-0 size-full">
          <line x1="104" y1="230" x2="176" y2="230" stroke="#4a5058" strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <line x1="364" y1="230" x2={CX - RX - 30} y2="230" stroke="#4a5058" strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#3a3f45" strokeWidth="1.5" strokeDasharray="5 7" />
          {arc && <path key={`${s}-${step}`} d={arc} fill="none" stroke="var(--z-turmeric)" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" className="lp-flow lp-arc" />}
          <line x1={CX + RX + 30} y1="230" x2="950" y2="230" stroke={finished ? "var(--z-turmeric)" : "#4a5058"} strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <path d="M 950 224 L 960 230 L 950 236 Z" fill={finished ? "var(--z-turmeric)" : "#4a5058"} />
        </svg>

        <ul className="absolute left-[2%] top-[8%] grid h-[84%] content-between">
          {INPUTS.map((x) => {
            const on = x.id === sc.input;
            return (
              <li key={x.id} title={pick(x.name)} className={`grid size-11 place-items-center rounded-xl border transition-colors duration-500 ${on ? "border-[var(--z-turmeric)] bg-[#2a2e33] text-[var(--z-turmeric)]" : "border-[#33383e] bg-[#202428] text-[#80868d]"}`}>
                <x.icon aria-hidden size={18} />
                <span className="sr-only">{pick(x.name)}</span>
              </li>
            );
          })}
        </ul>

        <div className="absolute left-[16.4%] top-[22%] flex h-[56%] w-[16.4%] flex-col items-center justify-center gap-4 rounded-[22px] border border-[#4a5058] bg-[#22262b] px-3 py-4">
          <p className="text-[13px] font-semibold text-[#b4b9be]">{step === 0 ? pick({ en: "Understanding", hi: "समझ रहा है" }) : pick({ en: "Understood", hi: "समझ लिया" })}</p>
          <p key={`${s}-heard`} className="lp-arrive text-center text-[15px] leading-snug text-white">
            {pick(sc.heard)}
          </p>
        </div>

        <div className="absolute left-[44%] top-[40%] w-[30%] text-center" aria-live="polite">
          <p className="text-[17px] font-semibold text-[var(--z-turmeric)]">{pick(sc.tab)}</p>
          <p key={`${s}-${step}`} className="lp-arrive mt-1 text-[15px] leading-snug text-[#d9dee3]">
            {active ? pick(sc.steps[step - 1].text) : finished ? pick({ en: "Done. Only the decisions came to Meena.", hi: "हो गया। मीना के पास सिर्फ़ फ़ैसले आए।" }) : pick({ en: "Coming in…", hi: "आ रहा है…" })}
          </p>
        </div>

        {ORDER.map((a) => {
          const p = at(a);
          const info = AGENT_INFO[a];
          const on = a === active;
          const was = lit.has(a) && !on;
          return (
            <div key={a} className="absolute flex w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${((p.x / 1100) * 100).toFixed(2)}%`, top: `${((p.y / 460) * 100).toFixed(2)}%` }}>
              <span className={`relative grid size-14 place-items-center rounded-full border-2 transition-colors duration-500 ${on ? "border-[var(--z-turmeric)] bg-[#2a2e33] text-[var(--z-turmeric)]" : was ? "border-[#d9dee3] bg-[#2a2e33] text-[#d9dee3]" : "border-[#3a3f45] bg-[#202428] text-[#80868d]"}`}>
                {on && <span aria-hidden className="lp-ring absolute -inset-1.5 rounded-full border-2 border-[var(--z-turmeric)]" />}
                <info.icon aria-hidden size={21} />
              </span>
              <span className={`mt-2 text-center text-[14px] font-semibold leading-tight ${on || was ? "text-white" : "text-[#9298a0]"}`}>{pick(info.name)}</span>
            </div>
          );
        })}

        <div className="absolute right-[1%] top-[16%] w-[12.5%]">
          <p className="text-[15px] font-semibold text-[var(--z-turmeric)]">{pick({ en: "What changed", hi: "क्या बदला" })}</p>
          <ul className="mt-3 space-y-4">
            {sc.outcomes.map((o, k) => (
              <li key={`${s}-${o.label.en}`} className={`transition-opacity duration-500 ${finished || done > k ? "opacity-100" : "opacity-25"}`}>
                <p className="text-[13px] leading-snug text-[#9298a0]">{pick(o.label)}</p>
                <p className="lp-display text-[26px] leading-tight text-white">{pick(o.value)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Phones and tablets: the same story, top to bottom */}
      <div className="px-5 pb-7 pt-6 lg:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-[#4a5058] bg-[#22262b] p-4">
          {(() => {
            const inp = INPUTS.find((x) => x.id === sc.input)!;
            return (
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--z-turmeric)] text-[var(--z-turmeric)]">
                <inp.icon aria-hidden size={18} />
              </span>
            );
          })()}
          <p className="text-[15px] leading-snug">{pick(sc.heard)}</p>
        </div>
        <ol className="mt-3 space-y-2">
          {sc.steps.map((x, k) => {
            const info = AGENT_INFO[x.agent];
            const on = k === step - 1;
            const was = k < step - 1 || finished;
            return (
              <li key={`${s}-${k}`} className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-500 ${on ? "border-[var(--z-turmeric)] bg-[#2a2e33]" : "border-[#33383e]"} ${on || was ? "" : "opacity-50"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${on ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[#2a2e33] text-[#d9dee3]"}`}>
                  <info.icon aria-hidden size={16} />
                </span>
                <div className="text-[15px] leading-snug">
                  <p className="font-semibold text-white">{pick(info.name)}</p>
                  <p className="text-[#d9dee3]">{pick(x.text)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-[14px] font-semibold text-[var(--z-turmeric)]">{pick({ en: "What changed", hi: "क्या बदला" })}</p>
        <ul className="mt-2 grid grid-cols-3 gap-3">
          {sc.outcomes.map((o) => (
            <li key={o.label.en}>
              <p className="lp-display text-[22px] leading-tight text-white">{pick(o.value)}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#9298a0]">{pick(o.label)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
