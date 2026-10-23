"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Camera, Check, ChevronLeft, Loader2 } from "lucide-react";
import { ApprovalTicket } from "@/components/approval-ticket";
import { ChannelTag, Wordmark } from "@/components/bits";
import { api, ApiError, refreshAll } from "@/lib/api";
import type { Bi } from "@/lib/i18n";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import type { ApprovalDTO, MenuItemDTO } from "@/lib/types";

type DocKind = "fssai" | "pan" | "bank" | "gst";
type Doc = { id: DocKind; name: Bi; why: Bi; optional?: boolean };

const DOCS: Doc[] = [
  { id: "fssai", name: { en: "FSSAI licence", hi: "FSSAI लाइसेंस" }, why: { en: "Every food business needs one to be listed.", hi: "लिस्टिंग के लिए हर फ़ूड बिज़नेस को चाहिए।" } },
  { id: "pan", name: { en: "PAN card", hi: "PAN कार्ड" }, why: { en: "Yours or the business's, for payouts and TDS.", hi: "आपका या बिज़नेस का, पेआउट और TDS के लिए।" } },
  { id: "bank", name: { en: "Cancelled cheque or bank statement", hi: "कैंसल चेक या बैंक स्टेटमेंट" }, why: { en: "This is where your payouts will land.", hi: "आपके पेआउट इसी खाते में आएँगे।" } },
  { id: "gst", name: { en: "GST certificate", hi: "GST सर्टिफ़िकेट" }, why: { en: "Only if you're registered for GST.", hi: "सिर्फ़ अगर आप GST में रजिस्टर्ड हैं।" }, optional: true },
];

type DocResult = { is_expected_document: boolean; problem: string; holder_name: string; number: string; valid_until: string; extra: string };
type DocState = { status: "empty" | "checking" | "ok" | "problem" | "manual"; result?: DocResult; error?: string };
type MenuDraft = { name: string; category: string; price: number; veg: boolean; description: string };

