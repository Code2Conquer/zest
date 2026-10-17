"use client";

import { CHANNEL_COLOR, CHANNEL_NAME, type Channel } from "@/lib/platforms";
import { useApp } from "@/lib/state";

export function ChannelTag({ channel, className = "" }: { channel: Channel; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-ink-2 ${className}`}>
      <span aria-hidden className="size-2 rounded-full" style={{ background: CHANNEL_COLOR[channel] }} />
      {CHANNEL_NAME[channel]}
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  // A single turmeric fleck after the "t", like zest on a dish: the only place the accent appears in the chrome.
  return (
    <span aria-label="Zest" className={`relative inline-flex items-start text-[1.65rem] font-semibold leading-none tracking-[-0.03em] ${className}`}>
      <span aria-hidden>Zest</span>
      <span aria-hidden className="ml-[0.06em] mt-[0.04em] size-[0.22em] rounded-full bg-turmeric" />
    </span>
  );
}

export function LangToggle() {
  const { state, update } = useApp();
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-full bg-sunken p-0.5 text-sm">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={state.lang === l}
          onClick={() => update({ lang: l })}
          className={`rounded-full px-3 py-1 transition-colors ${state.lang === l ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "text-muted hover:text-ink"}`}
        >
          {l === "en" ? "English" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="inline-flex items-center gap-0.5 text-sm font-medium">
      <span className={n <= 2 ? "text-chilli" : "text-ink"}>{n}</span>
      <svg aria-hidden viewBox="0 0 20 20" className={`size-3.5 ${n <= 2 ? "fill-chilli" : "fill-turmeric"}`}>
        <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.7 1-5.9L1.5 7.7l5.9-.8z" />
      </svg>
    </span>
  );
}
