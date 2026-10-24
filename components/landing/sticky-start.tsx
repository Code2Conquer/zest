"use client";

import { useEffect, useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import { LottieIcon } from "@/components/landing/lottie-icon";

// On a phone, once the hero's own button has scrolled away, the one action stays in reach at the
// bottom of the screen. Hidden again near the page's closing call to action, and never on wider screens.

export function StickyStart({ href, label, note, watch, hideAt }: { href: string; label: Bi; note: Bi; watch: string; hideAt: string }) {
  const { pick } = useApp();
  const [past, setPast] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const start = document.getElementById(watch);
    const end = document.getElementById(hideAt);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === start) setPast(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === end) setAtEnd(e.isIntersecting || e.boundingClientRect.top < 0);
      }
    });
    if (start) io.observe(start);
    if (end) io.observe(end);
    return () => io.disconnect();
  }, [watch, hideAt]);

  const show = past && !atEnd;
  // The animated button loads only once the bar has first appeared, so it costs the first screen nothing.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (show) setSeen(true);
  }, [show]);
  return (
    <div
      aria-hidden={!show}
      // A real overlay: it floats over the page, so it carries a shadow.
      className={/* taste-skill-ignore */ `fixed inset-x-0 bottom-0 z-40 bg-[var(--lp-ground)] shadow-[0_-10px_30px_-12px_rgb(0_0_0/0.25)] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 motion-reduce:transition-none sm:hidden ${show ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      {/* One bar for both actions, after ixigo: ask Zest on the left, start on the right. Nothing floats over the page. */}
      <div className="flex items-center gap-3">
        <button type="button" tabIndex={show ? 0 : -1} onClick={() => window.dispatchEvent(new Event("zest:open"))} aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })} className="za-pill relative grid size-12 shrink-0 place-items-center rounded-full">
          <span className="grid size-10 place-items-center rounded-full bg-[var(--z-turmeric)]">
            {seen && <LottieIcon src="/lottie/zest-sparkle.json" className="size-9" />}
          </span>
        </button>
        <p className="min-w-0 flex-1 text-[14px] leading-snug text-[var(--lp-muted)]">{pick(note)}</p>
        <a href={href} tabIndex={show ? 0 : -1} className="lp-btn haldi min-h-12 shrink-0 px-5 text-[16px]">
          {pick(label)}
        </a>
      </div>
    </div>
  );
}
