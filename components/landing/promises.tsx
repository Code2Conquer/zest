"use client";

import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Three short promises, side by side, after Airbnb's "It's easy · It's worth it · You're protected".
// Big words, one or two sentences each, no icons.

export function Promises({ title, items }: { title: Bi; items: { title: Bi; text: Bi }[] }) {
  const { pick } = useApp();
  return (
    <section aria-labelledby="promises-h" className="bg-[var(--lp-sunken)] py-16 lg:py-20">
      <div className="lp-wrap">
        <h2 id="promises-h" className="rv lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]">
          {pick(title)}
        </h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {items.map((x, k) => (
            <li key={x.title.en} className={`rv ${k === 1 ? "d1" : k === 2 ? "d2" : ""}`}>
              <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">{pick(x.title)}</h3>
              <p className="mt-3 text-[17px] leading-relaxed text-[var(--lp-muted)]">{pick(x.text)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
