"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Camera, Check, Gift, Globe, MapPin, MessageCircle, Phone, Search, Store, Volume2 } from "lucide-react";
import { MENU } from "@/lib/data";

// Zesty, the order soundbox, and the pieces of the landing page that show orders moving: the hero
// stage where every channel's orders arrive at Zesty, the one-menu sync demo, and the delivery and
// offer cards. Zesty is drawn, not photographed: it is in pilot.

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type ChannelId = "web" | "whatsapp" | "google" | "instagram" | "phone" | "zomato" | "swiggy";
export const CHANNEL: Record<ChannelId, { name: string; icon: typeof Globe; color: string }> = {
  web: { name: "Your website", icon: Globe, color: "var(--lp-web)" },
  whatsapp: { name: "WhatsApp", icon: MessageCircle, color: "#1f9d55" },
  google: { name: "Google", icon: Search, color: "var(--lp-google)" },
  instagram: { name: "Instagram", icon: Camera, color: "#c13584" },
  phone: { name: "Phone", icon: Phone, color: "var(--lp-dine)" },
  zomato: { name: "Zomato", icon: Store, color: "var(--lp-zomato)" },
  swiggy: { name: "Swiggy", icon: Store, color: "var(--lp-swiggy)" },
};

type Order = { ch: ChannelId; guest: string; items: string; total: number; say: string; sayHi: string };
const ORDERS: Order[] = [
  { ch: "web", guest: "Ananya R.", items: "2 butter naan, 1 dal makhani", total: 367, say: "New order! Two butter naan, one dal makhani, from your website.", sayHi: "नया ऑर्डर! दो बटर नान, एक दाल मखनी, आपकी वेबसाइट से।" },
  { ch: "whatsapp", guest: "Rahul M.", items: "Chicken biryani, raita", total: 409, say: "New order on WhatsApp! One chicken biryani with raita.", sayHi: "WhatsApp पर नया ऑर्डर! एक चिकन बिरयानी, रायता के साथ।" },
  { ch: "google", guest: "Priya S.", items: "Paneer tikka, 2 garlic naan", total: 427, say: "New order from Google! Paneer tikka and two garlic naan.", sayHi: "Google से नया ऑर्डर! पनीर टिक्का और दो गार्लिक नान।" },
  { ch: "instagram", guest: "Kabir J.", items: "Veg thali x2", total: 558, say: "New order from Instagram! Two veg thalis.", sayHi: "Instagram से नया ऑर्डर! दो वेज थाली।" },
  { ch: "zomato", guest: "Order #7841", items: "Chole bhature, masala chaas", total: 248, say: "New Zomato order! Chole bhature and a masala chaas.", sayHi: "नया Zomato ऑर्डर! छोले भटूरे और एक मसाला छाछ।" },
];

/** Speaks a line with the browser's voice, in Indian English or Hindi. Only ever on a click. */
function speak(text: string, lang: "en-IN" | "hi-IN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.02;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang === lang) ?? window.speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang.slice(0, 2)));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return true;
}

