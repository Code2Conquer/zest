import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, ready } from "@/lib/server/db";
import { dinePrice } from "@/lib/server/dining";
import { menuItems, outlets } from "@/lib/server/schema";

// The page a guest's phone opens from the table QR code: the dine-in menu, read-only.

async function load(outletId: string) {
  await ready();
  const [outlet] = await db.select().from(outlets).where(eq(outlets.id, outletId));
  if (!outlet) return null;
  const menu = await db.select().from(menuItems).where(eq(menuItems.outletId, outletId)).orderBy(asc(menuItems.sort));
  return { outlet, menu };
}

export async function generateMetadata({ params }: { params: Promise<{ outletId: string }> }): Promise<Metadata> {
  const data = await load((await params).outletId);
  return { title: data ? `${data.outlet.name} · Menu` : "Menu" };
}

export default async function TableMenu({ params }: { params: Promise<{ outletId: string }> }) {
  const data = await load((await params).outletId);
  if (!data) notFound();
  const { outlet, menu } = data;
  const categories = [...new Set(menu.map((m) => m.category))];

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="bg-curry px-5 pb-6 pt-8 text-[#f4efe6]">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-[#f4efe6]/60">{outlet.area || outlet.city}</p>
          <h1 className="font-sign mt-1 text-[2.2rem] leading-none">{outlet.name}</h1>
          {outlet.cuisines && <p className="mt-2 text-[#f4efe6]/75">{outlet.cuisines}</p>}
        </div>
      </header>
      <nav aria-label="Categories" className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <ul className="mx-auto flex max-w-xl gap-2 overflow-x-auto px-5 py-3 text-sm">
          {categories.map((c) => (
            <li key={c}>
              <a href={`#${encodeURIComponent(c)}`} className="block whitespace-nowrap rounded-full bg-surface px-3.5 py-1.5 shadow-[0_0_0_1px_var(--line)]">
                {c}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto max-w-xl px-5 pb-16">
        {menu.length === 0 && <p className="py-16 text-center text-muted">The menu is being updated. Please ask your server.</p>}
        {categories.map((c) => (
          <section key={c} id={encodeURIComponent(c)} className="scroll-mt-16 pt-8">
            <h2 className="text-lg font-semibold">{c}</h2>
            <ul className="mt-2 divide-y divide-line">
              {menu
                .filter((m) => m.category === c)
                .map((m) => {
                  const off = !Object.values(m.available).some(Boolean);
                  return (
                    <li key={m.id} className={`flex gap-4 py-4 ${off ? "opacity-50" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} aria-label={m.veg ? "Veg" : "Non-veg"} />
                        <p className="mt-1 font-medium">{m.name}</p>
                        <p className="text-sm text-ink-2">₹{dinePrice(m)}</p>
                        {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>}
                        {off && <p className="mt-1 text-sm font-medium text-chilli">Not available right now</p>}
                      </div>
                      {m.photoUrl && <img src={m.photoUrl} alt="" width={112} height={84} loading="lazy" className="h-[84px] w-[112px] shrink-0 rounded-xl object-cover" />}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
        <p className="mt-10 text-center text-xs text-muted">Prices include taxes where applicable. Menu by Zest.</p>
      </main>
    </div>
  );
}
