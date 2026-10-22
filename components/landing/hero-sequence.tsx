"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import { MEENA_MENU } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage's one big moment, about 8 seconds: a photo of Meena's handwritten menu board is
// scanned, its dishes lift onto her new ordering page, a WhatsApp order arrives and is paid by UPI,
// the order travels into the Soundbox, which speaks it, prints the KOT and is accepted. Then it idles,
// and while the hero is on screen a new order arrives every 10 seconds. It pauses off screen; with
// reduced motion it shows the finished state.

const DISHES = ["Rajma chawal", "Aloo paratha", "Thali"].map((n) => MEENA_MENU.find((d) => d.name === n)!);

type Order = { text: string; paid: number; ticket: string[]; say: Bi; clip?: string; done: Bi };
const FIRST: Order = {
  text: "2 aloo paratha, 1 rajma chawal, Flat 302",
  paid: 270,
  ticket: ["2 Aloo paratha|120", "1 Rajma chawal|90", "Zomato rider|60", "Flat 302, Green Park"],
  say: { en: "New order! Two aloo paratha, one rajma chawal. Payment received.", hi: "नया ऑर्डर! दो आलू पराठा, एक राजमा चावल. पैसे मिल गए." },
  clip: "new-order",
  done: { en: "Accepted. Zomato rider at 1:05.", hi: "ऑर्डर मंज़ूर. ज़ोमैटो राइडर 1:05 पर." },
};
const MORE: Order[] = [
  {
    text: "1 thali, pickup at 1:30",
    paid: 120,
    ticket: ["1 Thali|120", "Pickup 1:30 pm"],
    say: { en: "New order! One thali, for pickup at 1:30. Payment received.", hi: "नया ऑर्डर! एक थाली, 1:30 बजे पिकअप. पैसे मिल गए." },
    done: { en: "Accepted. Ready for pickup at 1:30.", hi: "ऑर्डर मंज़ूर. 1:30 बजे पिकअप के लिए तैयार." },
  },
  {
    text: "2 rajma chawal, B-14 Green Park",
    paid: 240,
    ticket: ["2 Rajma chawal|180", "Zomato rider|60", "B-14, Green Park"],
    say: { en: "New order! Two rajma chawal, for B-14. Payment received.", hi: "नया ऑर्डर! दो राजमा चावल, B-14 के लिए. पैसे मिल गए." },
    done: { en: "Accepted. Zomato rider at 1:40.", hi: "ऑर्डर मंज़ूर. ज़ोमैटो राइडर 1:40 पर." },
  },
];

// Beats of the sequence, in ms from the start.
const T = { scan: 300, lift: 1500, bubble: 3300, paid: 4000, travel: 4500, speak: 5100, print: 6500, press: 7700, idle: 9200 };
type Beat = "board" | "scan" | "lift" | "bubble" | "paid" | "travel" | "speak" | "print" | "press" | "idle";

export function HeroSequence() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState<Beat>("board");
  const [round, setRound] = useState(0); // 0 = the menu-photo opening; later rounds are new orders
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStill(true);
      setBeat("idle");
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Play one round: the opening on round 0, a shorter new-order round after that.
  useEffect(() => {
    if (still || !visible) return;
    const opening = round === 0;
    const plan: [Beat, number][] = opening
      ? [["scan", T.scan], ["lift", T.lift], ["bubble", T.bubble], ["paid", T.paid], ["travel", T.travel], ["speak", T.speak], ["print", T.print], ["press", T.press], ["idle", T.idle]]
      : [["bubble", 0], ["paid", 700], ["travel", 1200], ["speak", 1800], ["print", 3200], ["press", 4400], ["idle", 5900]];
    const timers = plan.map(([b, at]) => setTimeout(() => setBeat(b), at));
    // the next order, ten seconds after this round settles
    timers.push(setTimeout(() => setRound((r) => r + 1), (opening ? T.idle : 5900) + 10000));
    return () => timers.forEach(clearTimeout);
  }, [round, visible, still]);

  const order = round === 0 ? FIRST : MORE[(round - 1) % MORE.length];
  const at = (b: Beat) => ORDER_OF[beat] >= ORDER_OF[b];
  const lifted = round > 0 || at("lift");
  const sbState: SoundboxState = beat === "travel" ? "ringing" : beat === "speak" ? "speaking" : beat === "print" ? "printing" : beat === "press" || beat === "idle" ? "accepted" : "idle";
  const caption: Bi | undefined = at("press") ? order.done : at("speak") ? order.say : at("travel") ? { en: "New order!", hi: "नया ऑर्डर!" } : undefined;
  const showOrder = at("bubble");

  return (
    <div ref={box} className="relative grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[auto_auto] md:justify-center md:gap-8 xl:grid-cols-[auto_auto_auto] xl:items-start">
      {/* The menu board photo and the ordering page, side by side */}
      <div className="flex items-start justify-center gap-4 xl:contents">
        <MenuBoard scanning={beat === "scan"} faded={lifted} />
        <SellerPhone lifted={lifted} round={round} order={showOrder ? order : null} paid={at("paid")} />
      </div>
      {/* The order travelling to the Soundbox */}
      <div className="relative flex justify-center md:col-span-2 xl:col-span-1">
        {beat === "travel" && (
          <span aria-hidden className="hs-token absolute -left-28 top-[86px] hidden rounded-full bg-[var(--lp-accent)] px-3 py-1 text-[13px] font-semibold text-[#1c1f23] xl:block">
            #118
          </span>
        )}
        <Soundbox
          size="sm"
          state={sbState}
          caption={caption}
          clip={round === 0 ? (at("press") ? "accepted" : at("speak") ? "new-order" : undefined) : undefined}
          ticket={{ title: "MEENA'S KITCHEN", lines: ["KOT 118", ...order.ticket], foot: `Paid ₹${order.paid} UPI` }}
          showTicket={at("print")}
        />
        {beat === "press" && <Cursor />}
      </div>
      <p className="sr-only" aria-live="polite">
        {caption ? pick(caption) : ""}
      </p>
    </div>
  );
}

