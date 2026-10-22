"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LangToggle, ThemeToggle, Wordmark } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The website's header, shared by the homepage and /restaurants. On a phone the section links fold
// into a menu; the language switch, the start button and the theme switch stay in view.

export type NavLink = { href: string; label: Bi };

export const HOME_NAV: NavLink[] = [
  { href: "/#day", label: { en: "How it works", hi: "कैसे काम करता है" } },
  { href: "/#agents", label: { en: "Agents", hi: "एजेंट" } },
  { href: "/#soundbox", label: { en: "Soundbox", hi: "Soundbox" } },
  { href: "/#faq", label: { en: "Questions", hi: "सवाल" } },
  { href: "/restaurants", label: { en: "On Zomato or Swiggy?", hi: "Zomato या Swiggy पर?" } },
];

export function SiteHeader({ nav = HOME_NAV, start }: { nav?: NavLink[]; start: { href: string; label: Bi } }) {
  const { pick } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-30">
      <div className="lp-wrap flex h-[72px] items-center justify-between gap-4">
        <a href="/" aria-label="Zest home" className="shrink-0">
          <Wordmark className="text-[28px]" />
        </a>
        <nav aria-label={pick({ en: "Sections", hi: "हिस्से" })} className="hidden items-center gap-7 text-[15px] font-medium xl:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:underline hover:underline-offset-4">
              {pick(n.label)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden sm:block">
            <LangToggle />
          </span>
          <ThemeToggle />
          <a href="/login" className="hidden px-2 text-[15px] font-medium hover:underline hover:underline-offset-4 lg:inline">
            {pick({ en: "Log in", hi: "लॉग इन" })}
          </a>
          <a href={start.href} className="lp-btn min-h-11 whitespace-nowrap px-4 text-[15px] sm:px-5">
            {pick(start.label)}
          </a>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="site-menu" aria-label={pick({ en: "Menu", hi: "मेन्यू" })} className="grid size-11 place-items-center rounded-full xl:hidden">
            {open ? <X aria-hidden size={20} /> : <Menu aria-hidden size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="site-menu" aria-label={pick({ en: "Sections", hi: "हिस्से" })} className="lp-wrap pb-5 xl:hidden">
          <ul className="grid gap-1 rounded-2xl bg-[var(--lp-paper)] p-3 text-[17px] font-medium">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 hover:bg-[var(--lp-sunken)]">
                  {pick(n.label)}
                </a>
              </li>
            ))}
            <li>
              <a href="/login" className="block rounded-xl px-3 py-3 hover:bg-[var(--lp-sunken)]">
                {pick({ en: "Log in", hi: "लॉग इन" })}
              </a>
            </li>
            <li className="px-3 pt-2 sm:hidden">
              <LangToggle />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
