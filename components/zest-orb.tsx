"use client";

import { useId } from "react";

// Zest's mark as an AI presence, after ixigo's Tara: a dark glass sphere holding tilted, rounded bands of
// light (rose, coral, turmeric, saffron, cream) that drift past each other at their own pace. The bands
// rush while Zest thinks and pulse while it listens. Pure SVG and CSS (globals.css, .zo-*); still with
// reduced motion.

export type OrbState = "idle" | "thinking" | "listening";

// Each band fits inside the sphere at its height, so they read as lenses of light, not stripes.
const BANDS = [
  { y: 18.0, w: 41, h: 8, x: 19.5, from: "#ff9bb0", to: "#ff6f91" },
  { y: 27.5, w: 49, h: 9, x: 15.5, from: "#ff9a5c", to: "#ff6f3c" },
  { y: 37.0, w: 51, h: 10, x: 14.5, from: "#ffd36b", to: "#e9a31a" },
  { y: 47.5, w: 47, h: 9, x: 16.5, from: "#ffe7a3", to: "#ffc65c" },
  { y: 57.5, w: 37, h: 7, x: 21.5, from: "#fff6e0", to: "#ffd9a0" },
];

export function ZestOrb({ size = 44, state = "idle", className = "" }: { size?: number; state?: OrbState; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span aria-hidden data-state={state} className={`zo relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" width={size} height={size} className="block overflow-visible">
        <defs>
          <radialGradient id={`g${id}`} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#3a2a22" />
            <stop offset="1" stopColor="#0d0b0a" />
          </radialGradient>
          <radialGradient id={`s${id}`} cx="32%" cy="22%" r="45%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`c${id}`}>
            <circle cx="40" cy="40" r="36" />
          </clipPath>
          {BANDS.map((b, i) => (
            <linearGradient key={i} id={`b${id}${i}`} x1="0" x2="1">
              <stop offset="0" stopColor={b.from} />
              <stop offset="1" stopColor={b.to} />
            </linearGradient>
          ))}
        </defs>
        <circle className="zo-glow" cx="40" cy="40" r="36" />
        <circle cx="40" cy="40" r="36" fill={`url(#g${id})`} />
        <g clipPath={`url(#c${id})`}>
          <g className="zo-bands">
            {BANDS.map((b, i) => (
              <rect key={i} className={`zo-band zo-band-${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.h / 2} fill={`url(#b${id}${i})`} />
            ))}
          </g>
        </g>
        <circle cx="40" cy="40" r="36" fill={`url(#s${id})`} />
        <circle cx="40" cy="40" r="35.5" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1" />
      </svg>
    </span>
  );
}
