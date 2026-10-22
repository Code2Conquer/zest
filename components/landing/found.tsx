"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Globe, MapPin, MessagesSquare, Search } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "Be the first name people find nearby": a phone searches for homemade rajma chawal and, as the
// result appears, the four places Zest sets the seller up light in turn. One sequence when the
// section comes into view, then still.

const PANELS: { id: string; icon: typeof Globe; agent: Bi; title: Bi; text: Bi }[] = [
  {
    id: "site",
    icon: Globe,
    agent: { en: "Storefront", hi: "स्टोरफ़्रंट" },
    title: { en: "Your own website", hi: "आपकी अपनी वेबसाइट" },
    text: { en: "A fast page with every dish, prices and photos, written so Google understands it. Each dish gets its own page, so “aloo paratha in Lajpat Nagar” can land on it.", hi: "हर डिश, क़ीमत और फ़ोटो के साथ तेज़ पेज, ऐसे लिखा कि Google समझे। हर डिश का अपना पेज, ताकि “लाजपत नगर में आलू पराठा” खोजने वाला सीधे वहीं पहुँचे।" },
  },
  {
    id: "google",
    icon: MapPin,
    agent: { en: "Storefront", hi: "स्टोरफ़्रंट" },
    title: { en: "Google listing", hi: "Google लिस्टिंग" },
    text: { en: "Your Google Business Profile with menu, hours, photos and an Order button. Home kitchens can show their delivery area without showing their home address.", hi: "मेन्यू, समय, फ़ोटो और ऑर्डर बटन के साथ आपकी Google बिज़नेस प्रोफ़ाइल। घर की रसोई अपना पता दिखाए बिना डिलीवरी का इलाक़ा दिखा सकती है।" },
  },
  {
    id: "ai",
    icon: MessagesSquare,
    agent: { en: "Growth", hi: "ग्रोथ" },
    title: { en: "AI answers", hi: "AI जवाब" },
    text: { en: "Your menu and details set up so ChatGPT and Google's AI answers can recommend you when someone asks “where can I get homemade food nearby?”", hi: "आपका मेन्यू और जानकारी ऐसे तैयार कि कोई पूछे “पास में घर का खाना कहाँ मिलेगा?” तो ChatGPT और Google के AI जवाब आपका नाम बताएँ।" },
  },
  {
    id: "insta",
    icon: Camera,
    agent: { en: "Growth", hi: "ग्रोथ" },
    title: { en: "Instagram and Facebook", hi: "Instagram और Facebook" },
    text: { en: "An order link in your bio, posts of today's menu drafted for you, and small local ads within the budget you set.", hi: "बायो में ऑर्डर लिंक, आज के मेन्यू की पोस्ट आपके लिए तैयार, और आपके बजट में आस-पास के छोटे विज्ञापन।" },
  },
];

export function GetFound() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1); // -1 before, 0 typing, 1 result, 2..5 panels lit

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setStep(9);
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timers = [0, 1300, 1900, 2500, 3100, 3700].map((at, k) => setTimeout(() => setStep(k), at));
      },
      { threshold: 0.35 },
    );
    if (box.current) io.observe(box.current);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const panel = (k: number) => {
    const p = PANELS[k];
    const lit = step >= k + 2;
    return (
      <li key={p.id} className={`rounded-[22px] p-5 transition-colors duration-500 ${lit ? "bg-[var(--lp-paper)] ring-2 ring-[var(--z-turmeric)]" : "bg-[var(--lp-paper)] ring-1 ring-[var(--lp-line)]"}`}>
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[17px] font-semibold">
            <p.icon aria-hidden size={18} className={lit ? "text-[var(--z-turmeric)]" : "text-[var(--lp-faint)]"} /> {pick(p.title)}
          </span>
          <span className="rounded-full bg-[var(--lp-sunken)] px-2.5 py-0.5 text-[12.5px] font-semibold">{pick(p.agent)}</span>
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--lp-muted)]">{pick(p.text)}</p>
      </li>
    );
  };

  const query = pick({ en: "homemade rajma chawal near me", hi: "घर का राजमा चावल मेरे पास" });
  return (
    <div ref={box} className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8">
      <ul className="grid gap-5 lg:order-1">{[0, 1].map(panel)}</ul>
      <div data-ui className="mx-auto w-[248px] shrink-0 rounded-[32px] bg-[#1c1f23] p-[7px] lg:order-2">
        <div className="h-[430px] overflow-hidden rounded-[26px] bg-white px-3.5 pt-8 text-[#1c1f23]">
          <p className="flex items-center gap-2 rounded-full bg-[#eef0f2] px-3.5 py-2.5 text-[13px]">
            <Search aria-hidden size={14} className="shrink-0 text-[#6f757c]" />
            <span className="truncate">{step >= 0 ? <span className={step === 0 ? "gf-type" : ""}>{query}</span> : <span className="text-[#8d939a]">{pick({ en: "Search", hi: "खोजें" })}</span>}</span>
          </p>
          {step >= 1 && (
            <div className="gf-in mt-4 space-y-3 text-[13px]">
              <div className="rounded-2xl p-3 ring-1 ring-[#d9dee3]">
                <p className="text-[12px] text-[#545a61]">{pick({ en: "Home kitchen · 4.8 · 1.2 km", hi: "घर की रसोई · 4.8 · 1.2 किमी" })}</p>
                <p className="mt-0.5 text-[16px] font-semibold text-[#2a5db0]">Meena&apos;s Kitchen</p>
                <p className="text-[#545a61]">{pick({ en: "Rajma chawal ₹90 · Open till 9:30 pm", hi: "राजमा चावल ₹90 · रात 9:30 तक खुला" })}</p>
                <span className="mt-2.5 inline-flex min-h-8 items-center rounded-full bg-[#2a5db0] px-3.5 font-semibold text-white">{pick({ en: "Order", hi: "ऑर्डर करें" })}</span>
              </div>
              <div className="rounded-2xl bg-[#f5f6f7] p-3">
                <p className="flex items-center gap-1 text-[12px] font-semibold text-[#545a61]">
                  <MessagesSquare aria-hidden size={12} /> {pick({ en: "AI answer", hi: "AI जवाब" })}
                </p>
                <p className="mt-1 leading-snug">{pick({ en: "For homemade rajma chawal nearby, Meena's Kitchen in Green Park is well rated and delivers.", hi: "पास में घर का राजमा चावल चाहिए तो ग्रीन पार्क की मीना की रसोई अच्छी रेटिंग वाली है और डिलीवरी करती है।" })}</p>
              </div>
              <div className="h-16 rounded-2xl bg-[#f5f6f7]" />
            </div>
          )}
        </div>
      </div>
      <ul className="grid gap-5 lg:order-3">{[2, 3].map(panel)}</ul>
    </div>
  );
}
