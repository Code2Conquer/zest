"use client";

import { Page } from "@/components/page";
import { navItem } from "@/lib/nav";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ChannelTag } from "@/components/bits";
import { ListingCard } from "@/components/listing-preview";
import { MailboxCard } from "@/components/mailbox-card";
import { HoursEditor } from "@/components/hours-editor";
import { StaffCard } from "@/components/staff-card";
import { PlatformConnector } from "@/components/platform-connector";
import { api, refreshAll, useApi } from "@/lib/api";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";

type AuditRow = { id: string; actor: string; action: string; detail: Record<string, unknown>; createdAt: string };
type NotificationRow = { id: string; kind: string; body: string; status: "queued" | "sent" | "failed"; error: string | null; createdAt: string };

const ACTION_LABEL: Record<string, { en: string; hi: string }> = {
  "approval.created": { en: "Drafted", hi: "ड्राफ़्ट बनाया" },
  "approval.executed": { en: "Approved and done", hi: "मंज़ूर और पूरा" },
  "approval.failed": { en: "Approved, didn't go through", hi: "मंज़ूर, पर पूरा नहीं हुआ" },
  "approval.skipped": { en: "Skipped", hi: "छोड़ा" },
  "approval.undone": { en: "Undone", hi: "वापस लिया" },
  "connection.saved": { en: "Connection saved", hi: "कनेक्शन सेव हुआ" },
  "connection.removed": { en: "Disconnected", hi: "डिस्कनेक्ट किया" },
  "payout.ingested": { en: "Payout read from email", hi: "ईमेल से पेआउट पढ़ा" },
  "gmail.connected": { en: "Gmail connected", hi: "Gmail जुड़ा" },
  "gmail.synced": { en: "Read new mail", hi: "नए मेल पढ़े" },
  "gmail.disconnected": { en: "Gmail disconnected, mail deleted", hi: "Gmail हटाया, मेल मिटाए" },
  "outlet.updated": { en: "Details updated", hi: "जानकारी अपडेट हुई" },
  "outlet.created": { en: "Restaurant started", hi: "रेस्टोरेंट शुरू हुआ" },
  "menu.imported": { en: "Dishes added to menu", hi: "मेन्यू में डिश जोड़ी" },
  "sync.ran": { en: "Synced orders", hi: "ऑर्डर सिंक हुए" },
};

