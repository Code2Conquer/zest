"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { LangToggle, Wordmark } from "@/components/bits";
import { MailboxCard } from "@/components/mailbox-card";
import { PlatformConnector } from "@/components/platform-connector";
import { PLATFORMS } from "@/lib/platforms";
import { useApp } from "@/lib/state";

export default function Connect() {
  const { t, lang, outlet, updateOutlet } = useApp();
  const router = useRouter();
  const hi = lang === "hi";
  const live = outlet?.live.length ? outlet.live : PLATFORMS;
  const connections = outlet?.connections ?? [];
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save(patch: Record<string, unknown>) {
    setSaveError(null);
    try {
      await updateOutlet(patch);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }

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
          {outlet?.isDemo && (
            <p className="mt-4 rounded-xl bg-turmeric-soft px-4 py-3 text-sm">
              {hi ? "आप सैंपल रेस्टोरेंट बदल रहे हैं। अपना शुरू करने के लिए " : "You're editing the sample restaurant. To start your own, "}
              <Link href="/" className="font-medium underline underline-offset-2">
                {hi ? "शुरुआत से चुनें" : "pick an option on the start page"}
              </Link>
              .
            </p>
          )}

          <label className="mt-8 block max-w-md">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "रेस्टोरेंट का नाम" : "Restaurant name"}</span>
            <input
              value={name ?? outlet?.name ?? ""}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== null && name.trim() && name !== outlet?.name && save({ name: name.trim() })}
              className="w-full rounded-lg bg-surface px-3 py-2.5 text-lg outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
            />
          </label>

          <ol className="mt-10 space-y-12">
            <Step n={1} title={t("connect.email")} done={!!outlet?.email}>
              <p className="mb-4 max-w-[56ch] text-ink-2">{t("connect.email.sub")}</p>
              <MailboxCard returnTo="/connect" />
            </Step>

            <Step n={2} title={t("connect.platforms")} done={live.every((p) => connections.some((c) => c.platform === p))}>
              <div className="space-y-4">
                {live.map((p) => (
                  <PlatformConnector key={p} platform={p} />
                ))}
              </div>
            </Step>

            <Step n={3} title={t("connect.whatsapp")} done={!!outlet?.whatsapp && !!outlet.ownerPhone}>
              <p className="max-w-[56ch] text-ink-2">{t("connect.whatsapp.sub")}</p>
              <label className="mt-4 block max-w-xs">
                <span className="mb-1 block text-sm text-ink-2">{hi ? "WhatsApp नंबर" : "WhatsApp number"}</span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 98xxxxxx21"
                  value={phone ?? outlet?.ownerPhone ?? ""}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => phone !== null && phone !== (outlet?.ownerPhone ?? "") && save({ ownerPhone: phone.trim() || null })}
                  className="w-full rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
                />
              </label>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={!!outlet?.whatsapp} onChange={(e) => save({ whatsapp: e.target.checked })} className="peer sr-only" />
                <span aria-hidden className="relative h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-leaf peer-focus-visible:outline-2 peer-focus-visible:outline-turmeric">
                  <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all ${outlet?.whatsapp ? "left-[22px]" : "left-0.5"}`} />
                </span>
                {t("connect.whatsapp.on")}
              </label>
            </Step>
          </ol>

          {saveError && <p className="mt-6 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{saveError}</p>}

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
