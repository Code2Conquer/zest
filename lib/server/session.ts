import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { sign, unsign } from "./crypto";
import { db, ready } from "./db";
import { outlets, type Outlet } from "./schema";
import { DEMO_OUTLET_ID } from "./seed";

const COOKIE = "zest_outlet";

/**
 * The outlet this browser is working on. A signed cookie is set when an owner
 * starts onboarding; without one, requests read the demo restaurant.
 * Phone-OTP login replaces this before launch.
 */
export async function currentOutlet(): Promise<Outlet> {
  await ready();
  const id = unsign((await cookies()).get(COOKIE)?.value) ?? DEMO_OUTLET_ID;
  const [row] = await db.select().from(outlets).where(eq(outlets.id, id));
  if (row) return row;
  const [demo] = await db.select().from(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  return demo;
}

export async function setCurrentOutlet(id: string) {
  (await cookies()).set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearCurrentOutlet() {
  (await cookies()).delete(COOKIE);
}
