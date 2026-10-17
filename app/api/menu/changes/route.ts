import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createApproval } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";
import { menuItems } from "@/lib/server/schema";

const PlatformMap = <T extends z.ZodType>(v: T) => z.object({ zomato: v.optional(), swiggy: v.optional() });

const Body = z.object({
  changes: z
    .array(
      z.object({
        itemId: z.string(),
        available: PlatformMap(z.boolean()).optional(),
        price: PlatformMap(z.number().int().min(0).max(100000)).optional(),
        fields: z
          .object({
            name: z.string().trim().min(1).max(80),
            description: z.string().max(600),
            veg: z.boolean(),
            bestseller: z.boolean(),
            photoUrl: z.string().max(2_000_000).nullable(),
          })
          .partial()
          .optional(),
      }),
    )
    .min(1)
    .max(100),
});

/** Turns menu edits into one approval. Nothing reaches a platform until it's approved. */
export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  const { changes } = Body.parse(await req.json());
  const names = await db.select({ id: menuItems.id, name: menuItems.name }).from(menuItems).where(and(eq(menuItems.outletId, outlet.id), inArray(menuItems.id, changes.map((c) => c.itemId))));
  const label = names.map((n) => n.name);
  const row = await createApproval(outlet.id, {
    agent: "menu",
    kind: "menu_change",
    title: `${changes.length} menu change${changes.length === 1 ? "" : "s"}`,
    summary: label.slice(0, 4).join(", ") + (label.length > 4 ? ` and ${label.length - 4} more` : ""),
    payload: { changes },
  });
  return approvalDTO(row);
});
