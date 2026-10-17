"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ChannelTag } from "./bits";
import { METHODS, type ConnectMethod, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";

export function PlatformConnector({ platform }: { platform: Platform }) {
  const { t, pick, state, update } = useApp();
  const existing = state.connections[platform];
  // Partner-app sign-in first: most small owners have no API or MCP access.
  const [method, setMethod] = useState<ConnectMethod>(existing?.method ?? "portal");
  const [values, setValues] = useState<Record<string, string>>({});
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const spec = METHODS.find((m) => m.id === method)!;
  const filled = spec.fields.every((f) => values[f.key]?.trim());
  const hi = state.lang === "hi";

  function connect() {
    if (method === "portal" && !awaitingOtp) {
      setAwaitingOtp(true);
      return;
    }
    update({ connections: { ...state.connections, [platform]: { method, at: Date.now() } } });
    setAwaitingOtp(false);
  }

  function disconnect() {
    const next = { ...state.connections };
    delete next[platform];
    update({ connections: next });
  }

  if (existing) {
    const m = METHODS.find((x) => x.id === existing.method)!;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
        <div>
          <ChannelTag channel={platform} className="text-[1.05rem] font-medium text-ink" />
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-leaf">
            <Check aria-hidden className="size-4" />
            {t("connect.connected")}, {pick(m.name).toLowerCase()}
          </p>
        </div>
        <button type="button" onClick={disconnect} className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline">
          {hi ? "डिस्कनेक्ट करें" : "Disconnect"}
        </button>
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
              setAwaitingOtp(false);
            }}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm ${method === m.id ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--line)]" : "text-ink-2 hover:text-ink"}`}
          >
            {pick(m.name)}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4">
        <p className="max-w-[56ch] text-[0.95rem] leading-relaxed text-ink-2">{pick(spec.summary)}</p>
        <p className="mt-1 text-sm text-muted">{pick(spec.liveData)}</p>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            connect();
          }}
        >
          {!awaitingOtp &&
            spec.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm text-ink-2">{pick(f.label)}</span>
                <input
                  type={f.type}
                  inputMode={f.type === "tel" ? "numeric" : undefined}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-paper px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
                />
              </label>
            ))}
          {awaitingOtp && (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm text-ink-2">
                {hi ? `${values.phone} पर भेजा गया OTP डालें` : `Enter the OTP sent to ${values.phone}`}
              </span>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-40 rounded-lg bg-paper px-3 py-2.5 text-lg tracking-[0.3em] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
              />
            </label>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={awaitingOtp ? otp.length < 4 : !filled}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-30"
            >
              {awaitingOtp ? (hi ? "OTP जाँचें" : "Verify OTP") : method === "portal" ? (hi ? "OTP भेजें" : "Send OTP") : t("connect.button")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
