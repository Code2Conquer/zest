import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { audit } from "./approvals";
import { decrypt, encrypt } from "./crypto";
import { db } from "./db";
import { ingestEmail, type InboundAttachment } from "./ingest";
import { emails, mailboxes, outlets, payouts, type Mailbox } from "./schema";

// GOOGLE_API_OVERRIDE points every Google call at one base URL. Only for local testing.
const override = process.env.GOOGLE_API_OVERRIDE;
const AUTH_URL = override ? `${override}/auth` : "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = override ? `${override}/token` : "https://oauth2.googleapis.com/token";
const REVOKE_URL = override ? `${override}/revoke` : "https://oauth2.googleapis.com/revoke";
const GMAIL = override ? `${override}/gmail/v1/users/me` : "https://gmail.googleapis.com/gmail/v1/users/me";

const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/gmail.readonly"];

/** Senders we read. Nothing else in the inbox is fetched. */
export const SENDERS = (process.env.GMAIL_SENDERS ?? "zomato.com,swiggy.in,swiggy.com").split(",").map((s) => s.trim()).filter(Boolean);
const senderQuery = () => `from:(${SENDERS.join(" OR ")})`;

const BACKFILL_DAYS = 90;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export class GmailError extends Error {
  constructor(
    message: string,
    readonly reconnect = false,
  ) {
    super(message);
  }
}

export function gmailConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function authorizeUrl(redirectUri: string, state: string) {
  const u = new URL(AUTH_URL);
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();
  return u.toString();
}

type Tokens = { refreshToken: string; accessToken: string; expiresAt: number };

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    // invalid_grant: the owner revoked access, or Google expired it (every 7 days while the app is in Testing).
    throw new GmailError(data.error === "invalid_grant" ? "Google sign-in expired. Connect Gmail again." : `Google sign-in failed (${data.error ?? res.status}).`, data.error === "invalid_grant");
  }
  return data as { access_token: string; refresh_token?: string; expires_in: number };
}

async function gmailGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new GmailError("Gmail rejected the sign-in. Connect Gmail again.", true);
  if (res.status === 403) throw new GmailError("Gmail access wasn't granted. Connect again and allow reading email.", true);
  if (res.status === 429) throw new GmailError("Gmail is rate-limiting requests. It will catch up on the next sync.");
  if (!res.ok) throw new GmailError(`Gmail returned an error (${res.status}).`);
  return (await res.json()) as T;
}

/** Finishes sign-in: swaps the code for tokens and stores them encrypted. */
export async function connectGmail(outletId: string, code: string, redirectUri: string) {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
  if (!t.refresh_token) throw new GmailError("Google didn't grant offline access. Try connecting again.");
  const profile = await gmailGet<{ emailAddress: string }>(t.access_token, "/profile");
  const secret = encrypt({ refreshToken: t.refresh_token, accessToken: t.access_token, expiresAt: Date.now() + t.expires_in * 1000 } satisfies Tokens);
  await db
    .insert(mailboxes)
    .values({ outletId, provider: "gmail", address: profile.emailAddress, secret })
    .onConflictDoUpdate({ target: mailboxes.outletId, set: { provider: "gmail", address: profile.emailAddress, secret, status: "connected", statusDetail: null, backfillDone: false } });
  await db.update(outlets).set({ email: "gmail" }).where(eq(outlets.id, outletId));
  await audit(outletId, "owner", "gmail.connected", { address: profile.emailAddress });
  return profile.emailAddress;
}

async function accessToken(box: Mailbox): Promise<string> {
  const t = decrypt<Tokens>(box.secret);
  if (t.expiresAt - 60_000 > Date.now()) return t.accessToken;
  const fresh = await tokenRequest({ refresh_token: t.refreshToken, grant_type: "refresh_token" });
  const next: Tokens = { refreshToken: fresh.refresh_token ?? t.refreshToken, accessToken: fresh.access_token, expiresAt: Date.now() + fresh.expires_in * 1000 };
  await db.update(mailboxes).set({ secret: encrypt(next) }).where(eq(mailboxes.id, box.id));
  return next.accessToken;
}

// ---------------------------------------------------------------------------
// Message parsing

type Part = { mimeType: string; filename?: string; headers?: { name: string; value: string }[]; body?: { data?: string; size?: number; attachmentId?: string }; parts?: Part[] };
type GmailMessage = { id: string; internalDate: string; snippet: string; payload: Part };

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "\t")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8377;|&#x20b9;/gi, "₹")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Plain text of the message (preferring text/plain) and its attachments, without downloading them yet. */
export function readParts(payload: Part) {
  let plain = "";
  let html = "";
  const files: { filename: string; mimeType: string; attachmentId?: string; data?: string; size: number }[] = [];
  const walk = (p: Part) => {
    if (p.filename) {
      files.push({ filename: p.filename, mimeType: p.mimeType, attachmentId: p.body?.attachmentId, data: p.body?.data, size: p.body?.size ?? 0 });
    } else if (p.mimeType === "text/plain" && p.body?.data) {
      plain += b64url(p.body.data).toString("utf8");
    } else if (p.mimeType === "text/html" && p.body?.data) {
      html += b64url(p.body.data).toString("utf8");
    }
    p.parts?.forEach(walk);
  };
  walk(payload);
  return { text: (plain || htmlToText(html)).trim(), files };
}

