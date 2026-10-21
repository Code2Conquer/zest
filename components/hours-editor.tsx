"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { api, useApi } from "@/lib/api";
import { isOpenAt, type SpecialHours, type WeeklyHours } from "@/lib/hours";
import { useApp } from "@/lib/state";

const DAYS = [
  { en: "Sunday", hi: "रविवार" },
  { en: "Monday", hi: "सोमवार" },
  { en: "Tuesday", hi: "मंगलवार" },
  { en: "Wednesday", hi: "बुधवार" },
  { en: "Thursday", hi: "गुरुवार" },
  { en: "Friday", hi: "शुक्रवार" },
  { en: "Saturday", hi: "शनिवार" },
];
// Monday first, as restaurants write their hours.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Span = { opens: string; closes: string };

/** Weekly hours (up to two spans a day, for split shifts) and special dates such as festival closures. */
export function HoursEditor() {
  const { lang, pick, outlet } = useApp();
  const hi = lang === "hi";
  const { data } = useApi<{ weekly: WeeklyHours; special: SpecialHours }>(outlet ? `/api/hours?o=${outlet.id}` : null);
  const [days, setDays] = useState<Record<number, Span[]>>({});
  const [special, setSpecial] = useState<SpecialHours>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    const next: Record<number, Span[]> = {};
    for (const d of ORDER) next[d] = data.weekly.filter((h) => h.weekday === d && !h.channel).map((h) => ({ opens: h.opens, closes: h.closes }));
    setDays(next);
    setSpecial(data.special);
  }, [data]);

  const setSpan = (d: number, i: number, k: keyof Span, v: string) => setDays((x) => ({ ...x, [d]: x[d].map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      const weekly = ORDER.flatMap((d) => (days[d] ?? []).map((s) => ({ weekday: d, ...s })));
      // Keep any per-channel rows the editor doesn't show.
      const channelRows = (data?.weekly ?? []).filter((h) => h.channel);
      await api("/api/hours", { method: "PUT", json: { weekly: [...weekly, ...channelRows], special } });
      setNote({ ok: true, text: hi ? "समय सेव हो गया।" : "Hours saved." });
    } catch (err) {
      setNote({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const openNow = data ? isOpenAt(data.weekly, data.special, new Date()) : null;
  const time = "rounded-md bg-surface px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)] outline-none";

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "खुलने का समय" : "Opening hours"}</h2>
        {openNow !== null && <span className={`text-sm ${openNow ? "text-leaf" : "text-muted"}`}>{openNow ? (hi ? "अभी खुला" : "Open now") : hi ? "अभी बंद" : "Closed now"}</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        {hi ? "भारतीय समय में। आधी रात के बाद बंद होने के लिए, जैसे शाम 6 से रात 2, बंद होने का समय 02:00 लिखें।" : "In India time. To close after midnight, say 6 pm to 2 am, set the closing time to 02:00."}
      </p>
      <ul className="mt-4 divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_var(--line)]">
        {ORDER.map((d) => (
          <li key={d} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="w-28 font-medium">{pick(DAYS[d])}</span>
            {(days[d] ?? []).length === 0 && <span className="text-sm text-muted">{hi ? "बंद" : "Closed"}</span>}
            {(days[d] ?? []).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-sm">
                <input type="time" aria-label={hi ? "खुलता है" : "Opens"} value={s.opens} onChange={(e) => setSpan(d, i, "opens", e.target.value)} className={time} />
                <span className="text-muted">–</span>
                <input type="time" aria-label={hi ? "बंद होता है" : "Closes"} value={s.closes} onChange={(e) => setSpan(d, i, "closes", e.target.value)} className={time} />
                <button type="button" aria-label={hi ? "हटाएँ" : "Remove"} onClick={() => setDays((x) => ({ ...x, [d]: x[d].filter((_, j) => j !== i) }))} className="rounded-full p-1 text-muted hover:text-chilli">
                  <X aria-hidden className="size-4" />
                </button>
              </span>
            ))}
            {(days[d] ?? []).length < 2 && (
              <button type="button" onClick={() => setDays((x) => ({ ...x, [d]: [...(x[d] ?? []), { opens: "11:00", closes: "23:00" }] }))} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
                <Plus aria-hidden className="size-4" />
                {(days[d] ?? []).length ? (hi ? "दूसरी पाली" : "Second shift") : hi ? "खोलें" : "Open"}
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-sm font-medium">{hi ? "ख़ास तारीख़ें" : "Special dates"}</h3>
      <ul className="mt-2 space-y-2">
        {special.map((s, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <input type="date" value={s.date} onChange={(e) => setSpecial((x) => x.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)))} className={time} />
            <label className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={s.closed} onChange={(e) => setSpecial((x) => x.map((y, j) => (j === i ? { ...y, closed: e.target.checked, opens: e.target.checked ? undefined : "11:00", closes: e.target.checked ? undefined : "18:00" } : y)))} />
              {hi ? "बंद" : "Closed"}
            </label>
            {!s.closed && (
              <>
                <input type="time" aria-label={hi ? "खुलता है" : "Opens"} value={s.opens ?? ""} onChange={(e) => setSpecial((x) => x.map((y, j) => (j === i ? { ...y, opens: e.target.value } : y)))} className={time} />
                <input type="time" aria-label={hi ? "बंद होता है" : "Closes"} value={s.closes ?? ""} onChange={(e) => setSpecial((x) => x.map((y, j) => (j === i ? { ...y, closes: e.target.value } : y)))} className={time} />
              </>
            )}
            <input value={s.note ?? ""} onChange={(e) => setSpecial((x) => x.map((y, j) => (j === i ? { ...y, note: e.target.value } : y)))} placeholder={hi ? "जैसे दिवाली" : "e.g. Diwali"} className={`w-32 ${time}`} />
            <button type="button" aria-label={hi ? "हटाएँ" : "Remove"} onClick={() => setSpecial((x) => x.filter((_, j) => j !== i))} className="rounded-full p-1 text-muted hover:text-chilli">
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setSpecial((x) => [...x, { date: new Date().toISOString().slice(0, 10), closed: true }])} className="mt-2 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <Plus aria-hidden className="size-4" />
        {hi ? "तारीख़ जोड़ें" : "Add a date"}
      </button>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !data} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "समय सेव करें" : "Save hours"}
        </button>
        {note && <span className={`text-sm ${note.ok ? "text-leaf" : "text-chilli"}`} role="status">{note.text}</span>}
      </div>
    </section>
  );
}
