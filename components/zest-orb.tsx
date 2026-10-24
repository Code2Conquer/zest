"use client";

// Zest's mark as an AI presence: two soft blobs of turmeric, coral and rose light that keep changing shape
// and flow into each other, with a white sparkle at the centre that twinkles now and then. It quickens
// while Zest thinks and swells gently while it listens. Pure CSS (globals.css, .zo-*); still with reduced motion.

export type OrbState = "idle" | "thinking" | "listening";

export function ZestOrb({ size = 44, state = "idle", className = "" }: { size?: number; state?: OrbState; className?: string }) {
  return (
    <span aria-hidden data-state={state} className={`zo relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <span className="zo-blob absolute inset-0" />
      <span className="zo-blob zo-blob-2 absolute inset-[6%]" />
      <svg viewBox="0 0 24 24" className="zo-spark relative" style={{ width: size * 0.42, height: size * 0.42 }}>
        <path d="M12 2c.6 4.7 2.6 7.4 7.5 8.6.6.2.6 1 0 1.2C14.6 13 12.6 15.7 12 22c-.6-6.3-2.6-9-7.5-10.2-.6-.2-.6-1 0-1.2C9.4 9.4 11.4 6.7 12 2Z" fill="#fff" />
      </svg>
    </span>
  );
}
