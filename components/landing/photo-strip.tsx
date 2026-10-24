"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Bike, Footprints, Store } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// A rail of orders: food photos (Unsplash, sources in public/photos/wall/credits.json), each with the
// order it stands for, in the same card as the hero's. On the homepage it's a day of a home kitchen's
// orders; on /restaurants, the orders that never reach Zomato or Swiggy. It drifts slowly and stops
// while a pointer or finger is on it; with reduced motion it's a still row to swipe.

// Every card has the same slots: when, where it came from, the dish and its detail, how it reaches the
// customer, the amount and how it was paid, and a PAID stamp.
export type StripOrder = { photo: string; when: Bi; source: Bi; dish: Bi; detail: Bi; delivery: "rider" | "pickup" | "own"; deliveryNote?: Bi; amount: number; method: "UPI" | "Card" };

const DELIVERY = {
  rider: { icon: Bike, label: { en: "Zomato rider", hi: "Zomato राइडर" } },
  pickup: { icon: Store, label: { en: "Pickup", hi: "पिकअप" } },
  own: { icon: Footprints, label: { en: "Own delivery", hi: "अपनी डिलीवरी" } },
} as const;

export function PhotoStrip({ line, sub, orders }: { line: Bi; sub?: Bi; orders: StripOrder[] }) {
  const { pick } = useApp();
  // Drifts only while on screen, so it costs nothing during the first paint or once scrolled past.
  const rail = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setRun(e.isIntersecting));
    if (rail.current) io.observe(rail.current);
    return () => io.disconnect();
  }, []);
  return (
    <section aria-label={pick(line)} className="overflow-hidden py-10 lg:py-20">
      <div className="lp-wrap">
        <h2 className="lp-display rv max-w-[22ch] text-[22px] leading-[1.15] lg:text-[clamp(26px,3vw,40px)] lg:leading-[1.1] [text-wrap:balance]">{pick(line)}</h2>
        {sub && <p className="rv d1 mt-2 max-w-[48ch] text-[16px] leading-relaxed text-[var(--lp-muted)] lg:mt-3 lg:text-[18px]">{pick(sub)}</p>}
      </div>
      <div ref={rail} data-run={run || undefined} className="rail mt-6 lg:mt-8">
        {/* The list twice, so the drift loops without a seam; the copy is hidden from screen readers. */}
        <ul className="rail-track">
          {[0, 1].map((copy) =>
            orders.map((o, i) => (
              <li key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined} className="relative w-[228px] shrink-0 sm:w-[250px]">
                <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: "3 / 4" }}>
                  <Image src={o.photo} alt="" fill sizes="240px" className="object-cover" />
                </div>
                <OrderCard o={o} />
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}

/** The order card: the rail's cards and the hero's. `className` places it; the rail tucks it under the photo. */
export function OrderCard({ o, className = "relative z-10 mx-2.5 -mt-16" }: { o: StripOrder; className?: string }) {
  const { pick } = useApp();
  const d = DELIVERY[o.delivery];
  return (
    <div className={`${className} rounded-2xl bg-white p-3 pt-3.5 text-[#1c1f23] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.7)]`}>
      {/* PAID stamp */}
      <span aria-label={pick({ en: "Paid", hi: "भुगतान हो गया" })} className="absolute -top-3.5 left-3 -rotate-[6deg] rounded-md border-2 border-[#2f7a4c] bg-white px-1.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.12em] text-[#2f7a4c]">
        {pick({ en: "PAID", hi: "पेड" })}
      </span>
      {/* when · source */}
      <p className="flex items-center justify-between gap-2 text-[11.5px] text-[#545a61]">
        <span className="whitespace-nowrap tabular-nums">{pick(o.when)}</span>
        <span className="min-w-0 truncate rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11px] font-semibold text-[#3d4349]">{pick(o.source)}</span>
      </p>
      {/* dish and detail */}
      <p className="mt-1.5 line-clamp-2 min-h-[2.5em] text-[14.5px] font-semibold leading-snug">{pick(o.dish)}</p>
      <p className="truncate text-[12px] text-[#545a61]">{pick(o.detail)}</p>
      {/* delivery · amount and method */}
      <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-dashed border-[#d9dde1] pt-2">
        <p className="min-w-0 text-[11.5px] leading-tight text-[#545a61]">
          <span className="flex items-center gap-1 font-semibold text-[#1c1f23]">
            <d.icon aria-hidden size={13} />
            {pick(d.label)}
          </span>
          {o.deliveryNote && <span className="block truncate">{pick(o.deliveryNote)}</span>}
        </p>
        <p className="shrink-0 text-right leading-tight">
          <span className="block text-[14.5px] font-bold tabular-nums">₹{o.amount.toLocaleString("en-IN")}</span>
          <span className="block text-[11px] text-[#545a61]">{o.method}</span>
        </p>
      </div>
    </div>
  );
}
