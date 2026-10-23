"use client";

import { Wordmark } from "@/components/bits";
import { ArrowUpRight } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

const SAMPLES: { name: string; kind: Bi; dashboard: string; page: string }[] = [
  { name: "Meena's Kitchen", kind: { en: "Home kitchen · Green Park, Delhi", hi: "घर की रसोई · ग्रीन पार्क, दिल्ली" }, dashboard: "/demo/home", page: "/r/meenas-kitchen" },
  { name: "Rasoi 27", kind: { en: "Restaurant on Zomato and Swiggy · Bengaluru", hi: "Zomato और Swiggy पर रेस्टोरेंट · बेंगलुरु" }, dashboard: "/demo/restaurant", page: "/r/rasoi-27" },
];

// The website's footer, shared by the homepage and /restaurants: two samples to look around (a home
// kitchen and a restaurant, each with its dashboard and ordering page), then the name and the line.
// Neither page shows a photo that needs a credit now; \`credits\` brings back the line for Meena's
// Wikimedia photos if a page shows them again.

export function SiteFooter({ credits = false }: { credits?: boolean }) {
  const { pick } = useApp();
  return (
    <footer className="bg-[var(--lp-sunken)] py-12 lg:py-16">
      <div className="lp-wrap">
        <h2 className="text-[18px] font-semibold">{pick({ en: "Take a look around", hi: "घूमकर देखिए" })}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SAMPLES.map((x) => (
            <li key={x.name} className="rounded-[20px] bg-[var(--lp-paper)] p-5">
              <p className="text-[18px] font-semibold">{x.name}</p>
              <p className="mt-1 text-[14px] text-[var(--lp-muted)]">{pick(x.kind)}</p>
              <p className="mt-4 flex flex-wrap gap-2">
                {[
                  { href: x.dashboard, label: { en: "Dashboard", hi: "डैशबोर्ड" } },
                  { href: x.page, label: { en: "Ordering page", hi: "ऑर्डर पेज" } },
                ].map((l) => (
                  <a key={l.href} href={l.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--lp-sunken)] px-4 text-[14px] font-semibold hover:bg-[var(--lp-line)]">
                    {pick(l.label)}
                    <ArrowUpRight aria-hidden size={16} />
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <Wordmark className="mt-12 text-[64px] sm:text-[112px]" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <p className="text-[18px]">{pick({ en: "Online orders, delivered by you or by Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" })}</p>
          <p className="text-[14px] text-[var(--lp-muted)]">© 2026 Zest</p>
        </div>
        {credits && (
          <p className="mt-6 max-w-[60em] text-[12.5px] leading-relaxed text-[var(--lp-muted)]">
            {pick({ en: "Photos of Meena's dishes from Wikimedia Commons: “Amazing Aloo Paratha and Lovely Lassi” by Mahi Tatavarty, “Rajma Chawal by Rama Bhave” by Shreya151994, “Kadhi Chawal from India” by Barthateslisa (CC BY-SA 4.0); “Mithaas sweets box Indian food” by Krista (CC BY 2.0).", hi: "मीना की डिश की फ़ोटो Wikimedia Commons से: Mahi Tatavarty की “Amazing Aloo Paratha and Lovely Lassi”, Shreya151994 की “Rajma Chawal by Rama Bhave”, Barthateslisa की “Kadhi Chawal from India” (CC BY-SA 4.0); Krista की “Mithaas sweets box Indian food” (CC BY 2.0)।" })}
          </p>
        )}
      </div>
    </footer>
  );
}
