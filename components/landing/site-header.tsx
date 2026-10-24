"use client";

import { Wordmark } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The website's header, shared by the homepage and /restaurants: the name, which Zest you're looking at
// (home kitchens or restaurants, as icon tabs), and one start button. The language switch lives in the footer. On a phone the start
// button folds away; the page carries its own, and a sticky one.

// The two Zests as tabs, after Airbnb's Homes / Experiences: a 3D icon (Microsoft Fluent emoji, MIT)
// beside the name, and a bar under the one you're on.
const PAGES: { id: "home" | "restaurants"; href: string; label: Bi; icon: string }[] = [
  { id: "home", href: "/", label: { en: "Home kitchens", hi: "घर की रसोई" }, icon: "/icons/pot_of_food_3d.png" },
  { id: "restaurants", href: "/restaurants", label: { en: "Restaurants", hi: "रेस्टोरेंट" }, icon: "/icons/fork_and_knife_with_plate_3d.png" },
];

function Tabs({ current }: { current: "home" | "restaurants" }) {
  const { pick } = useApp();
  return (
    <nav aria-label={pick({ en: "Which Zest", hi: "कौन-सा Zest" })} className="flex items-stretch justify-center gap-10">
      {PAGES.map((p) => {
        const here = p.id === current;
        return (
          <a key={p.id} href={p.href} aria-current={here ? "page" : undefined} className={`group relative flex items-center gap-2 pb-2.5 pt-1.5 text-[15px] font-semibold transition-colors lg:gap-2.5 lg:pb-3 lg:pt-2 lg:text-[16px] ${here ? "text-[var(--lp-ink)]" : "text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}`}>
            <img src={p.icon} alt="" width={44} height={44} className={`size-8 transition-transform duration-300 group-hover:scale-110 lg:size-11 ${here ? "" : "opacity-80 saturate-[0.85] group-hover:opacity-100 group-hover:saturate-100"}`} />
            {pick(p.label)}
            <span aria-hidden className={`absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[var(--lp-ink)] transition-opacity ${here ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`} />
          </a>
        );
      })}
    </nav>
  );
}

export function SiteHeader({ current, start }: { current: "home" | "restaurants"; start: { href: string; label: Bi } }) {
  const { pick } = useApp();
  return (
    <header className="relative z-30 lg:border-b lg:border-[var(--lp-line)] max-lg:sticky max-lg:top-[-68px] max-lg:bg-[var(--lp-ground)]">
      {/* On a phone the whole header is sticky with its top row (68px) allowed to scroll away, so the
          Home kitchens / Restaurants tabs stay pinned under the top edge, as ixigo's categories do. */}
      <div className="lp-wrap relative flex h-[68px] items-center justify-between gap-3 sm:h-[84px]">
        <a href="/" aria-label={pick({ en: "Zest home", hi: "Zest होम" })} className="shrink-0">
          <Wordmark className="text-[32px] sm:text-[38px]" />
        </a>
        {/* Centered between the name and the buttons on wide screens; its own row on a phone. */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <Tabs current={current} />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <a href={start.href} className="lp-btn haldi min-h-11 whitespace-nowrap px-5 text-[16px] max-sm:!hidden">
            {pick(start.label)}
          </a>
        </div>
      </div>
      <div className="lp-wrap border-b border-[var(--lp-line)] lg:hidden">
        <Tabs current={current} />
      </div>
    </header>
  );
}
