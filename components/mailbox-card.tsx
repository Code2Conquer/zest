"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, Mail, Paperclip, RefreshCw } from "lucide-react";
import { api, refreshAll, useApi } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { MailboxDTO, MailSyncResult } from "@/lib/types";
import { EmailIngest } from "./email-ingest";

const KIND_LABEL: Record<string, { en: string; hi: string }> = {
  payout: { en: "Payout", hi: "पेआउट" },
  report: { en: "Report", hi: "रिपोर्ट" },
  complaint: { en: "Complaint", hi: "शिकायत" },
  onboarding: { en: "Onboarding", hi: "ऑनबोर्डिंग" },
  other: { en: "Other", hi: "अन्य" },
};

const NOTICE: Record<string, { en: string; hi: string; tone: "ok" | "bad" }> = {
  connected: { en: "Gmail connected. Reading your Zomato and Swiggy mail now.", hi: "Gmail जुड़ गया। आपके Zomato और Swiggy मेल पढ़े जा रहे हैं।", tone: "ok" },
  cancelled: { en: "Gmail wasn't connected: sign-in was cancelled.", hi: "Gmail नहीं जुड़ा: साइन-इन रद्द हुआ।", tone: "bad" },
  expired: { en: "That sign-in took too long. Try connecting again.", hi: "साइन-इन में बहुत देर हुई। दोबारा जोड़ें।", tone: "bad" },
  failed: { en: "Google didn't allow access. Try again and tick the box to let Zest read email.", hi: "Google ने एक्सेस नहीं दिया। दोबारा कोशिश करें और ईमेल पढ़ने की अनुमति दें।", tone: "bad" },
  error: { en: "Something went wrong connecting Gmail. Try again.", hi: "Gmail जोड़ने में दिक़्क़त हुई। दोबारा कोशिश करें।", tone: "bad" },
  "not-configured": { en: "Gmail sign-in isn't set up on this server yet.", hi: "इस सर्वर पर Gmail साइन-इन अभी सेट नहीं है।", tone: "bad" },
  demo: { en: "Start your own restaurant to connect Gmail. The sample restaurant is shared.", hi: "Gmail जोड़ने के लिए अपना रेस्टोरेंट शुरू करें। सैंपल रेस्टोरेंट सबका है।", tone: "bad" },
};

