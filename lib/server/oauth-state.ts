import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sign, unsign } from "./crypto";

const COOKIE = "zest_oauth";

/** Remembers which outlet started sign-in and where to return, bound to a one-time nonce. */
export async function startState(outletId: string, returnTo: string) {
  const nonce = randomBytes(16).toString("base64url");
  const value = Buffer.from(JSON.stringify({ outletId, nonce, returnTo })).toString("base64url");
  (await cookies()).set(COOKIE, sign(value), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/mail/google", maxAge: 600 });
  return nonce;
}

export async function finishState(nonce: string | null) {
  const jar = await cookies();
  const raw = unsign(jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
  if (!raw || !nonce) return null;
  const state = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { outletId: string; nonce: string; returnTo: string };
  return state.nonce === nonce ? state : null;
}

/** Only same-site paths, so the callback can't be used to bounce people elsewhere. */
export const safeReturn = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/connect");

/** Must match an authorised redirect URI in the Google Cloud OAuth client. APP_URL pins it behind proxies. */
export const callbackUrl = (req: Request) => `${process.env.APP_URL ?? new URL(req.url).origin}/api/mail/google/callback`;
