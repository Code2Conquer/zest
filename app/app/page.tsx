"use client";

import { Page } from "@/components/page";
import Link from "next/link";
import { useState } from "react";
import { ApprovalTicket } from "@/components/approval-ticket";
import { ChannelTag } from "@/components/bits";
import { ChannelSplit, rupees } from "@/components/cards";
import { Dish } from "@/components/dishes";
import { useApi } from "@/lib/api";
import { isHomeKitchen } from "@/lib/nav";
import { METHODS, type Channel } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";
import type { ApprovalDTO, TodayDTO } from "@/lib/types";

export default function Today() {
  const { t, pick, lang } = useApp();
  const { outlet, live, connections } = useOutlet();
  const { data, error, loading } = useApi<TodayDTO>(outlet ? `/api/today?o=${outlet.id}` : null);
  const hi = lang === "hi";
  const home = isHomeKitchen(outlet);
  const channels: Channel[] = home ? ["web", "whatsapp", "phone"] : [...live, "dine"];
  // Tickets decided this visit stay on screen with their result instead of vanishing.
  const [decided, setDecided] = useState<ApprovalDTO[]>([]);
  const pendingIds = new Set(data?.approvals.map((a) => a.id));
  const tickets = [...(data?.approvals ?? []), ...decided.filter((d) => !pendingIds.has(d.id))];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("today.hello") : hi ? "नमस्ते" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString(hi ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (error) return <p className="mx-auto max-w-4xl rounded-xl bg-chilli-soft p-4 text-chilli">{error}</p>;

  return (
    <Page eyebrow={dateLabel} title={`${greeting}${outlet?.ownerName ? `, ${outlet.ownerName}` : ""}`}>

      {home && outlet?.slug && (
        <section className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-turmeric-soft p-5">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{hi ? "आपका पेज लाइव है" : "Your page is live"}</p>
            <p className="mt-0.5 truncate text-ink-2">{typeof window !== "undefined" ? `${window.location.host}/r/${outlet.slug}` : `/r/${outlet.slug}`}</p>
          </div>
          <a href={`/r/${outlet.slug}`} target="_blank" rel="noreferrer" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
            {hi ? "पेज खोलें" : "Open page"}
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${hi ? "अब हमसे ऑनलाइन ऑर्डर कीजिए" : "Order from us online"}: ${typeof window !== "undefined" ? window.location.origin : ""}/r/${outlet.slug}`)}`} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-sm font-medium shadow-[inset_0_0_0_1.5px_var(--ink-2)]">
            {hi ? "WhatsApp पर भेजें" : "Share on WhatsApp"}
          </a>
        </section>
      )}
      {outlet && !outlet.isDemo && !home && connections.length === 0 && !outlet.email && (
        <Link href="/connect" className="mt-6 block rounded-2xl bg-turmeric-soft p-5 hover:shadow-[0_0_0_1px_var(--turmeric)]">
          <p className="font-medium">{hi ? "अभी कुछ जुड़ा नहीं है" : "Nothing is connected yet"}</p>
          <p className="mt-1 text-ink-2">{hi ? "ईमेल या कोई प्लेटफ़ॉर्म जोड़ें, और आपकी बिक्री, पेआउट और रिव्यू यहाँ दिखने लगेंगे।" : "Connect your email or a platform and your sales, payouts and reviews will start showing here."}</p>
        </Link>
      )}

      <section className="mt-8 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink-2">{t("today.yesterday")}</h2>
          {data?.changePct != null && (
            <span className={`text-sm ${data.changePct >= 0 ? "text-leaf" : "text-chilli"}`}>
              {data.changePct >= 0 ? "+" : ""}
              {data.changePct}% {hi ? "पिछले हफ़्ते के इसी दिन से" : "on the same day last week"}
            </span>
          )}
        </div>
        <p className="mb-5 mt-1 text-[2.6rem] font-semibold leading-none tracking-[-0.03em]">{data ? rupees(data.total) : loading ? "…" : "₹0"}</p>
        {data && <ChannelSplit sales={data.sales} channels={channels} />}
      </section>

      {home ? (
        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link href="/app/orders" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
            <h2 className="text-ink-2">{hi ? "आज के ऑर्डर" : "Today's orders"}</h2>
            <p className="mt-1 text-sm text-muted">{hi ? "पेज और WhatsApp से आए ऑर्डर, यहीं मंज़ूर कीजिए" : "From your page and WhatsApp; accept them here"}</p>
          </Link>
          <Link href="/app/menu" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
            <h2 className="text-ink-2">{hi ? "आज का मेन्यू" : "Today's menu"}</h2>
            <p className="mt-1 text-sm text-muted">{hi ? "जो बना है वह चालू, जो ख़त्म हुआ वह बंद" : "Switch on what's cooking, off what's finished"}</p>
          </Link>
          <Link href="/app/customers" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
            <h2 className="text-ink-2">{hi ? "आपके ग्राहक" : "Your customers"}</h2>
            <p className="mt-1 text-sm text-muted">{hi ? "पुराने ग्राहक और उनकी पसंद" : "Your regulars and what they like"}</p>
          </Link>
        </section>
      ) : (
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/app/money" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.payout")}</h2>
          {data?.nextPayout ? (
            <>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{rupees(data.nextPayout.net)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <ChannelTag channel={data.nextPayout.platform} />
                <span>{new Date(data.nextPayout.payDate).toLocaleDateString(hi ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">{hi ? "कोई आने वाला पेआउट नहीं" : "None on the way yet"}</p>
          )}
        </Link>
        <Link href="/app/reviews" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.rating")}</h2>
          <ul className="mt-2 space-y-1">
            {live.map((p) => {
              const r = outlet?.ratings[p];
              return (
                <li key={p} className="flex items-baseline justify-between">
                  <ChannelTag channel={p} />
                  {r ? (
                    <span>
                      <span className="text-lg font-semibold">{r.value.toFixed(1)}</span>
                      {r.change !== 0 && (
                        <span className={`ml-1.5 text-sm ${r.change < 0 ? "text-chilli" : "text-leaf"}`}>
                          {r.change > 0 ? "+" : "−"}
                          {Math.abs(r.change).toFixed(1)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">{hi ? "अभी नहीं" : "Not yet"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Link>
        <Link href="/app/reviews" className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
          <h2 className="text-ink-2">{t("today.complaints")}</h2>
          <p className={`mt-1 text-2xl font-semibold ${data?.openComplaints ? "text-chilli" : ""}`}>{data?.openComplaints ?? 0}</p>
          <p className="mt-1 text-sm text-muted">{hi ? "बिना जवाब वाले 1–2 स्टार रिव्यू" : "1 and 2 star reviews without a reply"}</p>
        </Link>
      </section>
      )}
      {data && data.topDishes.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "सबसे ज़्यादा बिकने वाली डिश" : "Your best sellers"}</h2>
            <Link href="/app/menu" className="text-sm text-ink-2 underline underline-offset-2 hover:text-ink">
              {hi ? "मेन्यू खोलें" : "Open menu"}
            </Link>
          </div>
          <ul className="scrollbar-thin -mx-1 mt-4 flex gap-4 overflow-x-auto px-1 pb-2">
            {data.topDishes.map(({ item: m, orders }, i) => (
              <li key={m.id} className="w-44 shrink-0 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
                <div className="grid h-[120px] place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_25%,#fbf3e2,#f0dfbf)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.photo ? <img src={m.photo} alt="" className="h-full w-full object-cover" /> : <Dish kind={m.kind} size={96} steam={i === 0} />}
                </div>
                <p className="mt-3 flex items-center gap-1.5 font-medium">
                  <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} />
                  <span className="truncate">{m.name}</span>
                </p>
                <p className="text-sm text-muted">{hi ? `रोज़ ~${orders} ऑर्डर` : `~${orders} orders a day`}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{t("today.approvals")}</h2>
        <p className="mt-1 text-sm text-muted">{hi ? "आपके एजेंटों के ड्राफ़्ट। मंज़ूरी के बिना कुछ नहीं जाएगा।" : "Drafts from your agents. Nothing goes out until you approve it."}</p>
        {data && tickets.length === 0 && <p className="mt-4 rounded-xl bg-sunken px-4 py-6 text-center text-muted">{t("today.empty")}</p>}
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {tickets.map((a) => (
            <ApprovalTicket key={a.id} approval={a} onDone={(next) => setDecided((d) => [...d.filter((x) => x.id !== next.id), next])} />
          ))}
        </div>
      </section>

      {!home && <section className="mt-10">
        <h2 className="text-sm text-muted">{t("today.sources")}</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
          {outlet?.email && <li>{outlet.email === "gmail" ? "Gmail" : "Outlook"}</li>}
          {live.map((p) => {
            const c = connections.find((x) => x.platform === p);
            const m = c && METHODS.find((x) => x.id === c.method);
            return (
              <li key={p} className="inline-flex items-center gap-1.5">
                <ChannelTag channel={p} />
                <span>
                  {c ? (
                    c.method === "sandbox" ? (
                      hi ? "सैंपल डेटा" : "sample data"
                    ) : (
                      `${m ? pick(m.name) : c.method}${c.status === "pending" ? (hi ? ", इंतज़ार में" : ", waiting") : ""}`
                    )
                  ) : (
                    <Link href="/app/connections" className="text-chilli underline underline-offset-2">
                      {hi ? "जुड़ा नहीं" : "not connected"}
                    </Link>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>}
    </Page>
  );
}
