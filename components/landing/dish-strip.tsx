"use client";

import { useApp } from "@/lib/state";

const DISHES = [
  { photo: "dish-biryani", name: { en: "Chicken dum biryani", hi: "चिकन दम बिरयानी" }, zomato: 329, swiggy: 319 },
  { photo: "dish-butter-chicken", name: { en: "Butter chicken", hi: "बटर चिकन" }, zomato: 349, swiggy: 349 },
  { photo: "dish-dosa", name: { en: "Masala dosa", hi: "मसाला डोसा" }, zomato: 149, swiggy: 139 },
  { photo: "dish-samosa", name: { en: "Punjabi samosa", hi: "पंजाबी समोसा" }, zomato: 59, swiggy: 59 },
  { photo: "dish-pav-bhaji", name: { en: "Butter pav bhaji", hi: "बटर पाव भाजी" }, zomato: 179, swiggy: 169 },
  { photo: "dish-kebab", name: { en: "Chicken seekh kebab", hi: "चिकन सीख कबाब" }, zomato: 289, swiggy: 289 },
  { photo: "dish-idli-vada", name: { en: "Idli vada sambar", hi: "इडली वड़ा सांभर" }, zomato: 119, swiggy: 109 },
  { photo: "dish-curry-naan", name: { en: "Mutton rogan josh", hi: "मटन रोगन जोश" }, zomato: 429, swiggy: 419 },
  { photo: "dish-tandoori", name: { en: "Tandoori chicken", hi: "तंदूरी चिकन" }, zomato: 399, swiggy: 389 },
  { photo: "dish-thali", name: { en: "South Indian meals", hi: "साउथ इंडियन मील्स" }, zomato: 249, swiggy: 249 },
];

/** A slow, endless strip of real dishes, each with its price on both platforms. */
export function DishStrip() {
  const { pick, lang } = useApp();
  const row = [...DISHES, ...DISHES];
  return (
    <div className="marquee group relative overflow-hidden" aria-label={lang === "hi" ? "डिश के उदाहरण" : "Example dishes"}>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent" />
      <ul className="marquee-track flex w-max gap-5 py-2">
        {row.map((d, i) => (
          <li key={i} aria-hidden={i >= DISHES.length} className="w-[250px] shrink-0">
            <div className="overflow-hidden rounded-2xl bg-sunken shadow-[0_18px_30px_-22px_rgba(0,0,0,0.55)]">
              <img src={`/photos/${d.photo}.webp`} alt={i < DISHES.length ? pick(d.name) : ""} width={520} height={390} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            </div>
            <p className="mt-3 font-medium">{pick(d.name)}</p>
            <p className="mt-0.5 flex items-center gap-3 text-sm text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-full bg-[var(--ch-zomato)]" />₹{d.zomato}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-full bg-[var(--ch-swiggy)]" />₹{d.swiggy}
              </span>
              <span className="ml-auto rounded-full bg-leaf-soft px-2 py-0.5 text-[0.72rem] font-medium text-leaf">{lang === "hi" ? "स्टॉक में" : "In stock"}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
