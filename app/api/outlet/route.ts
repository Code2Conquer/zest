import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseListing } from "@/lib/listing";
import { audit, HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { applyZomatoListing } from "@/lib/server/listing-sync";
import { fetchZomatoListing } from "@/lib/server/zomato-listing";
import { handler } from "@/lib/server/http";
import { outletDTO } from "@/lib/server/queries";
import { outlets } from "@/lib/server/schema";
import { setCurrentOutlet } from "@/lib/server/session";

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

/** Creates the owner's restaurant and profile for this browser, or updates the one already started. */
export const POST = handler(async (req, outlet) => {
  const { journey, live, listings, ...profile } = Start.parse(await req.json());
  const fields = { ...profile, journey, livePlatforms: live, ...(listings ? { listings: cleanListings(listings) } : {}) };
  let row;
  if (!outlet.isDemo) {
    [row] = await db.update(outlets).set(fields).where(eq(outlets.id, outlet.id)).returning();
    await audit(outlet.id, "owner", "outlet.updated", { fields: Object.keys(fields) });
  } else {
    [row] = await db.insert(outlets).values({ ...fields, name: fields.name || "My restaurant" }).returning();
    await setCurrentOutlet(row.id);
    await audit(row.id, "owner", "outlet.created", { journey, live, documents: { fssai: !!profile.fssai, gstin: !!profile.gstin } });
  }
  // Read the Zomato page if the link is new. A failure here never blocks sign-up.
  const zomato = row.listings.zomato;
  let listing: { imported: number } | { error: string } | null = null;
  if (zomato && row.listingData.zomato?.url !== zomato) {
    try {
      const applied = await applyZomatoListing(row, await fetchZomatoListing(zomato));
      row = applied.outlet;
      listing = { imported: applied.imported };
    } catch (err) {
      listing = { error: (err as Error).message };
    }
  }
  return { ...(await outletDTO(row)), listing };
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

export const PATCH = handler(async (req, outlet) => {
  const { live, listings, ...rest } = Update.parse(await req.json());
  const [row] = await db.update(outlets).set({ ...rest, ...(live ? { livePlatforms: live } : {}), ...(listings ? { listings: cleanListings(listings) } : {}) }).where(eq(outlets.id, outlet.id)).returning();
  await audit(outlet.id, "owner", "outlet.updated", { fields: Object.keys({ ...rest, ...(live ? { live } : {}), ...(listings ? { listings } : {}) }) });
  return outletDTO(row);
});
