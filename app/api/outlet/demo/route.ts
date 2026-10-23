import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/approvals";
import { assertWritable, handler, OWNER } from "@/lib/server/http";
import { approvals, auditLog, chatMessages, connections, emails, menuItems, notifications, orders, outlets, payouts, reviews } from "@/lib/server/schema";
import { DEMO_OUTLET_ID, MEENA_OUTLET_ID, refreshMeenaDay, seedDemo } from "@/lib/server/seed";
import { customers } from "@/lib/server/schema";
import { clearCurrentOutlet } from "@/lib/server/session";

/** Switches this browser to the sample restaurant. */
export const POST = handler(async () => {
  await clearCurrentOutlet();
  return { ok: true };
});

/** Puts the sample this browser is looking at back the way it started. */
export const DELETE = handler({ roles: OWNER }, async (_req, outlet) => {
  if (!outlet.isDemo) throw new HttpError(400, "Only a sample can be reset.");
  assertWritable(outlet, { sample: true });
  if (outlet.id === MEENA_OUTLET_ID) {
    await db.delete(orders).where(eq(orders.outletId, MEENA_OUTLET_ID));
    await db.delete(customers).where(eq(customers.brandId, `${MEENA_OUTLET_ID}-brand`));
    await refreshMeenaDay();
    return { ok: true };
  }
  for (const table of [approvals, auditLog, chatMessages, connections, emails, menuItems, notifications, orders, payouts, reviews]) {
    await db.delete(table).where(eq(table.outletId, DEMO_OUTLET_ID));
  }
  await db.delete(outlets).where(eq(outlets.id, DEMO_OUTLET_ID));
  await seedDemo();
  return { ok: true };
});
