import "server-only";
import { parseListing } from "../listing";
import type { PlatformListing } from "../types";
import { HttpError } from "./approvals";
import { arr, cached, num, obj, relay, str, UA, via, type Json } from "./scrape";

// Reads a restaurant's Swiggy listing from the menu API Swiggy's mobile site uses.
// The web page sits behind a bot check; the API answers with the details, rating,
// FSSAI number and the full menu. It wants a location, but returns the menu even
// when that location is outside the delivery area, so a rough city centre is enough.

const CITY_CENTRES: Record<string, [number, number]> = {
  delhi: [28.6139, 77.209],
  gurgaon: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
};

const IMAGE = "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_300,h_300,c_fit/";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "1K+ ratings" -> 1000, "120 ratings" -> 120. */
function ratingCount(s: string) {
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*(k)?/i);
  return m ? Math.round(Number(m[1]) * (m[2] ? 1000 : 1)) : 0;
}

/** Swiggy repeats parts of the address ("A128, Shop 3, …, A128, Shop 3, …"); keep each part once. */
function tidyAddress(s: string) {
  const seen = new Set<string>();
  return s
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p && !/^floor\s*:\s*0$/i.test(p) && !seen.has(p.toLowerCase()) && seen.add(p.toLowerCase()))
    .join(", ");
}

/** Turns Swiggy's menu API response into the fields Zest uses. */
export function readSwiggy(data: Json, url: string): PlatformListing | null {
  const cards = arr(obj(data.data).cards).map(obj);
  const info = obj(cards.map((c) => obj(obj(c.card).card)).find((c) => str(c["@type"]).endsWith(".Restaurant"))?.info);
  if (!str(info.name)) return null;
  const groups = obj(obj(cards.find((c) => c.groupedCard)?.groupedCard).cardGroupMap);
  const regular = arr(obj(groups.REGULAR).cards).map((c) => obj(obj(obj(c).card).card));

  const menu: PlatformListing["menu"] = [];
  const addItems = (category: string, itemCards: unknown[]) => {
    for (const ic of itemCards) {
      const it = obj(obj(obj(ic).card).info);
      const name = str(it.name);
      const paise = num(it.price) ?? num(it.defaultPrice);
      if (!name || paise === null) continue;
      menu.push({
        name: name.slice(0, 80),
        category: (str(it.category) || category || "Menu").slice(0, 60),
        price: Math.round(paise / 100),
        description: str(it.description).slice(0, 600),
        veg: it.isVeg === 1 || str(obj(it.itemAttribute).vegClassifier) === "VEG",
        photo: str(it.imageId) ? IMAGE + str(it.imageId) : null,
        available: it.inStock !== 0,
        bestseller: /bestseller/i.test(str(obj(it.ribbon).text)) || it.isBestseller === true,
      });
    }
  };
  let fssai: string | null = null;
  let address = "";
  for (const c of regular) {
    const type = str(c["@type"]);
    if (type.endsWith(".ItemCategory")) addItems(str(c.title), arr(c.itemCards));
    else if (type.endsWith(".NestedItemCategory")) for (const sub of arr(c.categories).map(obj)) addItems(str(sub.title) || str(c.title), arr(sub.itemCards));
    else if (type.endsWith(".RestaurantLicenseInfo")) fssai = arr(c.text).map(str).join(" ").match(/\d{14}/)?.[0] ?? null;
    else if (type.endsWith(".RestaurantAddress")) address = str(c.completeAddress);
  }

  // Hours: one line when every day is the same, else one line per day.
  const days = arr(obj(obj(info.timingsInfo).outletTiming).infoList).map(obj);
  const slots = days.map((d) => str(d.subtitle));
  const hours = days.length === 7 && new Set(slots).size === 1 ? [`Mon-Sun ${slots[0]}`] : days.map((d) => `${str(d.title).slice(0, 3)} ${str(d.subtitle)}`);

  const value = num(info.avgRating) ?? num(info.avgRatingString);
  const [lat, lng] = str(info.latLong).split(",").map(Number);
  const closed = obj(obj(info.availability).restaurantClosedMeta);
  const label = (title: string) => str(obj(arr(info.labels).map(obj).find((l) => str(l.title) === title)).message);

  return {
    platform: "swiggy",
    resId: str(info.id),
    url,
    name: str(info.name),
    cuisines: arr(info.cuisines).map(str).filter(Boolean),
    rating: { delivery: value ? { value, count: ratingCount(str(info.totalRatingsString)) || (num(info.totalRatings) ?? 0) } : null, dining: null },
    address: tidyAddress(address || label("Address")),
    locality: [str(info.areaName) || str(info.locality), str(info.city)].filter(Boolean).join(", "),
    area: str(info.areaName) || str(info.locality),
    city: str(info.city),
    pincode: str(info.postalCode) || null,
    location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    phone: str(info.phone) || null,
    hours: hours.filter((h) => h.trim()),
    costForTwo: num(info.costForTwo) !== null ? Math.round(num(info.costForTwo)! / 100) : null,
    highlights: [info.veg === true ? "Pure veg" : "", ...arr(obj(info.aggregatedDiscountInfo).descriptionList).map((d) => str(obj(d).meta)).filter((m) => m && m !== "freedel")].filter(Boolean),
    status: str(closed.reason) && /permanent/i.test(str(closed.reason)) ? "closed" : "open",
    deliveryOnly: true,
    fssai,
    photos: str(info.cloudinaryImageId) ? [IMAGE + str(info.cloudinaryImageId)] : [],
    menu,
    fetchedAt: new Date().toISOString(),
  };
}

/** Fetches and reads a Swiggy listing link. Throws HttpError with a message the owner can act on. */
export async function fetchSwiggyListing(raw: string): Promise<PlatformListing> {
  const link = parseListing(raw);
  if (link?.platform !== "swiggy" || !link.id) throw new HttpError(400, "That isn't a Swiggy restaurant link.");
  const { url, id, city } = link;
  return cached(url, async () => {
    const [lat, lng] = CITY_CENTRES[city ?? ""] ?? CITY_CENTRES.delhi;
    const api = `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${id}`;
    let res: Response;
    try {
      res = await fetch(via(api), { headers: relay ? { Accept: "application/json" } : { "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-IN,en;q=0.9" }, signal: AbortSignal.timeout(12_000) });
    } catch {
      throw new HttpError(502, "Couldn't reach Swiggy just now. Try again in a minute.");
    }
    const data = res.ok ? obj(await res.json().catch(() => null)) : null;
    if (!data || !arr(obj(data.data).cards).length) {
      console.warn("swiggy listing unavailable", url, res.status);
      throw new HttpError(502, res.status === 403 || res.status === 202 ? "Swiggy didn't let our server read the page right now." : `Swiggy didn't return the restaurant (${res.status}). Try again in a minute.`);
    }
    const listing = readSwiggy(data, url);
    if (!listing) throw new HttpError(404, "Swiggy has no restaurant at that link. Check it and try again.");
    return listing;
  });
}
