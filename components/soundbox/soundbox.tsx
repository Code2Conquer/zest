"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import "./soundbox.css";

// The Zest Soundbox "Halo": a round chalk puck with a light ring set into its top. The ring glows when an
// order comes in, moves while Zest speaks, turns green when accepted and red when an order waits too
// long. Press the top to accept (and again when the food is ready); hold the side button to talk.
// The KOT comes out of a separate ticket printer, an add-on that sits next to it. Drawn in SVG and CSS;
// the states are props so a page can play a scene through it. Audio only ever plays on a tap.

export type SoundboxState = "idle" | "ringing" | "speaking" | "printing" | "accepted" | "escalating";

export type SoundboxProps = {
  state: SoundboxState;
  /** What Zest says, shown under the box in the selected language. */
  caption?: Bi;
  /** Lines of the KOT, printed by the ticket printer while `state` is "printing" or after it. No ticket, no printer. */
  ticket?: { title: string; lines: string[]; foot?: string } | null;
  /** Show the printed ticket even when not printing (it stays out once printed). */
  showTicket?: boolean;
  /** A clip in public/audio, played by "Hear it": `${clip}-en.m4a` / `${clip}-hi.m4a`. */
  clip?: string;
  onPress?: () => void;
  onTalk?: () => void;
  /** Smaller box for tight places (the sticky column, the restaurants hero on phones). */
  size?: "md" | "sm" | "xs";
  /** Keep the ticket, caption and "Hear it" spaces reserved, so a state change never moves the page. */
  stable?: boolean;
  /** No caption or "Hear it" under the box: the page shows them elsewhere. */
  bare?: boolean;
  className?: string;
};

