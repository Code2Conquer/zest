"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, IndianRupee, MessageCircle, ReceiptText, Star, TrendingUp } from "lucide-react";
import { Dish, Spice } from "@/components/dishes";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

type Event = { icon: typeof Star; agent: Bi; text: Bi; tint: string };

const EVENTS: Event[] = [
  {
    icon: BookOpen,
    agent: { en: "Menu agent", hi: "मेन्यू एजेंट" },
    text: { en: "Paused paneer tikka and malai tikka on Zomato and Swiggy", hi: "Zomato और Swiggy पर पनीर टिक्का और मलाई टिक्का रोके" },
    tint: "var(--leaf)",
  },
  {
    icon: Star,
    agent: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
    text: { en: "Drafted a reply to Karthik's 2★ review about cold dal", hi: "ठंडी दाल वाले कार्तिक के 2★ रिव्यू का जवाब तैयार किया" },
    tint: "var(--haldi-deep)",
  },
  {
    icon: IndianRupee,
    agent: { en: "Money agent", hi: "पैसे वाला एजेंट" },
    text: { en: "Found a ₹412 cancellation charge that shouldn't be there", hi: "₹412 का ग़लत कैंसलेशन चार्ज पकड़ा" },
    tint: "var(--chilli)",
  },
  {
    icon: ReceiptText,
    agent: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
    text: { en: "Order #3390 is running 6 min late. Told the rider.", hi: "ऑर्डर #3390 में 6 मिनट की देरी। राइडर को बता दिया।" },
    tint: "var(--ch-dine)",
  },
  {
    icon: TrendingUp,
    agent: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
    text: { en: "Weekend dinner promo ready: about 60 new orders for ₹4,500", hi: "वीकेंड डिनर प्रोमो तैयार: ₹4,500 में क़रीब 60 नए ऑर्डर" },
    tint: "var(--masala)",
  },
  {
    icon: MessageCircle,
    agent: { en: "Zest on WhatsApp", hi: "WhatsApp पर Zest" },
    text: { en: "Sent Aditi her 8 am summary: ₹42,490 yesterday, up 9%", hi: "अदिति को सुबह 8 बजे का सारांश भेजा: कल ₹42,490, 9% ज़्यादा" },
    tint: "var(--veg)",
  },
];

/**
 * The hero's single orchestrated moment: a thali on the pass while the agents'
 * work prints out beside it, one ticket at a time.
 */
export function LiveKitchen() {
  const { pick, state } = useApp();
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  const visible = [0, 1, 2].map((k) => {
    const i = (tick - k + EVENTS.length * 10) % EVENTS.length;
    return { key: tick - k, e: EVENTS[i] };
  });

  return (
    <div className="relative mx-auto w-full max-w-[560px] pt-14 sm:aspect-square sm:pt-0">
      {/* Whole spices scattered on the counter */}
      <Spice kind="star-anise" size={44} className="drift absolute left-[6%] top-[8%]" />
      <Spice kind="chilli" size={58} className="drift absolute right-[4%] top-[2%] [animation-delay:-3s]" />
      <Spice kind="cardamom" size={30} className="drift absolute bottom-[8%] left-[2%] [animation-delay:-5s]" />
      <Spice kind="leaf" size={36} className="drift absolute bottom-[2%] right-[30%] [animation-delay:-2s]" />
      <Spice kind="cinnamon" size={46} className="drift absolute left-[44%] top-[-2%] [animation-delay:-6s]" />

      {/* The thali */}
      <motion.div
        initial={reduce ? false : { scale: 0.85, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative mx-auto w-[82%] sm:absolute sm:left-0 sm:top-[4%] sm:w-[70%]"
      >
        <div className="turn">
          <Dish kind="thali" size={400} className="h-auto w-full drop-shadow-[0_24px_30px_rgba(60,35,0,0.28)]" label={state.lang === "hi" ? "थाली" : "A thali"} />
        </div>
        <svg viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <g className="steam" stroke="rgba(255,255,255,0.9)" strokeWidth={2.4} fill="none" strokeLinecap="round">
            <path d="M44 38 c-6 -8 6 -12 0 -22" />
            <path d="M58 32 c-6 -8 6 -12 0 -24" />
            <path d="M72 38 c-6 -8 6 -12 0 -22" />
          </g>
        </svg>
      </motion.div>

      {/* The owner's message */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute right-0 top-0 max-w-[75%] sm:right-[2%] sm:top-[8%] sm:max-w-[50%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.95rem] text-paper shadow-lg"
      >
        Paneer khatam ho gaya, band kar do
      </motion.p>

      {/* Agent tickets printing */}
      <ol className="relative -mt-10 w-full space-y-2 sm:absolute sm:-bottom-[6%] sm:right-0 sm:mt-0 sm:w-[64%]" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(({ key, e }, idx) => (
            <motion.li
              key={key}
              layout
              initial={{ opacity: 0, y: -16, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: idx === 0 ? 1 : idx === 1 ? 0.94 : 0.8, y: 0, clipPath: "inset(0 0 -10px 0)", scale: 1 - idx * 0.03 }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="ticket flex items-start gap-3 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(60,35,0,0.35)]"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-paper" style={{ background: e.tint }}>
                <e.icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.78rem] text-muted">
                  {pick(e.agent)}, {idx === 0 ? (state.lang === "hi" ? "अभी" : "just now") : state.lang === "hi" ? `${idx * 2} मिनट पहले` : `${idx * 2} min ago`}
                </span>
                <span className="block text-[0.95rem] leading-snug text-ink">{pick(e.text)}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
