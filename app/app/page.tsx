"use client";

import Link from "next/link";
import { ChannelTag } from "@/components/bits";
import { Dish } from "@/components/dishes";
import { AgentCard, ChannelSplit, ReviewTicket } from "@/components/cards";
import { COMPLAINTS_OPEN, MENU, OUTLET, PAYOUTS, RATINGS, REVIEWS, SALES_YESTERDAY, TOP_DISHES_YESTERDAY, rupees } from "@/lib/data";
import { METHODS } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";

export default function Today() {
  const { t, pick, state } = useApp();
  const { live, connections, email } = useOutlet();
  const hi = state.lang === "hi";

  const total = live.reduce((s, p) => s + SALES_YESTERDAY[p].amount, 0) + SALES_YESTERDAY.dine.amount;
  const upcoming = PAYOUTS.filter((p) => p.status === "upcoming" && live.includes(p.platform)).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const complaints = live.reduce((s, p) => s + COMPLAINTS_OPEN[p], 0);
  const pendingReviews = REVIEWS.filter((r) => live.includes(r.platform) && r.stars <= 2);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-muted">{hi ? "शुक्रवार, 17 अक्टूबर" : "Friday, 17 October"}</p>
      <h1 className="mt-1 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
        {t("today.hello")}, {OUTLET.ownerFirstName}
      </h1>

      {/* Yesterday is the headline: one number, then how it split */}
      <section className="mt-8 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink-2">{t("today.yesterday")}</h2>
          <span className="text-sm text-leaf">{hi ? "पिछले गुरुवार से +9%" : "+9% on last Thursday"}</span>
        </div>
        <p className="mb-5 mt-1 text-[2.6rem] font-semibold leading-none tracking-[-0.03em]">{rupees(total)}</p>
        <ChannelSplit channels={[...live, "dine"]} />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/app/money" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.payout")}</h2>
          {upcoming[0] && (
            <>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{rupees(upcoming[0].net)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <ChannelTag channel={upcoming[0].platform} />
                <span>{upcoming[0].date}</span>
              </p>
            </>
          )}
        </Link>
        <Link href="/app/reviews" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.rating")}</h2>
          <ul className="mt-2 space-y-1">
            {live.map((p) => (
              <li key={p} className="flex items-baseline justify-between">
                <ChannelTag channel={p} />
                <span>
                  <span className="text-lg font-semibold">{RATINGS[p].value.toFixed(1)}</span>
                  <span className={`ml-1.5 text-sm ${RATINGS[p].change < 0 ? "text-chilli" : "text-leaf"}`}>
                    {RATINGS[p].change > 0 ? "+" : "−"}
                    {Math.abs(RATINGS[p].change).toFixed(1)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Link>
        <Link href="/app/reviews" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.complaints")}</h2>
          <p className={`mt-1 text-2xl font-semibold ${complaints ? "text-chilli" : ""}`}>{complaints}</p>
          <p className="mt-1 text-sm text-muted">{hi ? "सबसे पुरानी 3 घंटे से खुली" : "Oldest open for 3 hours"}</p>
        </Link>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-medium">{hi ? "कल क्या सबसे ज़्यादा बिका" : "What sold best yesterday"}</h2>
          <Link href="/app/menu" className="text-sm text-ink-2 underline underline-offset-2 hover:text-ink">
            {hi ? "मेन्यू खोलें" : "Open menu"}
          </Link>
        </div>
        <ul className="scrollbar-thin -mx-1 mt-4 flex gap-4 overflow-x-auto px-1 pb-2">
          {[...TOP_DISHES_YESTERDAY]
            .sort((a, b) => b.orders - a.orders)
            .map((d, i) => {
              const m = MENU.find((x) => x.id === d.id)!;
              return (
                <li key={d.id} className="w-44 shrink-0 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
                  <div className="grid place-items-center rounded-xl bg-[radial-gradient(circle_at_30%_25%,#fbf3e2,#f0dfbf)] py-3">
                    <Dish kind={m.kind} size={96} steam={i === 0} />
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 font-medium">
                    <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} />
                    <span className="truncate">{m.name}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {d.orders} {hi ? "ऑर्डर" : "orders"}
                  </p>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-medium">{t("today.approvals")}</h2>
        <p className="mt-1 text-sm text-muted">
          {hi ? "आपके एजेंटों ने रात में ये तैयार किए। मंज़ूरी के बिना कुछ नहीं जाएगा।" : "Your agents drafted these overnight. Nothing goes out until you approve it."}
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {live.includes("swiggy") && (
            <AgentCard
              card={{
                type: "dispute",
                id: "today-dispute",
                platform: "swiggy",
                amount: 412,
                reason: {
                  en: "Order #3381 was cancelled by the customer 6 minutes after acceptance, while it was being prepared. Requesting reversal of the cancellation charge.",
                  hi: "ऑर्डर #3381 ग्राहक ने स्वीकार होने के 6 मिनट बाद कैंसल किया, जब वह बन रहा था। कैंसलेशन चार्ज वापस करने का अनुरोध।",
                },
              }}
            />
          )}
          {pendingReviews.map((r) => (
            <ReviewTicket key={r.id} reviewId={r.id} />
          ))}
          <AgentCard
            card={{
              type: "menu-change",
              id: "today-menu",
              item: "Veg thali",
              platforms: live,
              change: { en: "Turn back on, lunch stock is in", hi: "वापस चालू करें, लंच का स्टॉक आ गया" },
            }}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-medium">{t("today.next")}</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {[
            {
              en: "Swiggy prep time averaged 17 minutes at dinner. Splitting dal makhani into a pre-portioned batch would bring it near 12.",
              hi: "डिनर में Swiggy का प्रेप टाइम औसतन 17 मिनट रहा। दाल मखनी पहले से पोर्शन करने पर ये 12 के क़रीब आ सकता है।",
            },
            {
              en: "Chole bhature is ₹10 cheaper on Swiggy than Zomato. Match the price, or keep it as a deliberate difference?",
              hi: "छोले भटूरे Swiggy पर Zomato से ₹10 सस्ते हैं। क़ीमत बराबर करें, या यह अंतर जानबूझकर रखें?",
            },
            {
              en: "Your FSSAI licence expires on 3 December. Renewal takes about 30 days, so start this week.",
              hi: "आपका FSSAI लाइसेंस 3 दिसंबर को ख़त्म होगा। रिन्यूअल में क़रीब 30 दिन लगते हैं, इसलिए इसी हफ़्ते शुरू करें।",
            },
          ].map((s) => (
            <li key={s.en} className="py-3.5 leading-relaxed text-ink-2">
              {pick(s)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm text-muted">{t("today.sources")}</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
          {email && <li>{email === "gmail" ? "Gmail" : "Outlook"}: {hi ? "2 मिनट पहले पढ़ा" : "read 2 min ago"}</li>}
          {live.map((p) => {
            const c = connections[p];
            const m = c && METHODS.find((x) => x.id === c.method);
            return (
              <li key={p} className="inline-flex items-center gap-1.5">
                <ChannelTag channel={p} />
                <span>
                  {m ? `${pick(m.name).toLowerCase()}, ${hi ? "अभी सिंक हुआ" : "synced just now"}` : <Link href="/app/connections" className="text-chilli underline underline-offset-2">{hi ? "जुड़ा नहीं" : "not connected"}</Link>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
