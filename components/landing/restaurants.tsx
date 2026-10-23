"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BatteryFull, Camera, Check, CheckCheck, ChevronLeft, Globe, MessageSquareReply, Mic, Phone, Plus, Sigma, Signal, Star, Video, Wallet, Wifi } from "lucide-react";
import { HearIt, Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The pieces of /restaurants: Rasoi 27's own page on a phone next to the Soundbox, with orders arriving
// from the page, Zomato and Swiggy; the Soundbox you can press (including what happens when nobody
// does); and the morning summary, played on the owner's phone in WhatsApp. Dish photos are from
// Unsplash (public/photos/dish-*.webp).

type Channel = "page" | "zomato" | "swiggy";
// Each channel with its own colour (Zomato red, Swiggy orange, Zest turmeric for the restaurant's own
// page) as a dot and, when an order arrives from it, as the chip's ring and tint. The names stay in ink
// for contrast; Zomato keeps its lowercase italic wordmark.
const BRAND: Record<Channel, { color: string; label: Bi; mark: string }> = {
  page: { color: "#e9a31a", label: { en: "Your page", hi: "आपका पेज" }, mark: "font-semibold" },
  zomato: { color: "#e23744", label: { en: "zomato", hi: "zomato" }, mark: "font-extrabold italic lowercase tracking-[-0.03em]" },
  swiggy: { color: "#fc8019", label: { en: "Swiggy", hi: "Swiggy" }, mark: "font-extrabold tracking-[-0.02em]" },
};
const ARRIVALS: { ch: Channel; items: Bi; say: Bi; clip?: string }[] = [
  { ch: "page", items: { en: "Party order: 12 chicken biryani", hi: "पार्टी ऑर्डर: 12 चिकन बिरयानी" }, say: { en: "New order on your page. A party order, twelve chicken biryani.", hi: "आपके पेज पर नया ऑर्डर. पार्टी ऑर्डर, बारह चिकन बिरयानी." } },
  { ch: "swiggy", items: { en: "2 paneer tikka", hi: "2 पनीर टिक्का" }, say: { en: "New order on Swiggy. Two paneer tikka.", hi: "स्विगी पर नया ऑर्डर. दो पनीर टिक्का." }, clip: "swiggy" },
  { ch: "zomato", items: { en: "Butter chicken", hi: "बटर चिकन" }, say: { en: "New order on Zomato. One butter chicken.", hi: "ज़ोमैटो पर नया ऑर्डर. एक बटर चिकन." } },
];

const DISHES = [
  { name: "Chicken biryani", price: 349, photo: "/photos/dish-biryani.webp" },
  { name: "Butter chicken", price: 329, photo: "/photos/dish-butter-chicken.webp" },
  { name: "Tandoori chicken", price: 379, photo: "/photos/dish-tandoori.webp" },
];

/** Hero: Rasoi 27's page on a phone, the Soundbox beside it, and orders from three channels arriving in turn. */
export function RestaurantStage() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"arrive" | "speak" | "rest">("rest");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("speak");
      return setVisible(false);
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = [setTimeout(() => setPhase("arrive"), 300), setTimeout(() => setPhase("speak"), 1200), setTimeout(() => setPhase("rest"), 4600), setTimeout(() => setN((v) => v + 1), 8600)];
    return () => t.forEach(clearTimeout);
  }, [n, visible]);

  const now = ARRIVALS[n % ARRIVALS.length];
  const live = phase !== "rest";
  const state: SoundboxState = phase === "arrive" ? "ringing" : phase === "speak" ? "speaking" : "idle";
  return (
    <div ref={box}>
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        <RasoiPhone toast={live && now.ch === "page"} />
        <div className="flex flex-col items-center gap-5 pt-10 sm:pt-14">
          {/* Both sizes are rendered and CSS shows one, so the box never resizes after load. */}
          <div className="sm:hidden">
            <Soundbox size="xs" bare state={state} />
          </div>
          <div className="hidden sm:block">
            <Soundbox size="sm" bare state={state} />
          </div>
          <ul className="grid w-full gap-1.5">
            {(["page", "zomato", "swiggy"] as Channel[]).map((c) => {
              const on = live && now.ch === c;
              const br = BRAND[c];
              return (
                <li key={c} className="flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[14px] text-[var(--lp-ink)] transition-colors duration-500 sm:text-[15px]" style={{ background: on ? `color-mix(in srgb, ${br.color} 22%, var(--lp-paper))` : "var(--lp-paper)", boxShadow: on ? `inset 0 0 0 2px ${br.color}` : undefined }}>
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: br.color }} />
                  <span className={br.mark}>{pick(br.label)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="mx-auto mt-5 flex max-w-[40ch] flex-col items-center gap-2 text-center">
        <p key={`${n}-${phase === "rest"}`} className="sb-caption min-h-[3em] text-[16px] font-medium leading-snug">
          {(live || n > 0) && (
            <>
              <span className="text-[var(--lp-muted)]">Zest: </span>“{pick(now.say)}”
            </>
          )}
        </p>
        <HearIt clip={now.clip} />
      </figcaption>
    </div>
  );
}

/** Rasoi 27's own ordering page on a phone, with real dish photos; a party order lands on it. */
function RasoiPhone({ toast }: { toast: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[176px] shrink-0 rounded-[30px] bg-[#1c1f23] p-[5px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] sm:w-[230px] sm:rounded-[36px] sm:p-[7px]">
      <div className="relative h-[340px] overflow-hidden rounded-[25px] bg-[#fafaf6] text-[#1c1f23] sm:h-[440px] sm:rounded-[30px]">
        <div className="relative h-[92px] sm:h-[120px]">
          <Image src="/photos/hero-sizzler.webp" alt="" width={460} height={240} sizes="230px" loading="eager" className="size-full object-cover" />
          <span aria-hidden className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1f23]" />
          <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]">
            <Star aria-hidden size={10} className="fill-current" /> 4.3 · 30 min
          </span>
        </div>
        <div className="px-3 pt-2.5 sm:px-3.5">
          <p className="text-[16px] font-bold leading-tight sm:text-[18px]">Rasoi 27</p>
          <p className="text-[11px] text-[#545a61] sm:text-[12px]">North Indian · Biryani · Indiranagar</p>
        </div>
        <ul className="space-y-1.5 p-2 sm:p-2.5">
          {DISHES.map((d) => (
            <li key={d.name} className="flex items-center gap-2.5 rounded-xl bg-white p-1.5">
              <Image src={d.photo} alt="" width={112} height={112} sizes="56px" loading="eager" className="size-11 shrink-0 rounded-lg object-cover sm:size-14" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-tight sm:text-[13.5px]">{d.name}</p>
                <p className="text-[11.5px] sm:text-[12.5px]">₹{d.price}</p>
              </div>
              <span className="mr-1 grid size-6 shrink-0 place-items-center rounded-md border border-[#2f7a4c] text-[#2f7a4c]">
                <Plus aria-hidden size={13} strokeWidth={3} />
              </span>
            </li>
          ))}
        </ul>
        {/* the party order arriving on the page */}
        <div className={`absolute inset-x-2 bottom-2 rounded-2xl bg-[#1c1f23] p-2.5 text-white transition-[opacity,transform] duration-500 sm:inset-x-2.5 sm:p-3 ${toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <p className="text-[10.5px] font-semibold text-[#e9a31a] sm:text-[11.5px]">{pick({ en: "New order · your page", hi: "नया ऑर्डर · आपका पेज" })}</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug sm:text-[13px]">{pick({ en: "12 chicken biryani, office party", hi: "12 चिकन बिरयानी, ऑफ़िस पार्टी" })}</p>
          <p className="mt-1 inline-flex rounded-full bg-[#2f7a4c] px-2 py-0.5 text-[10.5px] font-semibold sm:text-[11px]">{pick({ en: "Paid ₹4,188 · UPI", hi: "₹4,188 मिले · UPI" })}</p>
        </div>
      </div>
    </div>
  );
}

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
      stable
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
                <button type="button" onClick={() => show(k)} className={`flex w-full items-start gap-3.5 rounded-2xl px-4 py-3 text-left transition-colors ${on ? "bg-[var(--lp-paper)]" : "hover:bg-[var(--lp-paper)]/60"}`} style={on ? { boxShadow: "inset 3px 0 0 var(--z-turmeric)" } : undefined}>
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
            <span className="grid size-8 place-items-center rounded-full bg-[#e9a31a] text-[14px] font-bold text-[#1c1f23]">Z</span>
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
