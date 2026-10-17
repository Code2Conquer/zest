// Reads an owner's Zomato or Swiggy listing link. Nothing is fetched: the link
// itself says the platform, the city and the restaurant's slug, which is enough
// to check it against the name the owner typed and to suggest their area.

import type { Platform } from "./platforms";

export type ListingLink = {
  platform: Platform;
  url: string;
  city: string | null;
  slug: string;
  /** What's left of the slug after the restaurant name, usually the locality. */
  areaHint: string | null;
  /** True when the slug starts with the restaurant name the owner typed. */
  nameMatches: boolean | null;
};

// Zomato's city segments that don't read well as a city name.
const CITY_NAMES: Record<string, string> = {
  ncr: "Delhi NCR",
  bangalore: "Bengaluru",
  mumbai: "Mumbai",
  pune: "Pune",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  jaipur: "Jaipur",
  lucknow: "Lucknow",
  chandigarh: "Chandigarh",
  indore: "Indore",
  kochi: "Kochi",
  goa: "Goa",
};

const title = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cityName = (segment: string) => CITY_NAMES[segment] ?? title(segment);

/** Parses a listing link, or returns null if it isn't a Zomato or Swiggy restaurant page. */
export function parseListing(raw: string, restaurantName = ""): ListingLink | null {
  let u: URL;
  try {
    u = new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p).toLowerCase());
  let platform: Platform;
  let city: string | null = null;
  let slug: string;
  let url: string;

  if (host === "zomato.com" || host.endsWith(".zomato.com")) {
    // /{city}/{slug}[/order|/info|/reviews…]
    if (parts.length < 2 || !/^[a-z0-9-]+$/.test(parts[1])) return null;
    platform = "zomato";
    city = parts[0];
    slug = parts[1];
    url = `https://www.zomato.com/${city}/${slug}`;
  } else if (host === "swiggy.com" || host.endsWith(".swiggy.com")) {
    // /restaurants/{slug}-{id} or /city/{city}/{slug}-rest{id}
    const i = parts.indexOf("restaurants");
    if (i >= 0 && parts[i + 1]) slug = parts[i + 1];
    else if (parts[0] === "city" && parts[2]) {
      city = parts[1];
      slug = parts[2];
    } else return null;
    platform = "swiggy";
    url = `https://www.swiggy.com${u.pathname}`.replace(/\/$/, "");
    slug = slug.replace(/-(?:rest)?\d+$/, "");
  } else return null;

  const name = slugify(restaurantName);
  const nameMatches = name ? slug === name || slug.startsWith(`${name}-`) : null;
  const rest = nameMatches ? slug.slice(name.length).replace(/^-/, "") : "";
  return {
    platform,
    url,
    city,
    slug,
    areaHint: rest ? title(rest) : null,
    nameMatches,
  };
}
