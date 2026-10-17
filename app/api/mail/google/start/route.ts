import { NextResponse } from "next/server";
import { authorizeUrl, gmailConfigured } from "@/lib/server/gmail";
import { handler } from "@/lib/server/http";
import { callbackUrl, safeReturn, startState } from "@/lib/server/oauth-state";

/** Sends the owner to Google to allow read-only access to their Zomato and Swiggy mail. */
export const GET = handler(async (req, outlet) => {
  const returnTo = safeReturn(new URL(req.url).searchParams.get("returnTo"));
  const back = (error: string) => NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}gmail=${error}`, req.url));
  if (!gmailConfigured()) return back("not-configured");
  // Never attach a real inbox to the shared sample restaurant.
  if (outlet.isDemo) return back("demo");
  return NextResponse.redirect(authorizeUrl(callbackUrl(req), await startState(outlet.id, returnTo)));
});
