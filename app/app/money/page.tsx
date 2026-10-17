"use client";

import { ChannelTag } from "@/components/bits";
import { PAYOUTS, rupees } from "@/lib/data";
import { useApp, useOutlet } from "@/lib/state";

export default function Money() {
  const { t, pick, state } = useApp();
  const { live } = useOutlet();
  const hi = state.lang === "hi";
  const payouts = PAYOUTS.filter((p) => live.includes(p.platform));
  const upcoming = payouts.filter((p) => p.status === "upcoming");
  const credited = payouts.filter((p) => p.status === "credited");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{t("nav.money")}</h1>
      <p className="mt-1 max-w-[60ch] text-muted">
        {hi
          ? "पेआउट, कमीशन और कटौती, आपके ईमेल और बैंक अलर्ट से मिलाकर।"
          : "Payouts, commission and deductions, matched against your email and bank alerts."}
      </p>

      <h2 className="mt-8 font-medium">{hi ? "आने वाले" : "On the way"}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {upcoming.map((p) => (
          <article key={p.platform + p.period} className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <div className="flex items-baseline justify-between">
              <ChannelTag channel={p.platform} />
              <span className="text-sm text-muted">{p.date}</span>
            </div>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight">{rupees(p.net)}</p>
            <p className="mt-1 text-sm text-muted">{p.period}</p>
            <dl className="mt-4 divide-y divide-line text-[0.95rem]">
              {[
                [hi ? "बिक्री" : "Sales", p.gross],
                [hi ? "कमीशन" : "Commission", -p.commission],
                [hi ? "ऐड" : "Ads", -p.ads],
                [hi ? "कटौती" : "Deductions", -p.deductions],
              ].map(([label, amt]) => (
                <div key={label as string} className="flex justify-between py-1.5">
                  <dt className="text-ink-2">{label}</dt>
                  <dd>
                    {(amt as number) < 0 ? "−" : ""}
                    {rupees(Math.abs(amt as number))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.8rem] text-muted">{hi ? "स्रोत: " : "From "}{pick(p.source)}</p>
          </article>
        ))}
      </div>

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
            <tr key={p.platform + p.period} className="border-b border-line">
              <td className="py-2.5">
                <ChannelTag channel={p.platform} />
              </td>
              <td className="py-2.5 text-ink-2">{p.period}</td>
              <td className="hidden py-2.5 text-ink-2 sm:table-cell">{p.date}</td>
              <td className="py-2.5 text-right font-medium">{rupees(p.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
