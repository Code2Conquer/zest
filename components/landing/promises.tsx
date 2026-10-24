"use client";

import type { LucideIcon } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Three short promises, after Airbnb's "It's easy · It's worth it · You're protected": a simple line
// icon, a big title and a sentence or two each.

export function Promises({ title, items }: { title: Bi; items: { title: Bi; text: Bi; icon: LucideIcon }[] }) {
  const { pick } = useApp();
  return (
    <section aria-labelledby="promises-h" className="bg-[var(--lp-sunken)] py-10 lg:py-24">
      <div className="lp-wrap">
        <h2 id="promises-h" className="rv lp-display text-[26px] leading-[1.1] lg:text-[clamp(30px,3.6vw,52px)] lg:leading-[1.04] [text-wrap:balance]">
          {pick(title)}
        </h2>
        {/* Wide screens: three columns. Phones: compact rows, icon on the left, after Airbnb's lists. */}
        <ul className="mt-6 grid gap-5 md:mt-12 md:grid-cols-3 md:gap-12">
          {items.map((x, k) => (
            <li key={x.title.en} className={`rv flex gap-4 md:block ${k === 1 ? "d1" : k === 2 ? "d2" : ""}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--lp-paper)] md:size-auto md:place-items-start md:bg-transparent">
                <x.icon aria-hidden strokeWidth={1.5} className="size-6 text-[var(--z-turmeric)] md:size-11" />
              </span>
              <div>
                <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] md:mt-5 md:text-[28px]">{pick(x.title)}</h3>
                <p className="mt-1 text-[16px] leading-relaxed text-[var(--lp-muted)] [text-wrap:pretty] md:mt-2.5 md:text-[18px]">{pick(x.text)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