function StartInner() {
  const { lang, pick, outlet, updateOutlet } = useApp();
  const params = useSearchParams();
  const track = params.get("track") === "new" ? "new" : "notlive";
  const hi = lang === "hi";
  const [targets, setTargets] = useState<Platform[]>(["zomato", "swiggy"]);
  const [docs, setDocs] = useState<Partial<Record<DocKind, DocState>>>({});
  const [menuState, setMenuState] = useState<"empty" | "reading" | "review" | "added" | "error">("empty");
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuDraft, setMenuDraft] = useState<MenuDraft[]>([]);
  const [application, setApplication] = useState<ApprovalDTO | null>(null);
  const [name, setName] = useState<string | null>(null);

  async function upload(kind: DocKind, file: File) {
    setDocs((d) => ({ ...d, [kind]: { status: "checking" } }));
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    try {
      const result = await api<DocResult>("/api/onboarding/document", { method: "POST", body: form });
      setDocs((d) => ({ ...d, [kind]: { status: result.is_expected_document ? "ok" : "problem", result } }));
    } catch (e) {
      const unavailable = e instanceof ApiError && e.status === 503;
      setDocs((d) => ({ ...d, [kind]: { status: "problem", error: unavailable ? (hi ? "इस सर्वर पर दस्तावेज़ पढ़ना चालू नहीं है।" : "Document reading isn't switched on for this server.") : (e as Error).message } }));
    }
  }

  async function uploadMenu(file: File) {
    setMenuState("reading");
    setMenuError(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const { items } = await api<{ items: MenuDraft[] }>("/api/onboarding/menu", { method: "POST", body: form });
      setMenuDraft(items);
      setMenuState("review");
    } catch (e) {
      setMenuError(e instanceof ApiError && e.status === 503 ? (hi ? "इस सर्वर पर मेन्यू पढ़ना चालू नहीं है। आप बाद में मेन्यू में डिश जोड़ सकते हैं।" : "Menu reading isn't switched on for this server. You can add dishes in Menu later.") : (e as Error).message);
      setMenuState("error");
    }
  }

  async function addMenu() {
    try {
      await api<MenuItemDTO[]>("/api/menu/import", { method: "POST", json: { items: menuDraft.filter((m) => m.name.trim()) } });
      setMenuState("added");
      refreshAll();
    } catch (e) {
      setMenuError((e as Error).message);
    }
  }

  async function submit() {
    setApplication(await api<ApprovalDTO>("/api/onboarding/submit", { method: "POST", json: { platforms: targets } }));
  }

  const required = DOCS.filter((d) => !d.optional);
  const docDone = (k: DocKind) => docs[k]?.status === "ok" || docs[k]?.status === "manual";
  const ready = required.every((d) => docDone(d.id)) && (menuState === "added" || menuState === "error") && targets.length > 0;
  const doneCount = DOCS.filter((d) => docDone(d.id)).length + (menuState === "added" ? 1 : 0);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-8">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em]">
          {track === "new" ? (hi ? "चलिए आपका रेस्टोरेंट शुरू करते हैं" : "Let's get your restaurant started") : hi ? "चलिए आपको ऑनलाइन लाते हैं" : "Let's get you online"}
        </h1>
        <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-ink-2">
          {hi ? "दस्तावेज़ों और मेन्यू की फ़ोटो लें। Zest उन्हें पढ़कर जाँचेगा और आपकी लिस्टिंग तैयार करेगा।" : "Take photos of your documents and menu. Zest reads and checks them, then gets your listing ready."}
        </p>

        <label className="mt-8 block max-w-md">
          <span className="mb-1 block text-sm text-ink-2">{hi ? "रेस्टोरेंट का नाम" : "Restaurant name"}</span>
          <input
            value={name ?? (outlet && !outlet.isDemo ? outlet.name : "")}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name?.trim() && void updateOutlet({ name: name.trim() })}
            className="w-full rounded-lg bg-surface px-3 py-2.5 text-lg outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
          />
        </label>

        <section className="mt-10">
          <h2 className="text-xl font-medium">{hi ? "कहाँ लिस्ट होना है?" : "Where do you want to sell?"}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = targets.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTargets((t) => (on ? t.filter((x) => x !== p) : [...t, p]))}
                  className={`inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 ${on ? "shadow-[0_0_0_2px_var(--ink)]" : "shadow-[0_0_0_1px_var(--line)]"}`}
                >
                  <ChannelTag channel={p} className="text-ink" />
                  {on && <Check aria-hidden className="size-4" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-medium">{hi ? "दस्तावेज़" : "Documents"}</h2>
            <span className="text-sm text-muted">
              {doneCount} / {DOCS.length + 1} {hi ? "पूरे" : "done"}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {DOCS.map((d) => {
              const st = docs[d.id] ?? { status: "empty" as const };
              const r = st.result;
              const summary = r && r.is_expected_document ? [r.holder_name, r.number, r.valid_until && (hi ? `${r.valid_until} तक मान्य` : `valid till ${r.valid_until}`), r.extra].filter(Boolean).join(", ") : "";
              return (
                <DocRow
                  key={d.id}
                  title={pick(d.name)}
                  optional={d.optional}
                  status={st.status}
                  message={st.status === "ok" ? summary : st.status === "manual" ? (hi ? "आपने ख़ुद जाँचा" : "Checked by you") : st.status === "problem" ? (st.error ?? r?.problem ?? (hi ? "यह सही दस्तावेज़ नहीं लगा।" : "That didn't look like the right document.")) : st.status === "checking" ? (hi ? "पढ़ रहे हैं और जाँच रहे हैं…" : "Reading and checking…") : pick(d.why)}
                  onFile={(f) => upload(d.id, f)}
                  onManual={st.status === "problem" ? () => setDocs((x) => ({ ...x, [d.id]: { status: "manual" } })) : undefined}
                />
              );
            })}
            <DocRow
              title={hi ? "आपका मेन्यू" : "Your menu"}
              status={menuState === "added" ? "ok" : menuState === "reading" ? "checking" : menuState === "error" ? "problem" : "empty"}
              message={
                menuState === "added"
                  ? hi ? `${menuDraft.length} डिश मेन्यू में जुड़ गईं` : `${menuDraft.length} dishes added to your menu`
                  : menuState === "reading"
                    ? hi ? "मेन्यू पढ़ रहे हैं… इसमें आधा मिनट लग सकता है।" : "Reading your menu… this can take half a minute."
                    : menuState === "review"
                      ? hi ? `${menuDraft.length} डिश मिलीं। नीचे जाँच लें।` : `Found ${menuDraft.length} dishes. Check them below.`
                      : (menuError ?? (hi ? "पेपर मेन्यू या बोर्ड की फ़ोटो काफ़ी है।" : "A photo of your paper menu or board is enough."))
              }
              onFile={uploadMenu}
            />
          </ul>

          {menuState === "review" && (
            <div className="mt-4 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
              <p className="text-sm text-muted">{hi ? "फ़ोटो से पढ़ा गया। नाम या क़ीमत ठीक कर लें।" : "Read from your photo. Fix any name or price."}</p>
              <ul className="mt-2 divide-y divide-line">
                {menuDraft.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 py-2 text-[0.95rem]">
                    <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} />
                    <input value={m.name} onChange={(e) => setMenuDraft((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="min-w-0 flex-1 bg-transparent outline-none focus:underline" aria-label="Dish name" />
                    <span className="hidden text-sm text-muted sm:inline">{m.category}</span>
                    <span className="text-muted">₹</span>
                    <input type="number" value={m.price} onChange={(e) => setMenuDraft((all) => all.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} className="w-16 bg-transparent text-right outline-none focus:underline" aria-label="Price" />
                  </li>
                ))}
              </ul>
              {menuError && <p className="mt-2 text-sm text-chilli">{menuError}</p>}
              <button type="button" onClick={addMenu} className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
                {hi ? `${menuDraft.length} डिश मेन्यू में जोड़ें` : `Add ${menuDraft.length} dishes to my menu`}
              </button>
            </div>
          )}
        </section>

        <section className="mt-10 max-w-xl">
          {application ? (
            <ApprovalTicket approval={application} print />
          ) : (
            <button type="button" disabled={!ready} onClick={submit} className="rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-30">
              {hi ? "लिस्टिंग आवेदन तैयार करें" : "Prepare my listing application"}
            </button>
          )}
          {!ready && !application && <p className="mt-2 text-sm text-muted">{hi ? "ज़रूरी दस्तावेज़ और मेन्यू पूरे होने पर।" : "Once the required documents and your menu are done."}</p>}
        </section>
      </main>
    </div>
  );
}

