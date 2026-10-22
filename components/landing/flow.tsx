"use client";

import { useEffect, useState } from "react";
import { Bike, BookOpen, Camera, Gift, Globe, Megaphone, MessageCircle, Mic, Search, Star, Store, type LucideIcon } from "lucide-react";

// The agents at work: a request comes in on a channel, Zest understands it, and the agents pass it
// around the loop, each doing its part, until something changes for the restaurant. Four scenarios
// from the sample restaurant play in turn; picking one stops the rotation.

type AgentId = "storefront" | "discovery" | "menu" | "offers" | "dispatch" | "reviews";
export const AGENT_INFO: Record<AgentId, { name: string; icon: LucideIcon; does: string }> = {
  storefront: { name: "Storefront", icon: Globe, does: "Your website, WhatsApp ordering and Google profile" },
  discovery: { name: "Discovery", icon: Megaphone, does: "Search, AI answers, Instagram and Meta ads" },
  menu: { name: "Menu", icon: BookOpen, does: "One menu, prices and stock, everywhere you sell" },
  offers: { name: "Offers", icon: Gift, does: "Welcome offers, rewards for regulars, budgets" },
  dispatch: { name: "Dispatch", icon: Bike, does: "Zomato riders, live tracking and delays" },
  reviews: { name: "Reviews", icon: Star, does: "Replies in your voice, and the issues behind them" },
};

// Where each agent sits on the loop, as an angle on the ellipse.
const ORDER: AgentId[] = ["storefront", "discovery", "menu", "offers", "dispatch", "reviews"];
const ANGLE: Record<AgentId, number> = { storefront: 180, discovery: 240, menu: 300, offers: 0, dispatch: 60, reviews: 120 };
const CX = 650, CY = 230, RX = 220, RY = 150;
const at = (a: AgentId) => {
  const t = (ANGLE[a] * Math.PI) / 180;
  return { x: Math.round(CX + RX * Math.cos(t)), y: Math.round(CY + RY * Math.sin(t)) };
};

type InputId = "web" | "whatsapp" | "google" | "instagram" | "swiggy" | "zesty";
const INPUTS: { id: InputId; icon: LucideIcon; name: string }[] = [
  { id: "web", icon: Globe, name: "Website" },
  { id: "whatsapp", icon: MessageCircle, name: "WhatsApp" },
  { id: "google", icon: Search, name: "Google" },
  { id: "instagram", icon: Camera, name: "Instagram" },
  { id: "swiggy", icon: Store, name: "Zomato and Swiggy" },
  { id: "zesty", icon: Mic, name: "Zesty" },
];

