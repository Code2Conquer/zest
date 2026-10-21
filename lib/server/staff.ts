import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { HttpError } from "./approvals";
import { startSession, type SessionUser } from "./auth";
import { hmac } from "./crypto";
import { db } from "./db";
import { checkRate, refundRate } from "./rate-limit";
import { memberships, newStaffCode, outlets, users, type MembershipRow } from "./schema";

const PIN_TRIES = 5;
const PIN_WINDOW = 15 * 60;
// Per address too, so one device can't work through many restaurant codes.
const PIN_TRIES_PER_IP = 20;
const pinHash = (pin: string) => hmac(`pin:${pin}`);

/** Gives every outlet that has none a staff sign-in code. */
export async function ensureStaffCodes() {
  for (const o of await db.select({ id: outlets.id }).from(outlets).where(isNull(outlets.staffCode))) {
    await db.update(outlets).set({ staffCode: newStaffCode() }).where(eq(outlets.id, o.id));
  }
}

const overlaps = (a: string[] | null, b: string[] | null) => !a || !b || a.some((x) => b.includes(x));

export type StaffInput = { name: string; role: "manager" | "kitchen" | "cashier" | "rider"; outletIds: string[] | null; pin: string };

/** Adds a person who signs in on the restaurant's device with a 4-digit PIN. */
export async function addStaff(brandId: string, input: StaffInput): Promise<MembershipRow> {
  if (!input.name.trim()) throw new HttpError(400, "Enter the person's name.");
  if (!/^\d{4}$/.test(input.pin)) throw new HttpError(400, "A PIN is exactly 4 digits.");
  const hash = pinHash(input.pin);
  const sameBrand = await db.select().from(memberships).where(and(eq(memberships.brandId, brandId), eq(memberships.active, true), eq(memberships.pinHash, hash)));
  if (sameBrand.some((m) => overlaps(m.outletIds, input.outletIds))) throw new HttpError(400, "Someone at this outlet already uses that PIN. Pick another.");
  const [user] = await db.insert(users).values({ name: input.name.trim() }).returning();
  const [m] = await db.insert(memberships).values({ userId: user.id, brandId, role: input.role, outletIds: input.outletIds, pinHash: hash }).returning();
  return m;
}

/** Adds a manager who signs in with their own Google account instead of a PIN. */
export async function addManagerByEmail(brandId: string, input: { name: string; email: string; outletIds: string[] | null }): Promise<MembershipRow> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "Enter the manager's Google email address.");
  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) [user] = await db.insert(users).values({ email, name: input.name.trim() }).returning();
  const [already] = await db.select().from(memberships).where(and(eq(memberships.userId, user.id), eq(memberships.brandId, brandId), eq(memberships.active, true)));
  if (already) throw new HttpError(400, "That person already has access to this restaurant.");
  const [m] = await db.insert(memberships).values({ userId: user.id, brandId, role: "manager", outletIds: input.outletIds }).returning();
  return m;
}

/** Ends a person's access; their next request is signed out. */
export async function removeStaff(membershipId: string) {
  await db.update(memberships).set({ active: false }).where(eq(memberships.id, membershipId));
}

export async function listStaff(brandId: string) {
  const rows = await db
    .select({ id: memberships.id, role: memberships.role, outletIds: memberships.outletIds, name: users.name, email: users.email, hasPin: memberships.pinHash })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.brandId, brandId), eq(memberships.active, true)));
  return rows.map((r) => ({ ...r, hasPin: !!r.hasPin }));
}

/**
 * Signs staff in on the restaurant's device. Five wrong PINs lock the code for 15 minutes.
 * Every attempt is counted before the PIN is checked, so guesses sent at once can't slip past the limit;
 * a right PIN gives its try back.
 */
export async function pinSignIn(staffCode: string, pin: string, ip?: string): Promise<SessionUser> {
  const code = staffCode.trim().toUpperCase();
  const key = `pin:${code}`;
  const tooMany = () => new HttpError(429, "Too many wrong PINs. Try again in 15 minutes.");
  if (!(await checkRate(key, PIN_TRIES, PIN_WINDOW))) throw tooMany();
  if (ip && !(await checkRate(`pin-ip:${ip}`, PIN_TRIES_PER_IP, PIN_WINDOW))) throw tooMany();
  const wrong = async (): Promise<never> => {
    throw new HttpError(401, "That restaurant code and PIN don't match.");
  };
  const [outlet] = await db.select().from(outlets).where(eq(outlets.staffCode, code));
  if (!outlet?.brandId || !/^\d{4}$/.test(pin)) return wrong();
  const candidates = await db.select().from(memberships).where(and(eq(memberships.brandId, outlet.brandId), eq(memberships.active, true), eq(memberships.pinHash, pinHash(pin))));
  const membership = candidates.find((m) => !m.outletIds || m.outletIds.includes(outlet.id));
  if (!membership) return wrong();
  const [user] = await db.select().from(users).where(eq(users.id, membership.userId));
  await refundRate(key, PIN_WINDOW);
  if (ip) await refundRate(`pin-ip:${ip}`, PIN_WINDOW);
  return startSession(user, membership, outlet.id);
}
