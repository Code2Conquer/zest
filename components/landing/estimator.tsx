"use client";

import { useEffect, useRef, useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The first screen's live thing, after Airbnb's earnings estimate: set orders a day and see what that
// comes to in a month at a typical order value for this kind of kitchen (fixed; shown, not adjustable).
// Plain arithmetic (orders × average × 26 working days), and the page says so. Kind chips show only when
// a page offers more than one kind.

export type Preset = { id: string; label: Bi; orders: number; avg: number };
const DAYS = 26;
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function Estimator({ presets, orders: [oMin, oMax], per, ordersLabel }: { presets: Preset[]; orders: [number, number]; per: Bi; ordersLabel: Bi }) {
  const { pick } = useApp();
  const [kind, setKind] = useState(presets[0].id);
  const [orders, setOrders] = useState(presets[0].orders);
  const avg = presets.find((p) => p.id === kind)?.avg ?? presets[0].avg;
  const target = orders * avg * DAYS;
  const shown = useCountUp(target);
  const choose = (p: Preset) => {
    setKind(p.id);
    setOrders(p.orders);
  };

  return (
    <div>
      <p className="hero-in d1 flex flex-wrap items-baseline gap-x-3">
        <span className="lp-display relative inline-block text-[56px] leading-none tabular-nums text-[var(--z-turmeric)] sm:text-[80px] xl:text-[96px]" aria-live="polite">
          {/* The final amount always holds the space, and the counting figure is drawn over it, so the line never reflows. */}
          <span className="invisible">{inr(target)}</span>
          {shown != null && <span className="absolute inset-y-0 left-0">{inr(shown)}</span>}
          {shown == null && (
            <span className="est-dots absolute inset-y-0 left-0 inline-flex items-center gap-[0.12em]" aria-label="…">
              <i />
              <i />
              <i />
            </span>
          )}
        </span>
        <span className="text-[22px] font-medium text-[var(--lp-muted)] sm:text-[28px]">{pick(per)}</span>
      </p>

      <div className="hero-in d2 mt-7 max-w-[560px]">
        {presets.length > 1 && <div role="radiogroup" aria-label={pick({ en: "Your kind of kitchen", hi: "आपकी रसोई किस तरह की है" })} className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={kind === p.id}
              onClick={() => choose(p)}
              className={`min-h-10 rounded-full px-4 text-[14px] font-semibold transition-colors ${kind === p.id ? "bg-[var(--lp-ink)] text-[var(--lp-on-ink)]" : "bg-[var(--lp-sunken)] text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}`}
            >
              {pick(p.label)}
            </button>
          ))}
        </div>}
        <Slider label={pick(ordersLabel)} value={orders} display={String(orders)} min={oMin} max={oMax} step={1} onChange={setOrders} />
        <p className="mt-4 text-[14px] leading-snug text-[var(--lp-muted)]">
          {pick({
            en: `${orders} orders a day × ${inr(avg)} average order × ${DAYS} days. An estimate; what you earn depends on your food, prices and area.`,
            hi: `रोज़ ${orders} ऑर्डर × ${inr(avg)} औसत ऑर्डर × ${DAYS} दिन। एक अंदाज़ा; असली कमाई आपके खाने, दाम और इलाक़े पर निर्भर है।`,
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * The figure as Airbnb shows it: three dots thinking for a moment, then the amount counting up. Later
 * changes glide from the old amount to the new. Reduced motion shows the amount at once.
 */
function useCountUp(target: number): number | null {
  const [value, setValue] = useState<number | null>(null);
  const from = useRef<number | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      return setValue(target);
    }
    const first = from.current == null;
    const start = from.current ?? 0;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const dur = first ? 900 : 350;
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        const v = Math.round(start + (target - start) * eased);
        from.current = v;
        setValue(v);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const wait = first ? setTimeout(run, 1100) : null;
    if (!first) run();
    return () => {
      if (wait) clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return value;
}

function Slider({ label, value, display, min, max, step, onChange }: { label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="mt-6 block">
      <span className="flex items-baseline justify-between text-[16px]">
        <span className="text-[var(--lp-muted)]">{label}</span>
        <span className="font-semibold tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lp-range mt-2.5 w-full"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
    </label>
  );
}
