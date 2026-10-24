"use client";

import { Page } from "@/components/page";
import { isHomeKitchen, NAV_GROUPS, navItem } from "@/lib/nav";
import { useState } from "react";
import { motion } from "motion/react";
import { ChannelTag } from "@/components/bits";
import { Dish, type DishKind } from "@/components/dishes";
import { Loader2, RefreshCw } from "lucide-react";
import { rupees } from "@/components/cards";
import { api, refreshAll, useApi } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import { ACTIVE_STATUSES } from "@/lib/orders";
import { DIRECT_CHANNELS, isDirect, type Channel } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";
import { useOrderStream } from "@/lib/use-order-stream";

const STATUS: Record<OrderDTO["status"], { en: string; hi: string; tone: string }> = {
  new: { en: "New", hi: "नया", tone: "text-turmeric font-medium" },
  accepted: { en: "Accepted", hi: "स्वीकार किया", tone: "text-ink" },
  preparing: { en: "Preparing", hi: "बन रहा है", tone: "text-ink" },
  ready: { en: "Ready for pickup", hi: "पिकअप के लिए तैयार", tone: "text-leaf" },
  out_for_delivery: { en: "Out for delivery", hi: "डिलीवरी के लिए निकला", tone: "text-ink-2" },
  picked_up: { en: "Picked up", hi: "ले जाया गया", tone: "text-ink-2" },
  served: { en: "Served", hi: "परोसा गया", tone: "text-muted" },
  completed: { en: "Completed", hi: "पूरा हुआ", tone: "text-muted" },
  rejected: { en: "Rejected", hi: "अस्वीकार", tone: "text-muted line-through" },
  cancelled: { en: "Cancelled", hi: "कैंसल", tone: "text-muted line-through" },
};
const LATE = { en: "Running late", hi: "देर हो रही है", tone: "text-chilli font-medium" };
const statusOf = (o: OrderDTO) => (o.delayed && ACTIVE_STATUSES.includes(o.status) ? LATE : STATUS[o.status]);

type Filter = Channel | "all" | "direct";

function dishFor(items: string): DishKind {
  const s = items.toLowerCase();
  if (s.includes("biryani")) return "biryani";
  if (s.includes("paneer")) return "paneer-tikka";
  if (s.includes("dal")) return "dal-makhani";
  if (s.includes("thali")) return "thali";
  if (s.includes("chole")) return "chole-bhature";
  if (s.includes("rajma")) return "rajma-chawal";
  if (s.includes("jamun") || s.includes("halwa")) return "gulab-jamun";
  return "butter-naan";
}

// Target prep time; tickets past it are flagged.
const TARGET_MINS = 15;

