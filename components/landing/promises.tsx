"use client";

import type { LucideIcon } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Three short promises, after Airbnb's "It's easy · It's worth it · You're protected": a simple line
// icon, a big title and a sentence or two each.

export function Promises({ title, items }: { title: Bi; items: { title: Bi; text: Bi; icon: LucideIcon }[] }) {
  const { pick } = useApp();
  return (
    <section aria-labelledby="promises-h" className="bg-[var(--lp-sunken)] py-16 lg:py-24">
      <div className="lp-wrap">
        <h2 id="promises-h" className="rv lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]">
          {pick(title)}
        </h2>
        <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {items.map((x, k) => (
            <li key={x.title.en} className={`rv ${k === 1 ? "d1" : k === 2 ? "d2" : ""}`}>
              <x.icon aria-hidden size={44} strokeWidth={1.5} className="text-[var(--z-turmeric)]" />
              <h3 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">{pick(x.title)}</h3>
              <p className="mt-2.5 text-[18px] leading-relaxed text-[var(--lp-muted)]">{pick(x.text)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
