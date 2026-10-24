import { NextResponse } from "next/server";
import { signIn } from "@/lib/server/auth";
import { exchangeSigninCode } from "@/lib/server/google-signin";
import { handler } from "@/lib/server/http";
import { finishState, safeReturn, signinCallbackUrl } from "@/lib/server/oauth-state";

/** Google sends the person back here. Signs them in; people without a restaurant go on to create one. */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const state = await finishState(url.searchParams.get("state"), "signin");
  if (!state) return NextResponse.json({ error: "This sign-in link has expired. Start again." }, { status: 400 });
  if (url.searchParams.get("error") || !url.searchParams.get("code")) return NextResponse.redirect(new URL("/login?error=cancelled", req.url));
  let session;
  try {
    session = await signIn(await exchangeSigninCode(url.searchParams.get("code")!, signinCallbackUrl(req)));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/login?error=failed", req.url));
  }
  const returnTo = safeReturn(state.returnTo);
  return NextResponse.redirect(new URL(session ? returnTo : `/join${returnTo.startsWith("/join") ? returnTo.slice(5) : ""}`, req.url));
});
