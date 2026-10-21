import { eq, max } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { guessKind } from "@/lib/server/listing-sync";
import { getMenu } from "@/lib/server/queries";
import { menuItems } from "@/lib/server/schema";

const Body = z.object({
  items: z
    .array(z.object({ name: z.string().trim().min(1).max(80), category: z.string().trim().min(1).max(60), price: z.number().int().min(0), veg: z.boolean(), description: z.string().max(600).default("") }))
    .min(1)
    .max(300),
});

/** Adds dishes read from a menu photo to the master menu. */
export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  assertWritable(outlet);
  const { items } = Body.parse(await req.json());
  const [{ top }] = await db.select({ top: max(menuItems.sort) }).from(menuItems).where(eq(menuItems.outletId, outlet.id));
  await db.insert(menuItems).values(
    items.map((it, i) => ({
      outletId: outlet.id,
      name: it.name,
      category: it.category,
      kind: guessKind(it.name),
      veg: it.veg,
      description: it.description,
      price: { zomato: it.price, swiggy: it.price },
      available: { zomato: true, swiggy: true },
      sort: (top ?? 0) + i + 1,
    })),
  );
  await audit(outlet.id, "owner", "menu.imported", { count: items.length });
  return getMenu(outlet.id);
});
