"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { BookOpen, IndianRupee, MessageCircle, ReceiptText, Star, TrendingUp } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

type Event = { icon: typeof Star; agent: Bi; text: Bi; tint: string };

const EVENTS: Event[] = [
  {
    icon: ReceiptText,
    agent: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
    text: { en: "Swiggy #4821 · 2× Hyderabadi biryani · ₹598 accepted", hi: "Swiggy #4821 · 2× हैदराबादी बिरयानी · ₹598 स्वीकार" },
    tint: "#d9820a",
  },
  {
    icon: Star,
    agent: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
    text: { en: "Drafted a reply to Karthik's 2★ review about cold dal", hi: "ठंडी दाल वाले कार्तिक के 2★ रिव्यू का जवाब तैयार किया" },
    tint: "#f2b035",
  },
  {
    icon: IndianRupee,
    agent: { en: "Money agent", hi: "पैसे वाला एजेंट" },
    text: { en: "Found a ₹412 cancellation charge that shouldn't be there", hi: "₹412 का ग़लत कैंसलेशन चार्ज पकड़ा" },
    tint: "#ef7a68",
  },
  {
    icon: BookOpen,
    agent: { en: "Menu agent", hi: "मेन्यू एजेंट" },
    text: { en: "Matched paneer tikka to ₹289 on Zomato and Swiggy", hi: "Zomato और Swiggy पर पनीर टिक्का ₹289 किया" },
    tint: "#6cc196",
  },
  {
    icon: TrendingUp,
    agent: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
    text: { en: "Weekend dinner promo ready: about 60 new orders for ₹4,500", hi: "वीकेंड डिनर प्रोमो तैयार: ₹4,500 में क़रीब 60 नए ऑर्डर" },
    tint: "#c98a0c",
  },
  {
    icon: MessageCircle,
    agent: { en: "Zest on WhatsApp", hi: "WhatsApp पर Zest" },
    text: { en: "Sent the 8 am summary: ₹42,490 yesterday, up 9%", hi: "सुबह 8 बजे का सारांश भेजा: कल ₹42,490, 9% ज़्यादा" },
    tint: "#2b8a3e",
  },
];

/**
 * Wisps of steam: soft white shapes warped by animated turbulence, rising and
 * fading the way steam does over a hot handi.
 */
function Steam({ className = "", wisps = 5 }: { className?: string; wisps?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden viewBox="0 0 200 260" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none overflow-visible ${className}`}>
      <defs>
        <filter id={`warp-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves="3" seed="7" result="noise">
            <animate attributeName="baseFrequency" dur="14s" values="0.012 0.035;0.016 0.05;0.012 0.035" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="44" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id={`fill-${id}`}>
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter={`url(#warp-${id})`}>
        {Array.from({ length: wisps }, (_, i) => (
          <ellipse key={i} className="wisp" cx={60 + ((i * 37) % 90)} cy={250} rx={26 + (i % 3) * 8} ry={44 + (i % 2) * 14} fill={`url(#fill-${id})`} style={{ animationDelay: `${i * -1.3}s` }} />
        ))}
      </g>
    </svg>
  );
}

/** The hero's photo stage: a biryani handi with steam, a sizzler, and the agents' work landing on top. */
export function HeroStage() {
  const { pick } = useApp();
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((t) => t + 1), 2800);
    return () => clearInterval(id);
  }, [reduce]);

  // Gentle parallax: layers drift against the pointer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const backX = useTransform(sx, (v) => v * -10);
  const backY = useTransform(sy, (v) => v * -10);
  const frontX = useTransform(sx, (v) => v * 18);
  const frontY = useTransform(sy, (v) => v * 18);

  const visible = [0, 1, 2].map((k) => {
    const i = (((tick - k) % EVENTS.length) + EVENTS.length) % EVENTS.length;
    return { key: tick - k, e: EVENTS[i] };
  });

  return (
    <div
      className="relative mx-auto aspect-[4/5] w-full max-w-[520px] lg:ml-auto lg:mr-0"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      {/* Main photo */}
      <motion.div style={{ x: backX, y: backY }} className="absolute inset-0 overflow-hidden rounded-[32px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        <img
          src="/photos/hero-biryani.webp"
          srcSet="/photos/hero-biryani-sm.webp 560w, /photos/hero-biryani.webp 1000w"
          sizes="(min-width: 1024px) 520px, 90vw"
          alt="Biryani in a clay handi, garnished with mint and fried onions"
          width={1000}
          height={1250}
          fetchPriority="high"
          className="kenburns h-full w-full object-cover"
        />
        {/* Warm key light from the top left, darker toward the cards */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(255,190,90,0.18),transparent_55%),linear-gradient(to_top,rgba(10,14,12,0.55),transparent_45%)]" />
        <Steam className="absolute left-[14%] top-[4%] h-[52%] w-[70%] opacity-90" wisps={6} />
      </motion.div>

      {/* Sizzler, overlapping bottom left */}
      <motion.div
        style={{ x: frontX, y: frontY }}
        initial={reduce ? false : { opacity: 0, y: 30, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -5 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute -bottom-8 -left-2 w-[44%] sm:-left-12"
      >
        <div className="relative overflow-hidden rounded-2xl shadow-[0_30px_50px_-20px_rgba(0,0,0,0.75)] ring-4 ring-[#0f1612]">
          <img src="/photos/hero-sizzler.webp" alt="Paneer tikka on a hot sizzler plate" width={640} height={480} loading="eager" className="aspect-[4/3] w-full object-cover" />
          <Steam className="absolute inset-x-0 -top-6 h-[90%] w-full opacity-75" wisps={4} />
        </div>
      </motion.div>

      {/* Live strip, top left */}
      <motion.div
        style={{ x: frontX, y: frontY }}
        initial={reduce ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute left-2 top-6 rounded-2xl bg-white/85 px-4 py-3 text-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md sm:-left-10"
      >
        <p className="flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-wider text-[#3e4a44]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2b8a3e] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[#2b8a3e]" />
          </span>
          {pick({ en: "Yesterday", hi: "कल" })}
        </p>
        <p className="mt-0.5 text-[1.5rem] font-semibold leading-none tracking-tight">₹42,490</p>
        <p className="mt-1 text-[0.8rem] text-[#2b6a4b]">▲ 9% · 106 {pick({ en: "orders", hi: "ऑर्डर" })}</p>
      </motion.div>

      {/* The agents' work, landing one card at a time */}
      <ol aria-live="polite" className="absolute bottom-8 right-2 w-[84%] space-y-2 sm:-right-8 sm:w-[70%]">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(({ key, e }, idx) => (
            <motion.li
              key={key}
              layout
              initial={reduce ? false : { opacity: 0, y: -18, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: idx === 0 ? 1 : idx === 1 ? 0.92 : 0.75, y: 0, scale: 1 - idx * 0.035, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 14, transition: { duration: 0.25 } }}
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              className="flex items-start gap-3 rounded-2xl bg-white/90 px-3.5 py-3 text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] ring-1 ring-black/5 backdrop-blur-md"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-white" style={{ background: e.tint }}>
                <e.icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.72rem] font-medium text-[#66726b]">{pick(e.agent)}</span>
                <span className="block text-[0.9rem] leading-snug">{pick(e.text)}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
