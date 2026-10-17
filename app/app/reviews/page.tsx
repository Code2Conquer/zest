"use client";

import { ChannelTag } from "@/components/bits";
import { ReviewTicket } from "@/components/cards";
import { RATINGS, REVIEWS } from "@/lib/data";
import { useApp, useOutlet } from "@/lib/state";

export default function Reviews() {
  const { t, state } = useApp();
  const { live } = useOutlet();
  const hi = state.lang === "hi";
  const reviews = REVIEWS.filter((r) => live.includes(r.platform));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{t("nav.reviews")}</h1>
      <p className="mt-1 text-muted">{hi ? "हर प्लेटफ़ॉर्म के रिव्यू और शिकायतें, जवाब तैयार" : "Reviews and complaints from every platform, with replies ready"}</p>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
        {live.map((p) => (
          <div key={p}>
            <dt>
              <ChannelTag channel={p} />
            </dt>
            <dd className="mt-1">
              <span className="text-2xl font-semibold">{RATINGS[p].value.toFixed(1)}</span>
              <span className="ml-2 text-sm text-muted">
                {RATINGS[p].count.toLocaleString("en-IN")} {hi ? "रेटिंग" : "ratings"}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 space-y-6">
        {reviews.map((r) => (
          <ReviewTicket key={r.id} reviewId={r.id} />
        ))}
      </div>
    </div>
  );
}
