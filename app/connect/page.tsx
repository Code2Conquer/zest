"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { LangToggle, Wordmark } from "@/components/bits";
import { PlatformConnector } from "@/components/platform-connector";
import { PLATFORMS } from "@/lib/platforms";
import { useApp } from "@/lib/state";

export default function Connect() {
  const { t, state, update } = useApp();
  const router = useRouter();
  const live = state.live.length ? state.live : PLATFORMS;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
        <LangToggle />
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-6 sm:px-8 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em]">{t("connect.title")}</h1>
          <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-ink-2">{t("connect.sub")}</p>

          <ol className="mt-10 space-y-12">
            <Step n={1} title={t("connect.email")} done={!!state.email}>
              <p className="max-w-[56ch] text-ink-2">{t("connect.email.sub")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["gmail", "outlook"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => update({ email: e })}
                    aria-pressed={state.email === e}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 ${
                      state.email === e ? "bg-leaf-soft text-leaf shadow-[0_0_0_1px_var(--leaf)]" : "bg-surface shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--ink-2)]"
                    }`}
                  >
                    {state.email === e && <Check aria-hidden className="size-4" />}
                    {state.email === e ? `${e === "gmail" ? "Gmail" : "Outlook"}: ${t("connect.connected").toLowerCase()}` : t(e === "gmail" ? "connect.google" : "connect.outlook")}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={2} title={t("connect.platforms")} done={live.every((p) => state.connections[p])}>
              <div className="space-y-4">
                {live.map((p) => (
                  <PlatformConnector key={p} platform={p} />
                ))}
              </div>
            </Step>

            <Step n={3} title={t("connect.whatsapp")} done={state.whatsapp}>
              <p className="max-w-[56ch] text-ink-2">{t("connect.whatsapp.sub")}</p>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={state.whatsapp} onChange={(e) => update({ whatsapp: e.target.checked })} className="peer sr-only" />
                <span aria-hidden className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-leaf peer-focus-visible:outline-2 peer-focus-visible:outline-turmeric">
                  <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all ${state.whatsapp ? "left-[22px]" : "left-0.5"}`} />
                </span>
                {t("connect.whatsapp.on")}
              </label>
            </Step>
          </ol>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => router.push("/app")} className="rounded-full bg-ink px-6 py-3 font-medium text-paper">
              {t("connect.finish")}
            </button>
            <span className="text-sm text-muted">{t("connect.later")}</span>
          </div>
        </div>

        <aside className="lg:pt-24">
          <div className="rounded-2xl bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock aria-hidden className="size-4" />
              {t("connect.safe")}
            </h2>
            <ul className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink-2">
              <li>{t("connect.safe.1")}</li>
              <li>{t("connect.safe.2")}</li>
              <li>{t("connect.safe.3")}</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-x-4">
      <span
        aria-hidden
        className={`grid size-8 place-items-center rounded-full text-sm font-medium ${done ? "bg-leaf text-paper" : "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"}`}
      >
        {done ? <Check className="size-4" /> : n}
      </span>
      <div>
        <h2 className="pt-0.5 text-xl font-medium">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}
