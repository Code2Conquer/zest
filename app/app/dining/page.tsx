"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Check, Clock, CreditCard, ExternalLink, Minus, Pencil, Plus, Printer, QrCode, Search, Smartphone, Users, X } from "lucide-react";
import { rupees } from "@/components/cards";
import { api, refreshAll, useApi } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { DiningDTO, ReservationDTO } from "@/lib/types";

type Table = DiningDTO["tables"][number];
type Guest = { name: string; partySize: number; reservationId?: string };

const TONE: Record<Table["status"], { card: string; dot: string; en: string; hi: string }> = {
  free: { card: "bg-surface shadow-[0_0_0_1px_var(--line)]", dot: "bg-line", en: "Free", hi: "ख़ाली" },
  seated: { card: "bg-leaf-soft shadow-[0_0_0_1px_color-mix(in_oklab,var(--leaf)_35%,transparent)]", dot: "bg-leaf", en: "Seated", hi: "बैठे हैं" },
  billing: { card: "bg-turmeric-soft shadow-[0_0_0_1px_color-mix(in_oklab,var(--turmeric)_45%,transparent)]", dot: "bg-turmeric", en: "Bill printed", hi: "बिल दिया" },
  reserved: { card: "bg-[color-mix(in_oklab,var(--ch-dine)_10%,var(--surface))] shadow-[0_0_0_1px_color-mix(in_oklab,var(--ch-dine)_35%,transparent)]", dot: "bg-[var(--ch-dine)]", en: "Reserved", hi: "रिज़र्व" },
};

const minsSince = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));

export default function Dining() {
  const { lang, outlet } = useApp();
  const hi = lang === "hi";
  const { data, error, setData } = useApi<DiningDTO>(outlet ? `/api/dining?o=${outlet.id}` : null);
  const [now, setNow] = useState(() => Date.now());
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [placing, setPlacing] = useState<Guest | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function act<T>(path: string, init: RequestInit & { json?: unknown }) {
    setNote(null);
    try {
      const r = await api<T>(path, init);
      const fresh = await api<DiningDTO>(`/api/dining?o=${outlet?.id}`);
      setData(fresh);
      return r;
    } catch (e) {
      setNote((e as Error).message);
      return null;
    }
  }

  async function seatAt(table: Table, guest: Guest) {
    const r = await act("/api/dining/tabs", { method: "POST", json: { tableId: table.id, partyName: guest.name, partySize: guest.partySize, reservationId: guest.reservationId } });
    if (r) {
      setPlacing(null);
      setOpenTable(table.id);
    }
  }

  const zones = useMemo(() => [...new Set((data?.tables ?? []).map((t) => t.zone))], [data]);
  const table = data?.tables.find((t) => t.id === openTable) ?? null;
  const freeCount = data?.tables.filter((t) => t.status === "free").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{hi ? "डाइनिंग" : "Dining"}</h1>
          <p className="mt-1 max-w-[60ch] text-muted">
            {hi ? "टेबल, बिल, रिज़र्वेशन और वेटलिस्ट। हर बिल डाइन-इन बिक्री में जुड़ता है।" : "Tables, bills, bookings and the waitlist. Every settled bill counts in your dine-in sales."}
          </p>
        </div>
        <button type="button" onClick={() => setEditing((e) => !e)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ${editing ? "bg-ink text-paper" : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken"}`}>
          {editing ? <Check aria-hidden className="size-4" /> : <Pencil aria-hidden className="size-3.5" />}
          {editing ? (hi ? "हो गया" : "Done") : hi ? "टेबल बदलें" : "Edit tables"}
        </button>
      </div>

      {error && <p className="mt-6 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
      {note && (
        <p className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli" role="alert">
          {note}
          <button type="button" onClick={() => setNote(null)} aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </p>
      )}

      {data && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                [hi ? "आज डाइन-इन बिक्री" : "Dine-in sales today", rupees(data.stats.sales)],
                [hi ? "मेहमान" : "Guests served", String(data.stats.covers)],
                [hi ? "बिल" : "Bills settled", String(data.stats.bills)],
                [hi ? "औसत समय" : "Avg time at table", data.stats.avgMins ? `${data.stats.avgMins} min` : "—"],
                [hi ? "अभी" : "Right now", `${data.stats.openTables}/${data.tables.length} ${hi ? "टेबल" : "tables"} · ${data.stats.seatedGuests} ${hi ? "मेहमान" : "guests"}`],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)]">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-0.5 text-[1.25rem] font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid gap-8 2xl:grid-cols-[1fr_340px]">
            <section aria-label={hi ? "फ़्लोर" : "Floor"}>
              <AnimatePresence>
                {placing && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-paper">
                    <span>
                      {hi ? `${placing.name || "मेहमान"} (${placing.partySize}) के लिए ख़ाली टेबल चुनें` : `Pick a free table for ${placing.name || "the guests"} (${placing.partySize})`}
                      {freeCount === 0 && (hi ? " · अभी कोई टेबल ख़ाली नहीं" : " · no table is free right now")}
                    </span>
                    <button type="button" onClick={() => setPlacing(null)} className="text-paper/70 underline-offset-2 hover:underline">
                      {hi ? "रद्द करें" : "Cancel"}
                    </button>
                  </motion.p>
                )}
              </AnimatePresence>
              {zones.map((zone) => (
                <div key={zone} className="mb-8">
                  <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">{zone}</h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {data.tables
                      .filter((t) => t.zone === zone)
                      .map((t) => (
                        <TableCard
                          key={t.id}
                          table={t}
                          now={now}
                          editing={editing}
                          placing={placing}
                          onOpen={() => (placing && t.status !== "seated" && t.status !== "billing" ? seatAt(t, placing) : setOpenTable(t.id))}
                          onRemove={() => act(`/api/dining/tables/${t.id}`, { method: "DELETE" })}
                        />
                      ))}
                  </ul>
                </div>
              ))}
              {editing && <AddTable zones={zones} onAdd={(json) => act("/api/dining/tables", { method: "POST", json })} />}
            </section>

            <aside className="grid content-start gap-8 md:grid-cols-2 2xl:grid-cols-1">
              <Waitlist data={data} now={now} onPlace={setPlacing} act={act} />
              <Bookings data={data} onPlace={setPlacing} act={act} />
              <QrCard />
            </aside>
          </div>
        </>
      )}

      <AnimatePresence>{table && <TableSheet key={table.id} table={table} data={data!} now={now} onClose={() => setOpenTable(null)} act={act} onSeat={(g) => seatAt(table, g)} />}</AnimatePresence>
    </div>
  );
}

