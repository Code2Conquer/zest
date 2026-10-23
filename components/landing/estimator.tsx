"use client";

import { useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The first screen's live thing, after Airbnb's earnings estimate: pick the kind of kitchen, set orders
// a day and the average order, and see what that comes to in a month. It is plain arithmetic on the
// numbers the visitor sets (orders × average × 26 working days), and the page says so.

export type Preset = { id: string; label: Bi; orders: number; avg: number };
const DAYS = 26;
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function Estimator({
  presets,
  orders: [oMin, oMax],
  avg: [aMin, aMax, aStep],
  per,
  ordersLabel,
  avgLabel,
}: {
  presets: Preset[];
  orders: [number, number];
  avg: [number, number, number];
  per: Bi;
  ordersLabel: Bi;
  avgLabel: Bi;
}) {
  const { pick } = useApp();
  const [kind, setKind] = useState(presets[0].id);
  const [orders, setOrders] = useState(presets[0].orders);
  const [avg, setAvg] = useState(presets[0].avg);
  const choose = (p: Preset) => {
    setKind(p.id);
    setOrders(p.orders);
    setAvg(p.avg);
  };

  return (
    <div>
      <p className="hero-in d1 flex flex-wrap items-baseline gap-x-3">
        <span className="lp-display text-[56px] leading-none tabular-nums text-[var(--z-turmeric)] sm:text-[80px] xl:text-[96px]" aria-live="polite">
          {inr(orders * avg * DAYS)}
        </span>
        <span className="text-[22px] font-medium text-[var(--lp-muted)] sm:text-[28px]">{pick(per)}</span>
      </p>

      <div className="hero-in d2 mt-7 max-w-[560px]">
        <div role="radiogroup" aria-label={pick({ en: "Your kind of kitchen", hi: "आपकी रसोई किस तरह की है" })} className="flex flex-wrap gap-2">
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
        </div>
        <Slider label={pick(ordersLabel)} value={orders} display={String(orders)} min={oMin} max={oMax} step={1} onChange={(v) => { setOrders(v); setKind(""); }} />
        <Slider label={pick(avgLabel)} value={avg} display={inr(avg)} min={aMin} max={aMax} step={aStep} onChange={(v) => { setAvg(v); setKind(""); }} />
        <p className="mt-4 text-[14px] leading-snug text-[var(--lp-muted)]">
          {pick({
            en: `${orders} orders × ${inr(avg)} × ${DAYS} days. An estimate from the numbers you set; what you earn depends on your food, prices and area.`,
            hi: `${orders} ऑर्डर × ${inr(avg)} × ${DAYS} दिन। आपके चुने आँकड़ों से अंदाज़ा; असली कमाई आपके खाने, दाम और इलाक़े पर निर्भर है।`,
          })}
        </p>
      </div>
    </div>
  );
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
