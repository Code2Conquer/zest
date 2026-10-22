"use client";

import { ChefHat, Store } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Which Zest is for you, asked before anything else: small sellers not on the apps (the homepage) or
// restaurants already on Zomato or Swiggy (/restaurants). Sits above the headline on both pages, so a
// visitor knows within one glance whether they are in the right place.

const SIDES: { id: "home" | "restaurants"; href: string; icon: typeof Store; label: Bi; short: Bi }[] = [
  { id: "home", href: "/", icon: ChefHat, label: { en: "Home kitchen, tiffin or stall", hi: "घर की रसोई, टिफ़िन या ठेला" }, short: { en: "Home chef or stall", hi: "रसोई या ठेला" } },
  { id: "restaurants", href: "/restaurants", icon: Store, label: { en: "Restaurant on Zomato or Swiggy", hi: "Zomato या Swiggy पर रेस्टोरेंट" }, short: { en: "Restaurant", hi: "रेस्टोरेंट" } },
];

export function AudienceSwitch({ current }: { current: "home" | "restaurants" }) {
  const { pick } = useApp();
  return (
    <nav aria-label={pick({ en: "Which Zest is for you", hi: "आपके लिए कौन-सा Zest" })} className="grid grid-cols-2 rounded-full bg-[var(--lp-sunken)] p-1 sm:inline-flex">
      {SIDES.map((x) => {
        const here = x.id === current;
        return (
          <a
            key={x.id}
            href={x.href}
            aria-current={here ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-[14px] font-semibold leading-tight transition-colors sm:px-5 sm:text-[15px] ${here ? "bg-[var(--lp-ink)] text-[var(--lp-on-ink)]" : "text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}`}
          >
            <x.icon aria-hidden size={17} className="shrink-0" />
            <span className="sm:hidden">{pick(x.short)}</span>
            <span className="hidden sm:inline">{pick(x.label)}</span>
          </a>
        );
      })}
    </nav>
  );
}
