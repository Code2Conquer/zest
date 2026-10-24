import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sign, unsign } from "./crypto";

/** OAuth is only used to connect a Gmail inbox; each purpose gets its own cookie so states can't be replayed across. */
export type OAuthPurpose = "gmail";
const COOKIE: Record<OAuthPurpose, { name: string; path: string }> = {
  gmail: { name: "zest_oauth", path: "/api/mail/google" },
};

/** Remembers which outlet started sign-in and where to return, bound to a one-time nonce. */
export async function startState(outletId: string, returnTo: string, purpose: OAuthPurpose = "gmail") {
  const nonce = randomBytes(16).toString("base64url");
  const value = Buffer.from(JSON.stringify({ purpose, outletId, nonce, returnTo })).toString("base64url");
  const c = COOKIE[purpose];
  (await cookies()).set(c.name, sign(value), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: c.path, maxAge: 600 });
  return nonce;
}

export async function finishState(nonce: string | null, purpose: OAuthPurpose = "gmail") {
  const jar = await cookies();
  const name = COOKIE[purpose].name;
  const raw = unsign(jar.get(name)?.value);
  jar.delete(name);
  if (!raw || !nonce) return null;
  const state = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { purpose?: OAuthPurpose; outletId: string; nonce: string; returnTo: string };
  // States from before purposes existed were all Gmail.
  return state.nonce === nonce && (state.purpose ?? "gmail") === purpose ? state : null;
}

/**
 * Only same-site paths, so sign-in can't be used to bounce people elsewhere. Browsers read "/\\host" as
 * "//host", so backslashes (raw or encoded) and control characters are refused too.
 */
export function safeReturn(p: string | null): string {
  const fallback = "/connect";
  if (!p || !p.startsWith("/") || p.startsWith("//") || /[\\\u0000-\u001f\u007f]|%5c/i.test(p)) return fallback;
  try {
    const base = "https://zest.invalid";
    const u = new URL(p, base);
    return u.origin === base ? `${u.pathname}${u.search}${u.hash}` : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Must match an authorised redirect URI in the Google Cloud OAuth client. APP_URL pins it; on Vercel the
 * production domain is used, so preview deployments still return to an address Google knows.
 */
export const appUrl = (req: Request) =>
  process.env.APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : new URL(req.url).origin);
export const callbackUrl = (req: Request) => `${appUrl(req)}/api/mail/google/callback`;
