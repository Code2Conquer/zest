import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { HttpError } from "./approvals";
import { sign, unsign } from "./crypto";
import { db } from "./db";
import { mailboxes, memberships, outlets, users, type MembershipRow, type Outlet, type Role, type UserRow } from "./schema";

export type { Role } from "./schema";
export type SessionUser = { user: UserRow; membership: MembershipRow; outlet: Outlet };

const COOKIE = "zest_session";
/** The pre-login cookie that pointed a browser at one outlet. Still read so pilots keep their view until they sign in. */
export const LEGACY_COOKIE = "zest_outlet";
const MAX_AGE = 60 * 60 * 24 * 30;

type Payload = { u: string; m: string | null; o: string | null };

async function readPayload(): Promise<Payload | null> {
  const raw = unsign((await cookies()).get(COOKIE)?.value);
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Payload;
  } catch {
    return null;
  }
}

async function writePayload(p: Payload) {
  (await cookies()).set(COOKIE, sign(Buffer.from(JSON.stringify(p)).toString("base64url")), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

/** The outlet a browser pointed at before sign-in existed, if any. */
export async function legacyOutletId(): Promise<string | null> {
  return unsign((await cookies()).get(LEGACY_COOKIE)?.value);
}

/** The signed-in person, even before they belong to a restaurant. */
export async function currentUser(): Promise<UserRow | null> {
  const p = await readPayload();
  if (!p) return null;
  const [user] = await db.select().from(users).where(eq(users.id, p.u));
  return user ?? null;
}

const canUse = (m: MembershipRow, o: Outlet) => o.brandId === m.brandId && (!m.outletIds || m.outletIds.includes(o.id));

/**
 * The signed-in person with their role and current outlet. Re-reads the membership on every request,
 * so removing someone ends their access at once.
 */
export async function currentSession(): Promise<SessionUser | null> {
  const p = await readPayload();
  if (!p?.m || !p.o) return null;
  const [membership] = await db.select().from(memberships).where(and(eq(memberships.id, p.m), eq(memberships.userId, p.u), eq(memberships.active, true)));
  if (!membership) return null;
  const [outlet] = await db.select().from(outlets).where(eq(outlets.id, p.o));
  if (!outlet || !canUse(membership, outlet)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, p.u));
  return user ? { user, membership, outlet } : null;
}

/** Starts a session for this membership, at the preferred outlet if allowed, else its first outlet. */
export async function startSession(user: UserRow, membership: MembershipRow, preferredOutletId?: string | null): Promise<SessionUser> {
  const options = await db.select().from(outlets).where(eq(outlets.brandId, membership.brandId));
  const allowed = options.filter((o) => canUse(membership, o));
  const outlet = allowed.find((o) => o.id === preferredOutletId) ?? allowed[0];
  if (!outlet) throw new HttpError(403, "You don't have access to any outlet yet.");
  await writePayload({ u: user.id, m: membership.id, o: outlet.id });
  return { user, membership, outlet };
}

/** Signs a person in who has no restaurant yet, so they can create one. */
export async function startUserSession(user: UserRow) {
  await writePayload({ u: user.id, m: null, o: null });
}

async function ownerOf(brandId: string) {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.brandId, brandId), eq(memberships.role, "owner"), eq(memberships.active, true)));
  return m ?? null;
}

export async function addOwner(userId: string, brandId: string) {
  const [m] = await db.insert(memberships).values({ userId, brandId, role: "owner" }).returning();
  return m;
}

/**
 * Signs in a person verified by Google. Links an existing pilot outlet when this browser held its old cookie
 * or its connected Gmail address is this email. Returns null when the person has no restaurant yet.
 */
export async function signIn(identity: { email: string; name: string }): Promise<SessionUser | null> {
  const email = identity.email.trim().toLowerCase();
  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) [user] = await db.insert(users).values({ email, name: identity.name }).returning();

  let [membership] = await db.select().from(memberships).where(and(eq(memberships.userId, user.id), eq(memberships.active, true)));
  let preferred: string | null = null;
  if (!membership) {
    const legacy = await legacyOutletId();
    const [fromCookie] = legacy ? await db.select().from(outlets).where(eq(outlets.id, legacy)) : [];
    const [box] = fromCookie ? [] : await db.select().from(mailboxes).where(eq(mailboxes.address, email));
    const [fromMail] = box ? await db.select().from(outlets).where(eq(outlets.id, box.outletId)) : [];
    const claim = [fromCookie, fromMail].find((o) => o && !o.isDemo && o.brandId);
    if (claim && !(await ownerOf(claim.brandId!))) {
      membership = await addOwner(user.id, claim.brandId!);
      preferred = claim.id;
      const { audit } = await import("./approvals");
      await audit(claim.id, `user:${user.id}`, "owner.linked", { via: claim === fromCookie ? "browser" : "gmail" });
    }
  }
  (await cookies()).delete(LEGACY_COOKIE);
  if (!membership) {
    await startUserSession(user);
    return null;
  }
  return startSession(user, membership, preferred);
}

/** The session if the person holds one of these roles; 401 without a session, 403 with the wrong role. */
export function requireRole(session: SessionUser | null, roles: Role[]): SessionUser {
  if (!session) throw new HttpError(401, "Sign in to make changes.");
  if (!roles.includes(session.membership.role)) throw new HttpError(403, "Your role can't do this. Ask the owner.");
  return session;
}