export default function Connections() {
  const { t, lang, outlet, updateOutlet, pick } = useApp();
  const hi = lang === "hi";
  const { data: audit } = useApi<AuditRow[]>(outlet ? `/api/audit?o=${outlet.id}` : null);
  const { data: outbox } = useApi<NotificationRow[]>(outlet ? `/api/notifications?o=${outlet.id}` : null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setError(null);
    try {
      await updateOutlet(patch);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function setLive(p: Platform, on: boolean) {
    if (!outlet) return;
    void save({ live: on ? [...outlet.live, p] : outlet.live.filter((x) => x !== p) });
  }

  async function sendSummary() {
    setSending(true);
    try {
      await api("/api/notifications/daily-summary", { method: "POST" });
      refreshAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const field = "w-full rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";

  return (
    <Page
      width="narrow"
      title={pick(navItem("/app/connections").label)}
      subtitle={pick(navItem("/app/connections").hint)}
    >
      {error && <p className="mb-4 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "रेस्टोरेंट" : "Restaurant"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", hi ? "नाम" : "Name"],
              ["ownerName", hi ? "आपका नाम" : "Your name"],
              ["area", hi ? "इलाक़ा" : "Area"],
              ["city", hi ? "शहर" : "City"],
              ["address", hi ? "पूरा पता" : "Full address"],
              ["cuisines", hi ? "क्विज़ीन" : "Cuisines"],
              ["fssai", hi ? "FSSAI लाइसेंस नंबर" : "FSSAI licence number"],
              ["gstin", "GSTIN"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm text-ink-2">{label}</span>
              <input
                value={details[key] ?? outlet?.[key] ?? ""}
                onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                onBlur={() => details[key] !== undefined && details[key] !== (outlet?.[key] ?? "") && save({ [key]: (key === "fssai" || key === "gstin") && !details[key].trim() ? null : details[key] })}
                className={field}
              />
            </label>
          ))}
        </div>
      </section>

      {outlet && !outlet.isDemo && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "आपकी लिस्टिंग" : "Your listings"}</h2>
          <p className="mt-0.5 text-sm text-muted">{hi ? "रेटिंग, पता, समय और मेन्यू आपके Zomato और Swiggy पेज से।" : "Rating, address, hours and menu from your Zomato and Swiggy pages."}</p>
          <div className="mt-3 space-y-6">
            {(outlet.live.length ? outlet.live : PLATFORMS).map((p) => (
              <ListingCard key={p} platform={p} />
            ))}
          </div>
        </section>
      )}

      <HoursEditor />

      <StaffCard />

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "प्लेटफ़ॉर्म" : "Platforms"}</h2>
        <p className="mt-0.5 max-w-[60ch] text-sm text-muted">
          {hi ? "जिन प्लेटफ़ॉर्म पर आप लाइव हैं, उन्हें चुनें। हर एक को API, MCP या पार्टनर ऐप साइन-इन से जोड़ें।" : "Pick the platforms you're live on. Connect each one by API, MCP or partner app sign-in."}
        </p>
        <div className="mt-3 space-y-4">
          {PLATFORMS.map((p) => {
            const on = !!outlet?.live.includes(p);
            return (
              <div key={p}>
                <label className="mb-2 inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" checked={on} onChange={(e) => setLive(p, e.target.checked)} className="size-4 accent-[var(--ink)]" />
                  {hi ? "मैं यहाँ लाइव हूँ:" : "I'm live on"} <ChannelTag channel={p} />
                </label>
                {on && <PlatformConnector platform={p} />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{t("connect.email")}</h2>
        <div className="mt-3">
          <MailboxCard returnTo="/app/connections" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{t("connect.whatsapp")}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="block w-60">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "WhatsApp नंबर" : "WhatsApp number"}</span>
            <input
              type="tel"
              placeholder="+91 98xxxxxx21"
              value={details.ownerPhone ?? outlet?.ownerPhone ?? ""}
              onChange={(e) => setDetails((d) => ({ ...d, ownerPhone: e.target.value }))}
              onBlur={() => details.ownerPhone !== undefined && save({ ownerPhone: details.ownerPhone.trim() || null })}
              className={field}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 pb-2.5 text-[0.95rem]">
            <input type="checkbox" checked={!!outlet?.whatsapp} onChange={(e) => save({ whatsapp: e.target.checked })} className="size-4 accent-[var(--ink)]" />
            {t("connect.whatsapp.on")}
          </label>
          <button type="button" onClick={sendSummary} disabled={sending || !outlet?.whatsapp} className="mb-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-40">
            {sending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {hi ? "आज का सारांश अभी भेजें" : "Send today's summary now"}
          </button>
        </div>
        {outbox && outbox.length > 0 && (
          <ul className="mt-4 space-y-2">
            {outbox.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-xl bg-surface px-4 py-3 text-sm shadow-[0_0_0_1px_var(--line)]">
                <p className="text-ink">{n.body}</p>
                <p className={`mt-1 ${n.status === "sent" ? "text-leaf" : n.status === "failed" ? "text-chilli" : "text-muted"}`}>
                  {n.status === "sent" ? (hi ? "भेजा गया" : "Sent") : n.status === "failed" ? (hi ? "नहीं भेजा जा सका" : "Failed") : hi ? "क़तार में" : "Queued"}
                  {n.error ? `: ${n.error}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 pb-8">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{hi ? "हाल की गतिविधि" : "Recent activity"}</h2>
        <p className="mt-1 text-sm text-muted">{hi ? "हर बदलाव का रिकॉर्ड, किसने और कब।" : "A record of every change: who did it and when."}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {(audit ?? []).slice(0, 15).map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
              <span>
                <span className="text-ink">{(ACTION_LABEL[a.action] ?? { en: a.action, hi: a.action })[lang]}</span>
                {typeof a.detail.title === "string" && <span className="text-ink-2">: {a.detail.title}</span>}
                <span className="text-muted"> {hi ? "द्वारा" : "by"} {a.actor}</span>
              </span>
              <span className="text-muted">{new Date(a.createdAt).toLocaleString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
