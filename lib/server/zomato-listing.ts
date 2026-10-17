import "server-only";
import { parseListing } from "../listing";
import type { ZomatoListing } from "../types";
import { HttpError } from "./approvals";

// Reads a restaurant's public Zomato pages from the state they render from: the
// main page has the details (cost for two, highlights), the order page has the
// ratings, FSSAI number and the full delivery menu. Both are fetched together.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
// What Chrome sends for a top-level page load.
const BROWSER_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Google Chrome";v="141", "Chromium";v="141", "Not.A/Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};
const CACHE_MS = 10 * 60_000;

// Zomato blocks data-centre IPs (Vercel, AWS). ZOMATO_FETCH_VIA routes the requests
// through a scraping relay instead, as a URL template with {url} for the page, e.g.
//   https://api.scraperapi.com/?api_key=KEY&country_code=in&url={url}
const relay = process.env.ZOMATO_FETCH_VIA?.trim();
const via = (url: string) => (relay ? relay.replace("{url}", encodeURIComponent(url)) : url);
const cache = new Map<string, { at: number; data: ZomatoListing }>();

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number.parseFloat(str(v));
  return Number.isFinite(n) ? n : null;
};

/** Pulls the page's preloaded state out of the HTML. */
export function preloadedState(html: string): Json | null {
  const m = html.match(/__PRELOADED_STATE__\s*=\s*JSON\.parse\(("(?:[^"\\]|\\.)*")\)/);
  if (!m) return null;
  try {
    return obj(JSON.parse(JSON.parse(m[1]) as string));
  } catch {
    return null;
  }
}

const restaurantPage = (state: Json) => {
  const pages = obj(obj(state.pages).restaurant);
  const resId = Object.keys(pages)[0];
  return resId ? { resId, page: obj(pages[resId]) } : null;
};

/** Turns the state of a restaurant's main and/or order page into the fields Zest uses. */
export function readListing(states: Json[], url: string): ZomatoListing | null {
  const found = states.map((s) => ({ state: s, ...restaurantPage(s) })).filter((p) => p.resId);
  if (!found.length) return null;
  const resId = found[0].resId!;
  // Sections from every page, the menu from whichever page has it.
  const sections: Json = Object.assign({}, ...found.map((p) => obj(obj(p.page).sections)));
  const page = obj(found.find((p) => obj(obj(p.page).order).menuList)?.page);
  const state: Json = { entities: Object.assign({}, ...found.map((p) => obj(p.state.entities))) };
  const basic = obj(sections.SECTION_BASIC_INFO);
  const contact = obj(sections.SECTION_RES_CONTACT);
  const details = obj(sections.SECTION_RES_DETAILS);
  if (!str(basic.name)) return null;

  const ratings = obj(obj(basic.rating_new).ratings);
  const rating = (k: string) => {
    const r = obj(ratings[k]);
    const value = num(r.rating);
    return value ? { value, count: num(r.reviewCount) ?? 0 } : null;
  };

  const menuList = obj(obj(page.order).menuList);
  const menu: ZomatoListing["menu"] = [];
  for (const m of arr(menuList.menus)) {
    const section = obj(obj(m).menu);
    for (const c of arr(section.categories)) {
      const cat = obj(obj(c).category);
      const category = str(cat.name) || str(section.name) || "Menu";
      for (const i of arr(cat.items)) {
        const it = obj(obj(i).item);
        const name = str(it.name);
        const price = num(it.default_price) ?? num(it.price);
        if (!name || price === null) continue;
        const tags = arr(it.tag_slugs).map(str);
        const diet = arr(it.dietary_slugs).map(str);
        menu.push({
          name: name.slice(0, 80),
          category: category.slice(0, 60),
          price: Math.round(price),
          description: str(it.desc).slice(0, 600),
          veg: diet.includes("veg") || (!diet.includes("non-veg") && !diet.includes("egg") && tags.includes("veg")),
          photo: str(it.item_image_url) || null,
          available: str(it.item_state) !== "unavailable" && str(it.item_state) !== "out_of_stock",
          bestseller: tags.some((t) => t.includes("bestseller") || t.includes("must-try")),
        });
      }
    }
  }

  const cuisines = str(basic.cuisine_string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const timing = obj(basic.timing);
  const hours = arr(obj(timing.customised_timings).opening_hours).map((h) => `${str(obj(h).days)} ${str(obj(h).timing)}`.trim());
  const cft = str(obj(arr(obj(details.CFT_DETAILS).cfts)[0]).title);
  const fssai = str(obj(menuList.fssaiInfo).text).match(/\d{14}/)?.[0] ?? null;
  const images = obj(obj(state.entities).IMAGES);
  const photoIds = arr(obj(arr(obj(sections.SECTION_IMAGE_CAROUSEL).entities)[0]).entity_ids).map(str);
  const photos = photoIds.map((id) => str(obj(images[id]).url)).filter(Boolean).slice(0, 6);
  const status = basic.is_perm_closed ? "closed" : basic.is_temp_closed ? "temporarily_closed" : "open";
  const locality = str(contact.locality_verbose);

  return {
    resId,
    url,
    name: str(basic.name),
    cuisines,
    rating: { delivery: rating("DELIVERY"), dining: rating("DINING") },
    address: str(contact.address),
    locality,
    area: locality.split(",")[0]?.trim() ?? "",
    city: str(contact.city_name),
    pincode: str(contact.zipcode) || null,
    location: num(contact.latitude) !== null && num(contact.longitude) !== null ? { lat: num(contact.latitude)!, lng: num(contact.longitude)! } : null,
    phone: str(obj(contact.phoneDetails).phoneStr) || null,
    hours: hours.length ? hours : str(timing.timing_desc) ? [str(timing.timing_desc)] : [],
    costForTwo: num(cft.replace(/[^\d]/g, "")),
    highlights: arr(obj(details.HIGHLIGHTS).highlights)
      .filter((h) => str(obj(h).type) === "AVAILABLE")
      .map((h) => str(obj(h).text))
      .filter(Boolean),
    status,
    deliveryOnly: !!basic.is_delivery_only,
    fssai,
    photos,
    menu,
    fetchedAt: new Date().toISOString(),
  };
}

/** Follows a zoma.to share link to the restaurant's zomato.com page. */
async function resolveShortLink(url: string) {
  const fail = new HttpError(400, "Couldn't open that share link. Paste the full zomato.com link from your browser instead.");
  try {
    // Only the final address matters, so a blocked (403) landing page is fine.
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(10_000) });
    const link = parseListing(res.url);
    if (link?.platform !== "zomato" || link.short) throw fail;
    return link;
  } catch {
    throw fail;
  }
}