export function Soundbox({ state, caption, ticket, showTicket = false, clip, onPress, onTalk, size = "md", stable = false, bare = false, className = "" }: SoundboxProps) {
  const { pick, lang } = useApp();
  const printed = !!ticket && (state === "printing" || showTicket);
  // Gradient ids per instance: a page has several boxes, some inside display:none.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");

  const box = size === "xs" ? 150 : size === "sm" ? 210 : 260;
  const paper = size === "xs" ? box : Math.max(box * 0.86, 176);
  const label = pick(
    {
      idle: { en: "Zest Soundbox, waiting for orders", hi: "Zest Soundbox, ऑर्डर का इंतज़ार" },
      ringing: { en: "Zest Soundbox, new order", hi: "Zest Soundbox, नया ऑर्डर" },
      speaking: { en: "Zest Soundbox, speaking", hi: "Zest Soundbox, बोल रहा है" },
      printing: { en: "Zest Soundbox, order accepted, ticket printing", hi: "Zest Soundbox, ऑर्डर मंज़ूर, टिकट छप रहा है" },
      accepted: { en: "Zest Soundbox, order accepted", hi: "Zest Soundbox, ऑर्डर मंज़ूर" },
      escalating: { en: "Zest Soundbox, order not accepted yet", hi: "Zest Soundbox, ऑर्डर अभी मंज़ूर नहीं हुआ" },
    }[state],
  );

  return (
    <figure className={`sb flex flex-col items-center ${className}`} data-state={state}>
      <div className="relative" style={{ width: box, height: box * 0.56 }}>
        <svg viewBox="0 0 200 112" className="absolute inset-0 size-full overflow-visible" role="img" aria-label={label}>
          <defs>
            <linearGradient id={`${id}-side`} x1="0" x2="1">
              <stop offset="0" stopColor="#c9c2b4" />
              <stop offset="0.45" stopColor="#e4ded2" />
              <stop offset="1" stopColor="#b3ab9c" />
            </linearGradient>
            <radialGradient id={`${id}-top`} cx="0.4" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#f6f2ea" />
              <stop offset="1" stopColor="#ddd6c8" />
            </radialGradient>
            <radialGradient id={`${id}-dish`} cx="0.5" cy="0.6" r="0.6">
              <stop offset="0" stopColor="#e9e3d7" />
              <stop offset="1" stopColor="#d6cfc1" />
            </radialGradient>
            <filter id={`${id}-blur`} x="-30%" y="-60%" width="160%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          {/* light pooling on the counter, and the shadow */}
          <ellipse cx="100" cy="88" rx="98" ry="22" className="sb-pool" filter={`url(#${id}-blur)`} />
          <ellipse cx="100" cy="84" rx="80" ry="13" fill="#000" opacity="0.16" filter={`url(#${id}-blur)`} />
          {/* side band */}
          <path d="M14 48 V68 A86 30 0 0 0 186 68 V48 Z" fill={`url(#${id}-side)`} />
          <rect x="150" y="66" width="16" height="4" rx="2" transform="rotate(-8 158 68)" fill="#9d9586" />
          {/* top and the pressable dish */}
          <ellipse cx="100" cy="48" rx="86" ry="30" fill={`url(#${id}-top)`} />
          <g className="sb-dish">
            <ellipse cx="100" cy="48" rx="52" ry="18" fill={`url(#${id}-dish)`} />
            <text x="100" y="52" textAnchor="middle" fontSize="15" fontWeight="600" fill="#cbc4b6" transform="translate(0 20.8) scale(1 0.6)" letterSpacing="3">
              zest
            </text>
          </g>
          {/* the light ring in its groove */}
          <ellipse cx="100" cy="48" rx="58" ry="20.5" fill="none" stroke="#a69e8f" strokeWidth="3.2" />
          <ellipse cx="100" cy="48" rx="58" ry="20.5" className="sb-glow" filter={`url(#${id}-blur)`} />
          <ellipse cx="100" cy="48" rx="58" ry="20.5" className="sb-ring" />
        </svg>

        {/* Press the top */}
        <button
          type="button"
          onClick={onPress}
          disabled={!onPress}
          aria-label={state === "accepted" ? pick({ en: "Food ready", hi: "खाना तैयार" }) : pick({ en: "Accept the order", hi: "ऑर्डर मंज़ूर करें" })}
          className="sb-button absolute rounded-[50%]"
          style={{ left: "16%", top: "13%", width: "68%", height: "60%" }}
        />
        {/* Hold to talk, on the side */}
        <button type="button" onClick={onTalk} disabled={!onTalk} aria-label={pick({ en: "Push to talk", hi: "बोलने के लिए दबाएँ" })} className="sb-talk absolute grid place-items-center rounded-full" style={{ left: "71%", top: "52%", width: Math.max(24, box * 0.13), height: Math.max(24, box * 0.13) }}>
          {onTalk && <Mic aria-hidden size={Math.round(box * 0.05)} />}
        </button>
      </div>

      {/* The ticket printer (add-on) and the KOT feeding out of it */}
      {ticket && (printed || stable) && (
        <div className="relative z-0 flex flex-col items-center" style={{ marginTop: box * 0.06 }}>
          <div className="sb-printer relative" style={{ width: paper + 18, height: Math.round(box * 0.15) }} title={pick({ en: "Ticket printer (add-on)", hi: "टिकट प्रिंटर (ऐड-ऑन)" })}>
            <span className="sb-led absolute rounded-full" style={{ right: 10, top: "38%", width: 6, height: 6 }} />
            <span className="sb-slot absolute inset-x-[9px] bottom-0 h-[4px] rounded-full" />
          </div>
          <div aria-hidden={!printed || undefined} className="overflow-hidden" style={{ width: paper }}>
            <div className={`sb-ticket font-kot ${state === "printing" ? "is-printing" : ""} ${printed ? "" : "invisible"}`} style={size === "xs" ? { fontSize: 10.5, padding: "10px 8px 14px" } : undefined}>
              <p className="font-semibold">{ticket.title}</p>
              {ticket.lines.map((l) => {
                const [name, price] = l.split("|");
                return (
                  <p key={l} className="flex justify-between gap-3">
                    <span>{name}</span>
                    {price && <span className="tabular-nums">{price}</span>}
                  </p>
                );
              })}
              {ticket.foot && <p className="mt-1.5">{ticket.foot}</p>}
            </div>
          </div>
        </div>
      )}

      {/* What Zest says */}
      {!bare && (
        <figcaption className="mt-4 flex w-full max-w-[34ch] flex-col items-center gap-3 text-center">
          {(caption || stable) && (
            <p key={`${caption?.en}-${lang}`} className={`sb-caption text-[17px] font-medium leading-snug ${stable ? "min-h-[5.6em]" : ""}`} lang={lang}>
              {caption && (
                <>
                  <span className="text-[var(--lp-muted)]">Zest: </span>“{pick(caption)}”
                </>
              )}
            </p>
          )}
          {(clip || stable) && <HearIt clip={clip} />}
        </figcaption>
      )}
    </figure>
  );
}

/** "Hear it": plays the clip in the selected language, only on a tap. Keeps its space when there's no clip. */
export function HearIt({ clip, dark = false }: { clip?: string; dark?: boolean }) {
  const { pick, lang } = useApp();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => audio.current?.pause(), []);
  function hear() {
    if (!clip) return;
    audio.current?.pause();
    const a = new Audio(`/audio/${clip}-${lang}.m4a`);
    audio.current = a;
    setPlaying(true);
    a.onended = a.onerror = () => setPlaying(false);
    a.play().catch(() => setPlaying(false));
  }
  return (
    <button
      type="button"
      onClick={hear}
      disabled={!clip}
      aria-hidden={!clip || undefined}
      tabIndex={clip ? undefined : -1}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors ${dark ? "bg-[#2a2723] text-[#efe9df] hover:bg-[#3a3631]" : "bg-[var(--lp-sunken)] hover:bg-[var(--lp-line)]"} ${clip ? "" : "invisible"}`}
    >
      <Volume2 aria-hidden size={17} className={playing ? "text-[var(--z-turmeric)]" : ""} />
      {pick({ en: "Hear it", hi: "सुनिए" })}
    </button>
  );
}
