"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BellRing, Loader2, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { api, refreshAll, useApi } from "@/lib/api";
import { signOutHere, useMe } from "@/lib/auth-client";
import { isHomeKitchen, navGroupsFor, navItem, type NavItem } from "@/lib/nav";
import { useApp, useOutlet } from "@/lib/state";
import { AssistantDock } from "./assistant-dock";
import { LangToggle, Wordmark } from "./bits";

// Zest itself is the orb above the tabs (components/assistant-dock.tsx), so it has no tab of its own.
const MOBILE_TABS = ["/app", "/app/orders", "/app/menu", "/app/money", "more"] as const;

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
  // The left rail folds to icons; remembered on this browser.
  const [wide, setWide] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("zest-rail") === "narrow") setWide(false);
    } catch {}
  }, []);
  const toggleRail = () =>
    setWide((w) => {
      try {
        localStorage.setItem("zest-rail", w ? "narrow" : "wide");
      } catch {}
      return !w;
    });
  // A test order on a sample, so a visitor can run the whole flow.
  const [testing, setTesting] = useState(false);
  async function testOrder() {
    setTesting(true);
    try {
      await api("/api/outlet/demo/order", { method: "POST" });
      refreshAll();
      if (path !== "/app/orders") router.push("/app/orders");
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  // Kitchen and rider sign-ins get only the orders board.
  const screenOnly = me?.role === "kitchen" || me?.role === "rider";
  const router = useRouter();
  useEffect(() => {
    if (screenOnly && path !== "/app/orders") router.replace("/app/orders");
  }, [screenOnly, path, router]);
  const home = isHomeKitchen(outlet);
  const base = navGroupsFor(home);
  const groups = screenOnly ? base.map((g) => ({ ...g, items: g.items.filter((i) => i.href === "/app/orders") })).filter((g) => g.items.length) : base;
  // Drafts waiting for the owner's OK, shown on Today.
  const { data: pending } = useApi<{ id: string }[]>(me && !screenOnly ? "/api/approvals?status=pending" : null);
  const waiting = pending?.length ?? 0;

  const isActive = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Left rail, desktop */}
      <nav aria-label="Main" className={`hidden shrink-0 flex-col bg-curry py-5 text-[#eef2ec] transition-[width] duration-200 lg:flex ${wide ? "w-60 px-3" : "w-[72px] px-2"}`}>
        <div className={`flex items-center ${wide ? "justify-between pl-3" : "flex-col gap-3"}`}>
          <Link href="/" aria-label="Zest">
            {wide ? <Wordmark className="text-[30px]" /> : <Wordmark className="text-[26px]" />}
          </Link>
          <button type="button" onClick={toggleRail} aria-label={wide ? (hi ? "मेन्यू छोटा करें" : "Collapse menu") : hi ? "मेन्यू खोलें" : "Expand menu"} aria-expanded={wide} title={wide ? (hi ? "मेन्यू छोटा करें" : "Collapse menu") : hi ? "मेन्यू खोलें" : "Expand menu"} className="grid size-9 place-items-center rounded-lg text-[#eef2ec]/60 hover:bg-white/10 hover:text-[#eef2ec]">
            {wide ? <PanelLeftClose aria-hidden className="size-[18px]" /> : <PanelLeftOpen aria-hidden className="size-[18px]" />}
          </button>
        </div>
        <div className={`mt-6 px-3 ${wide ? "" : "hidden"}`}>
          <p className="font-medium">{outlet?.name ?? "\u00a0"}</p>
          <p className="text-sm text-[#eef2ec]/60">{[outlet?.area, outlet?.city].filter(Boolean).join(", ") || (outlet ? (state.lang === "hi" ? "सेटिंग्स में पता जोड़ें" : "Add your area in Settings") : "\u00a0")}</p>
        </div>
        <div className="scrollbar-thin mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.id} className={g.id === "settings" ? "border-t border-white/10 pt-3" : ""}>
              {g.label && wide && <p className="px-3 pb-1 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-[#eef2ec]/45">{pick(g.label)}</p>}
              <ul className="space-y-0.5">
                {g.items.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      title={wide ? pick(n.hint) : pick(n.label)}
                      aria-current={isActive(n.href) ? "page" : undefined}
                      className={`relative flex items-center gap-3 rounded-lg py-2 text-[0.95rem] ${wide ? "px-3" : "justify-center px-0"} ${
                        isActive(n.href) ? "bg-haldi font-medium text-ink" : "text-[#eef2ec]/80 hover:bg-white/10 hover:text-[#eef2ec]"
                      }`}
                    >
                      <n.icon aria-hidden className="size-[18px]" />
                      <span className={wide ? "flex-1" : "sr-only"}>{pick(n.label)}</span>
                      {n.href === "/app" && waiting > 0 && !wide && <span aria-hidden className="absolute right-2 top-1.5 size-2 rounded-full bg-haldi" />}
                      {n.href === "/app" && waiting > 0 && wide && (
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
        <div className={`mt-4 space-y-3 px-3 ${wide ? "" : "hidden"}`}>
          {me?.user && (
            <div className="text-sm">
              <p className="truncate text-[#eef2ec]/80">
                {me.user.name || me.user.email || me.user.phone}
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
            {/* Switch between the two samples: a home kitchen and a restaurant on Zomato/Swiggy. */}
            <span className="flex items-center gap-3">
              <span>{state.lang === "hi" ? "सैंपल:" : "Sample:"}</span>
              <span className="inline-flex rounded-full bg-paper/60 p-0.5">
                {(["home", "restaurant"] as const).map((k) => {
                  const here = (k === "home") === home;
                  return (
                    <a key={k} href={`/demo/${k}`} aria-current={here ? "page" : undefined} className={`rounded-full px-3 py-1 font-medium ${here ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}>
                      {k === "home" ? (state.lang === "hi" ? "घर की रसोई" : "Home kitchen") : state.lang === "hi" ? "रेस्टोरेंट" : "Restaurant"}
                    </a>
                  );
                })}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={testOrder} disabled={testing} className="inline-flex items-center gap-1.5 rounded-full bg-turmeric px-3.5 py-1.5 font-semibold text-ink disabled:opacity-60">
                {testing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <BellRing aria-hidden className="size-4" />}
                {state.lang === "hi" ? "टेस्ट ऑर्डर भेजें" : "Send a test order"}
              </button>
              {(
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
              )}
              <Link href={home ? "/join?journey=new" : "/join?journey=live"} className="font-medium underline underline-offset-2">
                {state.lang === "hi" ? "अपना शुरू करें" : "Start yours"}
              </Link>
            </span>
          </div>
        )}
        <header className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <Link href="/">
            <Wordmark className="text-[28px]" />
          </Link>
          <div className="flex items-center gap-1">
            <LangToggle />
          </div>
        </header>
        <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-6 sm:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Zest, as on the website: a question pill bottom-right, a panel over the dimmed page */}
      <AssistantDock open={copilotOpen} setOpen={setCopilotOpen} />

      {/* "More" sheet, mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-x-0 bottom-[72px] max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-surface p-3" onClick={(e) => e.stopPropagation()}>
            {groups.map((g) => {
              const items = g.items.filter((n) => !(home ? ["/app", "/app/orders", "/app/menu", "/app/customers"] : ["/app", "/app/orders", "/app/menu", "/app/money"]).includes(n.href));
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
        {(home ? (["/app", "/app/orders", "/app/menu", "/app/customers", "more"] as const) : MOBILE_TABS).map((tab) => {
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
