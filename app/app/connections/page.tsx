"use client";

import { Check } from "lucide-react";
import { ChannelTag } from "@/components/bits";
import { PlatformConnector } from "@/components/platform-connector";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";

export default function Connections() {
  const { t, state, update } = useApp();
  const hi = state.lang === "hi";

  function setLive(p: Platform, on: boolean) {
    update({ live: on ? [...state.live, p] : state.live.filter((x) => x !== p) });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-0.03em]">{t("nav.connections")}</h1>
      <p className="mt-1 max-w-[60ch] text-muted">
        {hi
          ? "जिन प्लेटफ़ॉर्म पर आप लाइव हैं, उन्हें चुनें। हर एक को API, MCP या पार्टनर ऐप साइन-इन से जोड़ें।"
          : "Pick the platforms you're live on. Connect each one by API, MCP or partner app sign-in."}
      </p>

      <section className="mt-8">
        <h2 className="font-medium">{hi ? "प्लेटफ़ॉर्म" : "Platforms"}</h2>
        <div className="mt-3 space-y-4">
          {PLATFORMS.map((p) => {
            const on = state.live.includes(p);
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
        <h2 className="font-medium">{t("connect.email")}</h2>
        <p className="mt-1 text-[0.95rem] text-ink-2">
          {state.email ? (
            <span className="inline-flex items-center gap-1.5 text-leaf">
              <Check aria-hidden className="size-4" />
              {state.email === "gmail" ? "Gmail" : "Outlook"}, {t("connect.connected").toLowerCase()}
            </span>
          ) : (
            <button type="button" onClick={() => update({ email: "gmail" })} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">
              {t("connect.google")}
            </button>
          )}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">{hi ? "POS" : "Point of sale"}</h2>
        <p className="mt-1 max-w-[60ch] text-[0.95rem] text-ink-2">
          {hi ? "Petpooja, UrbanPiper और दूसरे POS जल्द आ रहे हैं।" : "Petpooja, UrbanPiper and other POS systems are coming soon."}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-medium">{t("connect.whatsapp")}</h2>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[0.95rem]">
          <input type="checkbox" checked={state.whatsapp} onChange={(e) => update({ whatsapp: e.target.checked })} className="size-4 accent-[var(--ink)]" />
          {t("connect.whatsapp.on")}
        </label>
      </section>
    </div>
  );
}