function DocRow({ title, message, optional, status, onFile, onManual }: { title: string; message: string; optional?: boolean; status: DocState["status"]; onFile: (f: File) => void; onManual?: () => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const done = status === "ok" || status === "manual";
  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full ${done ? "bg-leaf text-paper" : status === "problem" ? "bg-chilli-soft text-chilli" : "bg-surface text-muted shadow-[0_0_0_1px_var(--line)]"}`}>
        {done ? <Check className="size-4" /> : status === "checking" ? <Loader2 className="size-4 animate-spin" /> : status === "problem" ? <AlertCircle className="size-4" /> : <Camera className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {title}
          {optional && <span className="ml-2 text-sm font-normal text-muted">{hi ? "अगर लागू हो" : "if applicable"}</span>}
        </p>
        <p className={`text-[0.95rem] ${done ? "text-leaf" : status === "problem" ? "text-chilli" : "text-muted"}`}>{message}</p>
      </div>
      {!done && (
        <div className="flex items-center gap-3">
          {onManual && (
            <button type="button" onClick={onManual} className="text-sm text-ink-2 underline-offset-2 hover:underline">
              {hi ? "मैंने ख़ुद जाँच लिया" : "I've checked it myself"}
            </button>
          )}
          <label className={`cursor-pointer rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken ${status === "checking" ? "pointer-events-none opacity-40" : ""}`}>
            {status === "problem" ? (hi ? "दूसरी फ़ोटो" : "Try another photo") : hi ? "फ़ोटो जोड़ें" : "Add photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
    </li>
  );
}

export default function Start() {
  return (
    <Suspense>
      <StartInner />
    </Suspense>
  );
}
