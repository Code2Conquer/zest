"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAll, useApi } from "./api";
import { translate, type Key, type Lang } from "./i18n";
import type { OutletDTO } from "./types";

type Ctx = {
  lang: Lang;
  /** Kept for components that read state.lang. */
  state: { lang: Lang };
  setLang: (lang: Lang) => void;
  outlet: OutletDTO | null;
  outletError: string | null;
  /** Patches the outlet on the server and refreshes every view. */
  updateOutlet: (patch: Record<string, unknown>) => Promise<OutletDTO>;
  t: (key: Key) => string;
  pick: <T>(bi: { en: T; hi: T }) => T;
};

const AppCtx = createContext<Ctx | null>(null);
const LANG_KEY = "zest:lang";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const { data: outlet, error: outletError, setData } = useApi<OutletDTO>("/api/outlet");

  // The language switch is paused: screens stay in English, and the assistant answers in whatever
  // language the owner writes in. Hindi copy stays in place for when the switch comes back.

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const updateOutlet = useCallback(
    async (patch: Record<string, unknown>) => {
      const next = await api<OutletDTO>("/api/outlet", { method: "PATCH", json: patch });
      setData(next);
      refreshAll();
      return next;
    },
    [setData],
  );

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      try {
        localStorage.setItem(LANG_KEY, l);
      } catch {}
      // The owner's language also decides WhatsApp messages.
      if (outlet && !outlet.isDemo) void api("/api/outlet", { method: "PATCH", json: { lang: l } }).catch(() => {});
    },
    [outlet],
  );

  const value = useMemo<Ctx>(
    () => ({ lang, state: { lang }, setLang, outlet, outletError, updateOutlet, t: (key) => translate(lang, key), pick: (bi) => bi[lang] }),
    [lang, setLang, outlet, outletError, updateOutlet],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

/** The current outlet's live platforms and connections, with safe defaults while loading. */
export function useOutlet() {
  const { outlet } = useApp();
  return {
    outlet,
    live: outlet?.live ?? [],
    connections: outlet?.connections ?? [],
    isDemo: outlet?.isDemo ?? false,
    ready: !!outlet,
  };
}
