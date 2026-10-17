"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Check, ChevronLeft, Loader2 } from "lucide-react";
import { ChannelTag, LangToggle, Wordmark } from "@/components/bits";
import { Ticket } from "@/components/ticket";
import { AGENT_NAME } from "@/lib/agents";
import { MENU, rupees } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";

type Doc = { id: string; name: Bi; why: Bi; result: Bi; optional?: boolean };

const DOCS: Doc[] = [
  {
    id: "fssai",
    name: { en: "FSSAI licence", hi: "FSSAI लाइसेंस" },
    why: { en: "Every food business needs one to be listed.", hi: "लिस्टिंग के लिए हर फ़ूड बिज़नेस को चाहिए।" },
    result: { en: "Licence 2241xxxx0187, valid till 3 Dec 2027", hi: "लाइसेंस 2241xxxx0187, 3 दिसंबर 2027 तक मान्य" },
  },
  {
    id: "pan",
    name: { en: "PAN card", hi: "PAN कार्ड" },
    why: { en: "Yours or the business's, for payouts and TDS.", hi: "आपका या बिज़नेस का, पेआउट और TDS के लिए।" },
    result: { en: "PAN ABCxx1234x, name matches the FSSAI licence", hi: "PAN ABCxx1234x, नाम FSSAI लाइसेंस से मेल खाता है" },
  },
  {
    id: "bank",
    name: { en: "Cancelled cheque or bank statement", hi: "कैंसल चेक या बैंक स्टेटमेंट" },
    why: { en: "This is where your payouts will land.", hi: "आपके पेआउट इसी खाते में आएँगे।" },
    result: { en: "HDFC Bank, account ending 4471, IFSC HDFC0001234", hi: "HDFC बैंक, खाता 4471 पर ख़त्म, IFSC HDFC0001234" },
  },
  {
    id: "gst",
    name: { en: "GST certificate", hi: "GST सर्टिफ़िकेट" },
    why: { en: "Only if you're registered for GST.", hi: "सिर्फ़ अगर आप GST में रजिस्टर्ड हैं।" },
    result: { en: "GSTIN 29ABCxx1234x1Zx, active", hi: "GSTIN 29ABCxx1234x1Zx, सक्रिय" },
    optional: true,
  },
];

type DocState = "empty" | "checking" | "ok";

