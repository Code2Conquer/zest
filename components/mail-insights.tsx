"use client";

import { AlertCircle, ArrowDownLeft, Info } from "lucide-react";
import { useApi } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { MailboxDTO, MailInsightsDTO } from "@/lib/types";
import { ChannelTag } from "./bits";
import { rupees } from "./cards";

const TONE = {
  good: { icon: ArrowDownLeft, className: "bg-leaf-soft text-leaf" },
  warn: { icon: AlertCircle, className: "bg-chilli-soft text-chilli" },
  info: { icon: Info, className: "bg-sunken text-ink-2" },
} as const;

/** What the last 30 days of Zomato and Swiggy mail say. Shows once a mailbox has been read. */
export function MailInsights() {
  const { lang, outlet, pick } = useApp();
  const hi = lang === "hi";
  const { data: mail } = useApi<MailboxDTO>(outlet ? `/api/mail?o=${outlet.id}` : null);
  const ready = !!mail?.mailbox?.backfillDone;
  const { data, error } = useApi<MailInsightsDTO>(outlet && ready ? `/api/mail/insights?o=${outlet.id}` : null);
  if (!ready || (!data && !error)) return null;
  if (error) return <p className="text-sm text-chilli">{error}</p>;
  if (!data) return null;
  const date = (iso: string) => new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5" aria-labelledby="mail-insights">
      <h3 id="mail-insights" className="font-medium">
        {hi ? `पिछले ${data.days} दिन, आपके इनबॉक्स से` : `Your last ${data.days} days, from your inbox`}
      </h3>
      <p className="mt-0.5 text-sm text-muted">
        {hi
          ? `${data.mails.total} मेल पढ़े: Zomato से ${data.mails.byPlatform.zomato}, Swiggy से ${data.mails.byPlatform.swiggy}।`
          : `${data.mails.total} mail${data.mails.total === 1 ? "" : "s"} read: ${data.mails.byPlatform.zomato} from Zomato, ${data.mails.byPlatform.swiggy} from Swiggy.`}
      </p>

      {data.platforms.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.platforms.map((p) => (
            <article key={p.platform} className="rounded-xl bg-paper p-4 shadow-[0_0_0_1px_var(--line)]">
              <div className="flex items-baseline justify-between">
                <ChannelTag channel={p.platform} />
                <span className="text-sm text-muted">
                  {p.payouts} {hi ? "पेआउट" : p.payouts === 1 ? "payout" : "payouts"}
                </span>
              </div>
              <p className="mt-2 text-[1.7rem] font-semibold leading-none tracking-tight">{rupees(p.net)}</p>
              <p className="mt-1 text-sm text-muted">
                {hi ? "आपको मिले, " : "to you, from "}
                {rupees(p.gross)} {hi ? "की बिक्री से" : "of sales"}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {(
                  [
                    [hi ? "कमीशन" : "Commission", p.commission],
                    [hi ? "ऐड" : "Ads", p.ads],
                    [hi ? "कटौती" : "Deductions", p.deductions],
                  ] as const
                ).map(([label, amt]) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium">
                      {rupees(amt)} <span className="font-normal text-muted">{p.gross ? `${Math.round((amt / p.gross) * 100)}%` : ""}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}

      {data.highlights.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.highlights.map((h, i) => {
            const tone = TONE[h.tone];
            return (
              <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
                <span aria-hidden className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${tone.className}`}>
                  <tone.icon className="size-3.5" />
                </span>
                {pick(h.text)}
              </li>
            );
          })}
        </ul>
      )}

      {(data.complaints.length > 0 || data.actions.length > 0) && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          {(
            [
              [hi ? "शिकायतें" : "Complaints", data.complaints],
              [hi ? "लिस्टिंग और दस्तावेज़" : "Listing and documents", data.actions],
            ] as const
          )
            .filter(([, list]) => list.length > 0)
            .map(([label, list]) => (
              <div key={label}>
                <h4 className="text-sm font-medium text-ink-2">{label}</h4>
                <ul className="mt-1.5 space-y-1.5 text-sm">
                  {list.map((m) => (
                    <li key={m.id} className="flex items-baseline gap-2">
                      {m.platform && <ChannelTag channel={m.platform} className="shrink-0 text-xs" />}
                      <span className="min-w-0 flex-1 truncate">{m.subject}</span>
                      <span className="shrink-0 text-muted">{date(m.receivedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
