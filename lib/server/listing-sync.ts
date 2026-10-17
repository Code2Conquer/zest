import "server-only";
import { count, eq } from "drizzle-orm";
import type { ZomatoListing } from "../types";
import { audit } from "./approvals";
import { db } from "./db";
import { menuItems, outlets, type Outlet } from "./schema";

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

/**
 * Saves what the Zomato page says: the rating, the listing details, and any
 * profile field the owner left empty. Imports the menu only if the outlet has none,
 * so dishes the owner already manages are never overwritten.
 */
export async function applyZomatoListing(outlet: Outlet, listing: ZomatoListing) {
  const { menu, ...rest } = listing;
  const fill = (current: string | null, next: string | null) => (current?.trim() ? current : (next ?? current));
  const delivery = listing.rating.delivery;
  const [row] = await db
    .update(outlets)
    .set({
      listingData: { ...outlet.listingData, zomato: { ...rest, menuCount: menu.length } },
      listings: { ...outlet.listings, zomato: listing.url },
      ratings: delivery ? { ...outlet.ratings, zomato: { value: delivery.value, count: delivery.count, change: outlet.ratings.zomato?.change ?? 0 } } : outlet.ratings,
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
  const [{ n }] = await db.select({ n: count() }).from(menuItems).where(eq(menuItems.outletId, outlet.id));
  if (n === 0 && menu.length) {
    await db.insert(menuItems).values(
      menu.slice(0, 300).map((it, i) => ({
        outletId: outlet.id,
        name: it.name,
        category: it.category,
        kind: guessKind(it.name),
        veg: it.veg,
        bestseller: it.bestseller,
        description: it.description,
        photoUrl: it.photo,
        price: { zomato: it.price, swiggy: it.price },
        available: { zomato: it.available, swiggy: it.available },
        sort: i + 1,
      })),
    );
    imported = Math.min(menu.length, 300);
  }
  await audit(outlet.id, "zomato-listing", "listing.read", { url: listing.url, resId: listing.resId, rating: delivery?.value ?? null, menuImported: imported });
  return { outlet: row, imported };
}
