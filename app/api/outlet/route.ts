import { eq } from "drizzle-orm";
import { z } from "zod";
import { audit } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { handler } from "@/lib/server/http";
import { outletDTO } from "@/lib/server/queries";
import { outlets } from "@/lib/server/schema";
import { setCurrentOutlet } from "@/lib/server/session";

const Platforms = z.array(z.enum(["zomato", "swiggy"])).max(2);

export const GET = handler(async (_req, outlet) => outletDTO(outlet));

const Start = z.object({
  journey: z.enum(["new", "notlive", "live"]),
  live: Platforms.default([]),
  lang: z.enum(["en", "hi"]).default("en"),
  name: z.string().trim().max(80).optional(),
});

/** Starts a real restaurant for this browser (or updates it if one is already started). */
export const POST = handler(async (req, outlet) => {
  const body = Start.parse(await req.json());
  if (!outlet.isDemo) {
    const [row] = await db.update(outlets).set({ journey: body.journey, livePlatforms: body.live, lang: body.lang, ...(body.name ? { name: body.name } : {}) }).where(eq(outlets.id, outlet.id)).returning();
    return outletDTO(row);
  }
  const [row] = await db.insert(outlets).values({ name: body.name || "My restaurant", journey: body.journey, livePlatforms: body.live, lang: body.lang }).returning();
  await setCurrentOutlet(row.id);
  await audit(row.id, "owner", "outlet.created", { journey: body.journey, live: body.live });
  return outletDTO(row);
});

const Update = z.object({
  name: z.string().trim().min(1).max(80),
  area: z.string().trim().max(120),
  cuisines: z.string().trim().max(120),
  ownerName: z.string().trim().max(80),
  ownerPhone: z.string().trim().regex(/^\+?[\d\s-]{10,15}$/, "Enter a valid phone number").nullable(),
  lang: z.enum(["en", "hi"]),
  live: Platforms,
  email: z.enum(["gmail", "outlook"]).nullable(),
  whatsapp: z.boolean(),
}).partial();

export const PATCH = handler(async (req, outlet) => {
  const { live, ...rest } = Update.parse(await req.json());
  const [row] = await db.update(outlets).set({ ...rest, ...(live ? { livePlatforms: live } : {}) }).where(eq(outlets.id, outlet.id)).returning();
  await audit(outlet.id, "owner", "outlet.updated", { fields: Object.keys({ ...rest, ...(live ? { live } : {}) }) });
  return outletDTO(row);
});
