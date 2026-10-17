"use client";

import { useState } from "react";
import { AlertCircle, Check, Clock, Loader2 } from "lucide-react";
import { api, refreshAll } from "@/lib/api";
import { METHODS, type ConnectMethod, type Platform } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";
import type { ConnectionDTO } from "@/lib/types";
import { ChannelTag } from "./bits";

/** Connect one platform by partner-app sign-in, partner API or MCP server. */
export function PlatformConnector({ platform }: { platform: Platform }) {
  const { t, pick, lang } = useApp();
  const { connections } = useOutlet();
  const existing = connections.find((c) => c.platform === platform);
  const hi = lang === "hi";
  // Partner-app sign-in first: most small owners have no API or MCP access.
  const [method, setMethod] = useState<ConnectMethod>(existing && existing.method !== "sandbox" ? existing.method : "portal");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const spec = METHODS.find((m) => m.id === method)!;
  const filled = spec.fields.every((f) => f.key === "token" || values[f.key]?.trim());

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fields = Object.fromEntries(spec.fields.map((f) => [f.key, values[f.key]?.trim() ?? ""]).filter(([, v]) => v));
      await api<ConnectionDTO>("/api/connections", { method: "POST", json: { platform, method, fields } });
      setValues({});
      setChanging(false);
      refreshAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await api(`/api/connections?platform=${platform}`, { method: "DELETE" });
      refreshAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (existing && !changing) {
    const m = METHODS.find((x) => x.id === existing.method);
    const label = existing.method === "sandbox" ? (hi ? "सैंपल डेटा" : "sample data") : m ? pick(m.name) : existing.method;
    const tools = Array.isArray(existing.info.tools) ? (existing.info.tools as string[]) : null;
    return (
      <div className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <ChannelTag channel={platform} className="text-[1.05rem] font-medium text-ink" />
            <p className={`mt-1 flex items-center gap-1.5 text-sm ${existing.status === "connected" ? "text-leaf" : existing.status === "pending" ? "text-turmeric" : "text-chilli"}`}>
              {existing.status === "connected" ? <Check aria-hidden className="size-4" /> : existing.status === "pending" ? <Clock aria-hidden className="size-4" /> : <AlertCircle aria-hidden className="size-4" />}
              {existing.status === "connected" ? t("connect.connected") : existing.status === "pending" ? (hi ? "सेव किया गया" : "Saved") : hi ? "समस्या" : "Problem"}, {label}
            </p>
            {existing.statusDetail && <p className="mt-1 max-w-[52ch] text-sm text-muted">{existing.statusDetail}</p>}
            {tools && <p className="mt-1 text-sm text-muted">{hi ? `${tools.length} टूल मिले` : `${tools.length} tools found`}: {tools.slice(0, 6).join(", ")}</p>}
          </div>
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => setChanging(true)} className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              {hi ? "बदलें" : "Change"}
            </button>
            <button type="button" onClick={disconnect} disabled={busy} className="text-muted underline-offset-2 hover:text-ink hover:underline">
              {hi ? "डिस्कनेक्ट करें" : "Disconnect"}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-chilli">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:p-5">
      <ChannelTag channel={platform} className="text-[1.05rem] font-medium text-ink" />
      <p className="mt-3 text-sm text-muted">{t("connect.how")}</p>
      <div role="tablist" aria-label={t("connect.how")} className="mt-2 flex flex-wrap gap-1 rounded-lg bg-sunken p-1">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={method === m.id}
            onClick={() => {
              setMethod(m.id);
              setError(null);
            }}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm ${method === m.id ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--line)]" : "text-ink-2 hover:text-ink"}`}
          >
            {pick(m.name)}
          </button>
        ))}
      </div>

      <form role="tabpanel" className="mt-4" onSubmit={connect}>
        <p className="max-w-[56ch] text-[0.95rem] leading-relaxed text-ink-2">{pick(spec.summary)}</p>
        <p className="mt-1 text-sm text-muted">{pick(spec.liveData)}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {spec.fields.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-sm text-ink-2">
                {pick(f.label)}
                {f.key === "token" && <span className="text-muted"> {hi ? "(अगर ज़रूरी हो)" : "(if needed)"}</span>}
              </span>
              <input
                type={f.type}
                inputMode={f.type === "tel" ? "numeric" : undefined}
                autoComplete="off"
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-lg bg-paper px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={!filled || busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-30">
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {method === "portal" ? (hi ? "साइन-इन सेव करें" : "Save sign-in") : method === "mcp" ? (hi ? "जाँचें और जोड़ें" : "Check and connect") : t("connect.button")}
          </button>
          {changing && (
            <button type="button" onClick={() => setChanging(false)} className="text-sm text-muted hover:text-ink">
              {hi ? "रद्द करें" : "Cancel"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
