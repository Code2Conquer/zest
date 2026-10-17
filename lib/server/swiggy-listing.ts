import "server-only";
import { parseListing } from "../listing";
import type { PlatformListing } from "../types";
import { HttpError } from "./approvals";
import { arr, cached, num, obj, relay, str, UA, via, type Json } from "./scrape";

// Reads a restaurant's Swiggy listing. Delivery listings come from the menu API
// Swiggy's mobile site uses (the desktop page sits behind a bot check): details,
// rating, FSSAI number and the full menu. It wants a location, but returns the menu
// even outside the delivery area, so a rough city centre is enough. Dineout (table
// booking) listings have no dish list; their page, which loads for a mobile browser,
// carries the details, Google rating, amenities and popular dishes.

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
const DINEOUT_IMAGE = "https://dineout-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600/";
const MOBILE_UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";

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
    hours: hoursFrom(info.timingsInfo),
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

/** Condenses Swiggy's seven-day timings list. */
function hoursFrom(timingsInfo: unknown) {
  const days = arr(obj(obj(timingsInfo).outletTiming).infoList).map(obj);
  const slots = days.map((d) => str(d.subtitle));
  const hours = days.length === 7 && new Set(slots).size === 1 ? [`Mon-Sun ${slots[0]}`] : days.map((d) => `${str(d.title).slice(0, 3)} ${str(d.subtitle)}`);
  return hours.filter((h) => h.trim());
}

/** Reads a Dineout page: its Next.js page data plus the schema.org block. */
export function readDineout(html: string, url: string): PlatformListing | null {
  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  let cards: Json[] = [];
  try {
    cards = arr(obj(obj(obj(obj(JSON.parse(next ?? "{}")).props).pageProps).widgetResponse).cards).map((c) => obj(obj(obj(c).card).card));
  } catch {
    return null;
  }
  let ld: Json = {};
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = obj(JSON.parse(m[1]));
      if (str(j["@type"]) === "Restaurant") ld = j;
    } catch {}
  }
  const masthead = cards.find((c) => str(c["@type"]).endsWith(".EntityInfoWithMasthead"));
  const info = obj(masthead?.info);
  const name = str(info.name) || str(ld.name);
  if (!name) return null;

  const location = obj(info.locationInfo);
  const attrs = obj(obj(info.entityAttributes).restaurantEntityAttributes);
  const ratings = obj(info.ratingsInfo);
  const aggregate = obj(ld.aggregateRating);
  const value = num(ratings.value) ?? num(aggregate.ratingValue);
  const count = num(ratings.count) ?? num(aggregate.reviewCount) ?? 0;
  const highlights = (title: RegExp) => arr(cards.find((c) => str(c["@type"]).endsWith(".RestaurantHighlights") && title.test(str(c.title)))?.element).map(str).filter(Boolean);
  const text = (title: string) => str(obj(cards.find((c) => str(c["@type"]).endsWith(".TextInfoWidget") && str(obj(c.title).info) === title)?.description).info);
  // "12615.3 km • B 14/1-6, Middle Circle, Connaught Place, 110001": drop the distance from wherever we asked.
  const address = text("Location").replace(/^[\d.]+\s*km\s*•\s*/, "") || str(location.formattedAddress);
  const cuisines = (text("Cuisines") || arr(attrs.cuisines).map(str).join(", ") || arr(ld.servesCuisine).map(str).join(", ")).split(",").map((c) => c.trim()).filter(Boolean);
  const photos = arr(obj(cards.find((c) => str(c["@type"]).endsWith(".StaggeredGrid"))).info)
    .map((p) => str(obj(obj(p).imageCardInfo).imageId))
    .filter(Boolean)
    .map((id) => DINEOUT_IMAGE + id);
  const lat = num(location.lat);
  const lng = num(location.long);
  const ldAddress = obj(ld.address);
  const area = address.split(",").map((p) => p.trim()).filter((p) => p && !/^\d{6}$/.test(p)).at(-1) ?? "";
  const phone = str(ld.telephone).replace(/[^\d+]/g, "") || str(arr(obj(info.callDetail).actions).map(obj)[0]?.text) || null;

  return {
    platform: "swiggy",
    resId: str(masthead?.id) || (url.match(/(\d+)\/dineout/)?.[1] ?? ""),
    url,
    name,
    cuisines,
    rating: { delivery: null, dining: value ? { value, count } : null },
    address,
    locality: [area, str(obj(location.city).name)].filter(Boolean).join(", "),
    area,
    city: str(obj(location.city).name) || str(ldAddress.addressLocality),
    pincode: str(ldAddress.postalCode) || address.match(/\b\d{6}\b/)?.[0] || null,
    location: lat !== null && lng !== null ? { lat, lng } : null,
    phone,
    hours: hoursFrom(info.timingsInfo),
    costForTwo: num((str(attrs.costForTwo) || str(ld.priceRange)).replace(/[^\d]/g, "")),
    highlights: highlights(/amenities/i),
    status: "open",
    deliveryOnly: false,
    dineout: true,
    popularDishes: highlights(/popular dishes/i),
    fssai: null,
    photos: photos.length ? photos.slice(0, 6) : str(ld.image) ? [str(ld.image)] : [],
    menu: [],
    fetchedAt: new Date().toISOString(),
  };
}

async function loadDineout(url: string): Promise<PlatformListing> {
  let res: Response;
  try {
    res = await fetch(via(url), { headers: relay ? { Accept: "text/html" } : { "User-Agent": MOBILE_UA, Accept: "text/html", "Accept-Language": "en-IN,en;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(12_000) });
  } catch {
    throw new HttpError(502, "Couldn't reach Swiggy just now. Try again in a minute.");
  }
  if (res.status === 404) throw new HttpError(404, "Swiggy says that page doesn't exist. Check the link.");
  const listing = res.ok ? readDineout(await res.text(), url) : null;
  if (!listing) {
    console.warn("swiggy dineout unavailable", url, res.status);
    throw new HttpError(502, res.status === 403 || res.status === 202 ? "Swiggy didn't let our server read the page right now." : `Couldn't read that Swiggy Dineout page (${res.status}).`);
  }
  return listing;
}

/** Fetches and reads a Swiggy listing link. Throws HttpError with a message the owner can act on. */
export async function fetchSwiggyListing(raw: string): Promise<PlatformListing> {
  const link = parseListing(raw);
  if (link?.platform !== "swiggy" || !link.id) throw new HttpError(400, "That isn't a Swiggy restaurant link.");
  const { url, id, city } = link;
  if (link.dineout) return cached(url, () => loadDineout(url));
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
    // No delivery menu for this id: it may be a Dineout-only restaurant.
    if (data && res.ok && !arr(obj(data.data).cards).length) return loadDineout(`https://www.swiggy.com/restaurants/${id}/dineout`);
    if (!data || !arr(obj(data.data).cards).length) {
      console.warn("swiggy listing unavailable", url, res.status);
      throw new HttpError(502, res.status === 403 || res.status === 202 ? "Swiggy didn't let our server read the page right now." : `Swiggy didn't return the restaurant (${res.status}). Try again in a minute.`);
    }
    const listing = readSwiggy(data, url);
    if (!listing) throw new HttpError(404, "Swiggy has no restaurant at that link. Check it and try again.");
    return listing;
  });
}
