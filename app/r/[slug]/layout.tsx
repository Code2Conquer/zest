import type { Metadata } from "next";
import { storefrontJsonLd, storefrontMeta } from "@/lib/seo";
import { siteUrl } from "@/lib/server/site";
import { getStorefront } from "@/lib/server/storefront";

// The ordering page itself is interactive (client); this server layout gives it what search engines
// read: a real title and description, a preview image, and the restaurant and menu as schema.org data.

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

async function load(slug: string) {
  try {
    return await getStorefront(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const shop = await load(slug);
  if (!shop) return { title: "Restaurant not found · Zest" };
  const { title, description } = storefrontMeta(shop);
  const url = `${siteUrl()}/r/${slug}`;
  return {
    title,
    description,
    // The sample restaurant is for trying Zest, not for search results.
    ...(shop.isDemo ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: shop.photos.slice(0, 1).map((p) => new URL(p, url).toString()) },
  };
}

export default async function StorefrontLayout({ params, children }: Props) {
  const { slug } = await params;
  const shop = await load(slug);
  return (
    <>
      {shop && !shop.isDemo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storefrontJsonLd(shop, `${siteUrl()}/r/${slug}`)).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}
