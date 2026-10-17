import "server-only";
import { and, eq } from "drizzle-orm";
import { parseListing } from "../listing";
import { PLATFORMS } from "../platforms";
import type { PlatformListing } from "../types";
import { audit, HttpError } from "./approvals";
import { db } from "./db";
import { menuItems, outlets, type Outlet } from "./schema";
import { fetchSwiggyListing } from "./swiggy-listing";
import { fetchZomatoListing } from "./zomato-listing";

/** Reads a Zomato or Swiggy listing link. */
export function fetchListing(raw: string): Promise<PlatformListing> {
  const link = parseListing(raw);
  if (link?.platform === "zomato") return fetchZomatoListing(raw);
  if (link?.platform === "swiggy") return fetchSwiggyListing(raw);
  return Promise.reject(new HttpError(400, "That isn't a Zomato or Swiggy restaurant link."));
}

// Picks an illustration until the owner adds a photo.
export function guessKind(name: string) {
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

const dishKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Saves what a listing page says: the rating, the listing details, and any profile
 * field the owner left empty. The menu is touched only the first time a platform is
 * read: an empty menu is imported whole; an existing one gets this platform's prices
 * and stock on matching dishes, and its other dishes added for this platform only.
 * Reading again later refreshes the rating and details, never the owner's menu.
 */
export async function applyListing(outlet: Outlet, listing: PlatformListing) {
  const { menu, ...rest } = listing;
  const p = listing.platform;
  const firstRead = !outlet.listingData[p];
  const fill = (current: string | null, next: string | null) => (current?.trim() ? current : (next ?? current));
  // A Dineout-only listing has just a dining (Google) rating; it's still this platform's rating.
  const delivery = listing.rating.delivery ?? listing.rating.dining;
  const [row] = await db
    .update(outlets)
    .set({
      listingData: { ...outlet.listingData, [p]: { ...rest, menuCount: menu.length } },
      listings: { ...outlet.listings, [p]: listing.url },
      ratings: delivery ? { ...outlet.ratings, [p]: { value: delivery.value, count: delivery.count, change: outlet.ratings[p]?.change ?? 0 } } : outlet.ratings,
      name: outlet.name === "My restaurant" ? listing.name : outlet.name,
      area: fill(outlet.area, listing.area) ?? "",
      city: fill(outlet.city, listing.city) ?? "",
      address: fill(outlet.address, listing.address) ?? "",
      cuisines: fill(outlet.cuisines, listing.cuisines.join(", ")) ?? "",
      fssai: fill(outlet.fssai, listing.fssai),
    })
    .where(eq(outlets.id, outlet.id))
    .returning();

  let imported = 0;
  let matched = 0;
  if (firstRead && menu.length) {
    const existing = await db.select().from(menuItems).where(eq(menuItems.outletId, outlet.id));
    const byName = new Map(existing.map((m) => [dishKey(m.name), m]));
    const fresh: typeof menu = [];
    for (const it of menu.slice(0, 300)) {
      const mine = byName.get(dishKey(it.name));
      if (!mine) {
        fresh.push(it);
        continue;
      }
      matched++;
      byName.delete(dishKey(it.name));
      await db
        .update(menuItems)
        .set({ price: { ...mine.price, [p]: it.price }, available: { ...mine.available, [p]: it.available }, photoUrl: mine.photoUrl ?? it.photo, description: mine.description || it.description })
        .where(and(eq(menuItems.id, mine.id), eq(menuItems.outletId, outlet.id)));
    }
    // The listing is the truth for its platform: dishes it doesn't have aren't sold there.
    for (const mine of byName.values()) {
      if (mine.available[p]) await db.update(menuItems).set({ available: { ...mine.available, [p]: false } }).where(eq(menuItems.id, mine.id));
    }
    if (fresh.length) {
      // With no menu yet, a dish is offered everywhere (except where the outlet is Dineout-only); otherwise only where it was found.
      const everywhere = existing.length === 0;
      await db.insert(menuItems).values(
        fresh.map((it, i) => ({
          outletId: outlet.id,
          name: it.name,
          category: it.category,
          kind: guessKind(it.name),
          veg: it.veg,
          bestseller: it.bestseller,
          description: it.description,
          photoUrl: it.photo,
          price: Object.fromEntries(PLATFORMS.map((q) => [q, it.price])) as Record<(typeof PLATFORMS)[number], number>,
          available: Object.fromEntries(PLATFORMS.map((q) => [q, q === p ? it.available : everywhere && !outlet.listingData[q]?.dineout && it.available])) as Record<(typeof PLATFORMS)[number], boolean>,
          sort: existing.length + i + 1,
        })),
      );
      imported = fresh.length;
    }
  }
  // A Dineout-only listing means no delivery menu on this platform.
  if (firstRead && listing.dineout && !menu.length) {
    for (const mine of await db.select().from(menuItems).where(eq(menuItems.outletId, outlet.id))) {
      if (mine.available[p]) await db.update(menuItems).set({ available: { ...mine.available, [p]: false } }).where(eq(menuItems.id, mine.id));
    }
  }
  await audit(outlet.id, `${p}-listing`, "listing.read", { url: listing.url, resId: listing.resId, rating: delivery?.value ?? null, menuImported: imported, menuMatched: matched });
  return { outlet: row, imported, matched };
}
