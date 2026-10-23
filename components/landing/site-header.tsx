"use client";

import { LangToggle, Wordmark } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The website's header, shared by the homepage and /restaurants: the name, the language and one start
// button. Nothing else: the audience switch under it moves between the two pages, and each page
// is short enough to read without section links. On a phone the start button folds away (the page
// carries its own, and a sticky one).

export function SiteHeader({ start }: { start: { href: string; label: Bi } }) {
  const { pick } = useApp();
  return (
    <header className="relative z-30">
      <div className="lp-wrap flex h-[72px] items-center justify-between gap-4">
        <a href="/" aria-label={pick({ en: "Zest home", hi: "Zest होम" })} className="shrink-0">
          <Wordmark className="text-[28px]" />
        </a>
        <div className="flex items-center gap-1 sm:gap-3">
          <LangToggle />
          <a href={start.href} className="lp-btn min-h-11 whitespace-nowrap px-5 text-[15px] max-sm:!hidden">
            {pick(start.label)}
          </a>
        </div>
      </div>
    </header>
  );
}
