"use client";

import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

export function ComingSoon({ title, body, phase }: { title: Bi; body: Bi; phase: number }) {
  const { pick, state } = useApp();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{pick(title)}</h1>
      <p className="mt-3 max-w-[56ch] text-lg leading-relaxed text-ink-2">{pick(body)}</p>
      <p className="mt-6 text-sm text-muted">{state.lang === "hi" ? `फ़ेज़ ${phase} में आ रहा है` : `Arriving in phase ${phase}`}</p>
    </div>
  );
}
