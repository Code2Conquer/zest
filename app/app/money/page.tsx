"use client";

import { ChannelTag } from "@/components/bits";
import { rupees } from "@/components/cards";
import { EmailIngest } from "@/components/email-ingest";
import { MailInsights } from "@/components/mail-insights";
import { useApi } from "@/lib/api";
import { useApp, useOutlet } from "@/lib/state";
import type { PayoutDTO } from "@/lib/types";

export default function Money() {
  const { t, lang } = useApp();
  const { outlet, live } = useOutlet();
  const { data, error } = useApi<PayoutDTO[]>(outlet ? `/api/payouts?o=${outlet.id}` : null);
  const hi = lang === "hi";
  const payouts = (data ?? []).filter((p) => live.includes(p.platform));
  const upcoming = payouts.filter((p) => p.status === "upcoming");
  const credited = payouts.filter((p) => p.status === "credited");
  const date = (iso: string) => new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{t("nav.money")}</h1>
          <p className="mt-1 max-w-[60ch] text-muted">{hi ? "पेआउट, कमीशन और कटौती, आपके ईमेल से मिलाकर।" : "Payouts, commission and deductions, read from your email."}</p>
        </div>
        <EmailIngest compact />
      </div>

      <div className="mt-6">
        <MailInsights />
      </div>

      {error && <p className="mt-6 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
      {data && payouts.length === 0 && (
        <p className="mt-8 rounded-xl bg-sunken px-4 py-6 text-center text-muted">
          {hi ? "अभी कोई पेआउट नहीं। ईमेल जोड़ें या ऊपर पेआउट मेल पेस्ट करें।" : "No payouts yet. Connect your email or paste a payout mail above."}
        </p>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-8 font-medium">{hi ? "आने वाले" : "On the way"}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {upcoming.map((p) => (
              <article key={p.id} className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
                <div className="flex items-baseline justify-between">
                  <ChannelTag channel={p.platform} />
                  <span className="text-sm text-muted">{date(p.payDate)}</span>
                </div>
                <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight">{rupees(p.net)}</p>
                <p className="mt-1 text-sm text-muted">{p.periodLabel}</p>
                <dl className="mt-4 divide-y divide-line text-[0.95rem]">
                  {(
                    [
                      [hi ? "बिक्री" : "Sales", p.gross],
                      [hi ? "कमीशन" : "Commission", -p.commission],
                      [hi ? "ऐड" : "Ads", -p.ads],
                      [hi ? "कटौती" : "Deductions", -p.deductions],
                    ] as const
                  ).map(([label, amt]) => (
                    <div key={label} className="flex justify-between py-1.5">
                      <dt className="text-ink-2">{label}</dt>
                      <dd>
                        {amt < 0 ? "−" : ""}
                        {rupees(Math.abs(amt))}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[0.8rem] text-muted">
                  {hi ? "स्रोत: " : "From "}
                  {p.source}
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      {credited.length > 0 && (
        <>
          <h2 className="mt-10 font-medium">{hi ? "खाते में आ चुके" : "Credited"}</h2>
          <table className="mt-3 w-full text-left text-[0.95rem]">
            <thead className="text-sm text-muted">
              <tr className="border-b border-line">
                <th className="py-2 font-normal">{hi ? "प्लेटफ़ॉर्म" : "Platform"}</th>
                <th className="py-2 font-normal">{hi ? "अवधि" : "Period"}</th>
                <th className="hidden py-2 font-normal sm:table-cell">{hi ? "तारीख़" : "Credited on"}</th>
                <th className="py-2 text-right font-normal">{hi ? "राशि" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {credited.map((p) => (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-2.5">
                    <ChannelTag channel={p.platform} />
                  </td>
                  <td className="py-2.5 text-ink-2">{p.periodLabel}</td>
                  <td className="hidden py-2.5 text-ink-2 sm:table-cell">{date(p.payDate)}</td>
                  <td className="py-2.5 text-right font-medium">{rupees(p.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