type Scenario = { id: string; tab: string; input: InputId; heard: string; steps: { agent: AgentId; text: string }[]; outcomes: { label: string; value: string }[] };
const SCENARIOS: Scenario[] = [
  {
    id: "order",
    tab: "A new order",
    input: "whatsapp",
    heard: "1 dal makhani, 2 garlic naan, on WhatsApp",
    steps: [
      { agent: "storefront", text: "Order taken: ₹442, Ananya R., 12th order" },
      { agent: "offers", text: "Regular's reward applied: free gajar halwa" },
      { agent: "dispatch", text: "Food ready. Zomato rider booked, 4 min away" },
      { agent: "reviews", text: "Delivered. Asked Ananya how it was" },
    ],
    outcomes: [
      { label: "Accepted on Zesty", value: "6 sec" },
      { label: "Rider at the door", value: "4 min" },
      { label: "Orders missed tonight", value: "0" },
    ],
  },
  {
    id: "out",
    tab: "A dish runs out",
    input: "zesty",
    heard: "“Dal makhani khatam,” said at the pass",
    steps: [
      { agent: "menu", text: "Off your website, WhatsApp, Google, Zomato and Swiggy" },
      { agent: "offers", text: "Paused the dal makhani combo" },
      { agent: "storefront", text: "Suggesting dal tadka to guests instead" },
    ],
    outcomes: [
      { label: "Menus updated", value: "6" },
      { label: "Time taken", value: "9 sec" },
      { label: "Orders you couldn't cook", value: "0" },
    ],
  },
  {
    id: "slow",
    tab: "A slow lunch",
    input: "web",
    heard: "Lunch orders well below a usual Tuesday",
    steps: [
      { agent: "discovery", text: "Drafted an Instagram story and a Google post: thali lunch" },
      { agent: "offers", text: "10% off lunch until 3 pm, capped at ₹1,500" },
      { agent: "storefront", text: "Offer shown on your website and WhatsApp menu" },
    ],
    outcomes: [
      { label: "Extra lunch orders", value: "+14" },
      { label: "Spent of your cap", value: "₹620" },
      { label: "Your part", value: "1 tap" },
    ],
  },
  {
    id: "review",
    tab: "A bad review",
    input: "swiggy",
    heard: "2 stars on Swiggy: “the dal was cold”",
    steps: [
      { agent: "reviews", text: "Reply drafted in your voice" },
      { agent: "menu", text: "Third cold-dal review this month: packaging flagged" },
      { agent: "offers", text: "₹75 credit ready for Karthik's next order" },
    ],
    outcomes: [
      { label: "Reply ready", value: "1 min" },
      { label: "Pattern found", value: "Cold dal ×3" },
      { label: "Waiting for you", value: "1 yes" },
    ],
  },
];

const STEP_MS = 1700;

