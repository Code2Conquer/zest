"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChannelTag } from "@/components/bits";
import { Dish, type DishKind } from "@/components/dishes";
import { Loader2, RefreshCw } from "lucide-react";
import { rupees } from "@/components/cards";
import { api, refreshAll, useApi } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import type { Channel } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";

const STATUS: Record<OrderDTO["status"], { en: string; hi: string; tone: string }> = {
  preparing: { en: "Preparing", hi: "बन रहा है", tone: "text-ink" },
  delayed: { en: "Running late", hi: "देर हो रही है", tone: "text-chilli font-medium" },
  ready: { en: "Ready for pickup", hi: "पिकअप के लिए तैयार", tone: "text-leaf" },
  picked: { en: "Picked up", hi: "पिकअप हो गया", tone: "text-ink-2" },
  delivered: { en: "Delivered", hi: "डिलीवर हो गया", tone: "text-muted" },
  cancelled: { en: "Cancelled", hi: "कैंसल", tone: "text-muted line-through" },
};

function dishFor(items: string): DishKind {
  const s = items.toLowerCase();
  if (s.includes("biryani")) return "biryani";
  if (s.includes("paneer")) return "paneer-tikka";
  if (s.includes("dal")) return "dal-makhani";
  if (s.includes("thali")) return "thali";
  if (s.includes("chole")) return "chole-bhature";
  if (s.includes("rajma")) return "rajma-chawal";
  if (s.includes("jamun")) return "gulab-jamun";
  return "butter-naan";
}

// Target prep time; tickets past it are flagged.
const TARGET_MINS = 15;

export default function Orders() {
  const { t, pick, state } = useApp();
  const { live, outlet } = useOutlet();
  const { data, error } = useApi<OrderDTO[]>(outlet ? `/api/orders?o=${outlet.id}` : null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const channels: Channel[] = [...live, "dine"];
  const [filter, setFilter] = useState<Channel | "all">("all");
  const hi = state.lang === "hi";
  const rows = (data ?? []).filter((o) => channels.includes(o.channel) && (filter === "all" || o.channel === filter));
  const active = rows.filter((o) => ["preparing", "delayed", "ready"].includes(o.status));
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
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{t("nav.orders")}</h1>
          <p className="mt-1 text-muted">{hi ? "सभी प्लेटफ़ॉर्म और डाइन-इन, एक जगह" : "Every platform and dine-in, in one list"}</p>
        </div>
        <button type="button" onClick={sync} disabled={syncing} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-60">
          {syncing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />}
          {hi ? "अभी सिंक करें" : "Sync now"}
        </button>
      </div>
      {syncNote && <p className="mt-3 text-sm text-ink-2" role="status">{syncNote}</p>}
      {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      <div role="group" aria-label="Filter by channel" className="mt-6 flex flex-wrap gap-2">
        {(["all", ...channels] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 text-sm ${filter === c ? "bg-ink text-paper" : "bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line)] hover:text-ink"}`}
          >
            {c === "all" ? (hi ? "सभी" : "All") : <ChannelTag channel={c} className={filter === c ? "text-paper" : ""} />}
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-medium">{hi ? `किचन में (${active.length})` : `In the kitchen (${active.length})`}</h2>
      {data && active.length === 0 && <p className="mt-3 rounded-xl bg-sunken px-4 py-6 text-center text-muted">{hi ? "अभी किचन में कोई ऑर्डर नहीं।" : "No orders in the kitchen right now."}</p>}
      <ul className="mt-4 grid gap-5 sm:grid-cols-2">
        {active.map((o, i) => {
          const late = o.status === "delayed";
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
                  <span className={STATUS[o.status].tone}>
                    {pick(STATUS[o.status])}, {o.prepMins} {hi ? "मिनट" : "min"}
                  </span>
                  <span>{rupees(o.amount)}</span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <h2 className="mt-10 font-medium">{hi ? "पहले के" : "Earlier"}</h2>
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
              <td className={`py-2.5 text-sm ${STATUS[o.status].tone}`}>{pick(STATUS[o.status])}</td>
              <td className="py-2.5 text-right">{rupees(o.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