function TableCard({ table: t, now, editing, placing, onOpen, onRemove }: { table: Table; now: number; editing: boolean; placing: Guest | null; onOpen: () => void; onRemove: () => void }) {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const tone = TONE[t.status];
  const target = placing && (t.status === "free" || t.status === "reserved");
  const mins = t.tab ? minsSince(t.tab.openedAt, now) : null;
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onOpen}
        disabled={!!placing && !target}
        className={`flex h-full min-h-[132px] w-full flex-col rounded-2xl p-4 text-left transition-all ${tone.card} ${target ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""} ${placing && !target ? "opacity-40" : "hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-16px_rgba(0,0,0,0.35)]"}`}
      >
        <span className="flex w-full items-start justify-between">
          <span className="text-[1.5rem] font-semibold leading-none tracking-tight">{t.label}</span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Users aria-hidden className="size-3.5" />
            {t.tab ? `${t.tab.partySize}/${t.seats}` : t.seats}
          </span>
        </span>
        <span className="mt-1 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-ink-2">
          <span aria-hidden className={`size-2 rounded-full ${tone.dot}`} />
          {pick(tone)}
        </span>
        <span className="mt-auto pt-3 text-sm">
          {t.tab ? (
            <>
              <span className="block truncate text-ink-2">{t.tab.partyName || (hi ? "वॉक-इन" : "Walk-in")}</span>
              <span className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 ${mins! > 75 ? "font-medium text-chilli" : "text-muted"}`}>
                  <Clock aria-hidden className="size-3.5" />
                  {mins} min
                </span>
                <span className="font-semibold">{rupees(t.tab.total)}</span>
              </span>
            </>
          ) : t.booking ? (
            <span className="block text-ink-2">
              {new Date(t.booking.at).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" })} · {t.booking.name} ({t.booking.partySize})
            </span>
          ) : target ? (
            <span className="font-medium">{hi ? "यहाँ बिठाएँ" : "Seat here"}</span>
          ) : (
            <span className="text-muted">{hi ? "बिठाने के लिए टैप करें" : "Tap to seat"}</span>
          )}
        </span>
      </button>
      {editing && t.status === "free" && (
        <button type="button" onClick={onRemove} aria-label={hi ? `${t.label} हटाएँ` : `Remove ${t.label}`} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-chilli text-paper shadow">
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}

function AddTable({ zones, onAdd }: { zones: string[]; onAdd: (t: { label: string; seats: number; zone: string }) => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [label, setLabel] = useState("");
  const [seats, setSeats] = useState(4);
  const [zone, setZone] = useState(zones[0] ?? "Indoor");
  const field = "rounded-lg bg-surface px-3 py-2 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onAdd({ label: label.trim(), seats, zone: zone.trim() || "Indoor" });
        setLabel("");
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl bg-sunken p-4"
    >
      <label className="block">
        <span className="mb-1 block text-sm text-ink-2">{hi ? "नाम" : "Table"}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="T7" maxLength={12} className={`${field} w-24`} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-2">{hi ? "सीटें" : "Seats"}</span>
        <input type="number" min={1} max={30} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className={`${field} w-20`} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-2">{hi ? "जगह" : "Area"}</span>
        <input value={zone} onChange={(e) => setZone(e.target.value)} list="zones" className={`${field} w-36`} />
        <datalist id="zones">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </label>
      <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
        {hi ? "टेबल जोड़ें" : "Add table"}
      </button>
    </form>
  );
}

type Act = <T>(path: string, init: RequestInit & { json?: unknown }) => Promise<T | null>;

function TableSheet({ table, data, now, onClose, act, onSeat }: { table: Table; data: DiningDTO; now: number; onClose: () => void; act: Act; onSeat: (g: Guest) => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState(Math.min(2, table.seats));
  const tab = table.tab;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = data.menu.filter((m) => m.available && m.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);
  const qty = (itemId: string) => tab?.lines.find((l) => l.itemId === itemId)?.qty ?? 0;
  const setQty = (itemId: string, q: number) => tab && act(`/api/dining/tabs/${tab.id}`, { method: "PATCH", json: { action: "line", itemId, qty: q } });

  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={table.label}
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-paper shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[1.6rem] font-semibold leading-none">{table.label}</p>
            <p className="mt-1 text-sm text-muted">
              {table.zone} · {table.seats} {hi ? "सीटें" : "seats"}
              {tab && ` · ${tab.partyName || (hi ? "वॉक-इन" : "Walk-in")}, ${tab.partySize} ${hi ? "मेहमान" : "guests"} · ${minsSince(tab.openedAt, now)} min`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {!tab ? (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {table.booking && (
              <div className="mb-6 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
                <p className="text-sm text-muted">{hi ? "इस टेबल की बुकिंग" : "Booked for this table"}</p>
                <p className="mt-1 font-medium">
                  {table.booking.name} · {table.booking.partySize} · {new Date(table.booking.at).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" })}
                </p>
                {table.booking.note && <p className="mt-1 text-sm text-ink-2">{table.booking.note}</p>}
                <button type="button" onClick={() => onSeat({ name: table.booking!.name, partySize: table.booking!.partySize, reservationId: table.booking!.id })} className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
                  {hi ? "अभी बिठाएँ" : "Seat them now"}
                </button>
              </div>
            )}
            <p className="font-medium">{hi ? "वॉक-इन बिठाएँ" : "Seat a walk-in"}</p>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm text-ink-2">{hi ? "नाम (ज़रूरी नहीं)" : "Name (optional)"}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]" />
            </label>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-ink-2">{hi ? "कितने लोग" : "Guests"}</span>
              <Stepper value={size} min={1} max={40} onChange={setSize} />
            </div>
            {size > table.seats && <p className="mt-2 text-sm text-turmeric">{hi ? `इस टेबल पर ${table.seats} सीटें हैं।` : `This table seats ${table.seats}.`}</p>}
            <button type="button" onClick={() => onSeat({ name: name.trim(), partySize: size })} className="mt-6 w-full rounded-full bg-ink px-5 py-3 font-medium text-paper">
              {hi ? "बिठाएँ और बिल खोलें" : "Seat and open the bill"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab.lines.length === 0 ? (
                <p className="rounded-xl bg-sunken px-4 py-6 text-center text-sm text-muted">{hi ? "अभी कुछ ऑर्डर नहीं हुआ। नीचे से डिश जोड़ें।" : "Nothing ordered yet. Add dishes below."}</p>
              ) : (
                <ul className="divide-y divide-line">
                  {tab.lines.map((l) => (
                    <li key={l.itemId ?? l.name} className="flex items-center gap-3 py-2.5">
                      <span className={`food-mark ${l.veg ? "text-veg" : "nonveg text-nonveg"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{l.name}</span>
                        <span className="text-sm text-muted">{rupees(l.price)}</span>
                      </span>
                      {tab.status === "open" && l.itemId ? <Stepper value={l.qty} min={0} max={99} onChange={(q) => setQty(l.itemId!, q)} /> : <span className="text-sm text-ink-2">× {l.qty}</span>}
                      <span className="w-16 text-right font-medium">{rupees(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tab.status === "open" && (
                <div className="mt-6">
                  <label className="relative block">
                    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={hi ? "डिश जोड़ें…" : "Add a dish…"} className="w-full rounded-full bg-surface py-2.5 pl-9 pr-3 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]" />
                  </label>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {results.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => setQty(m.id, qty(m.id) + 1)} className="flex w-full items-center gap-2 rounded-xl bg-surface p-2 text-left shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]">
                          {m.photo ? <img src={m.photo} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <span className="size-10 shrink-0 rounded-lg bg-sunken" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{m.name}</span>
                            <span className="text-xs text-muted">{rupees(m.price)}</span>
                          </span>
                          {qty(m.id) > 0 ? <span className="rounded-full bg-ink px-1.5 text-xs font-medium text-paper">{qty(m.id)}</span> : <Plus aria-hidden className="size-4 text-muted" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-line bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">{hi ? "कुल" : "Total"}</span>
                <span className="text-[1.6rem] font-semibold tracking-tight">{rupees(tab.total)}</span>
              </div>
              {tab.status === "open" ? (
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={tab.lines.length === 0} onClick={() => act(`/api/dining/tabs/${tab.id}`, { method: "PATCH", json: { action: "bill" } })} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 font-medium text-paper disabled:opacity-30">
                    <Printer aria-hidden className="size-4" />
                    {hi ? "बिल दें" : "Print bill"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await act(`/api/dining/tabs/${tab.id}`, { method: "PATCH", json: { action: "clear" } })) onClose();
                    }}
                    className="rounded-full px-4 py-3 text-sm text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken"
                  >
                    {hi ? "टेबल ख़ाली करें" : "Clear table"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted">{hi ? "पेमेंट कैसे हुआ?" : "How did they pay?"}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["upi", "UPI", Smartphone],
                        ["cash", hi ? "कैश" : "Cash", Banknote],
                        ["card", hi ? "कार्ड" : "Card", CreditCard],
                      ] as const
                    ).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={async () => {
                          if (await act(`/api/dining/tabs/${tab.id}`, { method: "PATCH", json: { action: "settle", paidVia: id } })) {
                            refreshAll();
                            onClose();
                          }
                        }}
                        className="inline-flex flex-col items-center gap-1 rounded-xl bg-paper py-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_2px_var(--ink)]"
                      >
                        <Icon aria-hidden className="size-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => act(`/api/dining/tabs/${tab.id}`, { method: "PATCH", json: { action: "reopen" } })} className="mt-3 text-sm text-ink-2 underline-offset-2 hover:underline">
                    {hi ? "बिल फिर खोलें" : "Reopen the bill"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--line)]">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Fewer" className="grid size-8 place-items-center rounded-full hover:bg-sunken">
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="More" className="grid size-8 place-items-center rounded-full hover:bg-sunken">
        <Plus className="size-3.5" />
      </button>
    </span>
  );
}

function GuestForm({ kind, onSubmit, onCancel }: { kind: "booking" | "waitlist"; onSubmit: (json: Record<string, unknown>) => Promise<unknown>; onCancel: () => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState(2);
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60_000);
    return `${String(d.getHours()).padStart(2, "0")}:${d.getMinutes() < 30 ? "30" : "00"}`;
  });
  const [quoted, setQuoted] = useState(15);
  const [note, setNote] = useState("");
  const field = "w-full rounded-lg bg-surface px-3 py-2 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const [h, m] = time.split(":").map(Number);
        const at = new Date();
        at.setHours(h, m, 0, 0);
        const ok = await onSubmit({
          kind,
          name,
          phone: phone.trim() || null,
          partySize: size,
          ...(kind === "booking" ? { at: at.toISOString() } : { quotedMins: quoted }),
          note: note.trim() || undefined,
        });
        if (ok) onCancel();
      }}
      className="space-y-3 rounded-2xl bg-sunken p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "नाम" : "Name"}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="col-span-2 block">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "फ़ोन (WhatsApp के लिए)" : "Phone (for WhatsApp)"}</span>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxxxxx21" className={field} />
        </label>
        <div>
          <span className="mb-1 block text-sm text-ink-2">{hi ? "लोग" : "Guests"}</span>
          <Stepper value={size} min={1} max={40} onChange={setSize} />
        </div>
        {kind === "booking" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "समय (आज)" : "Time (today)"}</span>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "बताया इंतज़ार" : "Quoted wait"}</span>
            <select value={quoted} onChange={(e) => setQuoted(Number(e.target.value))} className={field}>
              {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="col-span-2 block">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "नोट (ज़रूरी नहीं)" : "Note (optional)"}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={hi ? "जन्मदिन, हाई चेयर…" : "Birthday, high chair…"} className={field} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
          {kind === "booking" ? (hi ? "बुक करें" : "Add booking") : hi ? "वेटलिस्ट में जोड़ें" : "Add to waitlist"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-muted hover:text-ink">
          {hi ? "रद्द करें" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

function Waitlist({ data, now, onPlace, act }: { data: DiningDTO; now: number; onPlace: (g: Guest) => void; act: Act }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [adding, setAdding] = useState(false);
  const [sent, setSent] = useState<Record<string, string>>({});
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          {hi ? "वेटलिस्ट" : "Waitlist"} <span className="text-muted">{data.waitlist.length || ""}</span>
        </h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <Plus aria-hidden className="size-4" />
            {hi ? "जोड़ें" : "Add"}
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-3">
          <GuestForm kind="waitlist" onSubmit={(json) => act("/api/dining/reservations", { method: "POST", json })} onCancel={() => setAdding(false)} />
        </div>
      )}
      {data.waitlist.length === 0 && !adding && <p className="mt-2 text-sm text-muted">{hi ? "कोई इंतज़ार में नहीं।" : "No one waiting."}</p>}
      <ul className="mt-3 space-y-2">
        {data.waitlist.map((r) => {
          const waited = minsSince(r.at, now);
          const over = r.quotedMins !== null && waited > r.quotedMins;
          return (
            <li key={r.id} className="rounded-xl bg-surface p-3 shadow-[0_0_0_1px_var(--line)]">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">
                  {r.name} <span className="font-normal text-muted">· {r.partySize}</span>
                </p>
                <span className={`text-sm ${over ? "font-medium text-chilli" : "text-muted"}`}>
                  {waited}/{r.quotedMins} min
                </span>
              </div>
              {r.note && <p className="text-sm text-ink-2">{r.note}</p>}
              {r.status === "notified" && <p className="text-sm text-leaf">{hi ? "टेबल तैयार का मैसेज भेजा" : "Told their table is ready"}</p>}
              {sent[r.id] && <p className="text-sm text-muted">{sent[r.id]}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <button type="button" onClick={() => onPlace({ name: r.name, partySize: r.partySize, reservationId: r.id })} className="rounded-full bg-ink px-3 py-1.5 font-medium text-paper">
                  {hi ? "बिठाएँ" : "Seat"}
                </button>
                <button
                  type="button"
                  disabled={!r.phone}
                  title={r.phone ? undefined : hi ? "फ़ोन नंबर नहीं है" : "No phone number"}
                  onClick={async () => {
                    const res = await act<{ message: { status: string; error: string | null } | null }>(`/api/dining/reservations/${r.id}`, { method: "PATCH", json: { action: "notify" } });
                    if (res?.message?.error) setSent((s) => ({ ...s, [r.id]: hi ? `मैसेज कतार में: ${res.message!.error}` : `Message queued: ${res.message!.error}` }));
                  }}
                  className="rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-40"
                >
                  {hi ? "टेबल तैयार (WhatsApp)" : "Table ready (WhatsApp)"}
                </button>
                <button type="button" onClick={() => act(`/api/dining/reservations/${r.id}`, { method: "PATCH", json: { action: "cancel" } })} className="px-2 py-1.5 text-muted hover:text-ink">
                  {hi ? "हटाएँ" : "Remove"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Bookings({ data, onPlace, act }: { data: DiningDTO; onPlace: (g: Guest) => void; act: Act }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [adding, setAdding] = useState(false);
  const label = (r: ReservationDTO) => data.tables.find((t) => t.id === r.tableId)?.label;
  const upcoming = data.bookings.filter((r) => r.status === "booked");
  const done = data.bookings.filter((r) => r.status !== "booked");
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          {hi ? "आज की बुकिंग" : "Today's bookings"} <span className="text-muted">{upcoming.length || ""}</span>
        </h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <Plus aria-hidden className="size-4" />
            {hi ? "बुक करें" : "Book"}
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-3">
          <GuestForm kind="booking" onSubmit={(json) => act("/api/dining/reservations", { method: "POST", json })} onCancel={() => setAdding(false)} />
        </div>
      )}
      {data.bookings.length === 0 && !adding && <p className="mt-2 text-sm text-muted">{hi ? "आज कोई बुकिंग नहीं।" : "No bookings today."}</p>}
      <ul className="mt-3 space-y-2">
        {upcoming.map((r) => (
          <li key={r.id} className="rounded-xl bg-surface p-3 shadow-[0_0_0_1px_var(--line)]">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium">
                {new Date(r.at).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit" })} · {r.name} <span className="font-normal text-muted">· {r.partySize}</span>
              </p>
              {label(r) && <span className="text-sm text-muted">{label(r)}</span>}
            </div>
            {r.note && <p className="text-sm text-ink-2">{r.note}</p>}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onPlace({ name: r.name, partySize: r.partySize, reservationId: r.id })} className="rounded-full bg-ink px-3 py-1.5 font-medium text-paper">
                {hi ? "बिठाएँ" : "Seat"}
              </button>
              <button type="button" onClick={() => act(`/api/dining/reservations/${r.id}`, { method: "PATCH", json: { action: "no_show" } })} className="rounded-full px-3 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                {hi ? "नहीं आए" : "No-show"}
              </button>
              <button type="button" onClick={() => act(`/api/dining/reservations/${r.id}`, { method: "PATCH", json: { action: "cancel" } })} className="px-2 py-1.5 text-muted hover:text-ink">
                {hi ? "रद्द" : "Cancel"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {done.filter((r) => r.status === "seated").length} {hi ? "बैठ चुके" : "seated"} · {done.filter((r) => r.status === "no_show").length} {hi ? "नहीं आए" : "no-shows"}
        </p>
      )}
    </section>
  );
}

function QrCard() {
  const { lang, outlet } = useApp();
  const hi = lang === "hi";
  const { data } = useApi<{ url: string; svg: string }>(outlet ? `/api/dining/qr?o=${outlet.id}` : null);
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
      <h2 className="flex items-center gap-2 font-medium">
        <QrCode aria-hidden className="size-4" />
        {hi ? "टेबल के लिए QR मेन्यू" : "QR menu for tables"}
      </h2>
      <p className="mt-1 text-sm text-muted">{hi ? "मेहमान फ़ोन से स्कैन करके डाइन-इन मेन्यू और दाम देखते हैं।" : "Guests scan it to see your dine-in menu and prices on their phone."}</p>
      {data && (
        <div className="mt-3 flex items-center gap-4">
          <div className="size-28 shrink-0 rounded-lg bg-white p-1.5 shadow-[0_0_0_1px_var(--line)] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: data.svg }} />
          <div className="space-y-2 text-sm">
            <a href={data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ink underline-offset-2 hover:underline">
              <ExternalLink aria-hidden className="size-3.5" />
              {hi ? "मेन्यू खोलें" : "Open the menu"}
            </a>
            <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.svg)}`} download={`${outlet?.name ?? "menu"}-qr.svg`} className="flex items-center gap-1.5 text-ink-2 underline-offset-2 hover:underline">
              <Printer aria-hidden className="size-3.5" />
              {hi ? "प्रिंट के लिए डाउनलोड" : "Download to print"}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
