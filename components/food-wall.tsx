"use client";

// The backdrop for onboarding, after Airbnb's wall of city posters: a still grid of food photos in
// columns offset from each other, dimmed so the card in front stays the focus. It never moves, so
// nothing shifts behind the form while someone types. Decorative only.

const PHOTOS = [
  "/photos/in/thali.webp",
  "/photos/dish-pav-bhaji.webp",
  "/photos/in/dal-makhani.webp",
  "/photos/dish-samosa.webp",
  "/photos/in/pakoras.webp",
  "/photos/dish-biryani.webp",
  "/photos/dish-dosa.webp",
  "/photos/in/street-stall.webp",
  "/photos/dish-thali.webp",
  "/photos/in/home-cooking.webp",
  "/photos/dish-idli-vada.webp",
  "/photos/dish-butter-chicken.webp",
  "/photos/in/women-griddle.webp",
  "/photos/menu-chole-bhature.webp",
  "/photos/dish-curry-naan.webp",
  "/photos/menu-gajar-halwa.webp",
  "/photos/dish-tandoori.webp",
  "/photos/menu-paneer-tikka.webp",
];

const COLS = 7;

export function FoodWall() {
  const cols = Array.from({ length: COLS }, (_, c) => Array.from({ length: 5 }, (_, r) => PHOTOS[(c * 5 + r * 3 + c) % PHOTOS.length]));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute inset-x-[-6%] top-[-12%] flex justify-center gap-4 sm:gap-6">
        {cols.map((col, c) => (
          <div key={c} className="flex w-[150px] shrink-0 flex-col gap-4 sm:w-[210px] sm:gap-6" style={{ marginTop: `${c % 2 ? -110 : 0}px` }}>
            {col.map((src, r) => (
              <img key={r} src={src} alt="" loading="eager" className="aspect-[3/4] w-full rounded-[22px] object-cover" />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[#0d0f12]/70" />
    </div>
  );
}
