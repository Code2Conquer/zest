"use client";

import { useEffect, useRef, useState } from "react";
import { api, refreshAll } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, X } from "lucide-react";
import { ChannelTag } from "@/components/bits";
import type { Key } from "@/lib/i18n";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";

type Journey = "new" | "notlive" | "live";

const JOURNEYS: { id: Journey; title: Key; sub: Key }[] = [
  { id: "live", title: "journey.live", sub: "journey.live.sub" },
  { id: "notlive", title: "journey.notlive", sub: "journey.notlive.sub" },
  { id: "new", title: "journey.new", sub: "journey.new.sub" },
];

/** The three ways in. Live owners pick their platforms inline, then connect. */
export function JourneyRouter({ tone = "light" }: { tone?: "light" | "haldi" }) {
  const { t, lang } = useApp();
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [live, setLive] = useState<Platform[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Creates the owner's restaurant on the server, then moves on. */
  async function start(j: Journey, platforms: Platform[]) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/outlet", { method: "POST", json: { journey: j, live: platforms, lang } });
      // The browser now points at the new restaurant; reload everything that was showing the old one.
      refreshAll();
      router.push(j === "live" ? "/connect" : `/start?track=${j}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function choose(j: Journey) {
    setJourney(j);
    if (j !== "live") void start(j, ["zomato", "swiggy"]);
  }

  function togglePlatform(p: Platform) {
    setLive((l) => (l.includes(p) ? l.filter((x) => x !== p) : [...l, p]));
  }

  const line = tone === "haldi" ? "divide-ink/20 border-ink/20" : "divide-line border-line";

  return (
    <ul className={`divide-y border-y ${line}`} role="radiogroup" aria-label={t("landing.title")}>
      {JOURNEYS.map((j) => {
        const selected = journey === j.id;
        return (
          <li key={j.id}>
            <button type="button" role="radio" aria-checked={selected} onClick={() => choose(j.id)} className="group flex w-full items-center gap-4 py-5 text-left">
              <span
                aria-hidden
                className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${selected ? "bg-ink text-paper" : "shadow-[inset_0_0_0_1.5px_currentColor] opacity-40 group-hover:opacity-80"}`}
              >
                {selected && <Check className="size-3.5" />}
              </span>
              <span className="flex-1">
                <span className="block text-[1.2rem] font-medium leading-snug">{t(j.title)}</span>
                <span className={`mt-0.5 block text-[0.95rem] ${tone === "haldi" ? "text-ink/70" : "text-muted"}`}>{t(j.sub)}</span>
              </span>
              {j.id !== "live" && <ChevronRight aria-hidden className="size-5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />}
            </button>

            <AnimatePresence initial={false}>
              {j.id === "live" && selected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pl-10">
                    <p className="font-medium">{t("landing.where")}</p>
                    <p className={`mt-0.5 text-sm ${tone === "haldi" ? "text-ink/70" : "text-muted"}`}>{t("landing.where.sub")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PLATFORMS.map((p) => {
                        const on = live.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            aria-pressed={on}
                            onClick={() => togglePlatform(p)}
                            className={`inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 transition-shadow ${on ? "shadow-[0_0_0_2px_var(--ink)]" : "shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]"}`}
                          >
                            <ChannelTag channel={p} className="text-[0.98rem] text-ink" />
                            {on && <Check aria-hidden className="size-4 text-ink" />}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={live.length === 0 || busy}
                      onClick={() => start("live", live)}
                      className="mt-5 rounded-full bg-ink px-6 py-3 font-medium text-paper transition-opacity disabled:opacity-30"
                    >
                      {t("landing.continue")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
      {error && <li className="py-3 text-sm text-chilli">{error}</li>}
    </ul>
  );
}

export function RouterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="router-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 outline-none sm:max-w-xl sm:rounded-3xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="router-title" className="font-sign text-[1.9rem] leading-[1.05]">
                {t("landing.title")}
              </h2>
              <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6">
              <JourneyRouter />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
