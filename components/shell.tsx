"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Armchair, BookOpen, Home, IndianRupee, Menu as MenuIcon, MessageSquareText, Plug, ReceiptText, Sparkles, Star, TrendingUp, X } from "lucide-react";
import type { Key } from "@/lib/i18n";
import { useApp, useOutlet } from "@/lib/state";
import { Copilot } from "./copilot";
import { LangToggle, Wordmark } from "./bits";

type NavItem = { href: string; key: Key; icon: typeof Home; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/app", key: "nav.today", icon: Home },
  { href: "/app/orders", key: "nav.orders", icon: ReceiptText },
  { href: "/app/menu", key: "nav.menu", icon: BookOpen },
  { href: "/app/reviews", key: "nav.reviews", icon: Star },
  { href: "/app/money", key: "nav.money", icon: IndianRupee },
  { href: "/app/dining", key: "nav.dining", icon: Armchair, soon: true },
  { href: "/app/growth", key: "nav.growth", icon: TrendingUp, soon: true },
  { href: "/app/connections", key: "nav.connections", icon: Plug },
];

const MOBILE_TABS = ["/app", "/app/orders", "copilot", "/app/money", "more"] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, state } = useApp();
  const { isDemo, outlet } = useOutlet();
  const path = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  const isActive = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Left rail, desktop */}
      <nav aria-label="Main" className="hidden w-60 shrink-0 flex-col bg-curry px-3 py-5 text-[#eef2ec] lg:flex">
        <Link href="/" className="px-3">
          <Wordmark className="text-[#eef2ec]" />
        </Link>
        <div className="mt-6 px-3">
          <p className="font-medium">{outlet?.name ?? "\u00a0"}</p>
          <p className="text-sm text-[#eef2ec]/60">{outlet?.area || (outlet ? (state.lang === "hi" ? "पता जोड़ें" : "Add your area in Connections") : "\u00a0")}</p>
        </div>
        <ul className="mt-6 space-y-0.5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[0.95rem] ${
                  isActive(n.href) ? "bg-haldi font-medium text-ink" : "text-[#eef2ec]/80 hover:bg-white/10 hover:text-[#eef2ec]"
                }`}
              >
                <n.icon aria-hidden className="size-[18px]" />
                <span className="flex-1">{t(n.key)}</span>
                {n.soon && <span className="text-[0.7rem] opacity-60">{t("soon")}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto px-3">
          <LangToggle />
        </div>
      </nav>

      {/* Main canvas */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemo && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-turmeric-soft px-4 py-2 text-sm sm:px-8">
            <span>{state.lang === "hi" ? "आप एक सैंपल रेस्टोरेंट देख रहे हैं।" : "You're looking at a sample restaurant."}</span>
            <span className="flex gap-4">
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/outlet/demo", { method: "DELETE" });
                  window.location.reload();
                }}
                className="text-ink-2 underline-offset-2 hover:underline"
              >
                {state.lang === "hi" ? "सैंपल डेटा रीसेट करें" : "Reset sample data"}
              </button>
              <Link href="/" className="font-medium underline underline-offset-2">
                {state.lang === "hi" ? "अपना रेस्टोरेंट जोड़ें" : "Connect yours"}
              </Link>
            </span>
          </div>
        )}
        <header className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <Link href="/">
            <Wordmark className="text-2xl" />
          </Link>
          <LangToggle />
        </header>
        <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Copilot, always open on wide screens */}
      <aside className="hidden w-[420px] shrink-0 border-l border-line xl:block">
        <Copilot />
      </aside>

      {/* Copilot launcher between lg and xl */}
      <button
        type="button"
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-6 right-6 hidden items-center gap-2 rounded-full bg-ink px-5 py-3 text-paper shadow-lg lg:flex xl:hidden"
      >
        <Sparkles aria-hidden className="size-4 text-turmeric" />
        {t("nav.copilot")}
      </button>

      {copilotOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/30 xl:hidden" onClick={() => setCopilotOpen(false)}>
          <div className="h-full w-full max-w-[440px] shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <Copilot onClose={() => setCopilotOpen(false)} />
          </div>
        </div>
      )}

      {/* "More" sheet, mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setMoreOpen(false)}>
          <ul className="absolute inset-x-0 bottom-[72px] rounded-t-2xl bg-surface p-3" onClick={(e) => e.stopPropagation()}>
            {NAV.filter((n) => !["/app", "/app/orders", "/app/money"].includes(n.href)).map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-ink hover:bg-sunken">
                  <n.icon aria-hidden className="size-5 text-ink-2" />
                  <span className="flex-1">{t(n.key)}</span>
                  {n.soon && <span className="text-sm text-muted">{t("soon")}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom tabs, mobile */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid h-[72px] grid-cols-5 border-t border-line bg-surface lg:hidden">
        {MOBILE_TABS.map((tab) => {
          if (tab === "copilot") {
            return (
              <button key={tab} type="button" onClick={() => setCopilotOpen(true)} className="flex flex-col items-center justify-center gap-1">
                <span className="grid size-11 place-items-center rounded-full bg-ink text-paper">
                  <MessageSquareText aria-hidden className="size-5" />
                </span>
                <span className="sr-only">{t("nav.copilot")}</span>
              </button>
            );
          }
          if (tab === "more") {
            return (
              <button key={tab} type="button" onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className="flex flex-col items-center justify-center gap-1 text-[0.75rem] text-muted">
                {moreOpen ? <X aria-hidden className="size-5" /> : <MenuIcon aria-hidden className="size-5" />}
                {t("nav.more")}
              </button>
            );
          }
          const n = NAV.find((x) => x.href === tab)!;
          return (
            <Link key={tab} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 text-[0.75rem] ${isActive(n.href) ? "text-ink" : "text-muted"}`}>
              <n.icon aria-hidden className="size-5" />
              {t(n.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
