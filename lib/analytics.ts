"use client";

// Product analytics with PostHog (free cloud plan), loaded after the page is up so it costs the first
// paint nothing. Without NEXT_PUBLIC_POSTHOG_KEY every call is a no-op.
//
// Never send personal data: no phone numbers, names, addresses or typed messages. Events carry only
// what we need to count and compare (page, step, kind, amount bands, slugs of public pages).

type Props = Record<string, string | number | boolean | null | undefined>;
type PH = { capture: (e: string, p?: Props, o?: { send_instantly?: boolean; transport?: "sendBeacon" }) => void };
// Our events often fire just before the page changes (an order placed, a login), so they go at once, by
// beacon, which the browser delivers even as the page unloads.
const NOW = { send_instantly: true, transport: "sendBeacon" as const };

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let ph: PH | null = null;
let loading: Promise<PH | null> | null = null;
const queue: [string, Props | undefined][] = [];

export function initAnalytics() {
  if (!KEY || typeof window === "undefined" || loading) return loading;
  loading = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      // Page views follow client-side navigation; no cookies, nothing typed is recorded.
      capture_pageview: "history_change",
      persistence: "localStorage",
      autocapture: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      mask_all_text: true,
    });
    // The PostHog project is shared with other apps; every Zest event carries app=zest so charts can filter on it.
    posthog.register({ app: "zest" });
    ph = posthog as unknown as PH;
    for (const [e, p] of queue.splice(0)) ph.capture(e, p, NOW);
    return ph;
  });
  return loading;
}

/** Records one event. Safe to call before analytics has loaded, or when it's off. */
export function track(event: string, props?: Props) {
  if (!KEY || typeof window === "undefined") return;
  if (ph) ph.capture(event, props, NOW);
  else {
    queue.push([event, props]);
    void initAnalytics();
  }
}

/** Rounds a rupee amount into a band, so events carry order size without exact figures. */
export const amountBand = (n: number) => (n < 200 ? "<200" : n < 500 ? "200-499" : n < 1000 ? "500-999" : n < 3000 ? "1000-2999" : "3000+");
