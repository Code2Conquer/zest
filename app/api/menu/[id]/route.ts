import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { menuItems } from "@/lib/server/schema";

const Body = z.object({ dailyLimit: z.number().int().min(0).max(5000).nullable() });

/** Sets how many of a dish the kitchen makes in a day. Only for the seller's own page, so no approval. */
export const PATCH = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }) => {
  assertWritable(outlet, { sample: true });
  const { dailyLimit } = Body.parse(await req.json());
  const [row] = await db.update(menuItems).set({ dailyLimit, updatedAt: new Date().toISOString() }).where(and(eq(menuItems.id, id), eq(menuItems.outletId, outlet.id))).returning();
  if (!row) throw new HttpError(404, "Dish not found.");
  return { id: row.id, dailyLimit: row.dailyLimit };
});
