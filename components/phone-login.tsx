"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/state";

// Log in or sign up with a mobile number, like Airbnb: the number first, then the 6-digit code sent on
// WhatsApp. Without a sender (local development) the server returns the code and it is filled in.

export function PhoneLogin({ onDone }: { onDone: (hasRestaurant: boolean) => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeBox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sent) codeBox.current?.focus();
  }, [sent]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ phone: string; devCode?: string }>("/api/auth/otp/start", { method: "POST", json: { phone } });
      setSent(r.phone);
      if (r.devCode) {
        setHint(r.devCode);
        setCode(r.devCode);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ hasRestaurant: boolean }>("/api/auth/otp/verify", { method: "POST", json: { phone: sent, code } });
      onDone(r.hasRestaurant);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field = "w-full rounded-2xl bg-[#0d0f12] px-4 py-4 text-[17px] text-[#f1f1ec] outline-none shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] placeholder:text-[#6f757c] focus:shadow-[inset_0_0_0_2px_#e9a31a]";
  const button = "mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e9a31a] text-[17px] font-semibold text-[#1c1f23] disabled:opacity-50";

  if (!sent)
    return (
      <form onSubmit={send}>
        <label htmlFor="phone" className="sr-only">
          {hi ? "मोबाइल नंबर" : "Mobile number"}
        </label>
        <div className="flex items-center gap-2">
          <span className="rounded-2xl bg-[#0d0f12] px-4 py-4 text-[17px] text-[#9aa0a6] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">+91</span>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder={hi ? "मोबाइल नंबर" : "Mobile number"} className={field} autoFocus />
        </div>
        <p className="mt-2 text-[13.5px] text-[#9aa0a6]">{hi ? "हम WhatsApp पर एक कोड भेजेंगे।" : "We'll send a code on WhatsApp."}</p>
        {error && <p className="mt-3 text-[14px] text-[#e2735f]">{error}</p>}
        <button type="submit" disabled={busy || phone.replace(/\D/g, "").length < 10} className={button}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "आगे बढ़ें" : "Continue"}
        </button>
      </form>
    );

  return (
    <form onSubmit={verify}>
      <p className="text-[15px] text-[#b4b9be]">
        {hi ? `${sent} पर भेजा गया कोड डालिए।` : `Enter the code sent to ${sent}.`}{" "}
        <button type="button" onClick={() => { setSent(null); setCode(""); setHint(null); }} className="font-medium text-[#f1f1ec] underline underline-offset-4">
          {hi ? "नंबर बदलें" : "Change number"}
        </button>
      </p>
      <label htmlFor="code" className="sr-only">
        {hi ? "6 अंकों का कोड" : "6-digit code"}
      </label>
      <input ref={codeBox} id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className={`${field} mt-4 text-center text-[26px] font-semibold tracking-[0.5em]`} />
      {hint && <p className="mt-2 text-[13.5px] text-[#9aa0a6]">{hi ? `टेस्ट सर्वर: कोड ${hint} अपने-आप भर दिया।` : `Test server: code ${hint} filled in for you.`}</p>}
      {error && <p className="mt-3 text-[14px] text-[#e2735f]">{error}</p>}
      <button type="submit" disabled={busy || code.length !== 6} className={button}>
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {hi ? "पुष्टि करें" : "Confirm"}
      </button>
      <button type="button" onClick={() => send()} disabled={busy} className="mt-3 w-full text-center text-[14px] text-[#9aa0a6] hover:text-[#f1f1ec]">
        {hi ? "कोड फिर भेजें" : "Send the code again"}
      </button>
    </form>
  );
}
