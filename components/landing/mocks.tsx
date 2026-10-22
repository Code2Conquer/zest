"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Globe, Inbox, IndianRupee, Mail, MessageCircle, RotateCcw, Search, Sparkles, Star, Store, TrendingUp, Users } from "lucide-react";
import { MENU, PAYOUTS } from "@/lib/data";

// The product, drawn as it looks inside Zest, with the sample restaurant's numbers. These are
// interface pieces (data-ui), not illustrations: every action here is one the agents take in the app.

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const dish = (id: string) => MENU.find((m) => m.id === id)!;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Channel = "zomato" | "swiggy" | "web";
const CH: Record<Channel, { name: string; color: string }> = {
  zomato: { name: "Zomato", color: "var(--lp-zomato)" },
  swiggy: { name: "Swiggy", color: "var(--lp-swiggy)" },
  web: { name: "Your page", color: "var(--lp-web)" },
};

function Dot({ c }: { c: Channel }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: CH[c].color }} />;
}

function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? "#237433" : "#b8321f";
  return (
    <span aria-label={veg ? "Veg" : "Non-veg"} className="grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px]" style={{ borderColor: c }}>
      <span className="size-1.5 rounded-full" style={{ background: c }} />
    </span>
  );
}

export const AGENT_ICON = { website: Globe, listings: Store, payouts: IndianRupee, reviews: Star, guests: Users, growth: TrendingUp } as const;
export type AgentId = keyof typeof AGENT_ICON;

type Line = { t: string; agent: AgentId; name: string; text: string; ask?: string };
const NIGHT: Line[] = [
  { t: "11:48 pm", agent: "listings", name: "Listings", text: "Closed the day: 214 orders, ₹68,920 across Zomato, Swiggy and your page." },
  { t: "1:12 am", agent: "payouts", name: "Payouts", text: "Read Swiggy's statement. ₹412 taken for order #3381, cancelled after cooking started.", ask: "Dispute drafted" },
  { t: "2:05 am", agent: "website", name: "Website", text: "Gajar halwa is back on Zomato. Added it to your page with its photo and price." },
  { t: "6:20 am", agent: "reviews", name: "Reviews", text: "Drafted replies to 3 new reviews, including a 2-star one about cold dal.", ask: "Replies ready" },
  { t: "7:40 am", agent: "listings", name: "Listings", text: "Paneer tikka is ₹289 on Zomato and ₹299 on Swiggy.", ask: "Match prices?" },
  { t: "9:00 am", agent: "growth", name: "Growth", text: "Weekday lunch offer: 46 orders, ₹1,840 spent of the ₹3,000 you allowed." },
  { t: "9:15 am", agent: "guests", name: "Guests", text: "Ananya R. ordered from your page for the 12th time. Noted: less spice, Friday dinners." },
];

