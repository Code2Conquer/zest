"use client";

import Image from "next/image";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// A pause between sections: one line, then a full-bleed row of food photos (Unsplash, sources in
// public/photos/wall/credits.json). Breaks up the run of dark panels; on a phone it's a row to swipe.

export function PhotoStrip({ line, photos }: { line: Bi; photos: string[] }) {
  const { pick } = useApp();
  return (
    <section aria-label={pick(line)} className="overflow-hidden py-14 lg:py-20">
      <p className="lp-wrap lp-display rv text-[clamp(26px,3vw,40px)] leading-[1.1] [text-wrap:balance]">{pick(line)}</p>
      <div className="lp-wrap lg:max-w-none lg:px-0">
      <ul className="lp-swipe mt-8 lg:mx-auto lg:flex lg:w-[calc(100%+12rem)] lg:-translate-x-24 lg:gap-4 lg:overflow-visible">
        {photos.map((src, i) => (
          <li key={src} className={`relative w-[44%] max-w-[220px] shrink-0 overflow-hidden rounded-[22px] lg:w-auto lg:max-w-none lg:flex-1 ${i % 2 ? "lg:mt-10" : ""}`} style={{ aspectRatio: "3 / 4" }}>
            <Image src={src} alt="" fill sizes="(min-width: 1024px) 14vw, 44vw" className="object-cover" />
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
