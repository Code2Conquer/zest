"use client";

// The backdrop for onboarding, after Airbnb's wall of city posters: a still grid of food photos in
// columns offset from each other, dimmed so the card in front stays the focus. It never moves, so
// nothing shifts behind the form while someone types. Decorative only.

// 32 different photos (Unsplash, sources in public/photos/wall/credits.json), so no dish shows twice.
const PHOTOS = Array.from({ length: 32 }, (_, i) => `/photos/wall/w${String(i + 1).padStart(2, "0")}.webp`);

const COLS = 8;
const ROWS = 4;

export function FoodWall() {
  const cols = Array.from({ length: COLS }, (_, c) => PHOTOS.slice(c * ROWS, c * ROWS + ROWS));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute inset-x-[-6%] top-[-8%] flex justify-center gap-4 sm:gap-6">
        {cols.map((col, c) => (
          <div key={c} className="flex w-[150px] shrink-0 flex-col gap-4 sm:w-[210px] sm:gap-6" style={{ marginTop: `${c % 2 ? -110 : 0}px` }}>
            {col.map((src, r) => (
              <img key={r} src={src} alt="" decoding="async" className="aspect-[3/4] w-full rounded-[22px] bg-[#23272d] object-cover" />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[#0d0f12]/45 [background-image:radial-gradient(ellipse_at_center,rgba(13,15,18,0.75)_0%,rgba(13,15,18,0.35)_60%,rgba(13,15,18,0.2)_100%)]" />
    </div>
  );
}