function StartInner() {
  const { state, pick } = useApp();
  const params = useSearchParams();
  const track = params.get("track") === "new" ? "new" : "notlive";
  const hi = state.lang === "hi";
  const [targets, setTargets] = useState<Platform[]>(["zomato", "swiggy"]);
  const [docs, setDocs] = useState<Record<string, DocState>>({});
  const [menu, setMenu] = useState<DocState>("empty");

  // Stand-in for the vision pipeline: the photo is read, checked and summarised.
  function upload(id: string) {
    setDocs((d) => ({ ...d, [id]: "checking" }));
    setTimeout(() => setDocs((d) => ({ ...d, [id]: "ok" })), 1100);
  }
  function uploadMenu() {
    setMenu("checking");
    setTimeout(() => setMenu("ok"), 1500);
  }

  const required = DOCS.filter((d) => !d.optional);
  const ready = required.every((d) => docs[d.id] === "ok") && menu === "ok" && targets.length > 0;
  const doneCount = DOCS.filter((d) => docs[d.id] === "ok").length + (menu === "ok" ? 1 : 0);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
        <LangToggle />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-8">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em]">
          {track === "new" ? (hi ? "चलिए आपका रेस्टोरेंट शुरू करते हैं" : "Let's get your restaurant started") : hi ? "चलिए आपको ऑनलाइन लाते हैं" : "Let's get you online"}
        </h1>
        <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-ink-2">
          {hi
            ? "दस्तावेज़ों और मेन्यू की फ़ोटो लें। हम उन्हें पढ़कर जाँचेंगे और आपकी लिस्टिंग का फ़ॉर्म भर देंगे।"
            : "Take photos of your documents and menu. We'll read and check them, then fill in your listing forms for you."}
        </p>

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
            {DOCS.map((d) => (
              <DocRow key={d.id} title={pick(d.name)} why={pick(d.why)} result={pick(d.result)} optional={d.optional} status={docs[d.id] ?? "empty"} onUpload={() => upload(d.id)} />
            ))}
            <DocRow
              title={hi ? "आपका मेन्यू" : "Your menu"}
              why={hi ? "पेपर मेन्यू या बोर्ड की फ़ोटो काफ़ी है।" : "A photo of your paper menu or board is enough."}
              result={hi ? `${MENU.length} डिश मिलीं, 4 कैटेगरी में` : `Found ${MENU.length} dishes in 4 categories`}
              status={menu}
              onUpload={uploadMenu}
            />
          </ul>

          {menu === "ok" && (
            <div className="mt-4 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
              <p className="text-sm text-muted">{hi ? "फ़ोटो से पढ़ा गया, जाँच लें" : "Read from your photo. Check it over."}</p>
              <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
                {MENU.map((m) => (
                  <li key={m.id} className="flex justify-between border-b border-line py-1.5 text-[0.95rem]">
                    <span>{m.name}</span>
                    <span className="text-ink-2">{rupees(m.price.zomato)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {ready && (
          <section className="mt-10 max-w-xl">
            <Ticket
              print
              agent={AGENT_NAME.onboarding}
              title={hi ? `${targets.map((p) => (p === "zomato" ? "Zomato" : "Swiggy")).join(" और ")} पर लिस्टिंग के लिए आवेदन` : `Apply for listing on ${targets.map((p) => (p === "zomato" ? "Zomato" : "Swiggy")).join(" and ")}`}
              onApproveLabel={{ en: "Submit applications", hi: "आवेदन भेजें" }}
              doneLabel={{ en: "Submitted. I'll follow up and message you on WhatsApp.", hi: "भेज दिया। मैं फ़ॉलो-अप करूँगा और WhatsApp पर बताऊँगा।" }}
            >
              {hi
                ? "सारे दस्तावेज़ जाँचे गए और मेन्यू तैयार है। मंज़ूरी दें तो मैं हर प्लेटफ़ॉर्म का फ़ॉर्म भरकर भेज दूँगा।"
                : "All documents are checked and your menu is ready. Approve, and I'll fill in and send each platform's form."}
            </Ticket>
          </section>
        )}
      </main>
    </div>
  );
}

function DocRow({ title, why, result, optional, status, onUpload }: { title: string; why: string; result: string; optional?: boolean; status: DocState; onUpload: () => void }) {
  const { state } = useApp();
  const hi = state.lang === "hi";
  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <span
        aria-hidden
        className={`grid size-8 shrink-0 place-items-center rounded-full ${status === "ok" ? "bg-leaf text-paper" : "bg-surface text-muted shadow-[0_0_0_1px_var(--line)]"}`}
      >
        {status === "ok" ? <Check className="size-4" /> : status === "checking" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {title}
          {optional && <span className="ml-2 text-sm font-normal text-muted">{hi ? "अगर लागू हो" : "if applicable"}</span>}
        </p>
        <p className={`text-[0.95rem] ${status === "ok" ? "text-leaf" : "text-muted"}`}>
          {status === "ok" ? result : status === "checking" ? (hi ? "पढ़ रहे हैं और जाँच रहे हैं…" : "Reading and checking…") : why}
        </p>
      </div>
      {status !== "ok" && (
        <label className={`cursor-pointer rounded-full px-4 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken ${status === "checking" ? "pointer-events-none opacity-40" : ""}`}>
          {hi ? "फ़ोटो जोड़ें" : "Add photo"}
          <input type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={(e) => e.target.files?.length && onUpload()} />
        </label>
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
