import { eq, max } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { assertWritable, handler } from "@/lib/server/http";
import { getMenu } from "@/lib/server/queries";
import { menuItems } from "@/lib/server/schema";

const Body = z.object({
  items: z
    .array(z.object({ name: z.string().trim().min(1).max(80), category: z.string().trim().min(1).max(60), price: z.number().int().min(0), veg: z.boolean(), description: z.string().max(600).default("") }))
    .min(1)
    .max(300),
});

// Picks an illustration until the owner adds a photo.
function guessKind(name: string) {
  const s = name.toLowerCase();
  if (s.includes("biryani") || s.includes("pulao")) return "biryani";
  if (s.includes("tikka") || s.includes("kebab") || s.includes("paneer")) return "paneer-tikka";
  if (s.includes("dal")) return "dal-makhani";
  if (s.includes("thali")) return "thali";
  if (s.includes("chole") || s.includes("bhature")) return "chole-bhature";
  if (s.includes("rajma") || s.includes("chawal")) return "rajma-chawal";
  if (s.includes("jamun") || s.includes("sweet") || s.includes("kheer")) return "gulab-jamun";
  return "butter-naan";
}

/** Adds dishes read from a menu photo to the master menu. */
export const POST = handler(async (req, outlet) => {
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
