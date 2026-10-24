"use client";

import { Wordmark } from "@/components/bits";
import { ArrowUpRight, Globe } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

/** Zest's support WhatsApp number, set on the server (NEXT_PUBLIC_SUPPORT_WHATSAPP). */
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? null;

const SAMPLES: { name: string; kind: Bi; dashboard: string; page: string }[] = [
  { name: "Meena's Kitchen", kind: { en: "Home kitchen · Green Park, Delhi", hi: "घर की रसोई · ग्रीन पार्क, दिल्ली" }, dashboard: "/demo/home", page: "/r/meenas-kitchen" },
  { name: "Rasoi 27", kind: { en: "Restaurant on Zomato and Swiggy · Bengaluru", hi: "Zomato और Swiggy पर रेस्टोरेंट · बेंगलुरु" }, dashboard: "/demo/restaurant", page: "/r/rasoi-27" },
];

// The website's footer, shared by the homepage and /restaurants: two samples to look around (a home
// kitchen and a restaurant, each with its dashboard and ordering page), then the name and the line.
// Neither page shows a photo that needs a credit now; \`credits\` brings back the line for Meena's
// Wikimedia photos if a page shows them again.

export function SiteFooter({ credits = false }: { credits?: boolean }) {
  const { pick, lang, setLang } = useApp();
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
                  <a key={l.href} href={l.href} data-track="sample_opened" data-track-target={l.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--lp-sunken)] px-4 text-[14px] font-semibold hover:bg-[var(--lp-line)]">
                    {pick(l.label)}
                    <ArrowUpRight aria-hidden size={16} />
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <Wordmark className="mt-12 text-[64px] sm:text-[112px]" />
        <p className="mt-4 text-[18px]">{pick({ en: "Online orders, delivered by you or by Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" })}</p>
        {/* The bottom bar, after Airbnb's: the small print on the left, the language on the right. */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--lp-line)] pt-6 text-[14px]">
          <p className="flex flex-wrap items-center gap-x-2 text-[var(--lp-muted)]">
            <span>© 2026 Zest</span>
            <span aria-hidden>·</span>
            <a href="/" className="hover:text-[var(--lp-ink)] hover:underline">{pick({ en: "Home kitchens", hi: "घर की रसोई" })}</a>
            <span aria-hidden>·</span>
            <a href="/restaurants" className="hover:text-[var(--lp-ink)] hover:underline">{pick({ en: "Restaurants", hi: "रेस्टोरेंट" })}</a>
            <span aria-hidden>·</span>
            <a href="/privacy" className="hover:text-[var(--lp-ink)] hover:underline">{pick({ en: "Privacy", hi: "प्राइवेसी" })}</a>
            <span aria-hidden>·</span>
            <a href="/terms" className="hover:text-[var(--lp-ink)] hover:underline">{pick({ en: "Terms", hi: "शर्तें" })}</a>
            {SUPPORT && (
              <>
                <span aria-hidden>·</span>
                <a href={`https://wa.me/${SUPPORT.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-[var(--lp-ink)] hover:underline">
                  {pick({ en: "Help on WhatsApp", hi: "WhatsApp पर मदद" })}
                </a>
              </>
            )}
          </p>
          {/* Language: both named in themselves, the current one in bold. */}
          <p className="flex items-center gap-1">
            <Globe aria-hidden size={18} className="mr-1" />
            {(["en", "hi"] as const).map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden className="text-[var(--lp-muted)]">·</span>}
                <button type="button" onClick={() => setLang(l)} lang={l} aria-pressed={lang === l} className={`min-h-11 px-1.5 ${lang === l ? "font-semibold text-[var(--lp-ink)]" : "text-[var(--lp-muted)] hover:text-[var(--lp-ink)] hover:underline"}`}>
                  {l === "en" ? "English (IN)" : "हिंदी"}
                </button>
              </span>
            ))}
          </p>
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
