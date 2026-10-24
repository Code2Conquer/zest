"use client";

import { useMe } from "@/lib/auth-client";
import { useApp } from "@/lib/state";

// "Continue with Google", under the mobile login, for owners and managers. Shown only when the server has
// Google sign-in set up.

const ERRORS: Record<string, { en: string; hi: string }> = {
  "not-configured": { en: "Google sign-in isn't set up on this server yet.", hi: "इस सर्वर पर अभी Google साइन-इन चालू नहीं है।" },
  cancelled: { en: "Google sign-in was cancelled. Try again.", hi: "Google साइन-इन रद्द हुआ। फिर से कोशिश करें।" },
  failed: { en: "Google couldn't sign you in. Try again.", hi: "Google से साइन-इन नहीं हो पाया। फिर से कोशिश करें।" },
};

export function GoogleButton({ returnTo, error }: { returnTo: string; error?: string | null }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const { data: me } = useMe();
  if (!me?.methods.google) return null;
  return (
    <div className="mt-5">
      <p className="flex items-center gap-3 text-[13px] text-[#9aa0a6]">
        <span className="h-px flex-1 bg-white/10" />
        {hi ? "या" : "or"}
        <span className="h-px flex-1 bg-white/10" />
      </p>
      <a
        href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-semibold text-[#f1f1ec] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] hover:bg-white/[0.05]"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {hi ? "Google से जारी रखें" : "Continue with Google"}
      </a>
      {error && ERRORS[error] && <p className="mt-3 text-[14px] text-[#e2735f]">{hi ? ERRORS[error].hi : ERRORS[error].en}</p>}
    </div>
  );
}
