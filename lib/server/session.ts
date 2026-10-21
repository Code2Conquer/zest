import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { currentSession, legacyOutletId, LEGACY_COOKIE, signOut } from "./auth";
import { db, ready } from "./db";
import { outlets, type Outlet } from "./schema";
import { DEMO_OUTLET_ID } from "./seed";

/**
 * The outlet this browser is working on: the signed-in person's outlet; else, for a browser that
 * started a restaurant before sign-in existed, that outlet (read-only until they sign in); else the demo.
 */
export async function currentOutlet(): Promise<Outlet> {
  await ready();
  const session = await currentSession();
  if (session) return session.outlet;
  const legacy = await legacyOutletId();
  if (legacy) {
    const [row] = await db.select().from(outlets).where(eq(outlets.id, legacy));
    if (row) return row;
  }
  const [demo] = await db.select().from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  return demo;
}

/** Back to the sample restaurant: signs out and forgets any pre-login outlet. */
export async function clearCurrentOutlet() {
  (await cookies()).delete(LEGACY_COOKIE);
  await signOut();
}
