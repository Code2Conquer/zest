import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { customers } from "@/lib/server/schema";

const Body = z.object({ note: z.string().trim().max(200) });

/** The kitchen's own note on a regular ("less spicy, no onion"). Seen only in the dashboard. */
export const PATCH = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }) => {
  assertWritable(outlet);
  const { note } = Body.parse(await req.json());
  const [row] = await db.update(customers).set({ note }).where(and(eq(customers.id, id), eq(customers.brandId, outlet.brandId!))).returning();
  if (!row) throw new HttpError(404, "Customer not found.");
  return { id: row.id, note: row.note };
});
