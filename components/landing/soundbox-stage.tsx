"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Camera, Check, Globe, MessageCircle, Mic, Phone, Search, Store, Volume2 } from "lucide-react";
import { MENU } from "@/lib/data";

// Zest Soundbox, the order soundbox, and the pieces of the landing page that show orders moving: the hero
// stage where every channel's orders arrive at Zest Soundbox, and the push-to-talk menu sync demo. Zest Soundbox is
// drawn, not photographed: it is in pilot.

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
export function SoundboxDevice({ order, n, accepted, onAccept, small = false }: { order: Order; n: number; accepted: boolean; onAccept?: () => void; small?: boolean }) {
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
          <span aria-label="Push to talk" className="grid size-12 place-items-center rounded-full bg-[#2a312d]">
            <Mic aria-hidden size={19} />
          </span>
          <button
            type="button"
            onClick={onAccept}
            aria-label={accepted ? "Order accepted" : "Accept order"}
            className={`grid size-[86px] place-items-center rounded-full text-[15px] font-bold transition-transform active:scale-95 ${accepted ? "bg-[var(--lp-good)] text-white" : "bg-[var(--lp-accent)] text-[#121a16]"}`}
          >
            {accepted ? <Check size={30} strokeWidth={3} /> : "Accept"}
          </button>
          <span aria-label="Food ready" className="grid size-12 place-items-center rounded-full bg-[#2a312d]">
            <Bike aria-hidden size={19} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** The hero: orders from every channel arrive at Zest Soundbox, which announces each one and prints it. */
export function SoundboxStage() {
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
          <SoundboxDevice order={order} n={n} accepted={accepted} onAccept={() => setAccepted(true)} />
        </div>
      </div>
      {/* What Zest Soundbox just said */}
      <div className="relative flex flex-col gap-3 bg-[#151b17] px-5 py-4 text-[#eaf0eb] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p key={`q${n}${lang}`} className="lp-arrive min-h-[3em] min-w-0 flex-1 text-[16px] font-medium" aria-live="off">
          <span className="text-[var(--lp-accent)]">Zest: </span>“{line}”
        </p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Zest's language" className="flex rounded-full bg-[#0b0f0d] p-1 text-[13px]">
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
              <Volume2 aria-hidden size={16} /> Hear it
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

/** Push to talk on Zest Soundbox: say the dish is finished and it goes off everywhere, one channel after another. */
export function SyncDemo() {
  const [off, setOff] = useState(false);
  const [talking, setTalking] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const auto = useRef(true);
  function say(next: boolean) {
    setTalking(true);
    setTimeout(() => {
      setTalking(false);
      setHeard(next ? "“Dal makhani khatam.”" : "“Dal makhani is back.”");
      setOff(next);
    }, 900);
  }
  useEffect(() => {
    if (reduced()) return;
    let next = true;
    const t = setInterval(() => {
      if (!auto.current) return;
      say(next);
      next = !next;
    }, 4600);
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
            <p className={`text-[14px] ${off ? "text-[#f07d6b]" : "text-[#5cc07a]"}`}>{off ? "Off every menu" : "On every menu"}</p>
          </div>
        </div>
        <p className="mt-4 min-h-[1.5em] text-center text-[16px] font-medium" aria-live="polite">
          {talking ? (
            <span className="text-[#a9b8ae]">
              Listening<span className="lp-caret" />
            </span>
          ) : (
            (heard ?? <span className="text-[#a9b8ae]">Say a dish is finished, or back.</span>)
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            auto.current = false;
            say(!off);
          }}
          aria-label={off ? "Push to talk: say the dish is back" : "Push to talk: say the dish is finished"}
          className={`relative mx-auto mt-4 grid size-20 place-items-center rounded-full transition-colors active:scale-95 ${talking ? "bg-[var(--lp-accent)] text-[#121a16]" : "bg-[#2a312d] text-[#eaf0eb]"}`}
        >
          {talking && <span aria-hidden className="lp-ring absolute inset-0 rounded-full border-2 border-[var(--lp-accent)]" />}
          <Mic aria-hidden size={28} />
        </button>
        <p className="mt-3 text-center text-[13px] text-[#a9b8ae]">Push to talk</p>
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
