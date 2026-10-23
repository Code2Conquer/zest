"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Check, PhoneCall, PhoneMissed, QrCode, Search, Star } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "The orders you already get, and lose": four kinds of order that never reach Zomato or Swiggy, each
// shown as it goes today and then, a moment later, with Zest. While on screen it walks through the four;
// picking one, or the Today / With Zest switch, takes over. Reduced motion shows "With Zest", still.

type Kind = "regulars" | "party" | "dinein" | "search";
const KINDS: { id: Kind; icon: typeof Check; title: Bi; line: Bi }[] = [
  { id: "regulars", icon: PhoneCall, title: { en: "Regulars who call", hi: "फ़ोन करने वाले ग्राहक" }, line: { en: "A slip of paper, lost in the rush", hi: "एक पर्ची, भीड़ में खो गई" } },
  { id: "party", icon: Briefcase, title: { en: "Office and party orders", hi: "ऑफ़िस और पार्टी ऑर्डर" }, line: { en: "Long calls and a cash advance", hi: "लंबी कॉल और नकद एडवांस" } },
  { id: "dinein", icon: QrCode, title: { en: "Dine-in guests, at home", hi: "डाइन-इन मेहमान, घर पर" }, line: { en: "Loved the food, forgot your name", hi: "खाना पसंद आया, नाम भूल गए" } },
  { id: "search", icon: Search, title: { en: "People searching your name", hi: "आपका नाम खोजने वाले" }, line: { en: "Google shows a busy line", hi: "Google पर लाइन व्यस्त" } },
];
const FLIP_MS = 1800;
const NEXT_MS = 6000;

export function LostOrders() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const [zest, setZest] = useState(false);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      setZest(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Today first, then the flip to Zest, then the next kind.
  useEffect(() => {
    if (!auto || !inView) return;
    setZest(false);
    const t = [setTimeout(() => setZest(true), FLIP_MS), setTimeout(() => setK((x) => (x + 1) % KINDS.length), NEXT_MS)];
    return () => t.forEach(clearTimeout);
  }, [k, auto, inView]);

  const choose = (i: number) => {
    setAuto(false);
    setK(i);
    setZest(false);
    setTimeout(() => setZest(true), FLIP_MS);
  };
  const kind = KINDS[k].id;

  return (
    <div ref={box} className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
      {/* The four kinds: a list on wide screens, a scrolling row on a phone */}
      <div role="tablist" aria-label={pick({ en: "Kinds of order", hi: "ऑर्डर के प्रकार" })} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {KINDS.map((x, i) => {
          const on = i === k;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => choose(i)}
              className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors lg:py-4 ${on ? "bg-[var(--lp-paper)]" : "hover:bg-[var(--lp-paper)]/60"}`}
              style={on ? { boxShadow: "inset 3px 0 0 var(--z-turmeric)" } : undefined}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-sunken)] text-[var(--lp-muted)]"}`}>
                <x.icon aria-hidden size={18} />
              </span>
              <span className="min-w-0">
                <span className={`block whitespace-nowrap text-[16px] font-semibold leading-snug ${on ? "" : "text-[var(--lp-muted)]"}`}>{pick(x.title)}</span>
                <span className="hidden text-[14.5px] leading-snug text-[var(--lp-muted)] lg:block">{pick(x.line)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* The stage: today, then with Zest */}
      <div role="tabpanel" className="flex flex-col rounded-[24px] bg-[var(--lp-paper)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div role="radiogroup" aria-label={pick({ en: "Today or with Zest", hi: "आज या Zest के साथ" })} className="inline-flex rounded-full bg-[var(--lp-sunken)] p-1 text-[14px] font-semibold">
            {[false, true].map((z) => (
              <button
                key={String(z)}
                type="button"
                role="radio"
                aria-checked={zest === z}
                onClick={() => {
                  setAuto(false);
                  setZest(z);
                }}
                className={`min-h-9 rounded-full px-4 transition-colors ${zest === z ? (z ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-ink)] text-[var(--lp-on-ink)]") : "text-[var(--lp-muted)]"}`}
              >
                {z ? pick({ en: "With Zest", hi: "Zest के साथ" }) : pick({ en: "Today", hi: "आज" })}
              </button>
            ))}
          </div>
          <p className="truncate text-[14px] text-[var(--lp-muted)] lg:hidden">{pick(KINDS[k].line)}</p>
        </div>
        <div key={`${kind}-${zest}`} className="jr-in mt-4 grid h-[260px] place-items-center rounded-[18px] bg-[var(--lp-sunken)] sm:h-[280px]">
          {kind === "regulars" && (zest ? <RegularZest /> : <RegularToday />)}
          {kind === "party" && (zest ? <PartyZest /> : <PartyToday />)}
          {kind === "dinein" && (zest ? <DineZest /> : <DineToday />)}
          {kind === "search" && (zest ? <SearchZest /> : <SearchToday />)}
        </div>
      </div>
    </div>
  );
}

/* ---- the scenes: small pieces of the real world, drawn as interface ---- */

// The scene cards float above the stage like the real objects they stand for. taste-skill-ignore
const card = "w-[280px] rounded-2xl bg-white p-3.5 text-[#1c1f23] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]"; // taste-skill-ignore

function Slip({ lines, note }: { lines: string[]; note?: string }) {
  return (
    <div data-ui className="note-paper w-[240px] rotate-[-3deg] px-4 pb-4 pt-6 text-[#24348a]">
      <div className="font-hand text-[17px] leading-[24px]">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
        {note && <p className="mt-1 text-[#c23a22] line-through decoration-2">{note}</p>}
      </div>
    </div>
  );
}

function RegularToday() {
  return (
    <div className="flex items-center gap-4">
      <div data-ui className={`${card} w-[200px] max-sm:hidden`}>
        {["Rahul", "Rahul", "Unknown"].map((n, i) => (
          <p key={i} className="flex items-center gap-2 py-1 text-[13px]">
            <PhoneMissed aria-hidden size={14} className="text-[#c23a22]" />
            <span className="flex-1 font-medium">{n}</span>
            <span className="text-[#6f757c]">8:1{2 + i} pm</span>
          </p>
        ))}
      </div>
      <Slip lines={["Rahul - 2 dal makhani", "4 naan, 9 pm??"]} note="sent?" />
    </div>
  );
}
function RegularZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "New order · your page", hi: "नया ऑर्डर · आपका पेज" })}</p>
      <p className="mt-1 text-[15px] font-semibold">Rahul · 2 Dal makhani, 4 Naan</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
        <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "Paid ₹734 · UPI", hi: "₹734 मिले · UPI" })}
      </p>
      <p className="mt-2 text-[12.5px] text-[#545a61]">{pick({ en: "Saved as a regular · 14th order", hi: "पुराने ग्राहक में सेव · 14वाँ ऑर्डर" })}</p>
    </div>
  );
}

