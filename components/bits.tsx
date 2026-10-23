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
  // "zest" in lowercase, heavy and tight, with a single turmeric fleck after the "t". Sized by font-size.
  return (
    <span role="img" aria-label="Zest" className={`relative inline-flex items-start text-[1.65rem] font-extrabold leading-none tracking-[-0.05em] ${className}`}>
      <span aria-hidden>zest</span>
      <span aria-hidden className="ml-[0.07em] mt-[0.02em] size-[0.22em] shrink-0 rounded-full bg-turmeric" />
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
          // While the page is in English, "हिंदी" is drawn in the phone's own Devanagari font: in Anek it
          // would pull the whole Devanagari font file (~700 KB) for one word.
          className={`min-h-9 rounded-full px-3 transition-colors ${lang === l ? "bg-[color-mix(in_srgb,currentColor_14%,transparent)] font-semibold" : "opacity-75 hover:opacity-100"} ${l === "hi" && lang !== "hi" ? "font-[system-ui,sans-serif]" : ""}`}
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
