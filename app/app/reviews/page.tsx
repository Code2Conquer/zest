"use client";

import { Page } from "@/components/page";
import { NAV_GROUPS, navItem } from "@/lib/nav";
import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { ChannelTag, Stars } from "@/components/bits";
import { api, refreshAll, useApi } from "@/lib/api";
import { CHANNEL_NAME } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";
import type { ApprovalDTO, ReviewDTO } from "@/lib/types";

export default function Reviews() {
  const { lang, pick } = useApp();
  const { outlet, live } = useOutlet();
  const { data, error } = useApi<ReviewDTO[]>(outlet ? `/api/reviews?o=${outlet.id}` : null);
  const hi = lang === "hi";
  const reviews = (data ?? []).filter((r) => live.includes(r.platform));
  const open = reviews.filter((r) => !r.reply);
  const answered = reviews.filter((r) => r.reply);

  return (
    <Page
      width="narrow"
      eyebrow={pick(NAV_GROUPS[2].label!)}
      title={pick(navItem("/app/reviews").label)}
      subtitle={hi ? "हर प्लेटफ़ॉर्म के रिव्यू और शिकायतें, जवाब तैयार" : "Reviews and complaints from every platform, with replies ready"}
    >

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
        {live.map((p) => {
          const r = outlet?.ratings[p];
          return (
            <div key={p}>
              <dt>
                <ChannelTag channel={p} />
              </dt>
              <dd className="mt-1">
                {r ? (
                  <>
                    <span className="text-2xl font-semibold">{r.value.toFixed(1)}</span>
                    <span className="ml-2 text-sm text-muted">
                      {r.count.toLocaleString("en-IN")} {hi ? "रेटिंग" : "ratings"}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted">{hi ? "अभी कोई रेटिंग नहीं" : "No ratings yet"}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {error && <p className="mt-6 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      <h2 className="mt-10 text-lg font-semibold tracking-[-0.01em]">{hi ? `जवाब बाक़ी (${open.length})` : `Waiting for a reply (${open.length})`}</h2>
      {data && open.length === 0 && <p className="mt-3 rounded-xl bg-sunken px-4 py-6 text-center text-muted">{hi ? "हर रिव्यू का जवाब दिया जा चुका है।" : "Every review has a reply."}</p>}
      <div className="mt-4 space-y-6">
        {open.map((r) => (
          <ReplyComposer key={r.id} review={r} />
        ))}
      </div>

      {answered.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-semibold tracking-[-0.01em]">{hi ? "जवाब दिए गए" : "Replied"}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {answered.map((r) => (
              <li key={r.id} className="py-4">
                <ReviewHead r={r} />
                <q className="mt-1.5 block text-ink-2">{r.text}</q>
                <p className="mt-2 border-l-2 border-leaf pl-3 text-[0.95rem] text-ink-2">{r.reply}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

function ReviewHead({ r }: { r: ReviewDTO }) {
  const { lang } = useApp();
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-medium">{r.author}</span>
      <Stars n={r.stars} />
      <ChannelTag channel={r.platform} />
      <span className="text-sm text-muted">{new Date(r.postedAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
    </span>
  );
}

/** Pressing "Post reply" is the owner's approval, so the draft is created and approved in one go. */
function ReplyComposer({ review }: { review: ReviewDTO }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? review.draft?.[lang] ?? "";
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApprovalDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post() {
    setBusy(true);
    setError(null);
    try {
      const draft = await api<ApprovalDTO>(`/api/reviews/${review.id}/reply`, { method: "POST", json: { text } });
      const done = await api<ApprovalDTO>(`/api/approvals/${draft.id}`, { method: "POST", json: { action: "approve" } });
      setResult(done);
      if (done.status === "executed") setTimeout(refreshAll, 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const failed = result?.status === "failed";
  return (
    <article className="ticket px-4 pb-4 pt-4">
      <ReviewHead r={review} />
      <q className="mt-2 block text-ink">{review.text}</q>
      <label className="mb-1 mt-4 block text-[0.8rem] text-muted" htmlFor={`reply-${review.id}`}>
        {review.draft ? (hi ? "Zest का ड्राफ़्ट, आपके अंदाज़ में" : "Zest's draft, in your voice") : hi ? "आपका जवाब" : "Your reply"}
      </label>
      <textarea
        id={`reply-${review.id}`}
        value={text}
        onChange={(e) => setEdited(e.target.value)}
        rows={3}
        className="w-full rounded-md bg-sunken p-2.5 text-[0.95rem] text-ink outline-none focus:ring-2 focus:ring-turmeric"
      />
      {result && (
        <p className={`mt-2 flex items-start gap-2 text-sm ${failed ? "text-chilli" : "text-leaf"}`}>
          {failed ? <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" /> : <Check aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {failed ? result.steps.map((s) => s.error).filter(Boolean).join(" ") : (result.steps[0]?.note ?? (hi ? `${CHANNEL_NAME[review.platform]} पर पोस्ट हो गया` : `Posted on ${CHANNEL_NAME[review.platform]}`))}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-chilli">{error}</p>}
      {!result || failed ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={post} disabled={busy || text.trim().length < 2} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50">
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {hi ? "जवाब पोस्ट करें" : "Post reply"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
