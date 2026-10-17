import "server-only";

// Shared by the listing readers (zomato-listing.ts, swiggy-listing.ts).

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

// What Chrome sends for a top-level page load.
export const BROWSER_HEADERS = {
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

// Zomato and Swiggy can block data-centre IPs (Vercel, AWS). LISTING_FETCH_VIA routes
// the requests through a scraping relay instead, as a URL template with {url}, e.g.
//   https://api.scraperapi.com/?api_key=KEY&country_code=in&url={url}
export const relay = process.env.LISTING_FETCH_VIA?.trim() || process.env.ZOMATO_FETCH_VIA?.trim();
export const via = (url: string) => (relay ? relay.replace("{url}", encodeURIComponent(url)) : url);

export type Json = Record<string, unknown>;
export const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
export const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number.parseFloat(str(v));
  return Number.isFinite(n) ? n : null;
};

const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

/** Remembers a successful read for ten minutes, so retyping a link doesn't refetch it. */
export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data as T;
  const data = await load();
  cache.set(key, { at: Date.now(), data });
  return data;
}
