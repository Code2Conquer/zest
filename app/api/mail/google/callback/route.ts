import { NextResponse } from "next/server";
import { connectGmail, GmailError, syncMailbox } from "@/lib/server/gmail";
import { handler, OWNER } from "@/lib/server/http";
import { callbackUrl, finishState, safeReturn } from "@/lib/server/oauth-state";

export const maxDuration = 60;

/** Google sends the owner back here. Stores the tokens, then reads the first batch of mail. */
export const GET = handler({ roles: OWNER }, async (req, outlet) => {
  const url = new URL(req.url);
  const state = await finishState(url.searchParams.get("state"));
  const returnTo = safeReturn(state?.returnTo ?? null);
  const back = (status: string) => NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}gmail=${status}`, req.url));

  if (url.searchParams.get("error")) return back("cancelled");
  if (!state || state.outletId !== outlet.id) return back("expired");
  const code = url.searchParams.get("code");
  if (!code) return back("cancelled");

  try {
    await connectGmail(outlet.id, code, callbackUrl(req));
  } catch (err) {
    console.error(err);
    return back(err instanceof GmailError ? "failed" : "error");
  }
  // Read what we can now; the rest of the 90 days continues on the next sync.
  await syncMailbox(outlet.id, 30_000);
  return back("connected");
});