export default function Orders() {
  const { pick, state } = useApp();
  const { live, outlet } = useOutlet();
  const { data, error, setData } = useApi<OrderDTO[]>(outlet ? `/api/orders?o=${outlet.id}` : null);
  // Changes arrive live; each replaces the order with the same id, newest placed first.
  const merge = (changed: OrderDTO[]) =>
    setData((prev) => {
      const byId = new Map((prev ?? []).map((o) => [o.id, o]));
      for (const o of changed) byId.set(o.id, { ...byId.get(o.id), ...o });
      return [...byId.values()].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    });
  const { mode } = useOrderStream(merge, !!outlet);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const channels: Channel[] = [...live, "dine", ...DIRECT_CHANNELS];
  const hasDirect = (data ?? []).some((o) => isDirect(o.channel));
  // A home kitchen sells only on its own page, WhatsApp and phone: filter by those, no platforms or dine-in.
  const home = isHomeKitchen(outlet);
  const filters: Filter[] = home ? ["all", ...DIRECT_CHANNELS] : ["all", ...live, "dine", ...(hasDirect ? (["direct"] as const) : [])];
  const [filter, setFilter] = useState<Filter>("all");
  const hi = state.lang === "hi";
  const matches = (o: OrderDTO) => filter === "all" || (filter === "direct" ? isDirect(o.channel) : o.channel === filter);
  const rows = (data ?? []).filter((o) => channels.includes(o.channel) && matches(o));
  const active = rows.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const done = rows.filter((o) => !active.includes(o)).slice(0, 30);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" });

  async function sync() {
    setSyncing(true);
    setSyncNote(null);
    try {
      const { results } = await api<{ results: { platform: string; orders: number; error?: string }[] }>("/api/sync", { method: "POST" });
      const got = results.reduce((s, r) => s + r.orders, 0);
      const failed = results.filter((r) => r.error);
      setSyncNote(
        failed.length
          ? failed.map((f) => `${f.platform}: ${f.error}`).join(" ")
          : results.length
            ? hi ? `${got} ऑर्डर अपडेट हुए।` : `${got} order${got === 1 ? "" : "s"} updated.`
            : hi ? "सिंक करने के लिए कोई प्लेटफ़ॉर्म जुड़ा नहीं है।" : "No connected platform to sync from.",
      );
      refreshAll();
    } catch (e) {
      setSyncNote((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Page
      eyebrow={pick(NAV_GROUPS[1].label!)}
      title={home ? (hi ? "ऑर्डर" : "Orders") : pick(navItem("/app/orders").label)}
      subtitle={home ? (hi ? "आपके पेज, WhatsApp और फ़ोन से, एक जगह" : "From your page, WhatsApp and phone, in one list") : hi ? "सभी प्लेटफ़ॉर्म और डाइन-इन, एक जगह" : "Every platform and dine-in, in one list"}
      actions={
        !home && <button type="button" onClick={sync} disabled={syncing} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-60">
          {syncing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />}
          {hi ? "अभी सिंक करें" : "Sync now"}
        </button>
      }
    >
      {syncNote && <p className="mt-3 text-sm text-ink-2" role="status">{syncNote}</p>}
      {mode === "polling" && <p className="mt-3 text-sm text-muted">{hi ? "हर 10 सेकंड में अपडेट हो रहा है" : "Updating every 10 seconds"}</p>}
      {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      <div role="group" aria-label="Filter by channel" className="mt-6 flex flex-wrap gap-2">
        {filters.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 text-sm ${filter === c ? "bg-ink text-paper" : "bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line)] hover:text-ink"}`}
          >
            {c === "all" ? (hi ? "सभी" : "All") : c === "direct" ? (hi ? "सीधे ऑर्डर" : "Direct") : <ChannelTag channel={c} className={filter === c ? "text-paper" : ""} />}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-[-0.01em]">{hi ? `किचन में (${active.length})` : `In the kitchen (${active.length})`}</h2>
      {data && active.length === 0 && <p className="mt-3 rounded-xl bg-sunken px-4 py-6 text-center text-muted">{hi ? "अभी किचन में कोई ऑर्डर नहीं।" : "No orders in the kitchen right now."}</p>}
      <ul className="mt-4 grid gap-5 sm:grid-cols-2">
        {active.map((o, i) => {
          const late = o.delayed;
          return (
            <motion.li
              key={o.id}
              initial={{ y: -24, opacity: 0, rotate: -1.5 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22, delay: i * 0.06 }}
              className={`ticket flex gap-4 px-4 pb-4 pt-5 ${late ? "shadow-[0_0_0_2px_var(--chilli)]" : ""}`}
            >
              <Dish kind={dishFor(o.items)} size={64} steam={o.status === "ready"} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <ChannelTag channel={o.channel} />
                  <span className="text-sm text-muted">#{o.externalId}, {time(o.placedAt)}</span>
                </div>
                <p className="mt-1.5 font-medium leading-snug">{o.items}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
                  <motion.div
                    className={`h-full rounded-full ${late ? "bg-chilli" : o.status === "ready" ? "bg-veg" : "bg-haldi-deep"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (o.prepMins / TARGET_MINS) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between text-sm">
                  <span className={statusOf(o).tone}>
                    {pick(statusOf(o))}, {o.prepMins} {hi ? "मिनट" : "min"}
                  </span>
                  <span>{rupees(o.amount)}</span>
                </div>
                {isDirect(o.channel) && <DirectOrder order={o} onChange={merge} />}
              </div>
            </motion.li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-lg font-semibold tracking-[-0.01em]">{hi ? "पहले के" : "Earlier"}</h2>
      <table className="mt-3 w-full text-left text-[0.95rem]">
        <thead className="text-sm text-muted">
          <tr className="border-b border-line">
            <th className="py-2 font-normal">{hi ? "ऑर्डर" : "Order"}</th>
            <th className="hidden py-2 font-normal sm:table-cell">{hi ? "आइटम" : "Items"}</th>
            <th className="py-2 font-normal">{hi ? "स्थिति" : "Status"}</th>
            <th className="py-2 text-right font-normal">{hi ? "राशि" : "Amount"}</th>
          </tr>
        </thead>
        <tbody>
          {done.map((o) => (
            <tr key={o.id} className="border-b border-line">
              <td className="py-2.5">
                <ChannelTag channel={o.channel} />
                <span className="ml-2 text-sm text-muted">#{o.externalId}</span>
              </td>
              <td className="hidden py-2.5 text-ink-2 sm:table-cell">{o.items}</td>
              <td className={`py-2.5 text-sm ${statusOf(o).tone}`}>{pick(statusOf(o))}</td>
              <td className="py-2.5 text-right">{rupees(o.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}

const NEXT_STEP: Partial<Record<OrderDTO["status"], { action: "accept" | "prepare" | "ready" | "complete"; en: string; hi: string }>> = {
  new: { action: "accept", en: "Accept", hi: "स्वीकार करें" },
  accepted: { action: "prepare", en: "Start preparing", hi: "बनाना शुरू करें" },
  preparing: { action: "ready", en: "Mark ready", hi: "तैयार" },
  ready: { action: "complete", en: "Handed over", hi: "दे दिया" },
};

/** A website, WhatsApp or phone order: who it's for, how it's paid, and the next step. */
function DirectOrder({ order: o, onChange }: { order: OrderDTO; onChange: (o: OrderDTO[]) => void }) {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = NEXT_STEP[o.status];

  async function act(action: string) {
    setBusy(true);
    setError(null);
    try {
      onChange([await api<OrderDTO>(`/api/orders/${o.id}`, { method: "PATCH", json: { action } })]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 border-t border-dashed border-line pt-3 text-sm">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
        {o.customer && (
          <a href={`tel:${o.customer.phone}`} className="font-medium text-ink underline-offset-2 hover:underline">
            {o.customer.name}
          </a>
        )}
        <span>
          {o.fulfilment === "table"
            ? hi ? `टेबल ${o.tableLabel}` : `Table ${o.tableLabel}`
            : o.fulfilment === "delivery"
              ? o.delivery?.by === "zomato_rider"
                ? hi ? "डिलीवरी · Zomato राइडर" : "Delivery · Zomato rider"
                : hi ? "डिलीवरी · आपका स्टाफ़" : "Delivery · your staff"
              : hi ? "पिकअप" : "Pickup"}
          {o.delivery?.km != null && ` · ${o.delivery.km} km`}
        </span>
        <span className={o.paymentStatus === "paid" ? "text-leaf" : "text-chilli"}>
          {o.paymentStatus === "paid" ? (hi ? "भुगतान हो गया" : "Paid") : o.paymentMethod === "upi" ? (hi ? "UPI बाक़ी" : "UPI not confirmed") : hi ? "भुगतान बाक़ी" : "To pay at counter"}
        </span>
      </p>
      {o.delivery?.address && <p className="mt-1 text-ink-2">{o.delivery.address}</p>}
      {o.note && <p className="mt-1 italic text-ink-2">“{o.note}”</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {next && (
          <button type="button" disabled={busy} onClick={() => act(next.action)} className="rounded-full bg-ink px-3.5 py-1.5 font-medium text-paper disabled:opacity-60">
            {pick(next)}
          </button>
        )}
        {o.paymentStatus === "unpaid" && o.status !== "rejected" && (
          <button type="button" disabled={busy} onClick={() => act("paid")} className="rounded-full px-3.5 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-60">
            {hi ? "भुगतान मिला" : "Mark paid"}
          </button>
        )}
        {o.status === "new" && (
          <button type="button" disabled={busy} onClick={() => act("reject")} className="rounded-full px-3 py-1.5 text-muted hover:text-chilli disabled:opacity-60">
            {hi ? "मना करें" : "Reject"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-chilli">{error}</p>}
    </div>
  );
}
