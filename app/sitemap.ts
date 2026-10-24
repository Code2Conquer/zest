import type { MetadataRoute } from "next";
import { ready } from "@/lib/server/db";
import { listStorefronts } from "@/lib/server/storefront";
import { siteUrl } from "@/lib/server/site";

// The two landing pages, the legal pages and every seller taking orders on its own page.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const shops = await ready()
    .then(listStorefronts)
    .catch(() => []);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/restaurants`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...shops.map((s) => ({ url: `${base}/r/${s.slug}`, changeFrequency: "daily" as const, priority: 0.8 }))];
}