const ORDER_OF: Record<Beat, number> = { board: 0, scan: 1, lift: 2, bubble: 3, paid: 4, travel: 5, speak: 6, print: 7, press: 8, idle: 9 };

/** A phone photo of Meena's handwritten menu board, with a scan line passing over it. */
function MenuBoard({ scanning, faded }: { scanning: boolean; faded: boolean }) {
  const { pick } = useApp();
  return (
    <figure className={`relative w-[118px] shrink-0 rotate-[-4deg] transition-opacity duration-700 sm:w-[150px] ${faded ? "opacity-60" : ""}`}>
      <div className="overflow-hidden rounded-[18px] bg-[#1c1f23] p-[5px]">
        <div className="relative overflow-hidden rounded-[14px] bg-[#2e3a33] px-2.5 pb-4 pt-3 text-[#f1efe4] sm:px-3">
          <p className="hs-chalk text-[13px] sm:text-[15px]">Meena&apos;s Kitchen</p>
          <ul className="hs-chalk mt-2 space-y-1.5 text-[12px] sm:text-[14px]">
            <li>Rajma chawal 90</li>
            <li>Aloo paratha 60</li>
            <li>Thali 120</li>
          </ul>
          <p className="hs-chalk mt-2 text-[11px] opacity-80 sm:text-[12px]">Order: 98xxx xxx01</p>
          {scanning && <span aria-hidden className="hs-scan absolute inset-x-0 top-0 h-[3px] bg-[var(--lp-accent)]" />}
        </div>
      </div>
      <figcaption className="mt-2 text-center text-[13px] text-[var(--lp-muted)]">{pick({ en: "Your menu photo", hi: "आपके मेन्यू की फ़ोटो" })}</figcaption>
    </figure>
  );
}

/** Meena's ordering page on a phone: dishes arrive from the photo, then a WhatsApp order and UPI payment. */
function SellerPhone({ lifted, round, order, paid }: { lifted: boolean; round: number; order: Order | null; paid: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[196px] shrink-0 rounded-[30px] bg-[#1c1f23] p-[6px] sm:w-[220px]">
      <div className="relative h-[372px] overflow-hidden rounded-[25px] bg-[#fafaf6] text-[#1c1f23] sm:h-[404px]">
        <span aria-hidden className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1f23]" />
        <div className="bg-[#e9a31a] px-3.5 pb-3 pt-8">
          <p className="text-[16px] font-bold leading-tight">Meena&apos;s Kitchen</p>
          <p className="text-[11.5px]">{pick({ en: "Home kitchen · Green Park · Pure veg", hi: "घर की रसोई · ग्रीन पार्क · शुद्ध शाकाहारी" })}</p>
        </div>
        <ul className="space-y-1 px-2.5 pt-2.5">
          {DISHES.map((d, k) => (
            <li key={d.name} className={`flex items-center gap-2 rounded-xl bg-white p-1.5 sm:gap-2.5 ${lifted ? (round === 0 ? "hs-lift" : "") : "opacity-0"}`} style={{ animationDelay: `${k * 380}ms` }}>
              <img src={d.thumb} alt="" width={44} height={44} className="size-9 shrink-0 rounded-lg object-cover sm:size-11" />
              <div className="min-w-0 flex-1">
                <p className="flex items-start gap-1 text-[12.5px] font-semibold leading-tight">
                  <span className="mt-[1px]">
                    <VegMark />
                  </span>
                  <span className="min-w-0">{d.name}</span>
                </p>
                <p className="text-[12px]">₹{d.price}</p>
              </div>
              <span className="rounded-md border border-[#2f7a4c] px-1.5 py-0.5 text-[10.5px] font-bold text-[#2f7a4c]">ADD</span>
            </li>
          ))}
        </ul>
        {order && (
          <div key={order.text} className="absolute inset-x-2 bottom-2 space-y-1.5">
            <div className="hs-bubble rounded-xl rounded-tl-sm bg-[#dcf8c6] p-2.5 text-[12.5px] leading-snug">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-[#1f6b3a]">
                <MessageCircle aria-hidden size={12} /> WhatsApp
              </p>
              <p className="mt-0.5">{order.text}</p>
            </div>
            {paid && (
              <p className="hs-chip ml-auto flex w-fit items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-1 text-[12px] font-semibold text-white">
                <Check aria-hidden size={13} strokeWidth={3} /> {pick({ en: `Paid ₹${order.paid}`, hi: `₹${order.paid} मिल गए` })} · UPI
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VegMark() {
  return (
    <span role="img" aria-label="Veg" className="grid size-3 shrink-0 place-items-center rounded-[2px] border-[1.5px] border-[#2f7a4c]">
      <span className="size-1.5 rounded-full bg-[#2f7a4c]" />
    </span>
  );
}

/** A pointer that comes in and presses the Soundbox's big button. */
function Cursor() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="hs-cursor pointer-events-none absolute left-1/2 top-0 z-30 size-7">
      <path d="M4 2 L4 19 L9 14.5 L12.5 22 L15.5 20.6 L12 13.3 L18.5 13.3 Z" fill="#1c1f23" stroke="#fafaf6" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
