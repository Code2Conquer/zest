"use client";

import { useEffect, useRef, useState } from "react";
import { BatteryFull, Camera, Check, CheckCheck, ChevronLeft, MessageSquareReply, Mic, Phone, Plus, Sigma, Signal, Video, Wallet, Wifi } from "lucide-react";
import { Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The pieces of /restaurants: the Soundbox you can press (including what happens when nobody does),
// and the morning summary, played on the owner's phone in WhatsApp.

/** The Soundbox you can press: a Swiggy order rings; if nobody accepts, it gets louder. */
export function RestaurantVoice() {
  const [state, setState] = useState<SoundboxState>("ringing");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (state !== "ringing") return;
    timer.current = setTimeout(() => setState("escalating"), 6000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state]);
  const caption: Bi =
    state === "escalating"
      ? { en: "Order waiting! Please accept the Swiggy order.", hi: "ऑर्डर इंतज़ार में है! स्विगी वाला ऑर्डर मंज़ूर कीजिए." }
      : state === "printing" || state === "accepted"
        ? { en: "Accepted. Ticket printed.", hi: "ऑर्डर मंज़ूर. टिकट छप गया." }
        : { en: "New order on Swiggy. Two paneer tikka.", hi: "स्विगी पर नया ऑर्डर. दो पनीर टिक्का." };
  return (
    <Soundbox
      state={state}
      caption={caption}
      clip={state === "escalating" ? "missed" : state === "ringing" ? "swiggy" : undefined}
      ticket={{ title: "RASOI 27", lines: ["KOT 204 · Swiggy", "2 Paneer tikka|578"], foot: "Swiggy order #3390" }}
      showTicket={state === "printing" || state === "accepted"}
      onPress={() => setState(state === "ringing" || state === "escalating" ? "printing" : state === "printing" ? "accepted" : "ringing")}
    />
  );
}

// The morning summary, played: three messages arrive on the owner's phone and the point beside it that
// each one proves lights up. Tapping a point shows its message; "Post reply" on the review posts it.
const POINTS: { icon: typeof Sigma; title: Bi; text: Bi }[] = [
  { icon: Sigma, title: { en: "Every channel, one total", hi: "हर चैनल, एक जोड़" }, text: { en: "Zomato, Swiggy and your page, added up. No more opening three dashboards.", hi: "Zomato, Swiggy और आपका पेज, एक साथ जोड़कर। तीन डैशबोर्ड खोलने की ज़रूरत नहीं।" } },
  { icon: Wallet, title: { en: "Payouts, before they land", hi: "पेआउट, आने से पहले" }, text: { en: "How much is coming from Zomato and Swiggy, and on which day.", hi: "Zomato और Swiggy से कितना आ रहा है, और किस दिन।" } },
  { icon: MessageSquareReply, title: { en: "Bad reviews, handled", hi: "ख़राब रिव्यू, संभले हुए" }, text: { en: "A reply drafted in your voice. One tap to post it.", hi: "आपकी भाषा में जवाब तैयार। एक टैप में पोस्ट।" } },
];
const SALES = [
  { ch: "Zomato", amt: 1419, n: 4, color: "#e23744" },
  { ch: "Swiggy", amt: 1039, n: 3, color: "#fc8019" },
  { ch: "page", amt: 4477, n: 2, color: "#e9a31a" },
];

