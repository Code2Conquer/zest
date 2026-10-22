"use client";

import { useId, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The Soundbox waitlist form. Each error sits under its field and says exactly what to fix; on
// success the form is replaced by the confirmation. `page` and `section` record where it was filled.

type Field = "name" | "business" | "phone" | "city" | "type";
const TYPES: { id: string; label: Bi }[] = [
  { id: "home_kitchen", label: { en: "Home kitchen", hi: "घर की रसोई" } },
  { id: "tiffin", label: { en: "Tiffin service", hi: "टिफ़िन सर्विस" } },
  { id: "cloud_kitchen", label: { en: "Cloud kitchen", hi: "क्लाउड किचन" } },
  { id: "shop", label: { en: "Shop or stall", hi: "दुकान या स्टॉल" } },
  { id: "restaurant", label: { en: "Restaurant on Zomato or Swiggy", hi: "Zomato या Swiggy पर रेस्टोरेंट" } },
];
const ERR: Record<Field, Bi> = {
  name: { en: "Enter your name", hi: "अपना नाम लिखिए" },
  business: { en: "Enter your business name", hi: "अपने काम का नाम लिखिए" },
  phone: { en: "Enter a 10-digit mobile number", hi: "10 अंकों का मोबाइल नंबर लिखिए" },
  city: { en: "Enter your city", hi: "अपना शहर लिखिए" },
  type: { en: "Choose what kind of business you run", hi: "चुनिए आपका काम किस तरह का है" },
};

const validPhone = (v: string) => {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d);
};

export function Waitlist({ page, section, defaultType = "", tone = "light" }: { page: "/" | "/restaurants"; section: string; defaultType?: string; tone?: "light" | "dark" }) {
  const { pick } = useApp();
  const uid = useId();
  const [v, setV] = useState({ name: "", business: "", phone: "", city: "", type: defaultType });
  const [errors, setErrors] = useState<Partial<Record<Field, true>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [failure, setFailure] = useState("");

  function check(): Partial<Record<Field, true>> {
    const e: Partial<Record<Field, true>> = {};
    if (!v.name.trim()) e.name = true;
    if (!v.business.trim()) e.business = true;
    if (!validPhone(v.phone)) e.phone = true;
    if (!v.city.trim()) e.city = true;
    if (!v.type) e.type = true;
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...v, page, section }) });
      if (res.ok) return setState("done");
      const body = (await res.json().catch(() => ({}))) as { error?: string; issues?: { path: (string | number)[] }[] };
      const fromServer: Partial<Record<Field, true>> = {};
      for (const i of body.issues ?? []) fromServer[i.path[0] as Field] = true;
      if (Object.keys(fromServer).length) {
        setErrors(fromServer);
        setState("idle");
        return;
      }
      setFailure(res.status === 429 ? pick({ en: "Too many sign-ups from this connection. Try again in an hour.", hi: "इस कनेक्शन से बहुत ज़्यादा साइन-अप हुए। एक घंटे बाद कोशिश कीजिए।" }) : pick({ en: "We couldn't save that. Check your connection and try again.", hi: "सेव नहीं हो पाया। इंटरनेट देखकर फिर कोशिश कीजिए।" }));
      setState("failed");
    } catch {
      setFailure(pick({ en: "We couldn't save that. Check your connection and try again.", hi: "सेव नहीं हो पाया। इंटरनेट देखकर फिर कोशिश कीजिए।" }));
      setState("failed");
    }
  }

  const dark = tone === "dark";
  const box = dark ? "bg-[#2a2e33] text-[#f1f1ec] placeholder:text-[#8d939a]" : "bg-[var(--lp-ground)] text-[var(--lp-ink)] placeholder:text-[var(--lp-faint)]";
  const surface = dark ? "bg-[#22262b] text-[#f1f1ec]" : "bg-[var(--lp-paper)] text-[var(--lp-ink)]";

  if (state === "done") {
    return (
      <div role="status" className={`rounded-[24px] p-7 ${surface}`}>
        <span className="grid size-11 place-items-center rounded-full bg-[var(--z-leaf)] text-white">
          <Check aria-hidden size={22} strokeWidth={3} />
        </span>
        <p className="mt-4 text-[20px] font-semibold leading-snug">
          {pick({ en: "You're on the list. We'll WhatsApp you when the Soundbox is ready for your kitchen.", hi: "आप लिस्ट में हैं। Soundbox आपकी रसोई के लिए तैयार होते ही हम आपको WhatsApp करेंगे।" })}
        </p>
      </div>
    );
  }

  const field = (f: Field, label: Bi, input: React.ReactNode) => (
    <div>
      <label htmlFor={`${uid}-${f}`} className="block text-[15px] font-medium">
        {pick(label)}
      </label>
      <div className="mt-1.5">{input}</div>
      {errors[f] && (
        <p id={`${uid}-${f}-err`} className="mt-1.5 text-[14px] font-medium text-[var(--lp-bad)]">
          {pick(ERR[f])}
        </p>
      )}
    </div>
  );
  const inputCls = (f: Field) => `block min-h-12 w-full rounded-xl px-4 text-[17px] outline-none  ${box} ${errors[f] ? "outline outline-2 -outline-offset-2 outline-[var(--lp-bad)]" : ""}`;
  const aria = (f: Field) => ({ "aria-invalid": !!errors[f] || undefined, "aria-describedby": errors[f] ? `${uid}-${f}-err` : undefined });

  return (
    <form id="waitlist" onSubmit={submit} noValidate className={`scroll-mt-6 rounded-[24px] p-6 sm:p-7 ${surface}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", { en: "Your name", hi: "आपका नाम" }, <input id={`${uid}-name`} autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={inputCls("name")} {...aria("name")} />)}
        {field("business", { en: "Business name", hi: "काम का नाम" }, <input id={`${uid}-business`} autoComplete="organization" value={v.business} onChange={(e) => setV({ ...v, business: e.target.value })} className={inputCls("business")} {...aria("business")} />)}
        {field("phone", { en: "Phone (WhatsApp)", hi: "फ़ोन (WhatsApp)" }, <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxx xxxxx" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} className={inputCls("phone")} {...aria("phone")} />)}
        {field("city", { en: "City", hi: "शहर" }, <input id={`${uid}-city`} autoComplete="address-level2" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} className={inputCls("city")} {...aria("city")} />)}
        <div className="sm:col-span-2">
          {field(
            "type",
            { en: "Type of business", hi: "काम किस तरह का है" },
            <select id={`${uid}-type`} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} className={inputCls("type")} {...aria("type")}>
              <option value="">{pick({ en: "Choose one", hi: "एक चुनिए" })}</option>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {pick(t.label)}
                </option>
              ))}
            </select>,
          )}
        </div>
      </div>
      {state === "failed" && (
        <p role="alert" className="mt-4 text-[15px] font-medium text-[var(--lp-bad)]">
          {failure}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="lp-btn haldi mt-6 w-full sm:w-auto">
        {state === "sending" && <Loader2 aria-hidden size={18} className="animate-spin" />}
        {pick({ en: "Join the waitlist", hi: "वेटलिस्ट में जुड़ें" })}
      </button>
    </form>
  );
}
