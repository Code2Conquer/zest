"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { HearIt, Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import { MEENA_MENU } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage's one big moment, about 8 seconds: Meena's menu, handwritten on paper, is
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
    <div ref={box}>
      <div className="flex items-start justify-center gap-3 sm:gap-6">
        {/* The handwritten note and the ordering page it becomes */}
        <div className="relative sm:flex sm:items-start sm:gap-6">
          <PaperNote scanning={beat === "scan"} lifted={lifted} />
          <SellerPhone lifted={lifted} round={round} order={showOrder ? order : null} paid={at("paid")} />
        </div>
        {/* The Soundbox, where the order lands */}
        <div className="relative pt-6 sm:pt-8">
          {beat === "travel" && (
            <span aria-hidden className="hs-token absolute -left-16 top-[90px] hidden rounded-full bg-[var(--lp-accent)] px-3 py-1 text-[13px] font-semibold text-[#1c1f23] xl:block">
              #118
            </span>
          )}
          {/* Both sizes are rendered and CSS shows one, so the box never resizes after load. */}
          <div className="sm:hidden">
            <Soundbox
              size="xs"
              bare
              stable
              state={sbState}
              ticket={{ title: "MEENA'S KITCHEN", lines: ["KOT 118", ...order.ticket], foot: `Paid ₹${order.paid} UPI` }}
              showTicket={at("print")}
            />
          </div>
          <div className="hidden sm:block">
            <Soundbox
              size="sm"
              bare
              stable
              state={sbState}
              ticket={{ title: "MEENA'S KITCHEN", lines: ["KOT 118", ...order.ticket], foot: `Paid ₹${order.paid} UPI` }}
              showTicket={at("print")}
            />
          </div>
          {beat === "press" && <Cursor />}
        </div>
      </div>
      {/* What Zest says, in one fixed place so nothing below it moves */}
      <div className="mt-4 flex min-h-[7.5rem] flex-col items-center gap-3 text-center">
        <p key={`${caption?.en}`} className="sb-caption max-w-[34ch] text-[17px] font-medium leading-snug" aria-live="polite">
          {caption && (
            <>
              <span className="text-[var(--lp-muted)]">Zest: </span>“{pick(caption)}”
            </>
          )}
        </p>
        <HearIt clip={round === 0 ? (at("press") ? "accepted" : at("speak") ? "new-order" : undefined) : undefined} />
      </div>
    </div>
  );
}

const ORDER_OF: Record<Beat, number> = { board: 0, scan: 1, lift: 2, bubble: 3, paid: 4, travel: 5, speak: 6, print: 7, press: 8, idle: 9 };

/** Meena's menu, written by hand on a torn notebook page: what a home kitchen or a thela starts from.
 * On a phone it sits over the ordering page and fades as the dishes arrive; on wider screens it sits
 * beside it. */
function PaperNote({ scanning, lifted }: { scanning: boolean; lifted: boolean }) {
  const { pick } = useApp();
  const lines: Bi[] = [
    { en: "Rajma chawal - 90", hi: "राजमा चावल - 90" },
    { en: "Aloo paratha - 60", hi: "आलू पराठा - 60" },
    { en: "Thali - 120", hi: "थाली - 120" },
  ];
  return (
    <figure
      className={`absolute left-1/2 top-16 z-20 w-[150px] -translate-x-1/2 rotate-[-4deg] transition-[opacity,transform] duration-700 sm:static sm:z-auto sm:w-[160px] sm:translate-x-0 ${lifted ? "pointer-events-none max-sm:scale-90 max-sm:opacity-0 sm:opacity-70" : ""}`}
    >
      <div className="note-paper relative overflow-hidden px-3.5 pb-4 pt-5 text-[#24348a]">
        <svg aria-hidden className="absolute inset-0 size-full" preserveAspectRatio="none">
          {Array.from({ length: 9 }, (_, k) => (
            <line key={k} x1="0" x2="100%" y1={30 + k * 22} y2={30 + k * 22} stroke="#c9d6ea" strokeWidth="1" />
          ))}
          <line x1="18" x2="18" y1="0" y2="100%" stroke="#e8a3a3" strokeWidth="1" />
        </svg>
        <div className="font-hand relative leading-[22px]">
          <p className="text-[17px] font-bold">{pick({ en: "Meena's Kitchen", hi: "मीना की रसोई" })}</p>
          <ul className="mt-0.5 text-[15px]">
            {lines.map((l) => (
              <li key={l.en}>{pick(l)}</li>
            ))}
          </ul>
          <p className="mt-0.5 text-[13px]">{pick({ en: "Order: 98xxx xxx01", hi: "ऑर्डर: 98xxx xxx01" })}</p>
        </div>
        {scanning && <span aria-hidden className="hs-scan absolute inset-x-0 top-0 h-[3px] bg-[var(--lp-accent)]" />}
      </div>
      <figcaption className="mt-2 text-center text-[13px] text-[var(--lp-muted)]">{pick({ en: "Your menu, as you write it", hi: "आपका मेन्यू, जैसे आप लिखते हैं" })}</figcaption>
    </figure>
  );
}

/** Meena's ordering page on a phone: dishes arrive from the photo, then a WhatsApp order and UPI payment. */
function SellerPhone({ lifted, round, order, paid }: { lifted: boolean; round: number; order: Order | null; paid: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[172px] shrink-0 rounded-[28px] bg-[#1c1f23] p-[5px] sm:w-[220px] sm:rounded-[30px] sm:p-[6px]">
      <div className="relative h-[330px] overflow-hidden rounded-[23px] sm:h-[404px] sm:rounded-[25px] bg-[#fafaf6] text-[#1c1f23] sm:h-[404px]">
        <span aria-hidden className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1f23]" />
        <div className="bg-[#e9a31a] px-3.5 pb-3 pt-8">
          <p className="text-[16px] font-bold leading-tight">Meena&apos;s Kitchen</p>
          <p className="text-[11.5px]">{pick({ en: "Home kitchen · Green Park · Pure veg", hi: "घर की रसोई · ग्रीन पार्क · शुद्ध शाकाहारी" })}</p>
        </div>
        <ul className="space-y-1 px-2.5 pt-2.5">
          {DISHES.map((d, k) => (
            <li key={d.name} className={`flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 sm:gap-2.5 sm:py-2.5 ${lifted ? (round === 0 ? "hs-lift" : "") : "opacity-0"}`} style={{ animationDelay: `${k * 380}ms` }}>
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
