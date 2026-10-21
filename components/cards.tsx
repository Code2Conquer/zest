"use client";

import { useState } from "react";
import { salesSegments, type Channel, type SalesSegment } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import type { CopilotCard, PayoutDTO, TodayDTO } from "@/lib/types";
import { ApprovalTicket } from "./approval-ticket";
import { ChannelTag } from "./bits";

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Stacked bar of sales by channel, each segment direct-labelled below. Direct channels show as one segment. */
export function ChannelSplit({ sales, channels }: { sales: TodayDTO["sales"]; channels: Channel[] }) {
  const { lang } = useApp();
  const [hover, setHover] = useState<SalesSegment["key"] | null>(null);
  const segs = salesSegments(sales, channels);
  const total = segs.reduce((s, c) => s + c.amount, 0);
  if (!total) return <p className="text-sm text-muted">{lang === "hi" ? "अभी कोई बिक्री नहीं।" : "No sales yet."}</p>;
  const shown = segs.filter((c) => c.amount > 0);
  const label = (seg: SalesSegment) => (seg.key === "direct" && lang === "hi" ? "सीधे ऑर्डर" : seg.name);
  return (
    <figure className="m-0">
      <div className="flex h-3 gap-[2px]" role="img" aria-label={segs.map((c) => `${label(c)} ${rupees(c.amount)}`).join(", ")}>
        {shown.map((c, i) => (
          <div
            key={c.key}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            className="h-full transition-opacity"
            style={{
              width: `${(c.amount / total) * 100}%`,
              background: c.color,
              opacity: hover && hover !== c.key ? 0.35 : 1,
              borderRadius: `${i === 0 ? 4 : 0}px ${i === shown.length - 1 ? 4 : 0}px ${i === shown.length - 1 ? 4 : 0}px ${i === 0 ? 4 : 0}px`,
            }}
          />
        ))}
      </div>
      <figcaption className="mt-3 grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: `repeat(${segs.length}, minmax(0, 1fr))` }}>
        {segs.map((c) => (
          <div key={c.key} onMouseEnter={() => setHover(c.key)} onMouseLeave={() => setHover(null)}>
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
              <span aria-hidden className="size-2 rounded-full" style={{ background: c.color }} />
              {label(c)}
            </span>
            <div className="mt-0.5 text-[1.05rem] font-medium">{rupees(c.amount)}</div>
            <div className="text-sm text-muted">
              {c.orders} {lang === "hi" ? "ऑर्डर" : "orders"}
            </div>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

export function PayoutCard({ payout, previous }: { payout: PayoutDTO; previous: PayoutDTO | null }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const diff = previous ? payout.net - previous.net : null;
  const lines: [string, number][] = [
    [hi ? "बिक्री" : "Sales", payout.gross],
    [hi ? "कमीशन" : "Commission", -payout.commission],
    [hi ? "ऐड" : "Ads", -payout.ads],
    [hi ? "कटौती" : "Deductions", -payout.deductions],
  ];
  return (
    <div className="my-2 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
      <div className="flex items-baseline justify-between">
        <ChannelTag channel={payout.platform} />
        <span className="text-sm text-muted">{payout.periodLabel}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-semibold tracking-tight">{rupees(payout.net)}</span>
        {diff !== null && diff !== 0 && (
          <span className={`text-sm font-medium ${diff < 0 ? "text-chilli" : "text-leaf"}`}>
            {diff < 0 ? "−" : "+"}
            {rupees(Math.abs(diff))} {hi ? "पिछली बार से" : "vs last time"}
          </span>
        )}
      </div>
      <dl className="mt-3 divide-y divide-line text-[0.95rem]">
        {lines.map(([label, amount]) => (
          <div key={label} className="flex justify-between py-1.5">
            <dt className="text-ink-2">{label}</dt>
            <dd className={amount < 0 ? "text-ink-2" : "font-medium"}>
              {amount < 0 ? "−" : ""}
              {rupees(Math.abs(amount))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[0.8rem] text-muted">
        {hi ? "स्रोत: " : "From "}
        {payout.source}
      </p>
    </div>
  );
}

export function CopilotCardView({ card, print }: { card: CopilotCard; print?: boolean }) {
  if (card.type === "approval") return <ApprovalTicket approval={card.approval} print={print} />;
  if (card.type === "payout") return <PayoutCard payout={card.payout} previous={card.previous} />;
  return (
    <div className="my-2 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
      <ChannelSplit sales={card.sales} channels={card.channels} />
    </div>
  );
}
