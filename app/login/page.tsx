"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Wordmark } from "@/components/bits";
import { GoogleButton } from "@/components/google-button";
import { PhoneLogin } from "@/components/phone-login";
import { useApp } from "@/lib/state";

// Log in for owners and managers: a mobile number and a code, or Google. Kitchen staff use the PIN screen.

function LoginInner() {
  const params = useSearchParams();
  const raw = params.get("returnTo");
  const returnTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";
  return (
    <>
      <PhoneLogin onDone={(hasRestaurant) => (window.location.href = hasRestaurant ? returnTo : "/join")} />
      <GoogleButton returnTo={returnTo} error={params.get("error")} />
    </>
  );
}

export default function Login() {
  const { lang } = useApp();
  const hi = lang === "hi";
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
      </header>
      <main className="mx-auto max-w-md px-4 pb-16 pt-6 sm:px-8">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">{hi ? "लॉग इन" : "Log in"}</h1>
        <p className="mb-6 mt-1 text-muted">{hi ? "अपने मोबाइल नंबर या Google से।" : "With your mobile number or Google."}</p>
        <Suspense>
          <LoginInner />
        </Suspense>
        <p className="mt-8 text-sm text-muted">
          {hi ? "किचन स्टाफ़?" : "Kitchen staff?"}{" "}
          <Link href="/login/staff" className="font-medium text-ink underline underline-offset-2">
            {hi ? "PIN से लॉग इन करें" : "Log in with your PIN"}
          </Link>
        </p>
      </main>
    </div>
  );
}
