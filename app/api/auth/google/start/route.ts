import { NextResponse } from "next/server";
import { googleSigninConfigured, signinAuthorizeUrl } from "@/lib/server/google-signin";
import { handler } from "@/lib/server/http";
import { safeReturn, signinCallbackUrl, startState } from "@/lib/server/oauth-state";

/** Sends an owner or manager to Google to sign in. */
export const GET = handler(async (req) => {
  const returnTo = safeReturn(new URL(req.url).searchParams.get("returnTo") ?? "/app");
  if (!googleSigninConfigured()) return NextResponse.redirect(new URL(`/login?error=not-configured&returnTo=${encodeURIComponent(returnTo)}`, req.url));
  return NextResponse.redirect(signinAuthorizeUrl(signinCallbackUrl(req), await startState("", returnTo, "signin")));
});