/** Fetches and reads a Zomato listing link. Throws HttpError with a message the owner can act on. */
export async function fetchZomatoListing(raw: string): Promise<ZomatoListing> {
  let link = parseListing(raw);
  if (link?.platform !== "zomato") throw new HttpError(400, "That isn't a Zomato restaurant link.");
  if (link.short) link = await resolveShortLink(link.url);
  const hit = cache.get(link.url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const path = new URL(link.url).pathname;
  // The page itself, or failing that the JSON route Zomato's own web app loads pages from.
  const page = async (suffix: string) => {
    const res = await fetch(via(`${link.url}${suffix}`), { headers: relay ? { Accept: "text/html" } : BROWSER_HEADERS, signal: AbortSignal.timeout(12_000), redirect: "follow" });
    const state = res.ok ? preloadedState(await res.text()) : null;
    if (state || res.status === 404) return { status: res.status, state };
    const api = await fetch(via(`https://www.zomato.com/webroutes/getPage?page_url=${encodeURIComponent(path + suffix)}&location=&isMobile=0`), {
      headers: relay ? { Accept: "application/json" } : { ...BROWSER_HEADERS, Accept: "application/json", "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-origin", Referer: link.url },
      signal: AbortSignal.timeout(12_000),
    });
    const data = api.ok ? obj(await api.json().catch(() => null)) : {};
    const resId = str(obj(data.page_info).resId);
    return {
      status: api.ok ? api.status : res.status,
      state: resId && data.page_data ? { pages: { restaurant: { [resId]: data.page_data } }, entities: data.entities } : null,
      tried: `${res.status}/${api.status}`,
    };
  };
  const [main, order] = await Promise.allSettled([page(""), page("/order")]);
  const got = [main, order].flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (!got.length) throw new HttpError(502, "Couldn't reach Zomato just now. Try again in a minute.");
  if (got.every((g) => g.status === 404)) throw new HttpError(404, "Zomato says that page doesn't exist. Check the link.");
  const states = got.flatMap((g) => (g.state ? [g.state] : []));
  if (!states.length) {
    console.warn("zomato listing blocked", link.url, got.map((g) => ("tried" in g ? g.tried : g.status)));
    const blocked = got.every((g) => g.status === 403);
    throw new HttpError(
      502,
      blocked ? "Zomato didn't let our server read the page right now." : `Zomato didn't return the page (${got.map((g) => ("tried" in g ? g.tried : g.status)).join(", ")}). Try again in a minute.`,
    );
  }
  const data = readListing(states, link.url);
  if (!data) throw new HttpError(422, "Couldn't read that Zomato page. Is it a restaurant page?");
  cache.set(link.url, { at: Date.now(), data });
  return data;
}
