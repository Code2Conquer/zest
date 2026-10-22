"use client";

import { useApp } from "@/lib/state";

/** The small "Coming soon" tag beside anything on the website that isn't live yet. */
export function Soon({ className = "" }: { className?: string }) {
  const { pick } = useApp();
  return (
    <span className={`ml-2 inline-flex whitespace-nowrap rounded-full bg-[var(--lp-sunken)] px-2 py-0.5 align-middle text-[12.5px] font-semibold text-[var(--lp-muted)] ${className}`}>
      {pick({ en: "Coming soon", hi: "जल्द आ रहा है" })}
    </span>
  );
}
