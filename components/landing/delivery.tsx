"use client";

import { useEffect, useRef, useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "Pickup, your helper or a Zomato rider": one kitchen, three guests at three distances, and Zest
// choosing how each order travels. Plays once when it comes into view.

const CASES: { id: string; x: number; y: number; who: Bi; how: Bi; why: Bi }[] = [
  { id: "pickup", x: 205, y: 150, who: { en: "Neha, same lane", hi: "नेहा, उसी गली में" }, how: { en: "Pickup", hi: "पिकअप" }, why: { en: "2 min walk. Ready at 1:20.", hi: "2 मिनट पैदल। 1:20 पर तैयार।" } },
  { id: "helper", x: 330, y: 70, who: { en: "Arjun, next block", hi: "अर्जुन, अगला ब्लॉक" }, how: { en: "Your helper", hi: "आपका हेल्पर" }, why: { en: "800 m. Tracking link sent.", hi: "800 मीटर। ट्रैकिंग लिंक भेजा।" } },
  { id: "rider", x: 470, y: 200, who: { en: "Kavya, Hauz Khas", hi: "काव्या, हौज़ ख़ास" }, how: { en: "Zomato rider", hi: "Zomato राइडर" }, why: { en: "3.4 km. Rider at 1:15.", hi: "3.4 किमी। राइडर 1:15 पर।" } },
];
const HOME = { x: 160, y: 110 };

export function DeliveryMap() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(-1);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setLit(2);
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timers = [400, 1500, 2600].map((at, k) => setTimeout(() => setLit(k), at));
      },
      { threshold: 0.4 },
    );
    if (box.current) io.observe(box.current);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={box} className="grid items-center gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div data-ui className="overflow-hidden rounded-[24px]">
        <svg viewBox="0 0 560 260" className="block w-full" role="img" aria-label={pick({ en: "A neighbourhood map: the kitchen and three guests at different distances", hi: "मोहल्ले का नक्शा: रसोई और अलग-अलग दूरी पर तीन ग्राहक" })}>
          {/* the neighbourhood, drawn like a phone map: land, parks, roads with names */}
          <rect width="560" height="260" rx="14" fill="#22262b" />
          <rect x="285" y="150" width="100" height="58" rx="10" fill="#23382c" />
          <text x="335" y="183" textAnchor="middle" fontSize="11" fill="#5fb07e">Deer Park</text>
          <rect x="18" y="160" width="70" height="48" rx="10" fill="#23382c" />
          {[40, 130, 220].map((y) => (
            <rect key={y} x="0" y={y} width="560" height="11" fill="#2e3338" />
          ))}
          {[100, 260, 400].map((x) => (
            <rect key={x} x={x} y="0" width="11" height="260" fill="#2e3338" />
          ))}
          <text x="470" y="126" textAnchor="middle" fontSize="10.5" fill="#7d838a">Aurobindo Marg</text>
          <text x="180" y="36" textAnchor="middle" fontSize="10.5" fill="#7d838a">Green Park Main</text>
          <text x="500" y="250" textAnchor="middle" fontSize="11" fontWeight="600" fill="#7d838a">Hauz Khas</text>
          {/* routes, drawn as each choice is made */}
          {CASES.map((c, k) => (
            <path key={c.id} d={`M ${HOME.x} ${HOME.y} L ${c.x} ${HOME.y} L ${c.x} ${c.y}`} fill="none" stroke={k <= lit ? "var(--z-turmeric)" : "transparent"} strokeWidth="4" strokeDasharray="7 7" strokeLinecap="round" />
          ))}
          {/* the kitchen */}
          <rect x={HOME.x - 16} y={HOME.y - 16} width="32" height="32" rx="8" fill="#fafaf6" />
          <circle cx={HOME.x} cy={HOME.y} r="6" fill="var(--z-turmeric)" />
          <text x={HOME.x} y={HOME.y - 24} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--lp-ink)">
            Meena
          </text>
          {/* the guests */}
          {CASES.map((c, k) => (
            <g key={c.id}>
              <circle cx={c.x} cy={c.y} r="11" fill={k <= lit ? "var(--z-leaf)" : "#3a3f45"} className="transition-colors duration-500" />
              <circle cx={c.x} cy={c.y} r="4" fill="#fff" />
            </g>
          ))}
        </svg>
      </div>
      <ol className="space-y-3">
        {CASES.map((c, k) => (
          <li key={c.id} className={`rounded-2xl bg-[var(--lp-paper)] p-4 transition-shadow duration-500 ${k <= lit ? "shadow-[inset_0_0_0_2px_var(--z-turmeric)]" : ""}`}>{/* the ring marks the chosen way: a state, not decoration. taste-skill-ignore */}
            <p className="flex items-center justify-between gap-3 text-[16px]">
              <span className="font-semibold">{pick(c.who)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${k <= lit ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-sunken)]"}`}>{pick(c.how)}</span>
            </p>
            <p className="mt-1 text-[15px] text-[var(--lp-muted)]">{pick(c.why)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