/** The device itself. `n` changes with each new order, which restarts its announcement and print. */
export function ZestyDevice({ order, n, accepted, onAccept, small = false }: { order: Order; n: number; accepted: boolean; onAccept?: () => void; small?: boolean }) {
  const ch = CHANNEL[order.ch];
  return (
    <div className={`relative ${small ? "w-[230px]" : "w-[280px] sm:w-[300px]"}`}>
      {/* The ticket printing out of the top slot */}
      <div aria-hidden className="absolute inset-x-0 bottom-[calc(100%-10px)] flex h-[150px] justify-center overflow-hidden">
        <div key={`t${n}`} className="lp-print mt-auto w-[64%] rounded-t-md bg-[#fbfaf6] px-3 pb-4 pt-3 text-[13px] leading-snug text-[#121a16]">
          <p className="font-bold uppercase tracking-wide">Rasoi 27 · KOT</p>
          <p className="mt-1">{ch.name} · {order.guest}</p>
          <p className="mt-1 font-semibold">{order.items}</p>
          <p className="mt-1">Total {inr(order.total)}</p>
        </div>
      </div>
      <div data-ui className="relative rounded-[44px] bg-[#1b201d] p-5 text-[#eaf0eb]">
        {/* Speaker, with sound rings when it talks */}
        <div className="relative mx-auto grid size-[92px] place-items-center">
          <span key={`r1${n}`} aria-hidden className="lp-ring absolute inset-0 rounded-full border-2 border-[var(--lp-accent)]" />
          <span key={`r2${n}`} aria-hidden className="lp-ring late absolute inset-0 rounded-full border-2 border-[var(--lp-accent)]" />
          <svg aria-hidden viewBox="0 0 92 92" className="size-full">
            <circle cx="46" cy="46" r="45" fill="#121614" />
            {Array.from({ length: 7 }, (_, r) =>
              Array.from({ length: 7 }, (_, c) => {
                const x = 16 + c * 10, y = 16 + r * 10;
                return (x - 46) ** 2 + (y - 46) ** 2 < 32 ** 2 ? <circle key={`${r}-${c}`} cx={x} cy={y} r="2.2" fill="#3a423d" /> : null;
              }),
            )}
          </svg>
        </div>
        {/* Screen */}
        <div className="mt-4 rounded-2xl bg-[#0a0d0b] px-4 py-3">
          <p key={`s${n}`} className="lp-arrive flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--lp-accent)]">
            <span className="lp-pulse size-2 rounded-full bg-[var(--lp-accent)]" /> {accepted ? "Accepted · cooking" : "New order"}
          </p>
          <p key={`c${n}`} className="lp-arrive mt-1 flex items-center gap-1.5 text-[14px] font-semibold">
            <ch.icon aria-hidden size={14} /> {ch.name} · {inr(order.total)}
          </p>
        </div>
        {/* Buttons */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="grid min-h-11 place-items-center rounded-full bg-[#2a312d] px-3 text-[13px] font-semibold">Khatam</span>
          <button
            type="button"
            onClick={onAccept}
            aria-label={accepted ? "Order accepted" : "Accept order"}
            className={`grid size-[86px] place-items-center rounded-full text-[15px] font-bold transition-transform active:scale-95 ${accepted ? "bg-[var(--lp-good)] text-white" : "bg-[var(--lp-accent)] text-[#121a16]"}`}
          >
            {accepted ? <Check size={30} strokeWidth={3} /> : "Accept"}
          </button>
          <span className="grid min-h-11 place-items-center rounded-full bg-[#2a312d] px-3 text-[13px] font-semibold">Ready</span>
        </div>
      </div>
    </div>
  );
}

/** The hero: orders from every channel arrive at Zesty, which announces each one and prints it. */
export function ZestyStage() {
  const [n, setN] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [canSpeak, setCanSpeak] = useState(false);
  const paused = useRef(false);
  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    if (reduced()) return;
    const t = setInterval(() => {
      if (paused.current) return;
      setN((v) => v + 1);
      setAccepted(false);
    }, 4800);
    return () => clearInterval(t);
  }, []);
  const order = ORDERS[n % ORDERS.length];
  const recent = Array.from({ length: 3 }, (_, k) => ORDERS[(n - k + ORDERS.length * 10) % ORDERS.length]);
  const line = lang === "en-IN" ? order.say : order.sayHi;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#0b0f0d]">
      <img src="/photos/team-chef.webp" alt="" className="lp-drift absolute inset-0 size-full object-cover opacity-30" />
      <div className="relative grid gap-6 p-5 pt-[170px] sm:p-8 sm:pt-[180px] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        {/* Orders arriving */}
        <ol aria-label="Orders arriving" className="order-2 grid content-end gap-2 md:order-1">
          {recent.map((o, k) => {
            const c = CHANNEL[o.ch];
            return (
              <li key={`${o.guest}-${n - k}`} className={`flex items-center gap-3 rounded-2xl bg-[#151b17] px-4 py-3 text-[#eaf0eb] ${k === 0 ? "lp-slide" : "opacity-70"}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: c.color }}>
                  <c.icon aria-hidden size={17} className="text-white" />
                </span>
                <div className="min-w-0 text-[14px] leading-snug">
                  <p className="font-semibold">
                    {c.name} · {o.guest}
                  </p>
                  <p className="truncate text-[#a9b8ae]">{o.items}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="order-1 flex justify-center md:order-2">
          <ZestyDevice order={order} n={n} accepted={accepted} onAccept={() => setAccepted(true)} />
        </div>
      </div>
      {/* What Zesty just said */}
      <div className="relative flex flex-col gap-3 bg-[#151b17] px-5 py-4 text-[#eaf0eb] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p key={`q${n}${lang}`} className="lp-arrive min-h-[3em] min-w-0 flex-1 text-[16px] font-medium" aria-live="off">
          <span className="text-[var(--lp-accent)]">Zesty: </span>“{line}”
        </p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Zesty's language" className="flex rounded-full bg-[#0b0f0d] p-1 text-[13px]">
            {(["en-IN", "hi-IN"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-8 rounded-full px-3 font-semibold ${lang === l ? "bg-[#2a312d]" : "text-[#a9b8ae]"}`}>
                {l === "en-IN" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
          {canSpeak && (
            <button
              type="button"
              onClick={() => {
                paused.current = true;
                speak(line, lang);
                setTimeout(() => (paused.current = false), 5000);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--lp-accent)] px-4 text-[14px] font-semibold text-[#121a16]"
            >
              <Volume2 aria-hidden size={16} /> Hear Zesty
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SYNC: { ch: ChannelId; where: string }[] = [
  { ch: "web", where: "rasoi27 website" },
  { ch: "whatsapp", where: "WhatsApp menu" },
  { ch: "google", where: "Google profile" },
  { ch: "instagram", where: "Instagram link" },
  { ch: "zomato", where: "Zomato" },
  { ch: "swiggy", where: "Swiggy" },
];

/** One tap on Zesty's "Khatam" and the dish goes off everywhere, one channel after another. */
export function SyncDemo() {
  const [off, setOff] = useState(false);
  const auto = useRef(true);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => auto.current && setOff((v) => !v), 4200);
    return () => clearInterval(t);
  }, []);
  const m = MENU.find((x) => x.id === "m3")!;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
      <div data-ui className="mx-auto w-full max-w-[340px] rounded-[32px] bg-[#1b201d] p-5 text-[#eaf0eb]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#0a0d0b] p-3">
          <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="text-[16px] font-semibold">{m.name}</p>
            <p className={`text-[14px] ${off ? "text-[#f07d6b]" : "text-[#5cc07a]"}`}>{off ? "Out of stock everywhere" : "On every menu"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            auto.current = false;
            setOff((v) => !v);
          }}
          className={`mt-4 flex min-h-14 w-full items-center justify-center rounded-full text-[17px] font-bold transition-colors active:scale-[0.98] ${off ? "bg-[#2a312d] text-[#eaf0eb]" : "bg-[var(--lp-accent)] text-[#121a16]"}`}
        >
          {off ? "Back in stock" : "Dal makhani khatam"}
        </button>
        <p className="mt-3 text-center text-[13px] text-[#a9b8ae]">Press it, or just say it to Zesty.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYNC.map(({ ch, where }, k) => {
          const c = CHANNEL[ch];
          return (
            <li key={ch} className="lp-ui flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: c.color }}>
                <c.icon aria-hidden size={18} className="text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{where}</p>
                <p className={`text-[14px] transition-colors duration-300 ${off ? "text-[var(--lp-bad)]" : "text-[var(--lp-good)]"}`} style={{ transitionDelay: `${k * 180}ms` }}>
                  {off ? "Dal makhani: off" : "Dal makhani: on"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A Zomato rider booked for a website order, with the guest's tracking. */
export function DeliveryCard() {
  const steps = ["Order accepted on Zesty", "Food ready: rider called", "Rider picked up", "Delivered to Ananya"];
  const [at, setAt] = useState(1);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setAt((v) => (v >= steps.length - 1 ? 0 : v + 1)), 1800);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex items-center justify-between text-[14px]">
        <span className="flex items-center gap-2 font-semibold">
          <Globe aria-hidden size={15} className="text-[var(--lp-web)]" /> Website order · {inr(367)}
        </span>
        <span className="flex items-center gap-1.5 text-[var(--lp-muted)]">
          <Bike aria-hidden size={15} /> Zomato rider
        </span>
      </p>
      <div className="relative mt-5 h-2 rounded-full bg-[var(--lp-ground)]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--lp-accent)] transition-[width] duration-700" style={{ width: `${(at / (steps.length - 1)) * 100}%` }} />
        <span className="absolute top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--lp-ink)] text-[var(--lp-on-ink)] transition-[left] duration-700" style={{ left: `${(at / (steps.length - 1)) * 100}%` }}>
          <Bike aria-hidden size={15} />
        </span>
      </div>
      <ol className="mt-6 space-y-2 text-[14px]">
        {steps.map((s, k) => (
          <li key={s} className={`flex items-center gap-2 ${k <= at ? "" : "text-[var(--lp-faint)]"}`}>
            {k <= at ? <Check aria-hidden size={15} className="text-[var(--lp-good)]" /> : <MapPin aria-hidden size={15} />}
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-[var(--lp-ground)] p-3 text-[14px]">Ananya gets a live tracking link. If the rider is late, the agent tells you before she asks.</p>
    </div>
  );
}

/** Welcome offers for new guests and rewards for regulars, from one set of rules. */
export function OfferCard() {
  const rows = [
    { who: "New guests", what: "₹75 off the first order on your website", used: "38 used this month", color: "var(--lp-web)" },
    { who: "Regulars", what: "Free gajar halwa on every 5th order", used: "12 earned", color: "var(--lp-accent)" },
    { who: "Quiet weekdays", what: "10% off lunch, Mon to Thu", used: "Runs until ₹3,000 is spent", color: "var(--lp-swiggy)" },
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--lp-muted)]">
        <Gift aria-hidden size={16} /> Offers running
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.who} className="rounded-xl bg-[var(--lp-ground)] p-3.5 text-[14px]">
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} /> {r.who}
            </p>
            <p className="mt-0.5">{r.what}</p>
            <p className="mt-0.5 text-[13px] text-[var(--lp-muted)]">{r.used}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ads on Meta and the search setup, inside one budget. */
export function GrowthPanel() {
  const spent = 2140, cap = 5000;
  return (
    <div data-ui className="lp-ui p-5">
      <p className="text-[14px] font-semibold text-[var(--lp-muted)]">This week</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          ["Found on Google", "1,240"],
          ["Website visits", "610"],
          ["Orders", "84"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[13px] text-[var(--lp-muted)]">{k}</p>
            <p className="text-[22px] font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-[var(--lp-ground)] p-3.5 text-[14px]">
        <p className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-2">
            <Camera aria-hidden size={15} /> Instagram ad · “Friday biryani”
          </span>
          <span className="text-[var(--lp-good)]">31 orders</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--lp-paper)]">
          <span className="lp-bar block h-full rounded-full bg-[var(--lp-accent)]" style={{ width: `${(spent / cap) * 100}%` }} />
        </div>
        <p className="mt-2 text-[13px] text-[var(--lp-muted)]">
          {inr(spent)} of your {inr(cap)} budget. Stops by itself.
        </p>
      </div>
      <p className="mt-3 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px]">
        When someone asks an AI assistant for “best dal makhani in Indiranagar”, your menu, prices and reviews are there for it to read.
      </p>
    </div>
  );
}