/** The hero: what the agents did overnight, arriving line by line, with the decisions left for the owner. */
export function AgentConsole() {
  // Five lines fit; each new one pushes the oldest out of view, like a log that never stops.
  const FIT = 5;
  const [n, setN] = useState(FIT);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setN((v) => (v >= NIGHT.length + 2 ? FIT : v + 1)), 2400);
    return () => clearInterval(t);
  }, []);
  const upto = Math.min(n, NIGHT.length);
  const shown = NIGHT.slice(Math.max(0, upto - FIT), upto);
  const asks = NIGHT.slice(0, upto).filter((l) => l.ask).length;
  const writing = n < NIGHT.length;
  return (
    <div data-ui className="overflow-hidden rounded-[22px] border border-[var(--lp-line)] bg-[var(--lp-console)] text-[var(--lp-console-ink)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <Sparkles aria-hidden size={16} className="text-[var(--lp-accent)]" /> Rasoi 27 · overnight
        </p>
        <p className="flex items-center gap-2 text-[13px] text-[var(--lp-console-muted)]">
          <span className="lp-pulse size-2 rounded-full bg-[#5cc07a]" /> 6 agents working
        </p>
      </div>
      <ol className="flex flex-col justify-end gap-1 overflow-hidden px-3">
        {shown.map((l, k) => {
          const Icon = AGENT_ICON[l.agent];
          return (
            <li key={l.t} className={`flex shrink-0 gap-3 rounded-xl px-2.5 py-2.5 ${k === shown.length - 1 ? "lp-arrive bg-[var(--lp-console-2)]" : ""}`}>
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--lp-console-2)] text-[var(--lp-accent)]">
                <Icon aria-hidden size={15} />
              </span>
              <div className="min-w-0 flex-1 text-[14px] leading-snug">
                <p className="text-[12.5px] text-[var(--lp-console-muted)]">
                  {l.name} · {l.t}
                </p>
                <p className="mt-0.5">{l.text}</p>
                {l.ask && <p className="mt-1.5 inline-flex rounded-full bg-[var(--lp-accent)] px-2.5 py-0.5 text-[12.5px] font-semibold text-[var(--lp-accent-ink)]">{l.ask}</p>}
              </div>
            </li>
          );
        })}
        <li aria-hidden className={`shrink-0 px-2.5 py-2 text-[14px] text-[var(--lp-console-muted)] ${writing ? "" : "invisible"}`}>
          working
          <span className="lp-caret" />
        </li>
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--lp-console-2)] px-5 py-4">
        <p className="text-[14px]">
          <span className="font-semibold">{asks} need you.</span> <span className="text-[var(--lp-console-muted)]">Everything else is done.</span>
        </p>
        <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--lp-accent)] px-4 text-[14px] font-semibold text-[var(--lp-accent-ink)]">Review {asks}</span>
      </div>
    </div>
  );
}

