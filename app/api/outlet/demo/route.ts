import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { assertWritable, handler } from "@/lib/server/http";
import { approvals, auditLog, chatMessages, connections, emails, menuItems, notifications, orders, outlets, payouts, reviews } from "@/lib/server/schema";
import { DEMO_OUTLET_ID, seedDemo } from "@/lib/server/seed";
import { clearCurrentOutlet } from "@/lib/server/session";

/** Switches this browser to the sample restaurant. */
export const POST = handler(async () => {
  await clearCurrentOutlet();
  return { ok: true };
});

/** Puts the sample restaurant back the way it started. */
export const DELETE = handler(async (_req, outlet) => {
  // Same rule as editing the demo, whichever outlet this browser is on.
  assertWritable({ ...outlet, isDemo: true });
  for (const table of [approvals, auditLog, chatMessages, connections, emails, menuItems, notifications, orders, payouts, reviews]) {
    await db.delete(table).where(eq(table.outletId, DEMO_OUTLET_ID));
  }
  await db.delete(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  await seedDemo();
  return { ok: true };
});
