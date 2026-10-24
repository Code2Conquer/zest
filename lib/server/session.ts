import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { currentSession, signOut } from "./auth";
import { db, ready } from "./db";
import { outlets, type Outlet } from "./schema";
import { DEMO_OUTLET_ID, MEENA_OUTLET_ID } from "./seed";

/** Which sample a signed-out browser looks at: "home" (Meena's Kitchen) or the sample restaurant. */
export const SAMPLE_COOKIE = "zest_sample";

/**
 * The outlet this browser is working on: the signed-in person's outlet; else the sample it picked at
 * /demo/home or /demo/restaurant (the restaurant by default).
 */
export async function currentOutlet(): Promise<Outlet> {
  await ready();
  const session = await currentSession();
  if (session) return session.outlet;
  if ((await cookies()).get(SAMPLE_COOKIE)?.value === "home") {
    const [home] = await db.select().from(outlets).where(eq(outlets.id, MEENA_OUTLET_ID));
    if (home) return home;
  }
  const [demo] = await db.select().from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  return demo;
}

/** Back to the sample restaurant: signs out. */
export async function clearCurrentOutlet() {
  await signOut();
}
