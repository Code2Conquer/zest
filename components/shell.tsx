"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, MessageSquareText, Sparkles, X } from "lucide-react";
import { useApi } from "@/lib/api";
import { signOutHere, useMe } from "@/lib/auth-client";
import { NAV_GROUPS, navItem, type NavItem } from "@/lib/nav";
import { useApp, useOutlet } from "@/lib/state";
import { Copilot } from "./copilot";
import { LangToggle, Wordmark } from "./bits";

const MOBILE_TABS = ["/app", "/app/orders", "copilot", "/app/money", "more"] as const;

const ROLE_NAME = {
  owner: { en: "Owner", hi: "मालिक" },
  manager: { en: "Manager", hi: "मैनेजर" },
  kitchen: { en: "Kitchen", hi: "किचन" },
  cashier: { en: "Cashier", hi: "कैशियर" },
  rider: { en: "Rider", hi: "राइडर" },
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, state, pick } = useApp();
  const { isDemo, outlet } = useOutlet();
  const { data: me } = useMe();
  const hi = state.lang === "hi";
  const path = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  // Kitchen and rider sign-ins get only the orders board.
  const screenOnly = me?.role === "kitchen" || me?.role === "rider";
  const router = useRouter();
  useEffect(() => {
    if (screenOnly && path !== "/app/orders") router.replace("/app/orders");
  }, [screenOnly, path, router]);
  const groups = screenOnly ? NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.href === "/app/orders") })).filter((g) => g.items.length) : NAV_GROUPS;
  // Drafts waiting for the owner's OK, shown on Today.
  const { data: pending } = useApi<{ id: string }[]>(me && !screenOnly ? "/api/approvals?status=pending" : null);
  const waiting = pending?.length ?? 0;

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
          <p className="text-sm text-[#eef2ec]/60">{[outlet?.area, outlet?.city].filter(Boolean).join(", ") || (outlet ? (state.lang === "hi" ? "सेटिंग्स में पता जोड़ें" : "Add your area in Settings") : "\u00a0")}</p>
        </div>
        <div className="scrollbar-thin mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.id} className={g.id === "settings" ? "border-t border-white/10 pt-3" : ""}>
              {g.label && <p className="px-3 pb-1 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-[#eef2ec]/45">{pick(g.label)}</p>}
              <ul className="space-y-0.5">
                {g.items.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      title={pick(n.hint)}
                      aria-current={isActive(n.href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[0.95rem] ${
                        isActive(n.href) ? "bg-haldi font-medium text-ink" : "text-[#eef2ec]/80 hover:bg-white/10 hover:text-[#eef2ec]"
                      }`}
                    >
                      <n.icon aria-hidden className="size-[18px]" />
                      <span className="flex-1">{pick(n.label)}</span>
                      {n.href === "/app" && waiting > 0 && (
                        <span aria-label={hi ? `${waiting} मंज़ूरी बाक़ी` : `${waiting} waiting for your OK`} className={`rounded-full px-2 text-[0.75rem] font-semibold ${isActive(n.href) ? "bg-ink text-paper" : "bg-haldi text-ink"}`}>
                          {waiting}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 px-3">
          {me?.user && (
            <div className="text-sm">
              <p className="truncate text-[#eef2ec]/80">
                {me.user.name || me.user.email}
                {me.role && <span className="text-[#eef2ec]/50"> · {pick(ROLE_NAME[me.role])}</span>}
              </p>
              <button type="button" onClick={() => void signOutHere()} className="text-[#eef2ec]/60 underline underline-offset-2 hover:text-[#eef2ec]">
                {hi ? "साइन आउट" : "Sign out"}
              </button>
            </div>
          )}
          <LangToggle />
        </div>
      </nav>

      {/* Main canvas */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!isDemo && me && !me.role && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-turmeric-soft px-4 py-2 text-sm sm:px-8">
            <span>{hi ? "बदलाव करने के लिए साइन इन करें।" : "Sign in to make changes."}</span>
            <Link href={`/login?returnTo=${encodeURIComponent(path)}`} className="font-medium underline underline-offset-2">
              {hi ? "साइन इन" : "Sign in"}
            </Link>
          </div>
        )}
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
          <div className="absolute inset-x-0 bottom-[72px] max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-surface p-3" onClick={(e) => e.stopPropagation()}>
            {groups.map((g) => {
              const items = g.items.filter((n) => !["/app", "/app/orders", "/app/money"].includes(n.href));
              if (!items.length) return null;
              return (
                <div key={g.id} className="py-1">
                  {g.label && <p className="px-3 pb-1 pt-2 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted">{pick(g.label)}</p>}
                  <ul>
                    {items.map((n) => (
                      <li key={n.href}>
                        <Link href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink hover:bg-sunken">
                          <n.icon aria-hidden className="size-5 text-ink-2" />
                          <span className="min-w-0 flex-1">
                            <span className="block">{pick(n.label)}</span>
                            <span className="block truncate text-sm text-muted">{pick(n.hint)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
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
          const n: NavItem = navItem(tab);
          return (
            <Link key={tab} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`relative flex flex-col items-center justify-center gap-1 text-[0.75rem] ${isActive(n.href) ? "text-ink" : "text-muted"}`}>
              <n.icon aria-hidden className="size-5" />
              {pick(n.short ?? n.label)}
              {n.href === "/app" && waiting > 0 && <span aria-hidden className="absolute right-[28%] top-2.5 size-2 rounded-full bg-turmeric" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
