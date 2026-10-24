import "server-only";

// "Continue with Google" for owners and managers, alongside mobile login. Uses the same OAuth client as the
// Gmail connector, asking only for the person's verified email and name.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const envValue = (name: string) => process.env[name]?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

export const googleSigninConfigured = () => !!(envValue("GOOGLE_CLIENT_ID") && envValue("GOOGLE_CLIENT_SECRET"));

export function signinAuthorizeUrl(redirectUri: string, state: string) {
  const u = new URL(AUTH_URL);
  u.search = new URLSearchParams({
    client_id: envValue("GOOGLE_CLIENT_ID")!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  }).toString();
  return u.toString();
}

/**
 * Swaps the code for the person's identity. The ID token comes straight from Google's token endpoint
 * over TLS with our client secret, so its claims can be read without checking the signature (OpenID Connect §3.1.3.7).
 */
export async function exchangeSigninCode(code: string, redirectUri: string): Promise<{ email: string; name: string }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: envValue("GOOGLE_CLIENT_ID")!, client_secret: envValue("GOOGLE_CLIENT_SECRET")!, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !data.id_token) throw new Error(`Google sign-in failed (${data.error ?? res.status}).`);
  const claims = JSON.parse(Buffer.from(data.id_token.split(".")[1], "base64url").toString("utf8")) as { email?: string; email_verified?: boolean; name?: string };
  if (!claims.email || !claims.email_verified) throw new Error("Google didn't confirm this email address.");
  return { email: claims.email, name: claims.name ?? "" };
}
