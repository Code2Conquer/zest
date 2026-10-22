// What search engines read about a restaurant's own page: the title and description in results, and
// schema.org markup (Restaurant with its menu) so Google can show the dishes and prices.

export type SeoShop = {
  name: string;
  area: string;
  locality: string;
  address: string;
  cuisines: string[];
  costForTwo: { amount: number; estimated: boolean } | null;
  photos: string[];
  menu: { name: string; category: string; description: string; price: number; photo: string | null; veg: boolean }[];
};

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function storefrontMeta(s: SeoShop) {
  const where = s.locality ? `, ${s.locality}` : "";
  const what = s.cuisines.length ? `Order ${list(s.cuisines.slice(0, 3))} from ${s.name}` : `Order from ${s.name}`;
  const parts = [`${what}${s.area ? ` in ${s.area}` : ""}.`];
  if (s.costForTwo) parts.push(`About ₹${s.costForTwo.amount.toLocaleString("en-IN")} for two.`);
  parts.push("Pick up or order at your table.");
  return { title: `${s.name}${where} · Order online`, description: parts.join(" ") };
}

export function storefrontJsonLd(s: SeoShop, url: string) {
  const abs = (p: string) => new URL(p, url).toString();
  const sections = new Map<string, SeoShop["menu"]>();
  for (const m of s.menu) sections.set(m.category, [...(sections.get(m.category) ?? []), m]);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: s.name,
    url,
    image: s.photos.map(abs),
    servesCuisine: s.cuisines,
    ...(s.address ? { address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.locality || undefined, addressCountry: "IN" } } : {}),
    ...(s.costForTwo ? { priceRange: `₹${s.costForTwo.amount} for two` } : {}),
    acceptsReservations: false,
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: [...sections].map(([name, items]) => ({
        "@type": "MenuSection",
        name,
        hasMenuItem: items.map((m) => ({
          "@type": "MenuItem",
          name: m.name,
          ...(m.description ? { description: m.description } : {}),
          ...(m.photo ? { image: abs(m.photo) } : {}),
          ...(m.veg ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
          offers: { "@type": "Offer", price: String(m.price), priceCurrency: "INR" },
        })),
      })),
    },
  };
}