export function AgentFlow() {
  const [s, setS] = useState(0);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const sc = SCENARIOS[s];
  const total = sc.steps.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(total);
      return;
    }
    const t = setTimeout(() => {
      if (step < total + 1) setStep(step + 1);
      else if (auto) {
        setS((v) => (v + 1) % SCENARIOS.length);
        setStep(0);
      }
    }, step === 0 ? 1100 : step > total ? 2600 : STEP_MS);
    return () => clearTimeout(t);
  }, [step, total, auto]);

  const done = Math.min(step, total);
  const active = step >= 1 && step <= total ? sc.steps[step - 1].agent : null;
  const lit = new Set(sc.steps.slice(0, done).map((x) => x.agent));
  const finished = step > total;

  // The bright arc: from the agent before the current one (or the loop's entry) to the current one.
  const arc = (() => {
    if (!active) return null;
    const from = step >= 2 ? at(sc.steps[step - 2].agent) : { x: CX - RX, y: CY };
    const to = at(active);
    if (Math.hypot(from.x - to.x, from.y - to.y) < 1) return null;
    return `M ${from.x} ${from.y} A ${RX} ${RY} 0 0 1 ${to.x} ${to.y}`;
  })();

  function pick(k: number) {
    setAuto(false);
    setS(k);
    setStep(0);
  }

  return (
    <div data-ui className="overflow-hidden rounded-[28px] bg-[#0d1813] text-[#e6efe9]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-7">
        <p className="flex items-center gap-2 rounded-full border border-[#2a4237] px-3.5 py-1.5 text-[13px] font-semibold tracking-wide">
          <span className="lp-pulse size-2 rounded-full bg-[#7fd1a5]" /> Agents at work
        </p>
        <p className="text-[13px] text-[#8fa89a]">Rasoi 27, the sample restaurant</p>
      </div>

      <div role="tablist" aria-label="Scenarios" className="flex flex-wrap justify-center gap-2 px-5 pt-6">
        {SCENARIOS.map((x, k) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={k === s}
            onClick={() => pick(k)}
            className={`lp-tab min-h-10 rounded-full border px-4 text-[15px] transition-colors ${k === s ? "border-[#7fd1a5] bg-[#15281f] text-white" : "border-[#2a4237] text-[#a9bdb1] hover:text-white"}`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      {/* Wide screens: the loop */}
      <div className="relative mx-auto hidden aspect-[1100/460] w-full max-w-[1180px] lg:block">
        <svg aria-hidden viewBox="0 0 1100 460" className="absolute inset-0 size-full">
          <defs>
            <pattern id="lp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#14231c" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1100" height="460" fill="url(#lp-grid)" />
          <line x1="104" y1="230" x2="176" y2="230" stroke="#3d5c4e" strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <line x1="364" y1="230" x2={CX - RX - 30} y2="230" stroke="#3d5c4e" strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#2c4a3d" strokeWidth="1.5" strokeDasharray="5 7" />
          {arc && <path key={`${s}-${step}`} d={arc} fill="none" stroke="var(--lp-accent)" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" className="lp-flow lp-arc" />}
          <line x1={CX + RX + 30} y1="230" x2="950" y2="230" stroke={finished ? "var(--lp-accent)" : "#3d5c4e"} strokeWidth="1.5" strokeDasharray="5 6" className="lp-flow" />
          <path d="M 950 224 L 960 230 L 950 236 Z" fill={finished ? "var(--lp-accent)" : "#3d5c4e"} />
        </svg>

        {/* Channels */}
        <ul className="absolute left-[2%] top-[8%] grid h-[84%] content-between">
          {INPUTS.map((x) => {
            const on = x.id === sc.input;
            return (
              <li key={x.id} title={x.name} className={`grid size-11 place-items-center rounded-xl border transition-colors duration-500 ${on ? "border-[var(--lp-accent)] bg-[#1d3328] text-[var(--lp-accent)]" : "border-[#22382e] bg-[#111f19] text-[#6f8a7c]"}`}>
                <x.icon aria-hidden size={18} />
                <span className="sr-only">{x.name}</span>
              </li>
            );
          })}
        </ul>

        {/* Understanding */}
        <div className="absolute left-[16.4%] top-[19%] flex h-[62%] w-[16.4%] flex-col items-center justify-center gap-5 rounded-[22px] border border-[#3f6b58] bg-[#102019] px-3 py-4">
          <Lattice live={step === 0} />
          <p key={`${s}-heard`} className="lp-arrive text-center text-[13px] leading-snug text-[#cfe0d6]">
            {step === 0 ? (
              <>
                Understanding<span className="lp-caret" />
              </>
            ) : (
              sc.heard
            )}
          </p>
        </div>

        {/* The loop's centre: what's happening now */}
        <div className="absolute left-[44%] top-[40%] w-[30%] text-center" aria-live="polite">
          <p className="text-[17px] font-semibold text-[#9fe0bd]">{sc.tab}</p>
          <p key={`${s}-${step}`} className="lp-arrive mt-1 text-[14px] leading-snug text-[#c8d8ce]">
            {active ? sc.steps[step - 1].text : finished ? "Done. Only the decisions came to you." : "Coming in…"}
          </p>
        </div>

        {/* Agents on the loop */}
        {ORDER.map((a) => {
          const p = at(a);
          const info = AGENT_INFO[a];
          const on = a === active;
          const was = lit.has(a) && !on;
          return (
            <div key={a} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${((p.x / 1100) * 100).toFixed(2)}%`, top: `${((p.y / 460) * 100).toFixed(2)}%` }}>
              <span className={`relative grid size-14 place-items-center rounded-full border-2 transition-colors duration-500 ${on ? "border-[var(--lp-accent)] bg-[#1d3328] text-[var(--lp-accent)]" : was ? "border-[#7fd1a5] bg-[#132a20] text-[#7fd1a5]" : "border-[#2c4a3d] bg-[#0f1c16] text-[#6f8a7c]"}`}>
                {on && <span aria-hidden className="lp-ring absolute -inset-1.5 rounded-full border-2 border-[var(--lp-accent)]" />}
                <info.icon aria-hidden size={21} />
              </span>
              <span className={`mt-2 whitespace-nowrap text-[14px] font-semibold ${on || was ? "text-white" : "text-[#8fa89a]"}`}>{info.name}</span>
            </div>
          );
        })}

        {/* Outcomes */}
        <div className="absolute right-[1%] top-[18%] w-[12.5%]">
          <p className="text-[15px] font-semibold text-[#9fe0bd]">What changed</p>
          <ul className="mt-3 space-y-4">
            {sc.outcomes.map((o, k) => (
              <li key={`${s}-${o.label}`} className={`transition-opacity duration-500 ${finished || done > k ? "opacity-100" : "opacity-25"}`}>
                <p className="text-[13px] leading-snug text-[#8fa89a]">{o.label}</p>
                <p className="lp-display text-[24px] leading-tight text-white">{o.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Narrow screens: the same story, top to bottom */}
      <div className="px-5 pb-6 pt-6 lg:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-[#3f6b58] bg-[#102019] p-4">
          {(() => {
            const inp = INPUTS.find((x) => x.id === sc.input)!;
            return (
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--lp-accent)] text-[var(--lp-accent)]">
                <inp.icon aria-hidden size={18} />
              </span>
            );
          })()}
          <p className="text-[15px] leading-snug text-[#cfe0d6]">{sc.heard}</p>
        </div>
        <ol className="mt-3 space-y-2">
          {sc.steps.map((x, k) => {
            const info = AGENT_INFO[x.agent];
            const on = k === step - 1;
            const was = k < step - 1 || finished;
            return (
              <li key={`${s}-${k}`} className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-500 ${on ? "border-[var(--lp-accent)] bg-[#15281f]" : "border-[#1e3128]"} ${on || was ? "" : "opacity-50"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${on ? "bg-[var(--lp-accent)] text-[#121a16]" : "bg-[#15281f] text-[#7fd1a5]"}`}>
                  <info.icon aria-hidden size={16} />
                </span>
                <div className="text-[14px] leading-snug">
                  <p className="font-semibold text-white">{info.name}</p>
                  <p className="text-[#c8d8ce]">{x.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <ul className="mt-5 grid grid-cols-3 gap-3">
          {sc.outcomes.map((o) => (
            <li key={o.label}>
              <p className="lp-display text-[22px] leading-tight text-white">{o.value}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#8fa89a]">{o.label}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Captions */}
      <div className="hidden grid-cols-[16%_18%_minmax(0,1fr)_16%] gap-8 bg-[#0a130f] px-7 py-7 lg:grid">
        {[
          ["Every channel", "Website, WhatsApp, Google, Instagram, the apps, and Zesty in your kitchen"],
          ["Understands it", "An order, a review, a slow hour, or what you said at the pass"],
          ["Agents hand off", "Each does its part, then passes it on, until it's done"],
          ["What changed", "Results you can see, the same night"],
        ].map(([t, d]) => (
          <div key={t}>
            <p className="text-[16px] font-semibold text-[#9fe0bd]">{t}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#8fa89a]">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The "understanding" lattice: a small net of nodes that pulses while Zest reads what came in. */
function Lattice({ live }: { live: boolean }) {
  const rows = 6;
  const pts: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) pts.push({ x: 20 + c * 40 + (r % 2 ? 0 : 0), y: 14 + r * 26 });
  const lines: [number, number][] = [];
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c < 3; c++) {
      const a = r * 3 + c;
      if (c < 2) lines.push([a, (r + 1) * 3 + c + 1]);
      if (c > 0) lines.push([a, (r + 1) * 3 + c - 1]);
    }
  return (
    <svg aria-hidden viewBox="0 0 120 160" className="w-[70%]">
      {lines.map(([a, b], k) => (
        <line key={k} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} stroke="#4f8a70" strokeWidth="1.2" opacity="0.7" />
      ))}
      {pts.map((p, k) => (
        <circle key={k} cx={p.x} cy={p.y} r={k % 3 === 1 ? 4 : 3} fill={k % 3 === 1 ? "#cfeedd" : "#7fd1a5"} className={live ? "lp-pulse" : ""} style={{ animationDelay: `${(k % 6) * 0.18}s` }} />
      ))}
    </svg>
  );
}
