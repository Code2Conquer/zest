"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useMe } from "@/lib/auth-client";
import { useApp } from "@/lib/state";

const ERRORS: Record<string, { en: string; hi: string }> = {
  "not-configured": { en: "Google sign-in isn't set up on this server yet.", hi: "इस सर्वर पर अभी Google साइन-इन चालू नहीं है।" },
  cancelled: { en: "Sign-in was cancelled. Try again.", hi: "साइन-इन रद्द हुआ। फिर से कोशिश करें।" },
  failed: { en: "Google couldn't sign you in. Try again.", hi: "Google से साइन-इन नहीं हो पाया। फिर से कोशिश करें।" },
};

/** "Continue with Google" for owners and managers, a test sign-in in development, and the way to staff sign-in. */
export function SignInCard({ returnTo, error }: { returnTo: string; error?: string | null }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const { data: me } = useMe();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  async function devSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDevError(null);
    try {
      const r = await api<{ hasRestaurant: boolean }>("/api/auth/dev", { method: "POST", json: { email, name: email.split("@")[0] } });
      window.location.href = r.hasRestaurant ? returnTo : returnTo.startsWith("/join") ? returnTo : "/join";
    } catch (err) {
      setDevError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-[0_0_0_1px_var(--line)]">
      <h2 className="text-xl font-semibold">{hi ? "साइन इन करें" : "Sign in"}</h2>
      <p className="mt-1 text-ink-2">{hi ? "मालिक और मैनेजर अपने Google खाते से साइन इन करते हैं।" : "Owners and managers sign in with their Google account."}</p>
      {error && ERRORS[error] && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{hi ? ERRORS[error].hi : ERRORS[error].en}</p>}
      {me && !me.methods.google && !me.methods.dev && (
        <p className="mt-4 rounded-lg bg-sunken px-3 py-2 text-sm text-ink-2">
          {hi ? "इस सर्वर पर अभी साइन-इन चालू नहीं है। zest-dusky.vercel.app पर साइन इन करें।" : "Sign-in isn't set up on this server. Sign in on zest-dusky.vercel.app instead."}
        </p>
      )}
      {(!me || me.methods.google) && (
        <a
          href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
          className="mt-5 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:opacity-90"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-5">
            <path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
            <path fill="#fff" opacity=".8" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
            <path fill="#fff" opacity=".6" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" />
            <path fill="#fff" opacity=".9" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" />
          </svg>
          {hi ? "Google से आगे बढ़ें" : "Continue with Google"}
        </a>
      )}
      {me?.methods.dev && (
        <form onSubmit={devSignIn} className="mt-6 border-t border-line pt-5">
          <label htmlFor="dev-email" className="text-sm text-muted">
            {hi ? "टेस्ट साइन-इन (सिर्फ़ डेवलपमेंट में)" : "Test sign-in (development only)"}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="dev-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.in"
              className="min-w-0 flex-1 rounded-lg bg-sunken px-3 py-2 outline-none focus:ring-2 focus:ring-turmeric"
            />
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-60">
              {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {hi ? "साइन इन" : "Sign in"}
            </button>
          </div>
          {devError && <p className="mt-2 text-sm text-chilli">{devError}</p>}
        </form>
      )}
      <p className="mt-6 text-sm text-ink-2">
        {hi ? "किचन या काउंटर स्टाफ़? " : "Kitchen or counter staff? "}
        <Link href="/login/staff" className="font-medium underline underline-offset-2">
          {hi ? "कोड और PIN से साइन इन करें" : "Sign in with the restaurant code and PIN"}
        </Link>
      </p>
    </div>
  );
}
