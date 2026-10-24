"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// A rail of orders: food photos (Unsplash, sources in public/photos/wall/credits.json), each with the
// order it stands for, in the same card as the hero's. On the homepage it's a day of a home kitchen's
// orders; on /restaurants, the orders that never reach Zomato or Swiggy. It drifts slowly and stops
// while a pointer or finger is on it; with reduced motion it's a still row to swipe.

export type StripOrder = { photo: string; when: Bi; what: Bi; who: Bi; paid?: Bi };

export function PhotoStrip({ line, sub, orders }: { line: Bi; sub?: Bi; orders: StripOrder[] }) {
  const { pick } = useApp();
  return (
    <section aria-label={pick(line)} className="overflow-hidden py-10 lg:py-20">
      <div className="lp-wrap">
        <h2 className="lp-display rv max-w-[22ch] text-[22px] leading-[1.15] lg:text-[clamp(26px,3vw,40px)] lg:leading-[1.1] [text-wrap:balance]">{pick(line)}</h2>
        {sub && <p className="rv d1 mt-2 max-w-[48ch] text-[16px] leading-relaxed text-[var(--lp-muted)] lg:mt-3 lg:text-[18px]">{pick(sub)}</p>}
      </div>
      <div className="rail mt-6 lg:mt-8">
        {/* The list twice, so the drift loops without a seam; the copy is hidden from screen readers. */}
        <ul className="rail-track">
          {[0, 1].map((copy) =>
            orders.map((o, i) => (
              <li key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined} className="relative w-[170px] shrink-0 sm:w-[240px]">
                <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: "3 / 4" }}>
                  <Image src={o.photo} alt="" fill sizes="240px" className="object-cover" />
                </div>
                <div className="relative z-10 mx-3 -mt-14 rounded-2xl bg-white p-3 text-[#1c1f23] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.7)]">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1f6b3a]">
                    <span aria-hidden className="size-1.5 rounded-full bg-[#2f7a4c]" />
                    {pick(o.when)}
                  </p>
                  <p className="mt-0.5 text-[14.5px] font-semibold leading-snug">{pick(o.what)}</p>
                  <p className="mt-0.5 flex items-center justify-between gap-2 text-[12.5px] text-[#545a61]">
                    <span className="truncate">{pick(o.who)}</span>
                    {o.paid && (
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#1f6b3a]">
                        <Check aria-hidden size={12} strokeWidth={3} />
                        {pick(o.paid)}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
