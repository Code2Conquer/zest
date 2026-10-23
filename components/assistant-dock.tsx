"use client";

import { useEffect, useState } from "react";
import { LottieIcon } from "@/components/landing/lottie-icon";
import { HOME_STARTER_SUGGESTIONS, STARTER_SUGGESTIONS } from "@/lib/agents";
import { isHomeKitchen } from "@/lib/nav";
import { useApp } from "@/lib/state";
import { Copilot } from "./copilot";

// Zest in the dashboard, the same as on the website: one question at a time in an ink pill with a
// turmeric edge, and a panel that opens over the dimmed page. On a phone the bottom tabs open it.

export function AssistantDock({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { pick, outlet } = useApp();
  const questions = (isHomeKitchen(outlet) ? HOME_STARTER_SUGGESTIONS : STARTER_SUGGESTIONS).map((q) => pick(q));
  const [at, setAt] = useState(0);
  const [ask, setAsk] = useState<string | undefined>();
  useEffect(() => {
    if (open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAt((i) => i + 1), 4500);
    return () => clearInterval(t);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, setOpen]);
  const current = questions[at % Math.max(1, questions.length)] ?? "";
  const close = () => {
    setOpen(false);
    setAsk(undefined);
  };

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-40 hidden lg:block">
          <div className="za-pill relative flex items-center gap-1 rounded-full p-1.5 pl-5">
            <span aria-hidden className="za-dots pointer-events-none absolute inset-0 rounded-full" />
            <button
              type="button"
              onClick={() => {
                setAsk(current);
                setOpen(true);
              }}
              className="relative max-w-[300px] truncate py-2 pr-2 text-left text-[15px] font-semibold text-ink"
            >
              <span key={at} className="za-q inline-block">
                {current}
              </span>
            </button>
            <button type="button" onClick={() => setOpen(true)} aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })} className="relative grid size-11 shrink-0 place-items-center rounded-full bg-turmeric transition-transform hover:scale-105">
              <LottieIcon src="/lottie/zest-sparkle.json" className="size-10" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="za-scrim fixed inset-0 z-50 flex items-end justify-center bg-[#0b0d10]/60 backdrop-blur-[3px] sm:justify-end sm:p-6" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })}
            onClick={(e) => e.stopPropagation()}
            className="za-in flex h-[86dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:h-[680px] sm:max-h-[calc(100dvh-48px)] sm:w-[440px] sm:rounded-[28px]"
          >
            <Copilot onClose={close} ask={ask} />
          </div>
        </div>
      )}
    </>
  );
}
