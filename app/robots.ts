import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/r/"], disallow: ["/app", "/api", "/m/", "/login", "/join", "/start", "/connect"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
