"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, Plus, X } from "lucide-react";
import { Page } from "@/components/page";
import { rupees } from "@/components/cards";
import { api, refreshAll, useApi } from "@/lib/api";
import { NAV_GROUPS, navItem } from "@/lib/nav";
import { useApp } from "@/lib/state";
import type { MenuItemDTO } from "@/lib/types";

// Weekly tiffin plans: who gets what, on which days, and whether the week is paid. Each morning the day's
// orders are created from these and appear on the Orders screen like any other.

type Plan = {
  id: string;
  customer: { name: string; phone: string };
  dish: string;
  qty: number;
  days: number[];
  fulfilment: "delivery" | "pickup";
  address: string;
  note: string;
  startsOn: string;
  endsOn: string;
  amount: number;
  paymentStatus: "unpaid" | "paid";
  skips: string[];
  active: boolean;
  meals: number;
};

const DAYS = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"] };
const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const nextMonday = () => {
  const d = new Date(`${todayIndia()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
};

export default function Plans() {
  const { lang, pick, outlet } = useApp();
  const hi = lang === "hi";
  const { data, error } = useApi<Plan[]>(outlet ? `/api/plans?o=${outlet.id}` : null);
  const [adding, setAdding] = useState(false);
  const today = todayIndia();
  const live = (data ?? []).filter((p) => p.active && p.endsOn >= today);
  const past = (data ?? []).filter((p) => !(p.active && p.endsOn >= today));
  const date = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });

  async function change(id: string, json: Record<string, string>) {
    await api(`/api/plans/${id}`, { method: "PATCH", json }).catch(() => {});
    refreshAll();
  }

  return (
    <Page
      eyebrow={pick(NAV_GROUPS[2].label!)}
      title={pick(navItem("/app/plans").label)}
      subtitle={hi ? "हफ़्ते के टिफ़िन। हर सुबह उस दिन के ऑर्डर अपने-आप बन जाते हैं।" : "Weekly tiffins. Each morning the day's orders are made from these, on their own."}
      actions={
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
          <Plus aria-hidden className="size-4" /> {hi ? "नया प्लान" : "New plan"}
        </button>
      }
    >
      {error && <p className="rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
      {data && live.length === 0 && (
        <div className="mt-2 rounded-2xl bg-surface p-6 text-center">
          <CalendarCheck aria-hidden className="mx-auto size-8 text-turmeric" />
          <p className="mt-2 font-medium">{hi ? "अभी कोई प्लान नहीं" : "No plans running"}</p>
          <p className="mt-1 text-sm text-muted">{hi ? "रोज़ आने वाले ग्राहकों को हफ़्ते का प्लान दीजिए, पैसा पहले से।" : "Put your daily regulars on a weekly plan, paid up front."}</p>
        </div>
      )}
      <ul className="mt-2 grid gap-3 md:grid-cols-2">
        {live.map((p) => {
          const skipped = p.skips.includes(today);
          const onToday = p.days.includes(new Date(`${today}T00:00:00Z`).getUTCDay()) && p.startsOn <= today;
          return (
            <li key={p.id} className="rounded-2xl bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{p.customer.name}</p>
                  <p className="text-sm text-muted">{p.customer.phone}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${p.paymentStatus === "paid" ? "bg-leaf-soft text-leaf" : "bg-turmeric-soft text-ink"}`}>
                  {p.paymentStatus === "paid" ? (hi ? "पेड" : "Paid") : hi ? "बाक़ी" : "Unpaid"} · {rupees(p.amount)}
                </span>
              </div>
              <p className="mt-3 font-medium">
                {p.qty} × {p.dish}
              </p>
              <p className="text-sm text-ink-2">
                {p.days.map((d) => DAYS[hi ? "hi" : "en"][d]).join(", ")} · {date(p.startsOn)} – {date(p.endsOn)} · {p.meals} {hi ? "टिफ़िन" : "tiffins"}
              </p>
              {p.note && <p className="mt-1 text-sm text-muted">“{p.note}”</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {onToday && (
                  <button type="button" onClick={() => change(p.id, { action: skipped ? "unskip" : "skip", date: today })} className="rounded-full px-3 py-1.5 font-medium shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                    {skipped ? (hi ? "आज फिर से जोड़ें" : "Restore today") : hi ? "आज छोड़ें" : "Skip today"}
                  </button>
                )}
                {p.paymentStatus !== "paid" && (
                  <button type="button" onClick={() => change(p.id, { action: "paid" })} className="rounded-full bg-ink px-3 py-1.5 font-medium text-paper">
                    {hi ? "पैसा मिल गया" : "Mark paid"}
                  </button>
                )}
                <button type="button" onClick={() => change(p.id, { action: "stop" })} className="rounded-full px-3 py-1.5 text-muted hover:text-ink">
                  {hi ? "प्लान बंद करें" : "Stop plan"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">
            {hi ? "पुराने प्लान" : "Finished plans"} ({past.length})
          </summary>
          <ul className="mt-2 divide-y divide-line text-sm">
            {past.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>
                  {p.customer.name} · {p.qty} × {p.dish}
                </span>
                <span className="text-muted">{date(p.endsOn)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {adding && <NewPlan onClose={() => setAdding(false)} />}
    </Page>
  );
}

function NewPlan({ onClose }: { onClose: () => void }) {
  const { lang, outlet } = useApp();
  const hi = lang === "hi";
  const { data: menu } = useApi<MenuItemDTO[]>(outlet ? `/api/menu?o=${outlet.id}` : null);
  const [f, setF] = useState({ name: "", phone: "", itemId: "", qty: 1, days: [1, 2, 3, 4, 5], fulfilment: "delivery" as "delivery" | "pickup", address: "", note: "", startsOn: nextMonday(), weeks: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dish = menu?.find((m) => m.id === f.itemId);
  const meals = (() => {
    let n = 0;
    for (let i = 0; i < f.weeks * 7; i++) if (f.days.includes((new Date(`${f.startsOn}T00:00:00Z`).getUTCDay() + i) % 7)) n++;
    return n;
  })();
  const price = dish ? Math.min(...Object.values(dish.price)) : 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/plans", { method: "POST", json: f });
      refreshAll();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  const field = "mt-1 w-full rounded-xl bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={hi ? "नया प्लान" : "New plan"} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{hi ? "नया टिफ़िन प्लान" : "New tiffin plan"}</h2>
          <button type="button" onClick={onClose} aria-label={hi ? "बंद करें" : "Close"} className="rounded-full p-2 hover:bg-sunken">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-ink-2">
            {hi ? "नाम" : "Name"}
            <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
          </label>
          <label className="text-sm text-ink-2">
            {hi ? "मोबाइल" : "Mobile"}
            <input required inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={field} />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_80px] gap-3">
          <label className="text-sm text-ink-2">
            {hi ? "डिश" : "Dish"}
            <select required value={f.itemId} onChange={(e) => setF({ ...f, itemId: e.target.value })} className={field}>
              <option value="">{hi ? "चुनिए" : "Choose"}</option>
              {(menu ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {rupees(Math.min(...Object.values(m.price)))}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink-2">
            {hi ? "कितने" : "Qty"}
            <input type="number" min={1} max={10} value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) || 1 })} className={field} />
          </label>
        </div>
        <fieldset className="mt-3">
          <legend className="text-sm text-ink-2">{hi ? "किन दिनों" : "Days"}</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {DAYS.en.map((_, d) => {
              const on = f.days.includes(d);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => setF({ ...f, days: on ? f.days.filter((x) => x !== d) : [...f.days, d].sort() })} className={`min-w-11 rounded-full px-3 py-2 text-sm font-medium ${on ? "bg-ink text-paper" : "shadow-[inset_0_0_0_1px_var(--line)]"}`}>
                  {DAYS[hi ? "hi" : "en"][d]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm text-ink-2">
            {hi ? "शुरू" : "Starts"}
            <input type="date" value={f.startsOn} onChange={(e) => setF({ ...f, startsOn: e.target.value })} className={field} />
          </label>
          <label className="text-sm text-ink-2">
            {hi ? "हफ़्ते" : "Weeks"}
            <select value={f.weeks} onChange={(e) => setF({ ...f, weeks: Number(e.target.value) })} className={field}>
              {[1, 2, 3, 4].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
          {(["delivery", "pickup"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={f.fulfilment === k} onClick={() => setF({ ...f, fulfilment: k })} className={`rounded-xl py-2 text-sm font-medium ${f.fulfilment === k ? "bg-ink text-paper" : "text-ink-2"}`}>
              {k === "delivery" ? (hi ? "डिलीवरी" : "Delivery") : hi ? "पिकअप" : "Pickup"}
            </button>
          ))}
        </div>
        {f.fulfilment === "delivery" && (
          <label className="mt-3 block text-sm text-ink-2">
            {hi ? "पता" : "Address"}
            <input required minLength={8} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={field} />
          </label>
        )}
        <label className="mt-3 block text-sm text-ink-2">
          {hi ? "नोट (ज़रूरी नहीं)" : "Note (optional)"}
          <input value={f.note} maxLength={200} placeholder={hi ? "कम मिर्च, प्याज़ नहीं" : "Less spicy, no onion"} onChange={(e) => setF({ ...f, note: e.target.value })} className={field} />
        </label>
        <p className="mt-4 flex justify-between rounded-xl bg-surface px-4 py-3 text-sm">
          <span>
            {meals} {hi ? "टिफ़िन" : "tiffins"} × {f.qty}
          </span>
          <span className="font-semibold">{rupees(meals * f.qty * price)}</span>
        </p>
        {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-medium text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "प्लान शुरू करें" : "Start plan"}
        </button>
      </form>
    </div>
  );
}