const header = (m: GmailMessage, name: string) => m.payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

const WANTED = (f: { filename: string; mimeType: string }) => f.mimeType === "application/pdf" || f.mimeType === "text/csv" || /\.csv$/i.test(f.filename);

async function toInbound(token: string, m: GmailMessage) {
  const { text, files } = readParts(m.payload);
  const attachments: InboundAttachment[] = [];
  for (const f of files) {
    if (!WANTED(f) || f.size > MAX_ATTACHMENT_BYTES) {
      attachments.push({ filename: f.filename, mimeType: f.mimeType, data: "" });
      continue;
    }
    const raw = f.data ?? (f.attachmentId ? (await gmailGet<{ data: string }>(token, `/messages/${m.id}/attachments/${f.attachmentId}`)).data : "");
    attachments.push({ filename: f.filename, mimeType: f.mimeType, data: raw ? b64url(raw).toString("base64") : "" });
  }
  return {
    from: header(m, "From"),
    subject: header(m, "Subject") || "(no subject)",
    text: text || m.snippet,
    receivedAt: new Date(Number(m.internalDate)).toISOString(),
    attachments: attachments.filter((a) => a.data),
    origin: "gmail" as const,
    externalId: m.id,
  };
}

// ---------------------------------------------------------------------------
// Sync

export type SyncResult = { checked: number; added: number; payouts: number; done: boolean; error?: string };

/**
 * Reads new Zomato and Swiggy mail. The first run backfills the last 90 days;
 * later runs look back a day from the last sync. Stops before the time budget
 * so it fits a serverless request, and carries on next time.
 */
export async function syncMailbox(outletId: string, budgetMs = 40_000): Promise<SyncResult> {
  const started = Date.now();
  const [box] = await db.select().from(mailboxes).where(eq(mailboxes.outletId, outletId));
  if (!box) return { checked: 0, added: 0, payouts: 0, done: true, error: "No mailbox connected." };

  const result: SyncResult = { checked: 0, added: 0, payouts: 0, done: false };
  await db.update(mailboxes).set({ status: "syncing" }).where(eq(mailboxes.id, box.id));
  try {
    const token = await accessToken(box);
    const since = box.backfillDone && box.lastSyncAt ? Math.floor(new Date(box.lastSyncAt).getTime() / 1000) - 86_400 : null;
    const q = `${senderQuery()} ${since ? `after:${since}` : `newer_than:${BACKFILL_DAYS}d`}`;

    let pageToken: string | undefined;
    outer: do {
      const page = await gmailGet<{ messages?: { id: string }[]; nextPageToken?: string }>(token, `/messages?${new URLSearchParams({ q, maxResults: "50", ...(pageToken ? { pageToken } : {}) })}`);
      const ids = (page.messages ?? []).map((m) => m.id);
      // Skip messages already stored without fetching them again.
      const known = ids.length ? new Set((await db.select({ id: emails.externalId }).from(emails).where(and(eq(emails.outletId, outletId), inArray(emails.externalId, ids)))).map((r) => r.id)) : new Set<string | null>();
      for (const id of ids) {
        result.checked++;
        if (known.has(id)) continue;
        if (Date.now() - started > budgetMs) break outer;
        const msg = await gmailGet<GmailMessage>(token, `/messages/${id}?format=full`);
        const r = await ingestEmail(outletId, await toInbound(token, msg));
        if (r.kind !== "duplicate") result.added++;
        if (r.kind === "payout") result.payouts++;
      }
      pageToken = page.nextPageToken;
    } while (pageToken && Date.now() - started < budgetMs);

    result.done = !pageToken && Date.now() - started < budgetMs;
    await db
      .update(mailboxes)
      .set({ status: "connected", statusDetail: null, lastSyncAt: result.done ? new Date().toISOString() : box.lastSyncAt, backfillDone: box.backfillDone || result.done })
      .where(eq(mailboxes.id, box.id));
    await audit(outletId, "gmail", "gmail.synced", { ...result });
    return result;
  } catch (err) {
    const message = (err as Error).message;
    await db.update(mailboxes).set({ status: "error", statusDetail: message }).where(eq(mailboxes.id, box.id));
    return { ...result, error: message };
  }
}

/** Revokes Google access and deletes everything read from the mailbox. */
export async function disconnectGmail(outletId: string) {
  const [box] = await db.select().from(mailboxes).where(eq(mailboxes.outletId, outletId));
  if (!box) return;
  try {
    const t = decrypt<Tokens>(box.secret);
    await fetch(`${REVOKE_URL}?${new URLSearchParams({ token: t.refreshToken })}`, { method: "POST" });
  } catch {
    // Revocation is best effort; the owner can also remove access in their Google account.
  }
  const read = await db.select({ id: emails.id }).from(emails).where(and(eq(emails.outletId, outletId), eq(emails.origin, "gmail")));
  if (read.length) {
    await db.delete(payouts).where(and(eq(payouts.outletId, outletId), inArray(payouts.emailId, read.map((r) => r.id))));
    await db.delete(emails).where(and(eq(emails.outletId, outletId), eq(emails.origin, "gmail")));
  }
  await db.delete(mailboxes).where(eq(mailboxes.id, box.id));
  await db.update(outlets).set({ email: null }).where(eq(outlets.id, outletId));
  await audit(outletId, "owner", "gmail.disconnected", { address: box.address, deletedEmails: read.length });
}