/** Connect Gmail and see what Zest has read from Zomato and Swiggy. */
export function MailboxCard({ returnTo }: { returnTo: string }) {
  const { lang, outlet, pick } = useApp();
  const hi = lang === "hi";
  const { data, error, reload } = useApi<MailboxDTO>(outlet ? `/api/mail?o=${outlet.id}` : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "sync" | "disconnect">(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Google sends the owner back with ?gmail=<status>.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("gmail");
    if (status && NOTICE[status]) {
      setNotice(status);
      const u = new URL(window.location.href);
      u.searchParams.delete("gmail");
      window.history.replaceState(null, "", u.toString());
    }
  }, []);

  const box = data?.mailbox;

  // Keep reading the 90-day backfill until it's done.
  useEffect(() => {
    if (!box || box.backfillDone || box.status === "error" || busy) return;
    const id = setTimeout(() => void sync(true), 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box?.backfillDone, box?.status, box?.lastSyncAt, busy]);

  async function sync(quiet = false) {
    setBusy("sync");
    if (!quiet) setSyncNote(null);
    try {
      const r = await api<MailSyncResult>("/api/mail/sync", { method: "POST" });
      if (!quiet || r.added) setSyncNote(r.error ?? (hi ? `${r.added} नए मेल, ${r.payouts} पेआउट।` : `${r.added} new mail${r.added === 1 ? "" : "s"}, ${r.payouts} payout${r.payouts === 1 ? "" : "s"}.`));
      await reload();
      if (r.added) refreshAll();
    } catch (e) {
      setSyncNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    try {
      await api("/api/mail", { method: "DELETE" });
      setConfirming(false);
      refreshAll();
    } catch (e) {
      setSyncNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const connect = () => {
    window.location.href = `/api/mail/google/start?returnTo=${encodeURIComponent(returnTo)}`;
  };
  const time = (iso: string) => new Date(iso).toLocaleString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-3">
      {notice && (
        <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${NOTICE[notice].tone === "ok" ? "bg-leaf-soft text-leaf" : "bg-chilli-soft text-chilli"}`} role="status">
          {NOTICE[notice].tone === "ok" ? <Check aria-hidden className="mt-0.5 size-4 shrink-0" /> : <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {pick(NOTICE[notice])}
        </p>
      )}
      {error && <p className="text-sm text-chilli">{error}</p>}

      {data && !box && (
        <div className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={connect}
              disabled={!data.configured || outlet?.isDemo}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-medium text-paper disabled:opacity-40"
            >
              <Mail aria-hidden className="size-4" />
              {hi ? "Gmail जोड़ें" : "Connect Gmail"}
            </button>
            <span className="text-sm text-muted">{hi ? "Outlook जल्द आ रहा है" : "Outlook coming soon"}</span>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-2">
            {hi ? "हम सिर्फ़ इन भेजने वालों के मेल पढ़ते हैं: " : "We only read mail from "}
            <span className="font-medium text-ink">{data.senders.join(", ")}</span>
            {hi ? "। पिछले 90 दिनों से शुरू करते हैं। बाक़ी इनबॉक्स कभी नहीं खोला जाता।" : ", starting with the last 90 days. Nothing else in your inbox is opened."}
          </p>
          {!data.configured && <p className="mt-2 text-sm text-turmeric">{pick(NOTICE["not-configured"])}</p>}
          {outlet?.isDemo && <p className="mt-2 text-sm text-turmeric">{pick(NOTICE.demo)}</p>}
          <div className="mt-4">
            <EmailIngest compact />
          </div>
        </div>
      )}

      {box && (
        <div className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Mail aria-hidden className="size-4" />
                {box.address}
              </p>
              <p className={`mt-1 flex items-center gap-1.5 text-sm ${box.status === "error" ? "text-chilli" : "text-leaf"}`}>
                {box.status === "error" ? <AlertCircle aria-hidden className="size-4" /> : box.status === "syncing" || busy === "sync" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
                {box.status === "error"
                  ? box.statusDetail
                  : !box.backfillDone
                    ? hi ? "पिछले 90 दिनों के मेल पढ़ रहे हैं…" : "Reading the last 90 days…"
                    : box.lastSyncAt
                      ? (hi ? "आख़िरी सिंक " : "Last synced ") + time(box.lastSyncAt)
                      : hi ? "जुड़ा हुआ" : "Connected"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {box.status === "error" ? (
                <button type="button" onClick={connect} className="rounded-full bg-ink px-4 py-2 font-medium text-paper">
                  {hi ? "दोबारा जोड़ें" : "Connect again"}
                </button>
              ) : (
                <button type="button" onClick={() => sync()} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-50">
                  <RefreshCw aria-hidden className={`size-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />
                  {hi ? "अभी सिंक करें" : "Sync now"}
                </button>
              )}
              {confirming ? (
                <>
                  <button type="button" onClick={disconnect} disabled={!!busy} className="rounded-full bg-chilli px-3.5 py-2 font-medium text-paper">
                    {hi ? "हाँ, हटाएँ" : "Yes, disconnect"}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="px-2 py-2 text-muted hover:text-ink">
                    {hi ? "रद्द करें" : "Cancel"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirming(true)} className="px-2 py-2 text-muted underline-offset-2 hover:text-ink hover:underline">
                  {hi ? "डिस्कनेक्ट करें" : "Disconnect"}
                </button>
              )}
            </div>
          </div>
          {confirming && <p className="mt-2 text-sm text-ink-2">{hi ? "इससे Google एक्सेस हट जाएगा और इन मेल से पढ़ा सब कुछ, पेआउट समेत, मिट जाएगा।" : "This removes Google access and deletes everything read from these mails, including payouts."}</p>}
          {syncNote && <p className="mt-2 text-sm text-ink-2">{syncNote}</p>}

          <dl className="mt-4 flex flex-wrap gap-2 text-sm">
            {(Object.keys(box.counts) as (keyof typeof box.counts)[])
              .filter((k) => box.counts[k] > 0)
              .map((k) => (
                <div key={k} className="rounded-full bg-sunken px-3 py-1">
                  <dt className="inline text-ink-2">{pick(KIND_LABEL[k])}</dt> <dd className="inline font-medium">{box.counts[k]}</dd>
                </div>
              ))}
          </dl>

          {data.recent.length > 0 && (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {data.recent.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-[0.72rem] font-medium ${m.kind === "payout" ? "bg-leaf-soft text-leaf" : m.kind === "complaint" ? "bg-chilli-soft text-chilli" : "bg-sunken text-ink-2"}`}>
                    {pick(KIND_LABEL[m.kind ?? "other"] ?? KIND_LABEL.other)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink">{m.subject}</span>
                  {m.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-muted" title={m.attachments.map((a) => a.filename).join(", ")}>
                      <Paperclip aria-hidden className="size-3.5" />
                      {m.attachments.length}
                    </span>
                  )}
                  {m.payout && <Check aria-label={hi ? "पेआउट जोड़ा गया" : "Payout recorded"} className="size-4 text-leaf" />}
                  <span className="text-muted">{time(m.receivedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