function PartyToday() {
  return <Slip lines={["Fri office party", "12 biryani? 15?", "advance 2000 cash"]} note="paid?" />;
}
function PartyZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "Party order · Friday, 1 pm", hi: "पार्टी ऑर्डर · शुक्रवार, 1 बजे" })}</p>
      <p className="mt-1 text-[15px] font-semibold">12 × Chicken biryani</p>
      <p className="text-[13px] text-[#545a61]">{pick({ en: "Acme Labs, 4th floor · Priya", hi: "Acme Labs, चौथी मंज़िल · प्रिया" })}</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
        <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "Paid ₹4,188 upfront", hi: "₹4,188 पहले ही मिले" })}
      </p>
    </div>
  );
}

function Bill({ qr }: { qr: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[230px] bg-white px-4 pb-5 pt-4 font-kot text-[12px] leading-[1.5] text-[#1c1f23] [clip-path:polygon(0_0,100%_0,100%_calc(100%-6px),90%_100%,80%_calc(100%-6px),70%_100%,60%_calc(100%-6px),50%_100%,40%_calc(100%-6px),30%_100%,20%_calc(100%-6px),10%_100%,0_calc(100%-6px))]">
      <p className="text-center font-semibold">RASOI 27</p>
      <p className="text-center">Table 6 · 8:42 pm</p>
      <p className="mt-2 flex justify-between"><span>Dal makhani</span><span>249</span></p>
      <p className="flex justify-between"><span>Chicken biryani</span><span>349</span></p>
      <p className="flex justify-between"><span>Garlic naan x4</span><span>276</span></p>
      <p className="mt-1 flex justify-between font-semibold"><span>TOTAL</span><span>874</span></p>
      {qr ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[#fbefd3] p-2 font-sans">
          <QrCode aria-hidden size={34} />
          <span className="text-[11.5px] font-semibold leading-tight">{pick({ en: "Order from home: scan to open our page", hi: "घर से ऑर्डर: हमारा पेज खोलने के लिए स्कैन करें" })}</span>
        </div>
      ) : (
        <p className="mt-3 text-center">Thank you. Visit again!</p>
      )}
    </div>
  );
}
function DineToday() {
  return <Bill qr={false} />;
}
function DineZest() {
  return <Bill qr />;
}

function Result({ zest }: { zest: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`${card} w-[300px]`}>
      <p className="flex items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1.5 text-[13px] text-[#545a61]">
        <Search aria-hidden size={14} /> rasoi 27 indiranagar
      </p>
      <p className="mt-3 text-[16px] font-semibold text-[#1a0dab]">Rasoi 27</p>
      <p className="flex items-center gap-1 text-[12.5px] text-[#545a61]">
        4.3 <Star aria-hidden size={11} className="fill-[#e9a31a] text-[#e9a31a]" /> · North Indian · Open
      </p>
      <div className="mt-3 flex gap-2">
        {zest ? (
          <span className="rounded-full bg-[#e9a31a] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Order online", hi: "ऑनलाइन ऑर्डर" })}</span>
        ) : (
          <span className="rounded-full bg-[#f1f3f4] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Call", hi: "कॉल" })}</span>
        )}
        <span className="rounded-full bg-[#f1f3f4] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Directions", hi: "रास्ता" })}</span>
      </div>
      {!zest && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#c23a22]"><PhoneMissed aria-hidden size={13} /> {pick({ en: "Line busy. Try again later.", hi: "लाइन व्यस्त है। बाद में कोशिश करें।" })}</p>}
    </div>
  );
}
function SearchToday() {
  return <Result zest={false} />;
}
function SearchZest() {
  return <Result zest />;
}
