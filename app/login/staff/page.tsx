"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Delete, Loader2 } from "lucide-react";
import { ThemeToggle, Wordmark } from "@/components/bits";
import { api, refreshAll } from "@/lib/api";
import { useApp } from "@/lib/state";

/** Staff sign-in on the restaurant's tablet or phone: the restaurant code once, then a 4-digit PIN. */
export default function StaffLogin() {
  const { lang } = useApp();
  const hi = lang === "hi";
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(full: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/pin", { method: "POST", json: { code, pin: full } });
      refreshAll();
      router.push("/app");
    } catch (err) {
      setError((err as Error).message);
      setPin("");
      setBusy(false);
    }
  }

  function press(d: string) {
    if (busy || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4 && code.trim()) void submit(next);
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-5">
        <Link href="/login" aria-label="Back to sign in" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md px-4 pb-16 pt-4">
        <h1 className="text-2xl font-semibold">{hi ? "स्टाफ़ साइन-इन" : "Staff sign-in"}</h1>
        <label htmlFor="staff-code" className="mt-6 block text-sm text-muted">
          {hi ? "रेस्टोरेंट कोड (मालिक से पूछें)" : "Restaurant code (ask the owner)"}
        </label>
        <input
          id="staff-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={8}
          className="mt-1 w-full rounded-xl bg-surface px-4 py-3 text-center text-2xl font-semibold tracking-[0.3em] shadow-[0_0_0_1px_var(--line)] outline-none focus:shadow-[0_0_0_2px_var(--ink)]"
        />
        <p className="mt-6 text-sm text-muted">{hi ? "आपका 4 अंकों का PIN" : "Your 4-digit PIN"}</p>
        <div className="mt-2 flex justify-center gap-3" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`size-4 rounded-full ${i < pin.length ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
        {error && <p className="mt-4 rounded-lg bg-chilli-soft px-3 py-2 text-center text-sm text-chilli" role="alert">{error}</p>}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} disabled={!code.trim() || busy} className="h-16 rounded-2xl bg-surface text-2xl font-medium shadow-[0_0_0_1px_var(--line)] active:bg-sunken disabled:opacity-50">
              {d}
            </button>
          ))}
          <span className="grid place-items-center">{busy && <Loader2 aria-hidden className="size-6 animate-spin" />}</span>
          <button type="button" onClick={() => press("0")} disabled={!code.trim() || busy} className="h-16 rounded-2xl bg-surface text-2xl font-medium shadow-[0_0_0_1px_var(--line)] active:bg-sunken disabled:opacity-50">
            0
          </button>
          <button type="button" aria-label={hi ? "मिटाएँ" : "Delete"} onClick={() => setPin((p) => p.slice(0, -1))} className="grid h-16 place-items-center rounded-2xl text-ink-2 active:bg-sunken">
            <Delete aria-hidden className="size-6" />
          </button>
        </div>
      </main>
    </div>
  );
}
