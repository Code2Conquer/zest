import { and, eq } from "drizzle-orm";
import { audit, HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { handler, OWNER } from "@/lib/server/http";
import { memberships } from "@/lib/server/schema";
import { removeStaff } from "@/lib/server/staff";

export const DELETE = handler<{ id: string }>({ roles: OWNER }, async (_req, outlet, { id }, session) => {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.id, id), eq(memberships.brandId, outlet.brandId!)));
  if (!m) throw new HttpError(404, "No such person.");
  if (m.role === "owner") throw new HttpError(400, "The owner can't be removed here.");
  await removeStaff(id);
  await audit(outlet.id, `user:${session!.user.id}`, "staff.removed", { membershipId: id });
  return { ok: true };
});