export function MorningSummary({ intro, cta }: { intro: React.ReactNode; cta: React.ReactNode }) {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState(-1); // -1 typing, then 0..2: how many messages are in
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      setBeat(2);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const t = setTimeout(() => {
      if (beat >= 2) {
        setPosted(false);
        setBeat(-1);
      } else setBeat(beat + 1);
    }, beat === -1 ? 1100 : beat === 2 ? 6500 : 2600);
    return () => clearTimeout(t);
  }, [beat, auto, inView]);

  // Like WhatsApp: the newest message is always in view.
  useEffect(() => {
    const c = chat.current;
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
  }, [beat, posted]);

  // Tapping a point brings its message into view inside the phone (the page doesn't move).
  const show = (k: number) => {
    setAuto(false);
    setBeat(Math.max(beat, k));
    requestAnimationFrame(() => {
      const c = chat.current, m = document.getElementById(`ms-${k}`);
      if (c && m) c.scrollTo({ top: m.offsetTop - 12, behavior: "smooth" });
    });
  };
  const max = Math.max(...SALES.map((x) => x.amt));
  const bubble = "max-w-[90%] rounded-lg rounded-tl-none bg-white px-2.5 py-2 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]"; // WhatsApp bubble, taste-skill-ignore

  return (
    <div ref={box} className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <div>
        {intro}
        <ol className="mt-7 grid gap-1.5">
          {POINTS.map((x, k) => {
            const on = beat === k || (beat === 2 && k === 2);
            const lit = beat >= k;
            return (
              <li key={x.title.en}>
                <button type="button" onClick={() => show(k)} className={`relative flex w-full items-start gap-3.5 rounded-2xl px-4 py-3 text-left transition-colors ${on ? "bg-[var(--lp-paper)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--z-turmeric)]" : "hover:bg-[var(--lp-paper)]/60"}`}>
                  <x.icon aria-hidden size={20} className={`mt-0.5 shrink-0 transition-colors ${lit ? "text-[var(--z-turmeric)]" : "text-[var(--lp-faint)]"}`} />
                  <span>
                    <span className={`block text-[17px] font-semibold leading-snug ${lit ? "" : "text-[var(--lp-muted)]"}`}>{pick(x.title)}</span>
                    <span className="mt-0.5 block text-[15px] leading-snug text-[var(--lp-muted)]">{pick(x.text)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-7">{cta}</div>
      </div>

      <div data-ui className="mx-auto w-[290px] shrink-0 rounded-[44px] bg-[#1c1f23] p-[9px] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)] sm:w-[310px]">
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[36px] bg-[#efeae2] text-[#111b21]">
          <div className="flex items-center justify-between bg-[#f6f6f6] px-6 pb-1 pt-3 text-[12px] font-semibold">
            <span>7:30</span>
            <span aria-hidden className="absolute left-1/2 top-2.5 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#1c1f23]" />
            <span className="flex items-center gap-1">
              <Signal aria-hidden size={12} />
              <Wifi aria-hidden size={12} />
              <BatteryFull aria-hidden size={14} />
            </span>
          </div>
          <div className="flex items-center gap-2.5 border-b border-[#e5e5e5] bg-[#f6f6f6] px-3 py-2">{/* taste-skill-ignore */}
            <ChevronLeft aria-hidden size={20} className="text-[#007aff]" />
            <span className="grid size-8 place-items-center rounded-full bg-[#1c1f23] text-[15px] font-extrabold tracking-[-0.05em] text-[#f1f1ec]">z<span className="text-[#e9a31a]">.</span></span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[14px] font-semibold">Zest</p>
              <p className="text-[11px] text-[#54656f]">{beat === -1 ? pick({ en: "typing…", hi: "लिख रहा है…" }) : pick({ en: "online", hi: "ऑनलाइन" })}</p>
            </div>
            <Video aria-hidden size={18} className="text-[#007aff]" />
            <Phone aria-hidden size={16} className="text-[#007aff]" />
          </div>

          <div ref={chat} className="relative flex-1 space-y-2 overflow-y-auto px-2.5 py-3 text-[12.5px] leading-[1.45] [scrollbar-width:none]">
            <p className="mx-auto w-fit rounded-md bg-white/80 px-2 py-0.5 text-[11px] text-[#54656f]">{pick({ en: "Today", hi: "आज" })}</p>
            {beat === -1 && (
              <p className="lp-typing flex w-fit gap-1 rounded-lg rounded-tl-none bg-white px-3 py-2.5">
                <span className="sr-only">{pick({ en: "Zest is typing", hi: "Zest लिख रहा है" })}</span>
                <i aria-hidden className="size-1.5 rounded-full bg-[#8696a0]" />
                <i aria-hidden className="size-1.5 rounded-full bg-[#8696a0]" />
                <i aria-hidden className="size-1.5 rounded-full bg-[#8696a0]" />
              </p>
            )}
            {beat >= 0 && (
              <div id="ms-0" className={`hs-chip ${bubble}`}>
                <p className="font-semibold">{pick({ en: "Good morning, Aditi. Yesterday at Rasoi 27:", hi: "सुप्रभात अदिति। कल Rasoi 27 में:" })}</p>
                <ul className="mt-2 space-y-1.5">
                  {SALES.map((x, k) => (
                    <li key={x.ch}>
                      <p className="flex justify-between text-[12px]">
                        <span>{x.ch === "page" ? pick({ en: "Your page", hi: "आपका पेज" }) : x.ch}</span>
                        <span className="tabular-nums">
                          ₹{x.amt.toLocaleString("en-IN")} <span className="text-[#54656f]">· {x.n}</span>
                        </span>
                      </p>
                      <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-[#eef0f2]">
                        <span className="jr-stage block h-full rounded-full" style={{ background: x.color, maxWidth: `${(x.amt / max) * 100}%`, animationDelay: `${200 + k * 180}ms` }} />
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">{pick({ en: "Total ₹6,935 · 9 orders", hi: "कुल ₹6,935 · 9 ऑर्डर" })}</p>
              </div>
            )}
            {beat >= 1 && (
              <div id="ms-1" className={`hs-chip ${bubble}`}>
                <p className="font-semibold">{pick({ en: "Payouts on the way", hi: "आने वाले पेआउट" })}</p>
                <p className="mt-1 flex justify-between">
                  <span>{pick({ en: "Swiggy · Tuesday", hi: "Swiggy · मंगलवार" })}</span>
                  <span className="tabular-nums font-medium">₹67,238</span>
                </p>
                <p className="flex justify-between">
                  <span>{pick({ en: "Zomato · Wednesday", hi: "Zomato · बुधवार" })}</span>
                  <span className="tabular-nums font-medium">₹80,490</span>
                </p>
              </div>
            )}
            {beat >= 2 && (
              <div id="ms-2" className={`hs-chip ${bubble}`}>
                <p className="font-semibold">{pick({ en: "One review needs you", hi: "एक रिव्यू पर ध्यान दीजिए" })}</p>
                <p className="mt-0.5">{pick({ en: "Karthik, 2 stars on Swiggy: “Dal was cold by the time it reached.”", hi: "कार्तिक, Swiggy पर 2 स्टार: “दाल पहुँचते-पहुँचते ठंडी हो गई।”" })}</p>
                <p className="mt-1.5 rounded-md bg-[#f0f2f5] px-2 py-1.5 italic text-[#3b4a54]">{pick({ en: "“Sorry, Karthik. We've changed how we pack dal so it stays hot. Your next one is on us.”", hi: "“माफ़ कीजिए कार्तिक। हमने दाल की पैकिंग बदल दी है ताकि गरम रहे। अगली बार हमारी तरफ़ से।”" })}</p>
                {!posted ? (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[12.5px] font-semibold text-[#008069]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuto(false);
                        setPosted(true);
                      }}
                      className="rounded-md bg-[#f0f2f5] py-1.5 hover:bg-[#e6e9ec]"
                    >
                      {pick({ en: "Post reply", hi: "जवाब पोस्ट करें" })}
                    </button>
                    <span className="rounded-md bg-[#f0f2f5] py-1.5 text-center">{pick({ en: "Edit", hi: "बदलें" })}</span>
                  </div>
                ) : null}
              </div>
            )}
            {posted && (
              <>
                <p className="hs-chip ml-auto w-fit rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{/* taste-skill-ignore */}
                  {pick({ en: "Post reply", hi: "जवाब पोस्ट करें" })}
                  <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[10px] text-[#54656f]">
                    7:42 <CheckCheck aria-hidden size={13} className="text-[#53bdeb]" />
                  </span>
                </p>
                <p className="hs-chip w-fit rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{/* taste-skill-ignore */}
                  <span className="inline-flex items-center gap-1">
                    {pick({ en: "Posted on Swiggy", hi: "Swiggy पर पोस्ट हो गया" })}
                    <Check aria-hidden size={13} strokeWidth={3} className="text-[#2f7a4c]" />
                  </span>
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#f6f6f6] px-3 pb-6 pt-2">
            <Plus aria-hidden size={20} className="text-[#007aff]" />
            <span className="h-8 flex-1 rounded-full border border-[#e1e1e1] bg-white" />{/* taste-skill-ignore */}
            <Camera aria-hidden size={18} className="text-[#007aff]" />
            <Mic aria-hidden size={18} className="text-[#007aff]" />
          </div>
        </div>
      </div>
    </div>
  );
}
