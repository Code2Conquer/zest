"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Wordmark } from "@/components/bits";
import { SignInCard } from "@/components/sign-in";

function LoginInner() {
  const params = useSearchParams();
  const raw = params.get("returnTo");
  const returnTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";
  return <SignInCard returnTo={returnTo} error={params.get("error")} />;
}

export default function Login() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16 pt-6 sm:px-8">
        <Suspense>
          <LoginInner />
        </Suspense>
      </main>
    </div>
  );
}
