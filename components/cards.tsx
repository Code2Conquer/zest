"use client";

import { useState } from "react";
import { AGENT_NAME, type Card } from "@/lib/agents";
import { REVIEWS, SALES_YESTERDAY, rupees } from "@/lib/data";
import { CHANNEL_COLOR, CHANNEL_NAME, type Channel } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import { ChannelTag, Stars } from "./bits";
import { Ticket } from "./ticket";

/** Stacked bar of sales by channel, each segment direct-labelled below. */
export function ChannelSplit({ channels }: { channels: Channel[] }) {
  const [hover, setHover] = useState<Channel | null>(null);
  const total = channels.reduce((s, c) => s + SALES_YESTERDAY[c].amount, 0);
  return (
    <figure className="m-0">
      <div className="flex h-3 gap-[2px]" role="img" aria-label={channels.map((c) => `${CHANNEL_NAME[c]} ${rupees(SALES_YESTERDAY[c].amount)}`).join(", ")}>
        {channels.map((c, i) => (
          <div
            key={c}
            onMouseEnter={() => setHover(c)}
            onMouseLeave={() => setHover(null)}
            className="relative h-full transition-opacity"
            style={{
              width: `${(SALES_YESTERDAY[c].amount / total) * 100}%`,
              background: CHANNEL_COLOR[c],
              opacity: hover && hover !== c ? 0.35 : 1,
              borderTopLeftRadius: i === 0 ? 4 : 0,
              borderBottomLeftRadius: i === 0 ? 4 : 0,
              borderTopRightRadius: i === channels.length - 1 ? 4 : 0,
              borderBottomRightRadius: i === channels.length - 1 ? 4 : 0,
            }}
          />
        ))}
      </div>
      <figcaption className="mt-3 grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))` }}>
        {channels.map((c) => (
          <div key={c} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)}>
            <ChannelTag channel={c} />
            <div className="mt-0.5 text-[1.05rem] font-medium">{rupees(SALES_YESTERDAY[c].amount)}</div>
            <div className="text-sm text-muted">{SALES_YESTERDAY[c].orders} orders</div>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

export function AgentCard({ card, print }: { card: Card; print?: boolean }) {
  const { pick, state } = useApp();
  const lang = state.lang;

  switch (card.type) {
    case "sales":
      return (
        <div className="my-2 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
          <ChannelSplit channels={[...card.platforms, "dine"]} />
        </div>
      );

    case "payout-compare": {
      const diff = card.thisWeek - card.lastWeek;
      return (
        <div className="my-2 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
          <div className="flex items-baseline justify-between">
            <ChannelTag channel={card.platform} />
            <span className="text-sm text-muted">7 to 13 Oct</span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tracking-tight">{rupees(card.thisWeek)}</span>
            <span className={`text-sm font-medium ${diff < 0 ? "text-chilli" : "text-leaf"}`}>
              {diff < 0 ? "−" : "+"}
              {rupees(Math.abs(diff))} {lang === "hi" ? "पिछले हफ़्ते से" : "vs last week"}
            </span>
          </div>
          <dl className="mt-3 divide-y divide-line text-[0.95rem]">
            {card.lines.map((l) => (
              <div key={l.label.en} className="flex justify-between py-1.5">
                <dt className="text-ink-2">{pick(l.label)}</dt>
                <dd className={l.amount < 0 ? "text-ink-2" : "font-medium"}>
                  {l.amount < 0 ? "−" : ""}
                  {rupees(Math.abs(l.amount))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[0.8rem] text-muted">{lang === "hi" ? "स्रोत: " : "From "}{pick(card.source)}</p>
        </div>
      );
    }

    case "dispute":
      return (
        <Ticket
          print={print}
          agent={AGENT_NAME.finance}
          title={
            lang === "hi"
              ? `${CHANNEL_NAME[card.platform]} पर ${rupees(card.amount)} का डिस्प्यूट`
              : `Dispute ${rupees(card.amount)} with ${CHANNEL_NAME[card.platform]}`
          }
          onApproveLabel={{ en: "Raise dispute", hi: "डिस्प्यूट भेजें" }}
          doneLabel={{ en: "Dispute raised. I'll tell you when they reply.", hi: "डिस्प्यूट भेज दिया। जवाब आने पर बताऊँगा।" }}
        >
          {pick(card.reason)}
        </Ticket>
      );

    case "review-reply": {
      const r = REVIEWS.find((x) => x.id === card.reviewId);
      if (!r) return null;
      return <ReviewTicket reviewId={r.id} print={print} />;
    }

    case "menu-change":
      return (
        <Ticket
          print={print}
          agent={AGENT_NAME.menu}
          title={`${card.item}: ${pick(card.change).toLowerCase()}`}
          doneLabel={{ en: "Updated on every platform", hi: "हर प्लेटफ़ॉर्म पर अपडेट हो गया" }}
        >
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {card.platforms.map((p) => (
              <ChannelTag key={p} channel={p} />
            ))}
          </span>
        </Ticket>
      );

    case "promo":
      return (
        <Ticket
          print={print}
          agent={AGENT_NAME.growth}
          title={pick(card.offer)}
          onApproveLabel={{ en: "Schedule promo", hi: "प्रोमो शेड्यूल करें" }}
          doneLabel={{ en: "Scheduled. It stops itself if it isn't paying off.", hi: "शेड्यूल हो गया। फ़ायदा न हुआ तो अपने-आप रुक जाएगा।" }}
          editable
        >
          <span className="mb-2 block">
            <ChannelTag channel={card.platform} />
          </span>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-muted">{lang === "hi" ? "कब" : "When"}</dt>
              <dd className="text-ink">{pick(card.window)}</dd>
            </div>
            <div>
              <dt className="text-muted">{lang === "hi" ? "अधिकतम ख़र्च" : "Spend cap"}</dt>
              <dd className="text-ink">{rupees(card.cost)}</dd>
            </div>
            <div>
              <dt className="text-muted">{lang === "hi" ? "अनुमानित नए ऑर्डर" : "Expected new orders"}</dt>
              <dd className="text-ink">~{card.expectedOrders}</dd>
            </div>
          </dl>
        </Ticket>
      );
  }
}

export function ReviewTicket({ reviewId, print }: { reviewId: string; print?: boolean }) {
  const { pick, state } = useApp();
  const r = REVIEWS.find((x) => x.id === reviewId)!;
  // Follows the language toggle until the owner edits it.
  const [edited, setEdited] = useState<string | null>(null);
  const draft = edited ?? pick(r.draft);
  return (
    <Ticket
      print={print}
      agent={AGENT_NAME.reviews}
      editable
      onApproveLabel={{ en: "Post reply", hi: "जवाब पोस्ट करें" }}
      doneLabel={{ en: `Posted on ${CHANNEL_NAME[r.platform]}`, hi: `${CHANNEL_NAME[r.platform]} पर पोस्ट हो गया` }}
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{r.author}</span>
          <Stars n={r.stars} />
          <ChannelTag channel={r.platform} />
          <span className="text-sm font-normal text-muted">{r.when}</span>
        </span>
      }
    >
      {(editing) => (
        <>
          <q className="mb-3 block text-ink">{r.text}</q>
          <span className="mb-1 block text-[0.8rem] text-muted">{state.lang === "hi" ? "आपका जवाब" : "Your reply"}</span>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setEdited(e.target.value)}
              rows={4}
              className="w-full rounded-md bg-sunken p-2.5 text-[0.95rem] text-ink outline-none focus:ring-2 focus:ring-turmeric"
            />
          ) : (
            <span className="block border-l-2 border-turmeric pl-3">{draft}</span>
          )}
        </>
      )}
    </Ticket>
  );
}
