"use client";

import { useEffect, useRef, useState } from "react";
import type { Check } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// A shared way to make a case: each reason shown as it goes today, then with Zest. Used by "The orders
// you already get, and lose" on /restaurants and "Why take your kitchen online" on the homepage.

const FLIP_MS = 1800;
const NEXT_MS = 6000;

export type BeforeAfterItem = { id: string; icon: typeof Check; title: Bi; line: Bi; today: React.ReactNode; zest: React.ReactNode };

/**
 * Reasons as tabs, and a stage showing the chosen one as it goes today, then a moment later with Zest.
 * While on screen it walks through them; picking one, or the Today / With Zest switch, takes over.
 * Reduced motion shows "With Zest", still.
 */
export function BeforeAfter({ items, label }: { items: BeforeAfterItem[]; label: Bi }) {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const [zest, setZest] = useState(false);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      setZest(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Today first, then the flip to Zest, then the next reason.
  useEffect(() => {
    if (!auto || !inView) return;
    setZest(false);
    const t = [setTimeout(() => setZest(true), FLIP_MS), setTimeout(() => setK((x) => (x + 1) % items.length), NEXT_MS)];
    return () => t.forEach(clearTimeout);
  }, [k, auto, inView]);

  const choose = (i: number) => {
    setAuto(false);
    setK(i);
    setZest(false);
    setTimeout(() => setZest(true), FLIP_MS);
  };
  const item = items[k];

  return (
    <div ref={box} className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
      {/* The reasons: a list on wide screens, a two-column grid on a phone */}
      <div role="tablist" aria-label={pick(label)} className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1.5">
        {items.map((x, i) => {
          const on = i === k;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => choose(i)}
              className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors sm:px-4 lg:py-4 ${on ? "bg-[var(--lp-paper)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--z-turmeric)]" : "hover:bg-[var(--lp-paper)]/60"}`}
            >
              <span className={`hidden size-10 shrink-0 place-items-center rounded-full transition-colors sm:grid ${on ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-sunken)] text-[var(--lp-muted)]"}`}>
                <x.icon aria-hidden size={18} />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold leading-snug sm:text-[16px] ${on ? "" : "text-[var(--lp-muted)]"}`}>{pick(x.title)}</span>
                <span className="hidden text-[14.5px] leading-snug text-[var(--lp-muted)] lg:block">{pick(x.line)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* The stage: today, then with Zest */}
      <div role="tabpanel" className="flex flex-col rounded-[24px] bg-[var(--lp-paper)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div role="radiogroup" aria-label={pick({ en: "Today or with Zest", hi: "आज या Zest के साथ" })} className="inline-flex rounded-full bg-[var(--lp-sunken)] p-1 text-[14px] font-semibold">
            {[false, true].map((z) => (
              <button
                key={String(z)}
                type="button"
                role="radio"
                aria-checked={zest === z}
                onClick={() => {
                  setAuto(false);
                  setZest(z);
                }}
                className={`min-h-9 whitespace-nowrap rounded-full px-4 transition-colors ${zest === z ? (z ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-ink)] text-[var(--lp-on-ink)]") : "text-[var(--lp-muted)]"}`}
              >
                {z ? pick({ en: "With Zest", hi: "Zest के साथ" }) : pick({ en: "Today", hi: "आज" })}
              </button>
            ))}
          </div>
          <p className="hidden truncate text-[14px] text-[var(--lp-muted)] sm:block lg:hidden">{pick(items[k].line)}</p>
        </div>
        <div key={`${item.id}-${zest}`} className="jr-in mt-4 grid h-[260px] place-items-center rounded-[18px] bg-[var(--lp-sunken)] sm:h-[280px]">
          {zest ? item.zest : item.today}
        </div>
      </div>
    </div>
  );
}

/* ---- shared drawing pieces for the scenes ---- */

// The scene cards float above the stage like the real objects they stand for. taste-skill-ignore
export const card = "w-[280px] rounded-2xl bg-white p-3.5 text-[#1c1f23] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]"; // taste-skill-ignore

export function Slip({ lines, note }: { lines: string[]; note?: string }) {
  return (
    <div data-ui className="note-paper w-[240px] rotate-[-3deg] px-4 pb-4 pt-6 text-[#24348a]">
      <div className="font-hand text-[17px] leading-[24px]">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
        {note && <p className="mt-1 text-[#c23a22] line-through decoration-2">{note}</p>}
      </div>
    </div>
  );
}
