"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BatteryFull, Camera, CheckCheck, ChevronLeft, Globe, Mic, Phone, Plus, Signal, Star, Video, Wifi } from "lucide-react";
import { HearIt, Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The pieces of /restaurants: Rasoi 27's own page on a phone next to the Soundbox, with orders arriving
// from the page, Zomato and Swiggy; the Soundbox you can press (including what happens when nobody
// does); and the morning summary as it lands on the owner's phone in WhatsApp. Dish photos are from
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

/** The morning summary as it lands on the owner's phone: a WhatsApp chat with Zest. */
export function MorningSummary() {
  const { pick } = useApp();
  return (
    <div data-ui className="mx-auto w-[290px] shrink-0 rounded-[44px] bg-[#1c1f23] p-[9px] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)] sm:w-[310px]">
      <div className="relative flex h-[540px] flex-col overflow-hidden rounded-[36px] bg-[#efeae2] text-[#111b21]">
        {/* status bar and the island */}
        <div className="flex items-center justify-between bg-[#f6f6f6] px-6 pb-1 pt-3 text-[12px] font-semibold">
          <span>7:30</span>
          <span aria-hidden className="absolute left-1/2 top-2.5 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#1c1f23]" />
          <span className="flex items-center gap-1">
            <Signal aria-hidden size={12} />
            <Wifi aria-hidden size={12} />
            <BatteryFull aria-hidden size={14} />
          </span>
        </div>
        {/* the chat header (WhatsApp's own bar and divider; taste-skill-ignore) */}
        <div className="flex items-center gap-2.5 border-b border-[#e5e5e5] bg-[#f6f6f6] px-3 py-2">{/* taste-skill-ignore */}
          <ChevronLeft aria-hidden size={20} className="text-[#007aff]" />
          <span className="grid size-8 place-items-center rounded-full bg-[#e9a31a] text-[14px] font-bold text-[#1c1f23]">Z</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[14px] font-semibold">Zest</p>
            <p className="text-[11px] text-[#54656f]">{pick({ en: "online", hi: "ऑनलाइन" })}</p>
          </div>
          <Video aria-hidden size={18} className="text-[#007aff]" />
          <Phone aria-hidden size={16} className="text-[#007aff]" />
        </div>
        {/* the messages */}
        <div className="flex-1 space-y-2 overflow-hidden px-2.5 py-3 text-[12.5px] leading-[1.45]">
          <p className="mx-auto w-fit rounded-md bg-white/80 px-2 py-0.5 text-[11px] text-[#54656f]">{pick({ en: "Today", hi: "आज" })}</p>
          <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white px-2.5 py-2 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{/* WhatsApp bubble shadow, taste-skill-ignore */}
            <p className="font-semibold">{pick({ en: "Good morning, Aditi. Yesterday at Rasoi 27:", hi: "सुप्रभात अदिति। कल Rasoi 27 में:" })}</p>
            <table className="mt-1.5 w-full">
              <tbody>
                {[
                  ["Zomato", "₹1,419", "4"],
                  ["Swiggy", "₹1,039", "3"],
                  [pick({ en: "Your page", hi: "आपका पेज" }), "₹4,477", "2"],
                ].map(([k, amt, n]) => (
                  <tr key={k}>
                    <td className="py-px">{k}</td>
                    <td className="py-px text-right tabular-nums">{amt}</td>
                    <td className="py-px pl-2 text-right tabular-nums text-[#667781]">
                      {n} {pick({ en: "orders", hi: "ऑर्डर" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5">{pick({ en: "Payouts: Swiggy ₹67,238 on Tuesday, Zomato ₹80,490 on Wednesday.", hi: "पेआउट: स्विगी ₹67,238 मंगलवार, ज़ोमैटो ₹80,490 बुधवार।" })}</p>
            <p className="mt-1">{pick({ en: "Ratings: Zomato 4.2 (up 0.1), Swiggy 4.0.", hi: "रेटिंग: ज़ोमैटो 4.2 (0.1 ऊपर), स्विगी 4.0।" })}</p>
            <p className="mt-0.5 text-right text-[10px] text-[#54656f]">7:30</p>
          </div>
          <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white px-2.5 py-2 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{/* WhatsApp bubble shadow, taste-skill-ignore */}
            <p className="font-semibold">{pick({ en: "One review needs a reply", hi: "एक रिव्यू का जवाब देना है" })}</p>
            <p className="mt-0.5">{pick({ en: "Karthik, 2 stars on Swiggy: “Dal was cold by the time it reached.” I've drafted a reply. Post it?", hi: "कार्तिक, स्विगी पर 2 स्टार: “दाल पहुँचते-पहुँचते ठंडी हो गई।” जवाब तैयार है। पोस्ट कर दूँ?" })}</p>
            <p className="mt-0.5 text-right text-[10px] text-[#54656f]">7:30</p>
          </div>
          <div className="ml-auto w-fit max-w-[80%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)]">{/* WhatsApp bubble shadow, taste-skill-ignore */}
            <p>
              {pick({ en: "Yes, post it", hi: "हाँ, पोस्ट करो" })}
              <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[10px] text-[#54656f]">
                7:42 <CheckCheck aria-hidden size={13} className="text-[#53bdeb]" />
              </span>
            </p>
          </div>
        </div>
        {/* the input bar */}
        <div className="flex items-center gap-2 bg-[#f6f6f6] px-3 pb-6 pt-2">
          <Plus aria-hidden size={20} className="text-[#007aff]" />
          <span className="h-8 flex-1 rounded-full border border-[#e1e1e1] bg-white" />
          <Camera aria-hidden size={18} className="text-[#007aff]" />
          <Mic aria-hidden size={18} className="text-[#007aff]" />
        </div>
      </div>
    </div>
  );
}