/** How the restaurant's own page reads in a Google result: the title and description Zest writes. */
export function SearchResult() {
  return (
    <div data-ui className="lp-ui p-5">
      <div className="flex items-center gap-2 rounded-full bg-[var(--lp-ground)] px-4 py-2.5 text-[14px]">
        <Search aria-hidden size={15} className="text-[var(--lp-faint)]" /> dal makhani indiranagar order online
      </div>
      <div className="mt-5">
        <p className="flex items-center gap-2 text-[13px] text-[var(--lp-muted)]">
          <span className="grid size-6 place-items-center rounded-full bg-[var(--lp-accent)] text-[11px] font-bold text-[var(--lp-accent-ink)]">R</span>
          Rasoi 27 › order
        </p>
        <p className="mt-1.5 text-[19px] leading-snug text-[var(--lp-google)]">Rasoi 27, Indiranagar · Order online</p>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--lp-muted)]">Order North Indian, Biryani and Desserts from Rasoi 27 in Indiranagar, Bengaluru. About ₹600 for two. Pick up or order at your table.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
          {["Paneer tikka ₹289", "Dal makhani ₹249", "Chicken biryani ₹349"].map((x) => (
            <span key={x} className="rounded-full bg-[var(--lp-sunken)] px-3 py-1">
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The restaurant's own ordering page, on a phone. Always drawn light, as the page itself opens. */
export function PhonePage({ className = "" }: { className?: string }) {
  const items = ["m1", "m3", "m2"].map(dish);
  return (
    <div data-ui className={`w-[260px] rounded-[36px] bg-[#121a16] p-[8px] ${className}`}>
      <div className="overflow-hidden rounded-[29px] bg-[#f4f5f2] text-[#121a16]">
        <div className="relative h-[104px]">
          <img src="/photos/menu-paneer-tikka.webp" alt="" className="size-full object-cover" />
          <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#121a16]" />
        </div>
        <div className="relative mx-3 -mt-7 rounded-2xl bg-white p-3.5">
          <p className="text-[16px] font-semibold leading-tight">Rasoi 27</p>
          <p className="text-[12px] text-[#4d5953]">North Indian · Biryani · Indiranagar</p>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            {(["zomato", "swiggy"] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-md bg-[#237433] px-1.5 py-0.5 font-semibold text-white">
                {p === "zomato" ? "4.2" : "4.0"} <Star aria-hidden size={10} fill="currentColor" strokeWidth={0} />
                <span className="font-normal">{p === "zomato" ? "Zomato" : "Swiggy"}</span>
              </span>
            ))}
          </div>
        </div>
        <ul className="px-3 pb-3 pt-1">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 py-2">
              <div className="min-w-0 flex-1">
                <VegMark veg={m.veg} />
                <p className="mt-0.5 text-[13px] font-semibold leading-tight">{m.name}</p>
                <p className="text-[12px]">{inr(m.price.zomato)}</p>
              </div>
              <div className="relative">
                <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#237433]">ADD</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** One dish, switched off once, gone from every app; and a price mismatch waiting for a yes. */
export function MenuSync() {
  const [off, setOff] = useState(false);
  const m = dish("m3");
  return (
    <div data-ui className="lp-ui p-5">
      <div className="flex items-center gap-3">
        <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold">{m.name}</p>
          <p className="text-[14px] text-[var(--lp-muted)]">{inr(m.price.zomato)} · 121 orders this week</p>
        </div>
        <button type="button" role="switch" aria-checked={!off} aria-label="In stock" onClick={() => setOff((v) => !v)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${off ? "bg-[var(--lp-line)]" : "bg-[var(--lp-good)]"}`}>
          <span className={`absolute left-1 top-1 size-6 rounded-full bg-white transition-transform ${off ? "" : "translate-x-6"}`} />
        </button>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
        {(["zomato", "swiggy", "web"] as const).map((c, n) => (
          <li key={c} className="rounded-xl bg-[var(--lp-ground)] px-3 py-2.5">
            <p className="flex items-center gap-1.5 font-medium">
              <Dot c={c} /> {CH[c].name}
            </p>
            <p className={`mt-1 transition-colors ${off ? "text-[var(--lp-bad)]" : "text-[var(--lp-good)]"}`} style={{ transitionDelay: `${n * 140}ms` }}>
              {off ? "Out of stock" : "Live"}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-[var(--lp-muted)]">Tap the switch: one change, every app.</p>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px]">
        <Sparkles aria-hidden size={15} className="mt-0.5 shrink-0" />
        <p>Paneer tikka is ₹289 on Zomato and ₹299 on Swiggy. Match them at ₹289?</p>
      </div>
    </div>
  );
}

/** What Zest knows about a regular who orders from the restaurant's own page. */
export function GuestCard() {
  const rows: [string, string][] = [
    ["Orders", "12 since June"],
    ["Spent", inr(7840)],
    ["Usually", "Dal makhani, 2 garlic naan"],
    ["Note", "Less spice. Friday dinners."],
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--lp-accent-soft)] text-[17px] font-semibold">AR</span>
        <div>
          <p className="text-[17px] font-semibold">Ananya Rao</p>
          <p className="text-[14px] text-[var(--lp-muted)]">Regular · orders from your page</p>
        </div>
      </div>
      <dl className="mt-4 space-y-1 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-1 py-1.5">
            <dt className="text-[var(--lp-muted)]">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 rounded-xl bg-[var(--lp-ground)] p-3 text-[14px]">
        <p className="flex items-center gap-1.5 font-semibold">
          <MessageCircle aria-hidden size={15} /> Recent orders
        </p>
        <ul className="mt-2 space-y-1.5">
          {(
            [
              ["Fri, 3 Oct", "Dal makhani, 2 garlic naan", 638],
              ["Fri, 26 Sep", "Dal makhani, jeera rice", 498],
              ["Fri, 19 Sep", "Paneer tikka, 2 butter naan", 407],
            ] as const
          ).map(([d, what, amt]) => (
            <li key={d} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                <span className="text-[var(--lp-muted)]">{d}</span> · {what}
              </span>
              <span className="font-medium tabular-nums">{inr(amt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A low review with the reply Zest drafted. */
export function ReviewCard() {
  const [sent, setSent] = useState(false);
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
        <span className="font-semibold">Karthik R.</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--lp-bad)]">
          2 <Star aria-hidden size={12} fill="currentColor" strokeWidth={0} />
        </span>
        <span className="flex items-center gap-1.5 text-[var(--lp-muted)]">
          <Dot c="swiggy" /> Swiggy · 10:57 am
        </span>
      </p>
      <p className="mt-2 text-[15px]">“Dal was cold by the time it reached and the rice was less than usual.”</p>
      <p className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--lp-muted)]">
        <Sparkles aria-hidden size={14} /> Drafted in your voice
      </p>
      <p className="mt-1.5 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px] leading-relaxed">
        Karthik, sorry the dal reached you cold, that's not how it leaves our kitchen. We've moved dal to sealed containers from today and added a ₹75 credit to your next order.
      </p>
      <button type="button" onClick={() => setSent(true)} className={`mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${sent ? "bg-[var(--lp-good)] text-white" : "bg-[var(--lp-ink)] text-[var(--lp-on-ink)]"}`}>
        {sent ? (
          <>
            <Check aria-hidden size={15} /> Reply posted
          </>
        ) : (
          "Approve and post"
        )}
      </button>
    </div>
  );
}

/** A payout split into what the restaurant kept and where the rest went. */
export function PayoutCard() {
  const [p, setP] = useState<"zomato" | "swiggy">("swiggy");
  const cur = PAYOUTS.find((x) => x.platform === p)!;
  const parts = [
    { label: "You keep", v: cur.net, color: "var(--lp-good)" },
    { label: "Commission", v: cur.commission, color: "var(--lp-faint)" },
    { label: "Ads", v: cur.ads, color: "var(--lp-accent)" },
    { label: "Deductions", v: cur.deductions, color: "var(--lp-bad)" },
  ];
  const wrong = p === "swiggy" ? { amount: 412, order: "3381" } : { amount: 286, order: "7712" };
  return (
    <div data-ui className="lp-ui p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-[var(--lp-muted)]">Payout, 7 to 13 Oct</p>
        <div role="radiogroup" aria-label="Platform" className="flex rounded-full bg-[var(--lp-ground)] p-1 text-[14px]">
          {(["zomato", "swiggy"] as const).map((x) => (
            <button key={x} type="button" role="radio" aria-checked={p === x} onClick={() => setP(x)} className={`min-h-9 rounded-full px-4 font-semibold transition-colors ${p === x ? (x === "zomato" ? "text-white" : "text-[#121a16]") : "text-[var(--lp-muted)]"}`} style={p === x ? { background: CH[x].color } : undefined}>
              {CH[x].name}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[14px] text-[var(--lp-muted)]">Sales {inr(cur.gross)}</p>
      <p className="text-[clamp(32px,3.4vw,44px)] font-semibold leading-tight tracking-tight">{inr(cur.net)}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--lp-ground)]">
        {parts.map((x) => (
          <span key={x.label} className="lp-bar h-full" style={{ width: `${(x.v / cur.gross) * 100}%`, background: x.color }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
        {parts.map((x) => (
          <li key={x.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[var(--lp-muted)]">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: x.color }} />
              {x.label}
            </span>
            <span className="font-medium tabular-nums">{inr(x.v)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--lp-bad-soft)] p-3.5 text-[14px]">
        <div>
          <p className="font-semibold">{inr(wrong.amount)} deducted by mistake</p>
          <p className="text-[var(--lp-muted)]">Order #{wrong.order} was cancelled after cooking started.</p>
        </div>
        <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--lp-ink)] px-4 font-semibold text-[var(--lp-on-ink)]">Approve dispute</span>
      </div>
    </div>
  );
}

/** An offer with a hard weekly cap, and which dishes are winning or slipping. */
export function GrowthCard() {
  const spent = 1840, cap = 3000;
  const rows = [
    { m: dish("m2"), z: 4.3, s: 4.2 },
    { m: dish("m1"), z: 4.4, s: 4.3 },
    { m: dish("m3"), z: 4.5, s: 3.8, flag: true },
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex items-center justify-between text-[14px]">
        <span className="flex items-center gap-1.5 font-semibold">
          <Dot c="swiggy" /> Weekday lunch, 20% off
        </span>
        <span className="rounded-full bg-[var(--lp-good-soft)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--lp-good)]">Running</span>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["Orders", "46"],
          ["Sales", inr(14260)],
          ["Spent", inr(spent)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[13px] text-[var(--lp-muted)]">{k}</p>
            <p className="text-[20px] font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--lp-ground)]">
        <span className="lp-bar block h-full rounded-full bg-[var(--lp-accent)]" style={{ width: `${(spent / cap) * 100}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-[var(--lp-muted)]">Stops by itself at {inr(cap)} this week</p>
      <table className="mt-5 w-full text-[14px]">
        <thead>
          <tr className="text-left text-[13px] text-[var(--lp-muted)]">
            <th className="pb-2 font-medium">Dish</th>
            <th className="pb-2 text-right font-medium">Orders</th>
            <th className="pb-2 text-right font-medium">Zomato</th>
            <th className="pb-2 text-right font-medium">Swiggy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, z, s, flag }) => (
            <tr key={m.id}>
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <img src={m.photo} alt="" className="size-8 rounded-lg object-cover" />
                  {m.name}
                </span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{m.ordersLast7}</td>
              <td className="py-1.5 text-right tabular-nums">{z.toFixed(1)}</td>
              <td className={`py-1.5 text-right tabular-nums ${flag ? "font-semibold text-[var(--lp-bad)]" : ""}`}>{s.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex gap-2 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px]">
        <Clock aria-hidden size={16} className="mt-0.5 shrink-0" />
        Dal makhani is 0.7 lower on Swiggy. Three reviews say it arrived cold: try sealed containers.
      </p>
    </div>
  );
}

/** The approval trail: what the owner said yes to, each with undo. */
export function ApprovalTrail() {
  const [undone, setUndone] = useState<string | null>(null);
  const rows = [
    { t: "Today, 9:20 am", what: "Swiggy dispute for ₹412 sent", who: "You approved" },
    { t: "Today, 9:18 am", what: "3 review replies posted", who: "You approved, edited one" },
    { t: "Yesterday, 8:12 pm", what: "Chole bhature ₹189 → ₹199 on all apps", who: "You approved" },
    { t: "Yesterday, 4:40 pm", what: "Weekend offer paused at its ₹2,000 limit", who: "Stopped by itself" },
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--lp-muted)]">
        <Inbox aria-hidden size={16} /> Approvals and record
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.t} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--lp-ground)] px-3.5 py-3 text-[14px]">
            <div className="min-w-0">
              <p className={`font-medium ${undone === r.t ? "text-[var(--lp-faint)] line-through" : ""}`}>{r.what}</p>
              <p className="text-[13px] text-[var(--lp-muted)]">
                {r.t} · {undone === r.t ? "Undone" : r.who}
              </p>
            </div>
            <button type="button" onClick={() => setUndone(undone === r.t ? null : r.t)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-semibold hover:bg-[var(--lp-sunken)]">
              <RotateCcw aria-hidden size={14} /> {undone === r.t ? "Redo" : "Undo"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The two things setup asks for: a listing link and an email connection. */
export function SetupCard() {
  return (
    <div data-ui className="lp-ui space-y-3 p-5">
      <div className="rounded-xl bg-[var(--lp-ground)] p-3.5">
        <p className="text-[13px] text-[var(--lp-muted)]">Your Zomato link</p>
        <p className="mt-0.5 truncate text-[15px] font-medium">zomato.com/bangalore/rasoi-27-indiranagar</p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--lp-good)]">
          <Check aria-hidden size={14} /> 11 dishes, photos and a 4.2 rating read
        </p>
      </div>
      <div className="rounded-xl bg-[var(--lp-ground)] p-3.5">
        <p className="text-[13px] text-[var(--lp-muted)]">Your email</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[15px] font-medium">
          <Mail aria-hidden size={15} /> owner@rasoi27.in
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--lp-good)]">
          <Check aria-hidden size={14} /> 4 payout mails and 2 statements found
        </p>
      </div>
    </div>
  );
}
