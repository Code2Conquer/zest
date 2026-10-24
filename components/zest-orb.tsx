"use client";

// Zest's mark as an AI presence: a small glossy orb of turmeric, saffron and cream light that turns slowly
// and breathes at rest, spins faster while Zest thinks, and sends out soft rings while it listens.
// Pure CSS (globals.css, .zo-*), so it costs nothing to load; with reduced motion it holds still.

export type OrbState = "idle" | "thinking" | "listening";

export function ZestOrb({ size = 44, state = "idle", className = "" }: { size?: number; state?: OrbState; className?: string }) {
  return (
    <span aria-hidden data-state={state} className={`zo relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className="zo-halo absolute inset-[-18%] rounded-full" />
      <span className="zo-ring absolute inset-0 rounded-full" />
      <span className="zo-core absolute inset-0 overflow-hidden rounded-full">
        <span className="zo-swirl absolute inset-[-25%]" />
        <span className="zo-glint absolute inset-0 rounded-full" />
      </span>
    </span>
  );
}
