import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseListing } from "@/lib/listing";
import { audit, HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { applyListing, fetchListing } from "@/lib/server/listing-sync";
import { handler, OWNER } from "@/lib/server/http";
import { outletDTO } from "@/lib/server/queries";
import { brands, outlets } from "@/lib/server/schema";
import { addOwner, currentUser, startSession } from "@/lib/server/auth";

const Platforms = z.array(z.enum(["zomato", "swiggy"])).max(2);

export const GET = handler(async (_req, outlet) => outletDTO(outlet));

// What the owner tells us when they sign up. Documents are optional for now.
const Profile = z.object({
  name: z.string().trim().min(1, "Enter your restaurant's name").max(80),
  ownerName: z.string().trim().min(1, "Enter your name").max(80),
  ownerPhone: z.string().trim().regex(/^\+?[\d\s-]{10,15}$/, "Enter a valid phone number").nullable(),
  area: z.string().trim().min(1, "Enter your area or locality").max(120),
  city: z.string().trim().min(1, "Enter your city").max(60),
  address: z.string().trim().max(240),
  fssai: z.string().trim().regex(/^\d{14}$/, "An FSSAI licence number has 14 digits").nullable(),
  gstin: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "That doesn't look like a GSTIN (15 characters, e.g. 07ABCDE1234F1Z5)").nullable(),
  listings: z.object({ zomato: z.string().max(300), swiggy: z.string().max(300) }).partial(),
});

/** Keeps only links that really are this platform's restaurant pages, in their clean form. */
function cleanListings(listings: z.infer<typeof Profile>["listings"]) {
  const out: Partial<Record<"zomato" | "swiggy", string>> = {};
  for (const [platform, raw] of Object.entries(listings)) {
    if (!raw?.trim()) continue;
    const link = parseListing(raw);
    if (link?.platform !== platform) throw new HttpError(400, `That isn't a ${platform === "zomato" ? "Zomato" : "Swiggy"} restaurant link.`);
    out[platform] = link.url;
  }
  return out;
}

const Start = Profile.partial().extend({
  journey: z.enum(["new", "notlive", "live"]),
  live: Platforms.default([]),
  lang: z.enum(["en", "hi"]).default("en"),
});

/**
 * Creates the signed-in person's restaurant (brand, outlet and their owner membership), or updates
 * the one they already own. Signing in comes first.
 */
export const POST = handler(async (req, outlet, _params, session) => {
  const { journey, live, listings, ...profile } = Start.parse(await req.json());
  const fields = { ...profile, journey, livePlatforms: live, ...(listings ? { listings: cleanListings(listings) } : {}) };
  let row;
  if (session) {
    if (session.membership.role !== "owner") throw new HttpError(403, "Only the owner can change the restaurant's details.");
    [row] = await db.update(outlets).set(fields).where(eq(outlets.id, outlet.id)).returning();
    await audit(outlet.id, `user:${session.user.id}`, "outlet.updated", { fields: Object.keys(fields) });
  } else {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Sign in with Google first.");
    const name = fields.name || "My restaurant";
    const [brand] = await db.insert(brands).values({ name }).returning();
    [row] = await db.insert(outlets).values({ ...fields, name, brandId: brand.id }).returning();
    await startSession(user, await addOwner(user.id, brand.id), row.id);
    await audit(row.id, `user:${user.id}`, "outlet.created", { journey, live, documents: { fssai: !!profile.fssai, gstin: !!profile.gstin } });
  }
  // Read each listing page whose link is new. A failure here never blocks sign-up.
  const read: Partial<Record<"zomato" | "swiggy", { imported: number; matched: number } | { error: string }>> = {};
  for (const p of ["zomato", "swiggy"] as const) {
    const link = row.listings[p];
    if (!link || row.listingData[p]?.url === link) continue;
    try {
      const applied = await applyListing(row, await fetchListing(link));
      row = applied.outlet;
      read[p] = { imported: applied.imported, matched: applied.matched };
    } catch (err) {
      read[p] = { error: (err as Error).message };
    }
  }
  return { ...(await outletDTO(row)), read };
});

const Update = Profile.extend({
  area: z.string().trim().max(120),
  city: z.string().trim().max(60),
  ownerName: z.string().trim().max(80),
  cuisines: z.string().trim().max(120),
  lang: z.enum(["en", "hi"]),
  live: Platforms,
  email: z.enum(["gmail", "outlook"]).nullable(),
  whatsapp: z.boolean(),
}).partial();

export const PATCH = handler({ roles: OWNER }, async (req, outlet) => {
  const { live, listings, ...rest } = Update.parse(await req.json());
  const [row] = await db.update(outlets).set({ ...rest, ...(live ? { livePlatforms: live } : {}), ...(listings ? { listings: cleanListings(listings) } : {}) }).where(eq(outlets.id, outlet.id)).returning();
  await audit(outlet.id, "owner", "outlet.updated", { fields: Object.keys({ ...rest, ...(live ? { live } : {}), ...(listings ? { listings } : {}) }) });
  return outletDTO(row);
});
