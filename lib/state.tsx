"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ConnectMethod, Platform } from "./platforms";
import { translate, type Key, type Lang } from "./i18n";

export type Journey = "new" | "notlive" | "live";

export type Connection = { method: ConnectMethod; at: number };

export type AppState = {
  lang: Lang;
  journey: Journey | null;
  live: Platform[];
  connections: Partial<Record<Platform, Connection>>;
  email: "gmail" | "outlook" | null;
  whatsapp: boolean;
};

// Used when someone opens the dashboard without going through connect:
// a restaurant live on both platforms with everything connected.
export const DEMO_STATE: AppState = {
  lang: "en",
  journey: "live",
  live: ["zomato", "swiggy"],
  connections: {
    zomato: { method: "api", at: Date.now() - 3 * 60_000 },
    swiggy: { method: "portal", at: Date.now() - 4 * 60_000 },
  },
  email: "gmail",
  whatsapp: true,
};

const EMPTY: AppState = {
  lang: "en",
  journey: null,
  live: [],
  connections: {},
  email: null,
  whatsapp: false,
};

const STORAGE_KEY = "zest:state";

type Ctx = {
  state: AppState;
  ready: boolean;
  update: (patch: Partial<AppState>) => void;
  t: (key: Key) => string;
  pick: <T>(bi: { en: T; hi: T }) => T;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // Storage can be blocked; the app still works for this visit.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.lang === "hi" ? "hi" : "en";
  }, [state.lang]);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      update,
      t: (key) => translate(state.lang, key),
      pick: (bi) => bi[state.lang],
    }),
    [state, ready, update],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

/** The dashboard falls back to the demo restaurant when nothing is connected yet. */
export function useOutlet() {
  const { state, ready } = useApp();
  const isDemo = ready && state.live.length === 0;
  const live = isDemo ? DEMO_STATE.live : state.live;
  const connections = isDemo ? DEMO_STATE.connections : state.connections;
  return { live, connections, isDemo, email: isDemo ? DEMO_STATE.email : state.email };
}
