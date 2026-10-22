"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import "./soundbox.css";

// The Zest Soundbox: a steel rounded-square box with an ink face, a turmeric ring that moves like a
// voice when it speaks, one big button on top (accept, then food ready), a push-to-talk button on its
// side and a slot that prints a KOT downward. Drawn in SVG and CSS; the states are props so a page can
// play a scene through it. Audio only ever plays on a tap.

export type SoundboxState = "idle" | "ringing" | "speaking" | "printing" | "accepted" | "escalating";

export type SoundboxProps = {
  state: SoundboxState;
  /** What Zest says, shown under the box in the selected language. */
  caption?: Bi;
  /** Lines of the KOT, printed while `state` is "printing" or after it. */
  ticket?: { title: string; lines: string[]; foot?: string } | null;
  /** Show the printed ticket even when not printing (it stays out once printed). */
  showTicket?: boolean;
  /** A clip in public/audio, played by "Hear it": `${clip}-en.m4a` / `${clip}-hi.m4a`. */
  clip?: string;
  onPress?: () => void;
  onTalk?: () => void;
  /** Smaller box for tight places (the sticky column, the restaurants hero on phones). */
  size?: "md" | "sm";
  className?: string;
};

const RAYS = 36;

export function Soundbox({ state, caption, ticket, showTicket = false, clip, onPress, onTalk, size = "md", className = "" }: SoundboxProps) {
  const { pick, lang } = useApp();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const printed = !!ticket && (state === "printing" || showTicket);

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

  const box = size === "sm" ? 208 : 260;
  const label = pick(
    {
      idle: { en: "Zest Soundbox, waiting for orders", hi: "Zest Soundbox, ऑर्डर का इंतज़ार" },
      ringing: { en: "Zest Soundbox, new order", hi: "Zest Soundbox, नया ऑर्डर" },
      speaking: { en: "Zest Soundbox, speaking", hi: "Zest Soundbox, बोल रहा है" },
      printing: { en: "Zest Soundbox, printing the ticket", hi: "Zest Soundbox, टिकट छाप रहा है" },
      accepted: { en: "Zest Soundbox, order accepted", hi: "Zest Soundbox, ऑर्डर मंज़ूर" },
      escalating: { en: "Zest Soundbox, order not accepted yet", hi: "Zest Soundbox, ऑर्डर अभी मंज़ूर नहीं हुआ" },
    }[state],
  );

  return (
    <figure className={`sb flex flex-col items-center ${className}`} data-state={state} style={{ "--sb": `${box}px` } as React.CSSProperties}>
      <div className="relative" style={{ width: box, height: box + box * 0.14 }}>
        {/* Big button on top */}
        <button
          type="button"
          onClick={onPress}
          disabled={!onPress}
          aria-label={state === "accepted" ? pick({ en: "Food ready", hi: "खाना तैयार" }) : pick({ en: "Accept the order", hi: "ऑर्डर मंज़ूर करें" })}
          className="sb-button absolute left-1/2 top-0 z-20 -translate-x-1/2"
          style={{ width: box * 0.3, height: box * 0.3 }}
        >
          <span className="sb-button-cap" />
        </button>

        {/* Push to talk, on the right side */}
        <button type="button" onClick={onTalk} disabled={!onTalk} aria-label={pick({ en: "Push to talk", hi: "बोलने के लिए दबाएँ" })} className="sb-talk absolute z-20 grid place-items-center" style={{ right: -box * 0.045, top: box * 0.42, width: box * 0.07, height: box * 0.22 }}>
          <Mic aria-hidden size={Math.round(box * 0.05)} />
        </button>

        {/* Body and face */}
        <div className="sb-body absolute inset-x-0 bottom-0 z-10" style={{ height: box, borderRadius: box * 0.22 }}>
          <div className="sb-face absolute grid place-items-center" style={{ inset: box * 0.07, borderRadius: box * 0.16 }}>
            <svg viewBox="0 0 200 200" className="size-[86%]" role="img" aria-label={label}>
              {/* the voice ring: short rays that move like a waveform while Zest speaks */}
              <g className="sb-rays">
                {Array.from({ length: RAYS }, (_, k) => (
                  <g key={k} transform={`rotate(${(360 / RAYS) * k} 100 100)`}>
                    <rect x="98.5" y="14" width="3" height="16" rx="1.5" className="sb-ray" style={{ animationDelay: `${((k * 7) % RAYS) * -0.045}s` }} />
                  </g>
                ))}
              </g>
              <circle cx="100" cy="100" r="64" className="sb-ring" />
              {/* speaker grille */}
              {Array.from({ length: 9 }, (_, r) =>
                Array.from({ length: 9 }, (_, c) => {
                  const x = 60 + c * 10, y = 60 + r * 10;
                  return (x - 100) ** 2 + (y - 100) ** 2 <= 40 ** 2 ? <circle key={`${r}-${c}`} cx={x} cy={y} r="2.1" className="sb-hole" /> : null;
                }),
              )}
            </svg>
          </div>
          {/* Ticket slot, front bottom */}
          <span className="sb-slot absolute left-1/2 -translate-x-1/2" style={{ bottom: box * 0.035, width: box * 0.56, height: 5 }} />
        </div>

      </div>

      {/* The KOT, printing downward out of the slot */}
      {printed && ticket && (
        <div className="relative z-0 overflow-hidden" style={{ width: box * 0.86, marginTop: -box * 0.05 }}>
          <div className={`sb-ticket font-kot ${state === "printing" ? "is-printing" : ""}`}>
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
      )}

      {/* What Zest says */}
      <figcaption className="mt-4 flex w-full max-w-[34ch] flex-col items-center gap-3 text-center">
        {caption && (
          <p key={`${caption.en}-${lang}`} className="sb-caption text-[17px] font-medium leading-snug" lang={lang}>
            <span className="text-[var(--lp-muted)]">Zest: </span>“{pick(caption)}”
          </p>
        )}
        {clip && (
          <button type="button" onClick={hear} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--lp-sunken)] px-4 text-[15px] font-semibold transition-colors hover:bg-[var(--lp-line)]">
            <Volume2 aria-hidden size={17} className={playing ? "text-[var(--lp-accent)]" : ""} />
            {pick({ en: "Hear it", hi: "सुनिए" })}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
