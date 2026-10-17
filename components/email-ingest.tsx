"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { api, refreshAll } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { PayoutDTO } from "@/lib/types";

/**
 * Paste a payout or settlement email and Zest records it. Until Gmail/Outlook
 * sign-in is set up, this (or a forwarding rule to the ingest endpoint) is how
 * statements arrive.
 */
export function EmailIngest({ compact = false }: { compact?: boolean }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [open, setOpen] = useState(!compact);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<{ kind: "payout" | "ignored"; payout?: PayoutDTO }>("/api/ingest/email", { method: "POST", json: { from, subject, text } });
      if (res.kind === "payout" && res.payout) {
        setResult(hi ? `${res.payout.platform === "zomato" ? "Zomato" : "Swiggy"} का ₹${res.payout.net.toLocaleString("en-IN")} का पेआउट जोड़ा गया।` : `Added a ₹${res.payout.net.toLocaleString("en-IN")} ${res.payout.platform === "zomato" ? "Zomato" : "Swiggy"} payout.`);
        setFrom("");
        setSubject("");
        setText("");
        refreshAll();
      } else {
        setResult(hi ? "यह पेआउट ईमेल नहीं लगा, इसलिए सिर्फ़ सेव किया गया।" : "That didn't look like a payout email, so it was only saved.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
        <Mail aria-hidden className="size-4" />
        {hi ? "पेआउट ईमेल पेस्ट करें" : "Paste a payout email"}
      </button>
    );
  }

  const field = "w-full rounded-lg bg-paper px-3 py-2 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
      <p className="font-medium">{hi ? "पेआउट ईमेल पेस्ट करें" : "Paste a payout email"}</p>
      <p className="text-sm text-muted">{hi ? "Zomato या Swiggy का पेआउट या स्टेटमेंट मेल। Zest रक़म पढ़कर जोड़ देगा।" : "A payout or statement mail from Zomato or Swiggy. Zest reads the amounts and records it."}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "भेजने वाला" : "From"}</span>
          <input required value={from} onChange={(e) => setFrom(e.target.value)} placeholder="payouts@swiggy.in" className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "विषय" : "Subject"}</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Payout advice for 14 Oct to 20 Oct" className={field} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-2">{hi ? "मेल का टेक्स्ट" : "Email text"}</span>
        <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={5} className={field} />
      </label>
      {result && (
        <p className="flex items-center gap-2 text-sm text-leaf" role="status">
          <Check aria-hidden className="size-4" />
          {result}
        </p>
      )}
      {error && <p className="text-sm text-chilli">{error}</p>}
      <button type="submit" disabled={busy || !text.trim() || !from.trim()} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50">
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {hi ? "पढ़ें और जोड़ें" : "Read and add"}
      </button>
    </form>
  );
}
