"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
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

/** English or हिंदी, remembered on this device. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useApp();
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full p-0.5 text-sm ${className}`}>
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-9 rounded-full px-3 transition-colors ${lang === l ? "bg-[color-mix(in_srgb,currentColor_14%,transparent)] font-semibold" : "opacity-75 hover:opacity-100"}`}
        >
          {l === "en" ? "English" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}

/** Light or dark, remembered on this device. The first visit follows the system setting. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set ? set === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  function flip() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`grid size-10 place-items-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)] ${className}`}
    >
      {dark ? <Sun aria-hidden size={19} /> : <Moon aria-hidden size={19} />}
    </button>
  );
}

export const THEME_KEY = "zest:theme";

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
