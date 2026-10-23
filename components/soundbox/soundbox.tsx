"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import "./soundbox.css";

// The Zest Soundbox "Halo": a soft ceramic puck with a black glass top and a light ring set into it, shown as
// 3D renders (scripts/soundbox/render.html, ray-marched offline; the page never runs WebGL). The ring glows when an
// order comes in, moves while Zest speaks, turns green when accepted and red when an order waits too
// long. Press the top to accept (and again when the food is ready); hold the side button to talk.
// The KOT comes out of a separate ticket printer, an add-on that sits next to it (CSS);
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
  size?: "lg" | "md" | "sm" | "xs";
  /** Keep the ticket, caption and "Hear it" spaces reserved, so a state change never moves the page. */
  stable?: boolean;
  /** No caption or "Hear it" under the box: the page shows them elsewhere. */
  bare?: boolean;
  className?: string;
};

// Which lit render each state shows (public/soundbox/*.webp, made by scripts/soundbox/render.mjs).
const LIGHT: Record<SoundboxState, "amber" | "green" | "red" | null> = { idle: null, ringing: "amber", speaking: "amber", printing: "amber", accepted: "green", escalating: "red" };

export function Soundbox({ state, caption, ticket, showTicket = false, clip, onPress, onTalk, size = "md", stable = false, bare = false, className = "" }: SoundboxProps) {
  const { pick, lang } = useApp();
  const printed = !!ticket && (state === "printing" || showTicket);
  const light = LIGHT[state];
  // Lit renders are fetched the first time their state comes up, then kept for the fade.
  const [seen, setSeen] = useState<Set<string>>(() => new Set(light ? [light] : []));
  useEffect(() => {
    if (light && !seen.has(light)) setSeen(new Set([...seen, light]));
  }, [light, seen]);

  const box = size === "xs" ? 150 : size === "sm" ? 210 : size === "lg" ? 340 : 260;
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
      <div className="relative" style={{ width: box, height: box * 0.62 }}>
        {/* The rendered box, wider than its slot so the shadow and the ring's glow can spill out. The lit
            renders sit on top of the resting one and fade in for the state. */}
        <div role="img" aria-label={label} className="sb-body absolute" style={{ left: "-15%", top: "-8%", width: "130%", aspectRatio: "16 / 10" }}>
          <img src="/soundbox/idle.webp" alt="" width={640} height={400} draggable={false} className="absolute inset-0 size-full select-none" />
          {(["amber", "green", "red"] as const).filter((c) => seen.has(c)).map((c) => (
            <img key={c} src={`/soundbox/${c}.webp`} alt="" width={640} height={400} draggable={false} className={`sb-light absolute inset-0 size-full select-none ${light === c ? "is-on" : ""}`} />
          ))}
        </div>

        {/* Press the top */}
        <button
          type="button"
          onClick={onPress}
          disabled={!onPress}
          aria-label={state === "accepted" ? pick({ en: "Food ready", hi: "खाना तैयार" }) : pick({ en: "Accept the order", hi: "ऑर्डर मंज़ूर करें" })}
          className="sb-button absolute rounded-[50%]"
          style={{ left: "14%", top: "2%", width: "72%", height: "56%" }}
        />
        {/* Hold to talk, on the side */}
        <button type="button" onClick={onTalk} disabled={!onTalk} aria-label={pick({ en: "Push to talk", hi: "बोलने के लिए दबाएँ" })} className="sb-talk absolute grid place-items-center rounded-full" style={{ left: "52%", top: "66%", width: Math.max(24, box * 0.13), height: Math.max(24, box * 0.13) }}>
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
