"use client";

import Image from "next/image";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Three short promises, after Airbnb's "It's easy · It's worth it · You're protected": each a photograph
// of what it means, a big title and a sentence or two.

export function Promises({ title, items }: { title: Bi; items: { title: Bi; text: Bi; photo: string }[] }) {
  const { pick } = useApp();
  return (
    <section aria-labelledby="promises-h" className="bg-[var(--lp-sunken)] py-16 lg:py-20">
      <div className="lp-wrap">
        <h2 id="promises-h" className="rv lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]">
          {pick(title)}
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((x, k) => (
            <li key={x.title.en} className={`rv overflow-hidden rounded-[28px] bg-[var(--lp-paper)] ${k === 1 ? "d1" : k === 2 ? "d2" : ""}`}>
              <div className="relative aspect-[4/3]">
                <Image src={x.photo} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="px-6 pb-7 pt-6">
                <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">{pick(x.title)}</h3>
                <p className="mt-2.5 text-[17px] leading-relaxed text-[var(--lp-muted)]">{pick(x.text)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
