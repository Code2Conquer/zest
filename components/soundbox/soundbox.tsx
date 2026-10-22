"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import "./soundbox.css";

// The Zest Soundbox "Halo": a round graphite puck with a champagne bevel, a glass top and a light ring set into it. The ring glows when an
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
            {/* graphite side: lit from the front-left, falling off to the edges and the bottom */}
            <linearGradient id={`${id}-side`} x1="0" x2="1">
              <stop offset="0" stopColor="#0d0f11" />
              <stop offset="0.18" stopColor="#2b2f34" />
              <stop offset="0.36" stopColor="#4a4f56" />
              <stop offset="0.52" stopColor="#2a2e33" />
              <stop offset="0.85" stopColor="#16181b" />
              <stop offset="1" stopColor="#08090a" />
            </linearGradient>
            <linearGradient id={`${id}-shade`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.45" />
            </linearGradient>
            {/* champagne bevel where the top meets the side */}
            <linearGradient id={`${id}-bevel`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f3e4c4" />
              <stop offset="0.45" stopColor="#b89c6a" />
              <stop offset="1" stopColor="#5e4d33" />
            </linearGradient>
            <radialGradient id={`${id}-top`} cx="0.36" cy="0.25" r="0.9">
              <stop offset="0" stopColor="#3d4248" />
              <stop offset="0.55" stopColor="#25282c" />
              <stop offset="1" stopColor="#141619" />
            </radialGradient>
            <linearGradient id={`${id}-sheen`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="0.4" stopColor="#fff" stopOpacity="0.04" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* the glass dish you press */}
            <radialGradient id={`${id}-dish`} cx="0.45" cy="0.7" r="0.75">
              <stop offset="0" stopColor="#2f3338" />
              <stop offset="1" stopColor="#0f1113" />
            </radialGradient>
            <filter id={`${id}-blur`} x="-30%" y="-60%" width="160%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id={`${id}-soft`} x="-30%" y="-60%" width="160%" height="220%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <clipPath id={`${id}-topclip`}>
              <ellipse cx="100" cy="48" rx="84.5" ry="29" />
            </clipPath>
          </defs>
          {/* light pooling on the counter, the wide soft shadow and the tight contact shadow */}
          <ellipse cx="100" cy="90" rx="98" ry="22" className="sb-pool" filter={`url(#${id}-blur)`} />
          <ellipse cx="100" cy="86" rx="88" ry="15" fill="#000" opacity="0.22" filter={`url(#${id}-blur)`} />
          <ellipse cx="100" cy="76" rx="80" ry="10" fill="#000" opacity="0.35" filter={`url(#${id}-soft)`} />
          {/* side band, shaded towards the counter, with a thin lit lip at the bottom */}
          <path d="M14 48 V70 A86 30 0 0 0 186 70 V48 Z" fill={`url(#${id}-side)`} />
          <path d="M14 48 V70 A86 30 0 0 0 186 70 V48 Z" fill={`url(#${id}-shade)`} />
          <path d="M16 70 A84 29 0 0 0 184 70" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="0.8" />
          {/* push-to-talk key on the side */}
          <rect x="150" y="67" width="16" height="4" rx="2" transform="rotate(-8 158 69)" fill="#050607" />
          <rect x="150.5" y="67" width="15" height="1.2" rx="0.6" transform="rotate(-8 158 69)" fill="#fff" opacity="0.18" />
          {/* bevel, top and the sheen across it */}
          <ellipse cx="100" cy="48" rx="86" ry="30" fill={`url(#${id}-bevel)`} />
          <ellipse cx="100" cy="48" rx="84.5" ry="29" fill={`url(#${id}-top)`} />
          <g clipPath={`url(#${id}-topclip)`}>
            <ellipse cx="72" cy="30" rx="70" ry="22" fill={`url(#${id}-sheen)`} />
          </g>
          {/* the groove the light ring sits in */}
          <ellipse cx="100" cy="48.6" rx="58" ry="20.5" fill="none" stroke="#050607" strokeWidth="4.4" />
          <ellipse cx="100" cy="47.4" rx="58" ry="20.5" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
          {/* the glass dish, with its reflection and the etched mark */}
          <g className="sb-dish">
            <ellipse cx="100" cy="48" rx="52" ry="18" fill={`url(#${id}-dish)`} />
            <path d="M58 44 A48 15 0 0 1 128 33.5" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.4" strokeLinecap="round" />
            <ellipse cx="88" cy="40" rx="26" ry="6" fill="#fff" opacity="0.05" />
            <text x="100" y="52" textAnchor="middle" fontSize="13" fontWeight="500" fill="#8b9097" transform="translate(0 20.8) scale(1 0.6)" letterSpacing="5" style={{ fontFamily: "var(--font-site), system-ui, sans-serif" }}>
              zest
            </text>
          </g>
          {/* the light ring: a faint warm line at rest, glowing in the state's colour */}
          <ellipse cx="100" cy="48" rx="58" ry="20.5" fill="none" stroke="#6b5532" strokeOpacity="0.55" strokeWidth="1.6" />
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
