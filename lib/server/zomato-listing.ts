import "server-only";
import { parseListing } from "../listing";
import type { PlatformListing } from "../types";
import { HttpError } from "./approvals";
import { arr, BROWSER_HEADERS, cached, num, obj, relay, str, UA, via, type Json } from "./scrape";

// Reads a restaurant's public Zomato pages from the state they render from: the
// main page has the details (cost for two, highlights), the order page has the
// ratings, FSSAI number and the full delivery menu. Both are fetched together.

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
export function readListing(states: Json[], url: string): PlatformListing | null {
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
  const menu: PlatformListing["menu"] = [];
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
    platform: "zomato",
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
export async function fetchZomatoListing(raw: string): Promise<PlatformListing> {
  let link = parseListing(raw);
  if (link?.platform !== "zomato") throw new HttpError(400, "That isn't a Zomato restaurant link.");
  if (link.short) link = await resolveShortLink(link.url);
  const { url } = link;
  return cached(url, () => loadZomato(url));
}

async function loadZomato(url: string): Promise<PlatformListing> {
  const path = new URL(url).pathname;
  // The page itself, or failing that the JSON route Zomato's own web app loads pages from.
  const page = async (suffix: string) => {
    const res = await fetch(via(`${url}${suffix}`), { headers: relay ? { Accept: "text/html" } : BROWSER_HEADERS, signal: AbortSignal.timeout(12_000), redirect: "follow" });
    const state = res.ok ? preloadedState(await res.text()) : null;
    if (state || res.status === 404) return { status: res.status, state };
    const api = await fetch(via(`https://www.zomato.com/webroutes/getPage?page_url=${encodeURIComponent(path + suffix)}&location=&isMobile=0`), {
      headers: relay ? { Accept: "application/json" } : { ...BROWSER_HEADERS, Accept: "application/json", "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-origin", Referer: url },
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
    console.warn("zomato listing blocked", url, got.map((g) => ("tried" in g ? g.tried : g.status)));
    const blocked = got.every((g) => g.status === 403);
    throw new HttpError(
      502,
      blocked ? "Zomato didn't let our server read the page right now." : `Zomato didn't return the page (${got.map((g) => ("tried" in g ? g.tried : g.status)).join(", ")}). Try again in a minute.`,
    );
  }
  const data = readListing(states, url);
  if (!data) throw new HttpError(422, "Couldn't read that Zomato page. Is it a restaurant page?");
  return data;
}
