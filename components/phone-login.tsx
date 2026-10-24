"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/state";
import { track } from "@/lib/analytics";

// Log in or sign up with a mobile number, like Airbnb: the number first, then the 4-digit code sent on
// WhatsApp. Without a sender (local development) the server returns the code and it is filled in.

export function PhoneLogin({ onDone }: { onDone: (hasRestaurant: boolean) => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  // Until WhatsApp or SMS is set up, the code is the number's last 4 digits; the screen says so.
  const [last4, setLast4] = useState(false);
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
      const r = await api<{ phone: string; devCode?: string; mode?: "last4" }>("/api/auth/otp/start", { method: "POST", json: { phone } });
      setLast4(r.mode === "last4");
      track("login_code_requested", { mode: r.mode ?? (r.devCode ? "dev" : "sent") });
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
      track("login_succeeded", { method: "phone", hasRestaurant: r.hasRestaurant });
      onDone(r.hasRestaurant);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const digits = phone;
  const valid = /^[6-9]\d{9}$/.test(digits);
  const wrongStart = digits.length > 0 && !/^[6-9]/.test(digits);
  // One box holding its label, after Airbnb: a quiet edge that turns white while typing, no second ring.
  const box = "rounded-2xl bg-[#0f1114] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] transition-shadow focus-within:shadow-[inset_0_0_0_2px_#f1f1ec]";
  const input = "w-full bg-transparent text-[#f1f1ec] outline-none placeholder:text-[#5d636a] focus-visible:!outline-none";
  const button = "mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-semibold transition-colors bg-[#e9a31a] text-[#1c1f23] hover:bg-[#f0b13a] disabled:cursor-not-allowed disabled:bg-[#2a2e33] disabled:text-[#7c828a]";

  if (!sent)
    return (
      <form onSubmit={send}>
        <div className={box}>
          <label htmlFor="phone" className="block px-4 pt-3 text-[13px] font-medium text-[#9aa0a6]">
            {hi ? "मोबाइल नंबर" : "Mobile number"}
          </label>
          <div className="flex items-center gap-2 px-4 pb-3.5 pt-1 text-[19px] tabular-nums">
            <span className="text-[#9aa0a6]">+91</span>
            <input
              id="phone"
              value={digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10})/, "").slice(0, 10));
                setError(null);
              }}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              maxLength={11}
              aria-invalid={wrongStart || undefined}
              className={`${input} tracking-[0.02em]`}
              autoFocus
            />
          </div>
        </div>
        <p className={`mt-2.5 text-[13.5px] ${wrongStart ? "text-[#e2735f]" : "text-[#9aa0a6]"}`}>
          {wrongStart
            ? hi ? "मोबाइल नंबर 6, 7, 8 या 9 से शुरू होता है।" : "Mobile numbers start with 6, 7, 8 or 9."
            : hi ? "हम SMS या WhatsApp पर 4 अंकों का कोड (OTP) भेजेंगे।" : "We'll send a 4-digit code (OTP) by SMS or WhatsApp."}
        </p>
        {error && <p className="mt-3 text-[14px] text-[#e2735f]">{error}</p>}
        <button type="submit" disabled={busy || !valid} className={button}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "आगे बढ़ें" : "Continue"}
        </button>
      </form>
    );

  return (
    <form onSubmit={verify}>
      <p className="text-[15px] text-[#b4b9be]">
        {last4 ? (hi ? `${sent} के आख़िरी 4 अंक डालिए।` : `Enter the last 4 digits of ${sent}.`) : hi ? `${sent} पर भेजा गया कोड डालिए।` : `Enter the code sent to ${sent}.`}{" "}
        <button type="button" onClick={() => { setSent(null); setCode(""); setHint(null); }} className="font-medium text-[#f1f1ec] underline underline-offset-4">
          {hi ? "नंबर बदलें" : "Change number"}
        </button>
      </p>
      <div className={`${box} mt-4`}>
        <label htmlFor="code" className="block px-4 pt-3 text-[13px] font-medium text-[#9aa0a6]">
          {hi ? "4 अंकों का कोड" : "4-digit code"}
        </label>
        <input ref={codeBox} id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" placeholder="––––" maxLength={4} className={`${input} px-4 pb-3.5 pt-1 text-[24px] font-semibold tracking-[0.4em] tabular-nums`} />
      </div>
      {hint && <p className="mt-2 text-[13.5px] text-[#9aa0a6]">{hi ? `टेस्ट सर्वर: कोड ${hint} अपने-आप भर दिया।` : `Test server: code ${hint} filled in for you.`}</p>}
      {error && <p className="mt-3 text-[14px] text-[#e2735f]">{error}</p>}
      <button type="submit" disabled={busy || code.length !== 4} className={button}>
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {hi ? "पुष्टि करें" : "Confirm"}
      </button>
      {!last4 && (
        <button type="button" onClick={() => send()} disabled={busy} className="mt-3 w-full text-center text-[14px] text-[#9aa0a6] hover:text-[#f1f1ec]">
        {hi ? "कोड फिर भेजें" : "Send the code again"}
      </button>
      )}
    </form>
  );
}
