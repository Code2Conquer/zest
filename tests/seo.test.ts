import { describe, expect, it } from "vitest";
import { storefrontJsonLd, storefrontMeta } from "@/lib/seo";

const shop = {
  name: "Rasoi 27",
  area: "Indiranagar, Bengaluru",
  locality: "Indiranagar",
  address: "100 Feet Rd, Indiranagar, Bengaluru",
  cuisines: ["North Indian", "Biryani"],
  costForTwo: { amount: 600, estimated: false },
  photos: ["/photos/menu-paneer-tikka.webp"],
  menu: [
    { name: "Paneer tikka", category: "Starters", description: "Charred in the tandoor", price: 289, photo: "/photos/menu-paneer-tikka.webp", veg: true },
    { name: "Dal makhani", category: "Main course", description: "", price: 249, photo: null, veg: true },
  ],
};

describe("storefrontMeta", () => {
  it("titles the page with the name, 'order online' and the locality", () => {
    expect(storefrontMeta(shop).title).toBe("Rasoi 27, Indiranagar · Order online");
  });

  it("describes cuisines, area and cost for two", () => {
    expect(storefrontMeta(shop).description).toBe("Order North Indian and Biryani from Rasoi 27 in Indiranagar, Bengaluru. About ₹600 for two. Pick up or order at your table.");
  });

  it("leaves out what the restaurant hasn't told us", () => {
    const d = storefrontMeta({ ...shop, cuisines: [], costForTwo: null, area: "" }).description;
    expect(d).toBe("Order from Rasoi 27. Pick up or order at your table.");
  });
});

describe("storefrontJsonLd", () => {
  const ld = storefrontJsonLd(shop, "https://zest.example/r/rasoi-27");

  it("marks the page up as a Restaurant with absolute image URLs", () => {
    expect(ld["@type"]).toBe("Restaurant");
    expect(ld.url).toBe("https://zest.example/r/rasoi-27");
    expect(ld.image).toEqual(["https://zest.example/photos/menu-paneer-tikka.webp"]);
    expect(ld.servesCuisine).toEqual(["North Indian", "Biryani"]);
    expect(ld.address).toEqual({ "@type": "PostalAddress", streetAddress: "100 Feet Rd, Indiranagar, Bengaluru", addressLocality: "Indiranagar", addressCountry: "IN" });
  });

  it("groups the menu into sections with prices in rupees", () => {
    const sections = ld.hasMenu.hasMenuSection;
    expect(sections.map((s) => s.name)).toEqual(["Starters", "Main course"]);
    expect(sections[0].hasMenuItem[0]).toEqual({
      "@type": "MenuItem",
      name: "Paneer tikka",
      description: "Charred in the tandoor",
      image: "https://zest.example/photos/menu-paneer-tikka.webp",
      suitableForDiet: "https://schema.org/VegetarianDiet",
      offers: { "@type": "Offer", price: "289", priceCurrency: "INR" },
    });
    expect(sections[1].hasMenuItem[0]).not.toHaveProperty("description");
    expect(sections[1].hasMenuItem[0]).not.toHaveProperty("image");
  });
});
