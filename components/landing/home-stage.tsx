"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Check, MessageCircle, Store, UserRound } from "lucide-react";
import { HearIt, Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage hero: Meena's own ordering page on a phone, the Soundbox beside it, and the three ways an
// order can travel. It opens on a finished first order (nothing builds itself up on load), then a new
// order arrives every few seconds while it's on screen: the phone shows it, the Soundbox speaks it, and
// the way it's delivered lights up. Reduced motion keeps the first order, still.

type Way = "rider" | "helper" | "pickup";
const WAYS: { id: Way; icon: typeof Bike; name: Bi; color: string }[] = [
  { id: "rider", icon: Bike, name: { en: "Zomato rider", hi: "Zomato राइडर" }, color: "#e23744" },
  { id: "helper", icon: UserRound, name: { en: "Your helper", hi: "आपका हेल्पर" }, color: "#e9a31a" },
  { id: "pickup", icon: Store, name: { en: "Pickup", hi: "पिकअप" }, color: "#2f7a4c" },
];

const ORDERS: { who: Bi; items: Bi; paid: number; way: Way; say: Bi; clip?: string }[] = [
  {
    who: { en: "Flat 302", hi: "फ़्लैट 302" },
    items: { en: "2 aloo paratha, 1 rajma chawal", hi: "2 आलू पराठा, 1 राजमा चावल" },
    paid: 270,
    way: "rider",
    say: { en: "New order! Two aloo paratha, one rajma chawal. Zomato rider at 1:05.", hi: "नया ऑर्डर! दो आलू पराठा, एक राजमा चावल। Zomato राइडर 1:05 पर।" },
    clip: "new-order",
  },
  {
    who: { en: "Neha, same lane", hi: "नेहा, उसी गली में" },
    items: { en: "1 thali", hi: "1 थाली" },
    paid: 120,
    way: "pickup",
    say: { en: "New order from Neha. One thali, for pickup at 1:20.", hi: "नेहा का नया ऑर्डर। एक थाली, 1:20 पर पिकअप।" },
  },
  {
    who: { en: "Arjun, next block", hi: "अर्जुन, अगला ब्लॉक" },
    items: { en: "2 rajma chawal", hi: "2 राजमा चावल" },
    paid: 180,
    way: "helper",
    say: { en: "New order from Arjun. Two rajma chawal. Your helper takes it.", hi: "अर्जुन का नया ऑर्डर। दो राजमा चावल। आपका हेल्पर ले जाएगा।" },
  },
];

const MENU: { name: Bi; price: number }[] = [
  { name: { en: "Rajma chawal", hi: "राजमा चावल" }, price: 90 },
  { name: { en: "Aloo paratha", hi: "आलू पराठा" }, price: 60 },
  { name: { en: "Thali", hi: "थाली" }, price: 120 },
];

export function HomeStage() {
  const { pick, lang } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"arrive" | "speak" | "rest">("rest");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // The first order is already there; after a pause, the next one arrives.
  useEffect(() => {
    if (!visible) return;
    const t = [
      setTimeout(() => {
        setN((v) => v + 1);
        setPhase("arrive");
      }, 4200),
      setTimeout(() => setPhase("speak"), 5100),
      setTimeout(() => setPhase("rest"), 8600),
    ];
    return () => t.forEach(clearTimeout);
  }, [n, visible]);

  const order = ORDERS[n % ORDERS.length];
  const state: SoundboxState = phase === "arrive" ? "ringing" : phase === "speak" ? "speaking" : "accepted";

  return (
    <div ref={box}>
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        {/* Meena's page, with the order that just came in */}
        <div data-ui className="w-[176px] shrink-0 rounded-[30px] bg-[#1c1f23] p-[5px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] sm:w-[230px] sm:rounded-[36px] sm:p-[7px]">
          <div className="relative h-[310px] overflow-hidden rounded-[25px] bg-[#fafaf6] text-[#1c1f23] sm:h-[370px] sm:rounded-[30px]">
            <span aria-hidden className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1f23]" />
            <div className="bg-[#e9a31a] px-3.5 pb-3 pt-8">
              <p className="text-[15px] font-bold leading-tight sm:text-[17px]">{pick({ en: "Meena's Kitchen", hi: "मीना की रसोई" })}</p>
              <p className="text-[11px] sm:text-[12px]">{pick({ en: "Home kitchen · Green Park", hi: "घर की रसोई · ग्रीन पार्क" })}</p>
            </div>
            <ul className="space-y-1.5 p-2 sm:p-2.5">
              {MENU.map((m) => (
                <li key={m.name.en} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
                  <span aria-hidden className="grid size-3 shrink-0 place-items-center rounded-[2px] border-[1.5px] border-[#2f7a4c]">
                    <span className="size-1.5 rounded-full bg-[#2f7a4c]" />
                  </span>
                  <span className="min-w-0 flex-1 text-[12.5px] font-semibold leading-tight sm:text-[13.5px]">{pick(m.name)}</span>
                  <span className="text-[12px] sm:text-[13px]">₹{m.price}</span>
                </li>
              ))}
            </ul>
            <div key={n} className={`absolute inset-x-2 bottom-2 space-y-1.5 sm:inset-x-2.5 ${phase === "arrive" ? "hs-chip" : ""}`}>
              <div className="rounded-xl rounded-tl-sm bg-[#dcf8c6] p-2.5 text-[12px] leading-snug sm:text-[12.5px]">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-[#1f6b3a]">
                  <MessageCircle aria-hidden size={12} /> {pick(order.who)}
                </p>
                <p className="mt-0.5">{pick(order.items)}</p>
              </div>
              <p className="ml-auto flex w-fit items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-1 text-[11.5px] font-semibold text-white">
                <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: `Paid ₹${order.paid}`, hi: `₹${order.paid} मिले` })} · UPI
              </p>
            </div>
          </div>
        </div>

        {/* The Soundbox, and how this order travels */}
        <div className="flex flex-col items-center gap-5 pt-10 sm:pt-14">
          <div className="sm:hidden">
            <Soundbox size="xs" bare state={state} />
          </div>
          <div className="hidden sm:block">
            <Soundbox size="sm" bare state={state} />
          </div>
          <ul className="grid w-full gap-1.5" aria-label={pick({ en: "How this order travels", hi: "यह ऑर्डर कैसे पहुँचेगा" })}>
            {WAYS.map((w) => {
              const on = w.id === order.way;
              return (
                <li key={w.id} className="flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] text-[var(--lp-ink)] transition-colors duration-500 sm:text-[14.5px]" style={{ background: on ? `color-mix(in srgb, ${w.color} 24%, var(--lp-paper))` : "var(--lp-paper)", boxShadow: on ? `inset 0 0 0 2px ${w.color}` : undefined }}>
                  <w.icon aria-hidden size={15} className="shrink-0" style={{ color: w.color }} />
                  <span className={on ? "font-semibold" : ""}>{pick(w.name)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="mx-auto mt-5 flex max-w-[40ch] flex-col items-center gap-2 text-center">
        <p key={`${n}-${lang}`} className="sb-caption min-h-[3em] text-[16px] font-medium leading-snug">
          <span className="text-[var(--lp-muted)]">Zest: </span>“{pick(order.say)}”
        </p>
        <HearIt clip={order.clip} />
      </figcaption>
    </div>
  );
}
