"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useApi } from "@/lib/api";
import { useApp } from "@/lib/state";

/** The restaurant's own ordering site: switch it on, share its link and QR, and set where UPI payments go. */
export function OrderingSiteCard() {
  const { lang, outlet, updateOutlet } = useApp();
  const hi = lang === "hi";
  const { data: qr } = useApi<{ url: string; svg: string }>(outlet?.slug ? `/api/outlet/site-qr?o=${outlet.id}` : null);
  const [upi, setUpi] = useState(outlet?.upiId ?? "");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUpi(outlet?.upiId ?? ""), [outlet?.upiId]);
  if (!outlet) return null;

  async function save(patch: Record<string, unknown>, done: string) {
    setNote(null);
    try {
      await updateOutlet(patch);
      setNote({ ok: true, text: done });
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    }
  }

  const field = "rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "आपकी ऑर्डरिंग साइट" : "Your ordering site"}</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={outlet.ordering} onChange={(e) => void save({ ordering: e.target.checked }, e.target.checked ? (hi ? "ऑर्डरिंग चालू" : "Ordering is on") : hi ? "ऑर्डरिंग बंद" : "Ordering is off")} className="size-4 accent-[var(--leaf)]" />
          {hi ? "ऑर्डर लें" : "Take orders"}
        </label>
      </div>
      <p className="mt-0.5 max-w-[60ch] text-sm text-muted">
        {hi
          ? "बिना कमीशन के सीधे ऑर्डर: पिकअप, या टेबल के QR से। ग्राहक UPI से सीधे आपको या काउंटर पर भुगतान करते हैं।"
          : "Commission-free orders straight to you: pickup, or from a table's QR code. Customers pay you directly by UPI, or at the counter."}
      </p>
      <div className="mt-4 flex flex-wrap gap-5 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
        {qr && <div aria-hidden className="size-28 shrink-0 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />}
        <div className="min-w-0 flex-1 space-y-3">
          {qr && (
            <p className="flex flex-wrap items-center gap-2">
              <span className="truncate font-mono text-sm">{qr.url}</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(qr.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken"
              >
                <Copy aria-hidden className="size-3.5" />
                {copied ? (hi ? "कॉपी हुआ" : "Copied") : hi ? "कॉपी" : "Copy"}
              </button>
              <a href={qr.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-2">
                <ExternalLink aria-hidden className="size-3.5" />
                {hi ? "खोलें" : "Open"}
              </a>
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save({ upiId: upi.trim() || null }, hi ? "UPI ID सेव हुआ" : "UPI ID saved");
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="min-w-48 flex-1 text-sm text-muted">
              {hi ? "भुगतान के लिए आपका UPI ID" : "Your UPI ID for payments"}
              <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="rasoi27@okhdfc" className={`mt-1 w-full text-ink ${field}`} />
            </label>
            <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper">
              {hi ? "सेव करें" : "Save"}
            </button>
          </form>
          <p className="text-sm text-muted">
            {hi ? "UPI ID न हो तो ग्राहक काउंटर पर भुगतान करेंगे। टेबल के QR के लिए लिंक के आख़िर में ?table=T1 जोड़ें।" : "Without a UPI ID, customers pay at the counter. For a table's QR code, add ?table=T1 to the link."}
          </p>
          {note && <p className={`text-sm ${note.ok ? "text-leaf" : "text-chilli"}`} role="status">{note.text}</p>}
        </div>
      </div>
    </section>
  );
}
