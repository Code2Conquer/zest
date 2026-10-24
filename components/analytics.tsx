"use client";

import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { initAnalytics, track } from "@/lib/analytics";

// Site-wide analytics: Vercel Web Analytics and Speed Insights (page views and real-user speed, switched
// on in the Vercel dashboard), and PostHog for funnels, started once the browser is idle.
// Links and buttons with data-track="event" (and optional data-track-place / data-track-page) are counted
// on click, so markup can be tracked without wiring handlers.

export function Analytics() {
  useEffect(() => {
    const start = () => void initAnalytics();
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback;
    const t = idle ? idle(start) : window.setTimeout(start, 1500);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const props: Record<string, string> = { path: location.pathname };
      for (const [k, v] of Object.entries(el.dataset)) if (k.startsWith("track") && k !== "track" && v) props[k.slice(5).toLowerCase()] = v;
      track(el.dataset.track!, props);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (!idle) clearTimeout(t);
    };
  }, []);
  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}
