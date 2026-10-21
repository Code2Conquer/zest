"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { api, refreshAll, useApi } from "@/lib/api";
import { useMe } from "@/lib/auth-client";
import { useApp } from "@/lib/state";

type StaffRow = { id: string; name: string; email: string | null; role: "owner" | "manager" | "kitchen" | "cashier" | "rider"; hasPin: boolean };

const ROLE: Record<StaffRow["role"], { en: string; hi: string }> = {
  owner: { en: "Owner", hi: "मालिक" },
  manager: { en: "Manager", hi: "मैनेजर" },
  kitchen: { en: "Kitchen", hi: "किचन" },
  cashier: { en: "Cashier", hi: "कैशियर" },
  rider: { en: "Rider", hi: "राइडर" },
};

/** The owner's list of people who can sign in, with the restaurant code staff use with their PIN. */
export function StaffCard() {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const { data: me } = useMe();
  const isOwner = me?.role === "owner";
  const { data } = useApi<{ staffCode: string | null; staff: StaffRow[] }>(isOwner ? "/api/staff" : null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"manager" | "kitchen" | "cashier" | "rider">("kitchen");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/staff", { method: "POST", json: role === "manager" ? { name, role, email } : { name, role, pin } });
      setName("");
      setPin("");
      setEmail("");
      refreshAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/api/staff/${id}`, { method: "DELETE" });
      refreshAll();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const field = "rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "स्टाफ़" : "Staff"}</h2>
      <p className="mt-1 text-sm text-muted">
        {hi ? "स्टाफ़ रेस्टोरेंट के फ़ोन या टैबलेट पर इस कोड और अपने PIN से साइन इन करते हैं:" : "Staff sign in on the restaurant's phone or tablet with this code and their own PIN:"}{" "}
        <span className="font-mono text-base font-semibold tracking-widest text-ink">{data?.staffCode ?? "…"}</span>
      </p>
      {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
      <ul className="mt-4 divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_var(--line)]">
        {(data?.staff ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{s.name || s.email}</span>
              <span className="text-sm text-muted">
                {pick(ROLE[s.role])}
                {s.hasPin ? (hi ? " · PIN से" : " · signs in with PIN") : s.email ? ` · ${s.email}` : ""}
              </span>
            </span>
            {s.role !== "owner" && (
              <button type="button" onClick={() => remove(s.id)} aria-label={hi ? `${s.name} को हटाएँ` : `Remove ${s.name}`} className="rounded-full p-2 text-muted hover:bg-sunken hover:text-chilli">
                <Trash2 aria-hidden className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1">
          <span className="text-sm text-muted">{hi ? "नाम" : "Name"}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={`mt-1 w-full ${field}`} />
        </label>
        <label>
          <span className="text-sm text-muted">{hi ? "काम" : "Role"}</span>
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={`mt-1 block ${field}`}>
            {(["kitchen", "cashier", "rider", "manager"] as const).map((r) => (
              <option key={r} value={r}>
                {pick(ROLE[r])}
              </option>
            ))}
          </select>
        </label>
        {role === "manager" ? (
          <label className="min-w-48 flex-1">
            <span className="text-sm text-muted">{hi ? "Google ईमेल (वे इसी से साइन इन करेंगे)" : "Google email (they sign in with it)"}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`mt-1 w-full ${field}`} />
          </label>
        ) : (
          <label className="w-28">
            <span className="text-sm text-muted">PIN</span>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" required pattern="\d{4}" className={`mt-1 w-full font-mono tracking-widest ${field}`} />
          </label>
        )}
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "जोड़ें" : "Add"}
        </button>
      </form>
    </section>
  );
}
