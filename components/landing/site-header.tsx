"use client";

import { Wordmark } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The website's header, shared by the homepage and /restaurants: the name, which Zest you're looking at
// (home kitchens or restaurants), one language switch and one start button. On a phone the start
// button folds away; the page carries its own, and a sticky one.

const PAGES: { id: "home" | "restaurants"; href: string; label: Bi; short: Bi }[] = [
  { id: "home", href: "/", label: { en: "Home kitchens", hi: "घर की रसोई" }, short: { en: "Kitchens", hi: "रसोई" } },
  { id: "restaurants", href: "/restaurants", label: { en: "Restaurants", hi: "रेस्टोरेंट" }, short: { en: "Restaurants", hi: "रेस्टोरेंट" } },
];

export function SiteHeader({ current, start }: { current: "home" | "restaurants"; start: { href: string; label: Bi } }) {
  const { pick, lang, setLang } = useApp();
  return (
    <header className="relative z-30">
      <div className="lp-wrap flex h-[68px] items-center justify-between gap-3 sm:h-[76px]">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <a href="/" aria-label={pick({ en: "Zest home", hi: "Zest होम" })} className="shrink-0">
            <Wordmark className="text-[26px] sm:text-[28px]" />
          </a>
          <nav aria-label={pick({ en: "Which Zest", hi: "कौन-सा Zest" })} className="flex items-center gap-1 text-[14.5px] font-medium sm:text-[15px]">
            {PAGES.map((p) => {
              const here = p.id === current;
              return (
                <a key={p.id} href={p.href} aria-current={here ? "page" : undefined} className={`rounded-full px-3 py-1.5 transition-colors ${here ? "bg-[var(--lp-sunken)] text-[var(--lp-ink)]" : "text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}`}>
                  <span className="sm:hidden">{pick(p.short)}</span>
                  <span className="hidden sm:inline">{pick(p.label)}</span>
                </a>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* The other language, named in itself; Devanagari is drawn in the phone's own font until Hindi is chosen. */}
          <button type="button" onClick={() => setLang(lang === "hi" ? "en" : "hi")} lang={lang === "hi" ? "en" : "hi"} className={`px-1.5 py-1.5 text-[15px] font-medium text-[var(--lp-muted)] hover:text-[var(--lp-ink)] ${lang === "hi" ? "" : "font-[system-ui,sans-serif]"}`}>
            {lang === "hi" ? "English" : "हिंदी"}
          </button>
          <a href={start.href} className="lp-btn haldi min-h-11 whitespace-nowrap px-5 text-[15px] max-sm:!hidden">
            {pick(start.label)}
          </a>
        </div>
      </div>
    </header>
  );
}
