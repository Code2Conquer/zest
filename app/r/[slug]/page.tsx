"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Bike, Check, Clock, IndianRupee, Loader2, LocateFixed, Minus, Plus, Search, ShoppingBag, Star, Utensils, X } from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/state";

// The restaurant's own ordering site. Phone first: browse, add dishes, give a name and number, then
// have it delivered (by a Zomato rider or the restaurant's own staff, priced by distance), pick it up
// or eat at the table. Pay online (when the gateway is set up), by UPI to the seller, or on collection.
// Dishes can have a daily count ("only 3 left") and menu sections a daily cut-off ("lunch orders by 11").

type Dish = { id: string; name: string; category: string; description: string; veg: boolean; bestseller: boolean; photo: string | null; price: number; rating: number | null; votes: number; left: number | null };
type Shop = {
  name: string;
  hero: string;
  area: string;
  locality: string;
  address: string;
  cuisines: string[];
  ratings: { platform: "zomato" | "swiggy"; value: number; count: number }[];
  costForTwo: { amount: number; estimated: boolean } | null;
  highlights: string[];
  photos: string[];
  pureVeg: boolean;
  hoursToday: string | null;
  fssai: string | null;
  open: boolean;
  upi: boolean;
  online: boolean;
  cutoffs: Record<string, { at: string; closed: boolean }>;
  delivery: { zomatoRider: boolean; ownStaff: boolean; pickup: boolean; feePaidBy: "customer" | "restaurant"; freeAbove: number | null; maxKm: number; priced: boolean };
  menu: Dish[];
};
type Checkout = { key: string; pgOrderId: string; amount: number; name: string };
type Placed = { orderId: string; number: string; total: number; token: string; upiLink: string | null; checkout?: Checkout | null; paid?: boolean; deliveryFee?: number; deliveryBy?: "zomato_rider" | "own_staff" | null };
type Status = { number: string; status: string; total: number; items: string; paymentStatus: "unpaid" | "paid" | null; fulfilment: string | null; table: string | null; upiLink: string | null; deliveryBy: "zomato_rider" | "own_staff" | null; deliveryFee: number | null; address: string | null };
type Quote = { ok: true; by: "zomato_rider" | "own_staff"; km: number | null; fee: number | null; customerFee: number } | { ok: false; reason: "off" | "too_far" };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};

/** Opens the payment gateway's checkout over the page. Resolves with its proof of payment, or null if closed. */
function payOnline(c: Checkout, prefill: { name: string; contact: string }): Promise<{ paymentId: string; signature: string } | null> {
  type Rzp = new (o: Record<string, unknown>) => { open: () => void };
  const load = () =>
    new Promise<void>((ok, fail) => {
      if ((window as unknown as { Razorpay?: Rzp }).Razorpay) return ok();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => ok();
      s.onerror = () => fail(new Error("Couldn't open the payment page. Check your connection and try again."));
      document.body.appendChild(s);
    });
  return load().then(
    () =>
      new Promise((resolve) => {
        const R = (window as unknown as { Razorpay: Rzp }).Razorpay;
        new R({
          key: c.key,
          order_id: c.pgOrderId,
          amount: c.amount,
          currency: "INR",
          name: c.name,
          prefill,
          theme: { color: "#e9a31a" },
          handler: (r: { razorpay_payment_id: string; razorpay_signature: string }) => resolve({ paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
          modal: { ondismiss: () => resolve(null) },
        }).open();
      }),
  );
}
const PLATFORM = { zomato: "Zomato", swiggy: "Swiggy" } as const;

const STEP: Record<string, { en: string; hi: string }> = {
  new: { en: "Sent to the kitchen", hi: "किचन को भेजा गया" },
  accepted: { en: "Accepted by the restaurant", hi: "रेस्टोरेंट ने स्वीकार किया" },
  preparing: { en: "Being prepared", hi: "बन रहा है" },
  ready: { en: "Ready", hi: "तैयार है" },
  out_for_delivery: { en: "On the way with your rider", hi: "राइडर के साथ रास्ते में" },
  completed: { en: "Collected. Enjoy your meal!", hi: "ले लिया गया। खाने का मज़ा लें!" },
  served: { en: "Served. Enjoy your meal!", hi: "परोसा गया। खाने का मज़ा लें!" },
  rejected: { en: "The restaurant couldn't take this order", hi: "रेस्टोरेंट यह ऑर्डर नहीं ले पाया" },
  cancelled: { en: "Cancelled", hi: "कैंसल" },
};

function Storefront({ slug }: { slug: string }) {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const params = useSearchParams();
  const table = params.get("table");
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    api<Shop>(`/api/storefront/${slug}`).then(setShop, (e: Error) => setError(e.message));
    // Come back to an order placed earlier on this phone.
    try {
      const saved = localStorage.getItem(`zest:order:${slug}`);
      if (saved) setPlaced(JSON.parse(saved) as Placed);
    } catch {}
  }, [slug]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (shop?.menu ?? []).filter((m) => (!vegOnly || m.veg) && (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)));
  }, [shop, query, vegOnly]);
  const categories = useMemo(() => [...new Set(shown.map((m) => m.category))], [shown]);
  const count = Object.values(cart).reduce((s, n) => s + n, 0);
  const total = shop ? Object.entries(cart).reduce((s, [id, n]) => s + (shop.menu.find((m) => m.id === id)?.price ?? 0) * n, 0) : 0;
  // A dish can be added up to what's left of it today, and not at all once its section's cut-off has passed.
  const cap = (m: Dish) => (shop?.cutoffs[m.category]?.closed ? 0 : Math.min(20, m.left ?? 20));
  const add = (id: string, d: number) =>
    setCart((c) => {
      const m = shop?.menu.find((x) => x.id === id);
      return { ...c, [id]: Math.max(0, Math.min(m ? cap(m) : 20, (c[id] ?? 0) + d)) };
    });
  // The last order placed on this phone, to order it again in one tap.
  const [usual, setUsual] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`zest:usual:${slug}`);
      if (saved) setUsual(JSON.parse(saved) as Record<string, number>);
    } catch {}
  }, [slug]);
  const usualNow = shop && usual ? Object.fromEntries(Object.entries(usual).flatMap(([id, n]) => { const m = shop.menu.find((x) => x.id === id); return m ? [[id, Math.min(n, cap(m))]] : []; }).filter(([, n]) => (n as number) > 0)) : null;

  if (error) return <p className="mx-auto max-w-xl px-5 py-20 text-center text-ink-2">{error}</p>;
  if (!shop)
    return (
      <p className="flex justify-center py-20 text-muted">
        <Loader2 aria-hidden className="size-5 animate-spin" />
      </p>
    );
  if (placed)
    return (
      <OrderPlaced
        slug={slug}
        shopName={shop.name}
        placed={placed}
        onNew={() => {
          try {
            localStorage.removeItem(`zest:order:${slug}`);
          } catch {}
          setPlaced(null);
          setCart({});
        }}
      />
    );

  const delivers = shop.delivery.zomatoRider || shop.delivery.ownStaff;
  const mode = table
    ? hi ? `टेबल ${table}` : `Table ${table}`
    : [delivers && (shop.delivery.zomatoRider ? (hi ? "Zomato राइडर से डिलीवरी" : "Delivery by Zomato riders") : hi ? "डिलीवरी" : "Delivery"), shop.delivery.pickup && (hi ? "पिकअप" : "Pickup")].filter(Boolean).join(" · ");

  return (
    <div className="min-h-dvh bg-paper pb-28 text-ink lg:pb-16">
      {/* The hero: one large photo, the name over it */}
      <div className="relative h-[260px] overflow-hidden sm:h-[380px] lg:h-[440px]">
        <img src={shop.hero} alt="" className="size-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_12_11/0.92),rgb(10_12_11/0.35)_55%,rgb(10_12_11/0.15))]" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-14 sm:px-8 sm:pb-20">
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">{shop.name}</h1>
          {shop.cuisines.length > 0 && <p className="mt-1.5 text-[1.05rem] text-white/85">{shop.cuisines.join(" · ")}</p>}
        </div>
      </div>

      {/* Restaurant details card */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-12 sm:px-6">
        <section className="rounded-3xl bg-surface p-5 shadow-[0_0_0_1px_var(--line),0_18px_40px_-24px_rgb(0_0_0/0.35)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-ink-2">{[shop.address, shop.locality && !shop.address.includes(shop.locality) ? shop.locality : null].filter(Boolean).join(", ") || shop.area}</p>
            </div>
            {shop.ratings.length > 0 && (
              <div className="flex gap-3">
                {shop.ratings.map((r) => (
                  <div key={r.platform} className="min-w-[84px] rounded-xl text-center shadow-[0_0_0_1px_var(--line)]">
                    <p className="inline-flex w-full items-center justify-center gap-1 rounded-t-xl bg-[#1f6b3a] py-1 text-[1.05rem] font-semibold text-white">
                      {r.value.toFixed(1)}
                      <Star aria-hidden className="size-3.5 fill-current" />
                    </p>
                    <p className="px-2 pt-1 text-[0.75rem] font-medium">{PLATFORM[r.platform]}</p>
                    <p className="px-2 pb-1.5 text-[0.7rem] text-muted">
                      {r.count.toLocaleString("en-IN")} {hi ? "रेटिंग" : "ratings"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            <li className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium ${shop.open ? "bg-leaf-soft text-leaf" : "bg-chilli-soft text-chilli"}`}>
              <Clock aria-hidden className="size-3.5" />
              {shop.open ? (hi ? "अभी खुला" : "Open now") : hi ? "अभी बंद" : "Closed now"}
              {shop.hoursToday && <span className="font-normal opacity-80">· {shop.hoursToday}</span>}
            </li>
            {shop.costForTwo && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5">
                <IndianRupee aria-hidden className="size-3.5" />
                {shop.costForTwo.estimated ? "≈ " : ""}
                {inr(shop.costForTwo.amount)} {hi ? "दो लोगों के लिए" : "for two"}
              </li>
            )}
            {shop.pureVeg && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-veg">
                <span className="food-mark scale-75" aria-hidden />
                {hi ? "शुद्ध शाकाहारी" : "Pure veg"}
              </li>
            )}
            <li className="inline-flex items-center gap-1.5 rounded-full bg-turmeric-soft px-3 py-1.5 font-medium">
              {table ? <Utensils aria-hidden className="size-3.5" /> : delivers ? <Bike aria-hidden className="size-3.5" /> : <ShoppingBag aria-hidden className="size-3.5" />}
              {table ? (hi ? `टेबल ${table} से ऑर्डर` : `Ordering for table ${table}`) : mode}
            </li>
            {shop.highlights.slice(0, 3).map((h) => (
              <li key={h} className="rounded-full px-3 py-1.5 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
                {h}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Search and filters */}
      <div className="sticky top-0 z-20 mt-4 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{hi ? "मेन्यू में खोजें" : "Search the menu"}</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={hi ? "डिश खोजें" : "Search dishes"} className="w-full rounded-full bg-surface py-2 pl-9 pr-4 shadow-[0_0_0_1px_var(--line)] outline-none focus:shadow-[0_0_0_2px_var(--ink)]" />
          </label>
          {!shop.pureVeg && (
            <button type="button" aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm ${vegOnly ? "bg-leaf-soft text-leaf shadow-[0_0_0_1.5px_var(--veg)]" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
              <span className="food-mark text-veg" aria-hidden />
              {hi ? "सिर्फ़ वेज" : "Veg only"}
            </button>
          )}
        </div>
        <nav aria-label={hi ? "श्रेणियाँ" : "Categories"} className="mx-auto max-w-6xl lg:hidden">
          <ul className="flex gap-2 overflow-x-auto px-4 pb-3 text-sm sm:px-6">
            {categories.map((c) => (
              <li key={c}>
                <a href={`#${encodeURIComponent(c)}`} className="block whitespace-nowrap rounded-full bg-surface px-3.5 py-1.5 shadow-[0_0_0_1px_var(--line)]">
                  {c} <span className="text-muted">{shown.filter((m) => m.category === c).length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-2 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
        {/* Categories, desktop */}
        <nav aria-label={hi ? "श्रेणियाँ" : "Categories"} className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5 border-r border-line pr-4 pt-6 text-[0.95rem]">
            {categories.map((c) => (
              <li key={c}>
                <a href={`#${encodeURIComponent(c)}`} className="flex justify-between rounded-lg px-3 py-2 text-ink-2 hover:bg-surface hover:text-ink">
                  <span>{c}</span>
                  <span className="text-muted">{shown.filter((m) => m.category === c).length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Menu */}
        <main>
          {usualNow && Object.keys(usualNow).length > 0 && count === 0 && shop.open && (
            <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-turmeric-soft p-4">
              <div className="min-w-0">
                <p className="font-semibold">{hi ? "पिछली बार वाला ऑर्डर?" : "Your usual?"}</p>
                <p className="truncate text-sm text-ink-2">{Object.entries(usualNow).map(([id, n]) => `${n} × ${shop.menu.find((m) => m.id === id)!.name}`).join(", ")}</p>
              </div>
              <button type="button" onClick={() => setCart(usualNow as Record<string, number>)} className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
                {hi ? "फिर से जोड़ें" : "Add it again"}
              </button>
            </section>
          )}
          {shop.menu.length === 0 && <p className="py-16 text-center text-muted">{hi ? "मेन्यू अपडेट हो रहा है।" : "The menu is being updated."}</p>}
          {shop.menu.length > 0 && shown.length === 0 && <p className="py-16 text-center text-muted">{hi ? "कोई डिश नहीं मिली।" : "No dishes match."}</p>}
          {categories.map((c) => (
            <section key={c} id={encodeURIComponent(c)} className="scroll-mt-36 pt-6">
              <h2 className="flex flex-wrap items-baseline gap-x-3 text-xl font-semibold tracking-[-0.01em]">
                <span>
                  {c} <span className="text-base font-normal text-muted">({shown.filter((m) => m.category === c).length})</span>
                </span>
                {shop.cutoffs[c] && (
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${shop.cutoffs[c].closed ? "bg-chilli-soft text-chilli" : "bg-turmeric-soft text-ink"}`}>
                    {shop.cutoffs[c].closed ? (hi ? "आज के ऑर्डर बंद" : "Closed for today") : hi ? `${clock(shop.cutoffs[c].at)} तक ऑर्डर करें` : `Order by ${clock(shop.cutoffs[c].at)}`}
                  </span>
                )}
              </h2>
              <ul className="mt-2 divide-y divide-dashed divide-line">
                {shown
                  .filter((m) => m.category === c)
                  .map((m) => (
                    <li key={m.id} className="flex gap-5 py-6">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} role="img" aria-label={m.veg ? "Veg" : "Non-veg"} />
                          {m.bestseller && <span className="rounded bg-turmeric-soft px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink">{hi ? "बेस्टसेलर" : "Bestseller"}</span>}
                        </p>
                        <h3 className="mt-1.5 text-[1.05rem] font-semibold">{m.name}</h3>
                        <p className="mt-0.5 font-medium">{inr(m.price)}</p>
                        {m.left != null && m.left <= 5 && <p className={`mt-1 text-sm font-semibold ${m.left ? "text-turmeric" : "text-chilli"}`}>{m.left ? (hi ? `सिर्फ़ ${m.left} बचे` : `Only ${m.left} left today`) : hi ? "आज का ख़त्म" : "Sold out today"}</p>}
                        {m.rating && (
                          <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-2">
                            <Star aria-hidden className="size-3.5 fill-turmeric text-turmeric" />
                            {m.rating.toFixed(1)} <span className="text-muted">({m.votes.toLocaleString("en-IN")})</span>
                          </p>
                        )}
                        {m.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{m.description}</p>}
                      </div>
                      <div className="relative w-[132px] shrink-0 pb-4">
                        {m.photo ? <img src={m.photo} alt="" width={132} height={132} loading="lazy" className="size-[132px] rounded-2xl object-cover" /> : <div className="h-8" />}
                        {shop.open && cap(m) > 0 && (
                          <div className={`${m.photo ? "absolute inset-x-3 bottom-0" : ""}`}>
                            {cart[m.id] ? (
                              <span className="flex items-center justify-between rounded-lg bg-surface px-2 py-1.5 font-semibold text-leaf shadow-[0_0_0_1px_var(--line),0_6px_14px_-8px_rgb(0_0_0/0.4)]">
                                <button type="button" aria-label={hi ? "एक कम" : "One less"} onClick={() => add(m.id, -1)} className="px-1">
                                  <Minus aria-hidden className="size-4" />
                                </button>
                                <span>{cart[m.id]}</span>
                                <button type="button" aria-label={hi ? "एक और" : "One more"} onClick={() => add(m.id, 1)} className="px-1">
                                  <Plus aria-hidden className="size-4" />
                                </button>
                              </span>
                            ) : (
                              <button type="button" onClick={() => add(m.id, 1)} className="w-full rounded-lg bg-surface py-1.5 font-semibold text-leaf shadow-[0_0_0_1px_var(--line),0_6px_14px_-8px_rgb(0_0_0/0.4)] hover:bg-leaf-soft">
                                {hi ? "जोड़ें" : "ADD"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <p className="mt-10 border-t border-line pt-6 text-center text-xs text-muted">
            {shop.fssai ? `FSSAI ${shop.fssai} · ` : ""}
            {hi ? "क़ीमतों में लागू टैक्स शामिल।" : "Prices include taxes where applicable."} {hi ? "Zest द्वारा ऑर्डरिंग।" : "Ordering by Zest."}
          </p>
        </main>

        {/* Cart, desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 mt-6 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <h2 className="font-semibold">{hi ? "आपका ऑर्डर" : "Your order"}</h2>
            <p className="text-sm text-muted">{mode}</p>
            {count === 0 ? (
              <p className="mt-6 text-center text-sm text-muted">{hi ? "डिश जोड़ें, वे यहाँ दिखेंगी।" : "Add dishes and they'll show here."}</p>
            ) : (
              <>
                <ul className="mt-4 space-y-2 text-sm">
                  {Object.entries(cart)
                    .filter(([, n]) => n > 0)
                    .map(([id, n]) => {
                      const m = shop.menu.find((x) => x.id === id)!;
                      return (
                        <li key={id} className="flex justify-between gap-3">
                          <span className="min-w-0">
                            <span className={`food-mark mr-1.5 inline-grid scale-75 align-middle ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} aria-hidden />
                            {n} × {m.name}
                          </span>
                          <span className="shrink-0">{inr(m.price * n)}</span>
                        </li>
                      );
                    })}
                </ul>
                <p className="mt-4 flex justify-between border-t border-line pt-3 font-semibold">
                  <span>{hi ? "कुल" : "Total"}</span>
                  <span>{inr(total)}</span>
                </p>
                <button type="button" onClick={() => setCheckout(true)} className="mt-4 w-full rounded-xl bg-ink py-3 font-medium text-paper">
                  {hi ? "आगे बढ़ें" : "Checkout"}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {count > 0 && !checkout && (
        <button type="button" onClick={() => setCheckout(true)} className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-ink px-5 py-4 text-paper shadow-xl lg:hidden">
          <span className="inline-flex items-center gap-2">
            <ShoppingBag aria-hidden className="size-5" />
            {count} {hi ? "आइटम" : count === 1 ? "item" : "items"} · {inr(total)}
          </span>
          <span className="font-medium">{hi ? "आगे बढ़ें" : "Checkout"}</span>
        </button>
      )}
      {checkout && <Checkout slug={slug} shop={shop} cart={cart} total={total} table={table} onClose={() => setCheckout(false)} onPlaced={setPlaced} pick={pick} hi={hi} />}
    </div>
  );
}

function Checkout(props: { slug: string; shop: Shop; cart: Record<string, number>; total: number; table: string | null; onClose: () => void; onPlaced: (p: Placed) => void; pick: <T>(b: { en: T; hi: T }) => T; hi: boolean }) {
  const { slug, shop, cart, total, table, onClose, onPlaced, hi } = props;
  const d = shop.delivery;
  const delivers = !table && (d.zomatoRider || d.ownStaff);
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup" | "table">(table ? "table" : delivers ? "delivery" : "pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<"online" | "upi" | "counter">(shop.online ? "online" : shop.upi ? "upi" : "counter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The fee, worked out on the server from the customer's location and the order so far.
  useEffect(() => {
    if (fulfilment !== "delivery") return setQuote(null);
    let live = true;
    api<Quote>(`/api/storefront/${slug}/quote`, { method: "POST", json: { subtotal: total, location } }).then((q) => live && setQuote(q), () => {});
    return () => {
      live = false;
    };
  }, [fulfilment, location, total, slug]);

  function locate() {
    if (!navigator.geolocation) return setError(hi ? "यह फ़ोन लोकेशन नहीं दे सकता। पता लिख दीजिए।" : "This phone can't share its location. Type your address instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(hi ? "लोकेशन नहीं मिली। पता लिख दीजिए, फ़ीस WhatsApp पर पक्की होगी।" : "Couldn't get your location. Type your address; the fee is confirmed on WhatsApp.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const fee = fulfilment === "delivery" && quote?.ok ? quote.customerFee : 0;
  const grand = total + fee;
  const blocked = fulfilment === "delivery" && quote && !quote.ok;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const lines = Object.entries(cart)
        .filter(([, n]) => n > 0)
        .map(([itemId, qty]) => ({ itemId, qty }));
      const placed = await api<Placed>(`/api/storefront/${slug}/orders`, {
        method: "POST",
        json: { name, phone, fulfilment, table: table ?? undefined, address: fulfilment === "delivery" ? address : undefined, location: fulfilment === "delivery" && location ? location : undefined, pay, note: note || undefined, lines },
      });
      try {
        localStorage.setItem(`zest:order:${slug}`, JSON.stringify(placed));
        localStorage.setItem(`zest:usual:${slug}`, JSON.stringify(Object.fromEntries(lines.map((l) => [l.itemId, l.qty]))));
      } catch {}
      // Online: pay in the gateway's checkout now; the order counts once the payment is confirmed.
      if (placed.checkout) {
        const proof = await payOnline(placed.checkout, { name, contact: phone });
        if (proof) {
          await api(`/api/storefront/${slug}/orders/${placed.orderId}/paid`, { method: "POST", json: { token: placed.token, ...proof } });
          placed.paid = true;
          try {
            localStorage.setItem(`zest:order:${slug}`, JSON.stringify(placed));
          } catch {}
        }
      }
      onPlaced(placed);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)] outline-none focus:shadow-[0_0_0_2px_var(--ink)]";
  const seg = (on: boolean) => `flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-medium ${on ? "bg-ink text-paper" : "text-ink-2"}`;
  const byRider = quote?.ok ? quote.by === "zomato_rider" : d.zomatoRider;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-paper p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{hi ? "आपका ऑर्डर" : "Your order"}</h2>
          <button type="button" aria-label={hi ? "बंद करें" : "Close"} onClick={onClose} className="rounded-full p-2 hover:bg-sunken">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {/* How it reaches you */}
        {!table && delivers && d.pickup && (
          <div role="radiogroup" aria-label={hi ? "डिलीवरी या पिकअप" : "Delivery or pickup"} className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1 shadow-[0_0_0_1px_var(--line)]">
            <button type="button" role="radio" aria-checked={fulfilment === "delivery"} onClick={() => setFulfilment("delivery")} className={seg(fulfilment === "delivery")}>
              <Bike aria-hidden className="size-4" /> {hi ? "डिलीवरी" : "Delivery"}
            </button>
            <button type="button" role="radio" aria-checked={fulfilment === "pickup"} onClick={() => setFulfilment("pickup")} className={seg(fulfilment === "pickup")}>
              <ShoppingBag aria-hidden className="size-4" /> {hi ? "पिकअप" : "Pickup"}
            </button>
          </div>
        )}

        <ul className="mt-3 divide-y divide-line text-[0.95rem]">
          {Object.entries(cart)
            .filter(([, n]) => n > 0)
            .map(([id, n]) => {
              const m = shop.menu.find((x) => x.id === id)!;
              return (
                <li key={id} className="flex justify-between py-2">
                  <span>
                    {n} × {m.name}
                  </span>
                  <span>{inr(m.price * n)}</span>
                </li>
              );
            })}
          {fulfilment === "delivery" && (
            <li className="flex justify-between py-2">
              <span>
                {hi ? "डिलीवरी" : "Delivery"}
                {quote?.ok && quote.km != null && <span className="text-muted"> · {quote.km} km</span>}
              </span>
              <span>{quote?.ok ? (quote.customerFee === 0 && quote.fee != null ? (hi ? "मुफ़्त" : "Free") : quote.fee == null ? (d.feePaidBy === "restaurant" ? (hi ? "मुफ़्त" : "Free") : hi ? "दूरी से तय" : "By distance") : inr(quote.customerFee)) : "…"}</span>
            </li>
          )}
          <li className="flex justify-between py-2 font-semibold">
            <span>{hi ? "कुल" : "Total"}</span>
            <span>{inr(grand)}</span>
          </li>
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          {fulfilment === "delivery" ? (
            <>
              <Bike aria-hidden className="size-4 shrink-0" />
              {byRider ? (hi ? "Zomato राइडर पहुँचाएगा, लाइव ट्रैकिंग के साथ" : "Delivered by a Zomato rider, with live tracking") : hi ? "रेस्टोरेंट का स्टाफ़ पहुँचाएगा" : "Delivered by the restaurant's own staff"}
            </>
          ) : table ? (
            hi ? `टेबल ${table} पर परोसा जाएगा` : `Served at table ${table}`
          ) : hi ? (
            "काउंटर से पिकअप"
          ) : (
            "Pick up at the counter"
          )}
        </p>
        {blocked && (
          <p className="mt-2 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">
            {quote && !quote.ok && quote.reason === "too_far" ? (hi ? `यह ${d.maxKm} किमी से दूर है। पिकअप चुनें या पास का पता दें।` : `That's farther than ${d.maxKm} km. Choose pickup, or a closer address.`) : hi ? "अभी डिलीवरी बंद है। पिकअप चुनें।" : "Delivery is off right now. Choose pickup."}
          </p>
        )}

        <label className="mt-5 block text-sm text-ink-2">
          {hi ? "नाम" : "Name"}
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={field} />
        </label>
        <label className="mt-3 block text-sm text-ink-2">
          {hi ? "मोबाइल नंबर" : "Mobile number"}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" placeholder="98xxxxxx21" className={field} />
        </label>
        {/* What this number is for, said up front */}
        <p className="mt-1.5 text-[0.8rem] leading-snug text-muted">
          {fulfilment === "delivery"
            ? hi
              ? "ऑर्डर अपडेट और डिलीवरी का ट्रैकिंग लिंक इसी नंबर पर WhatsApp या SMS से आएगा। OTP जैसे कोड भी यहीं आएँगे।"
              : "Order updates and the delivery tracking link will come to this number on WhatsApp or SMS. Any OTP or code comes here too."
            : hi
              ? "ऑर्डर अपडेट इसी नंबर पर WhatsApp या SMS से आएँगे। OTP जैसे कोड भी यहीं आएँगे।"
              : "Order updates will come to this number on WhatsApp or SMS. Any OTP or code comes here too."}
        </p>
        {fulfilment === "delivery" && (
          <div className="mt-3">
            <label className="block text-sm text-ink-2">
              {hi ? "डिलीवरी का पता" : "Delivery address"}
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} required minLength={8} rows={2} autoComplete="street-address" placeholder={hi ? "फ़्लैट, बिल्डिंग, गली, लैंडमार्क" : "Flat, building, street, landmark"} className={`${field} resize-none`} />
            </label>
            <button type="button" onClick={locate} disabled={locating} className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-[inset_0_0_0_1.5px_var(--line)]">
              {locating ? <Loader2 aria-hidden className="size-4 animate-spin" /> : location ? <Check aria-hidden className="size-4 text-leaf" /> : <LocateFixed aria-hidden className="size-4" />}
              {location ? (hi ? "लोकेशन मिल गई" : "Location shared") : hi ? "मेरी लोकेशन इस्तेमाल करें" : "Use my location"}
            </button>
            {!location && d.priced && d.feePaidBy === "customer" && <p className="mt-1 text-sm text-muted">{hi ? "लोकेशन से डिलीवरी फ़ीस तुरंत दिखेगी।" : "Share your location to see the delivery fee now."}</p>}
          </div>
        )}
        <label className="mt-3 block text-sm text-ink-2">
          {hi ? "कुछ कहना है? (ज़रूरी नहीं)" : "Anything to tell the kitchen? (optional)"}
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={field} />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm text-ink-2">{hi ? "भुगतान" : "Payment"}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {shop.online && (
              <button type="button" aria-pressed={pay === "online"} onClick={() => setPay("online")} className={`rounded-xl px-4 py-3 text-left ${pay === "online" ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
                {hi ? "अभी भुगतान" : "Pay now"}
                <span className="block text-sm opacity-70">{hi ? "UPI, कार्ड या वॉलेट" : "UPI, card or wallet"}</span>
              </button>
            )}
            {shop.upi && !shop.online && (
              <button type="button" aria-pressed={pay === "upi"} onClick={() => setPay("upi")} className={`rounded-xl px-4 py-3 text-left ${pay === "upi" ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
                UPI
                <span className="block text-sm opacity-70">{hi ? "अपने UPI ऐप से" : "From your UPI app"}</span>
              </button>
            )}
            <button type="button" aria-pressed={pay === "counter"} onClick={() => setPay("counter")} className={`rounded-xl px-4 py-3 text-left ${pay === "counter" ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
              {table ? (hi ? "टेबल पर" : "At the table") : fulfilment === "delivery" ? (hi ? "डिलीवरी पर" : "On delivery") : hi ? "काउंटर पर" : "At the counter"}
              <span className="block text-sm opacity-70">{hi ? "कैश, कार्ड या UPI" : "Cash, card or UPI"}</span>
            </button>
          </div>
        </fieldset>

        {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
        <button type="submit" disabled={busy || !!blocked} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-medium text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? `ऑर्डर करें · ${inr(grand)}` : `Place order · ${inr(grand)}`}
        </button>
      </form>
    </div>
  );
}

function OrderPlaced({ slug, shopName, placed, onNew }: { slug: string; shopName: string; placed: Placed; onNew: () => void }) {
  const { lang, pick } = useApp();
  const hi = lang === "hi";
  const [status, setStatus] = useState<Status | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const load = () => api<Status>(`/api/storefront/${slug}/orders/${placed.orderId}?t=${placed.token}`).then(setStatus, () => {});
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [slug, placed]);

  const upi = status ? status.upiLink : placed.upiLink;
  useEffect(() => {
    if (upi) QRCode.toDataURL(upi, { margin: 1, width: 220 }).then(setQr, () => setQr(null));
  }, [upi]);

  const done = status && ["completed", "served", "rejected", "cancelled"].includes(status.status);
  return (
    <div className="min-h-dvh bg-paper px-5 py-10 text-ink">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-leaf-soft text-leaf">
          <Check aria-hidden className="size-7" />
        </span>
        <p className="mt-4 text-sm font-medium uppercase tracking-[0.08em] text-muted">{shopName}</p>
        <h1 className="mt-1 text-2xl font-semibold">{hi ? "ऑर्डर मिल गया" : "Order received"}</h1>
        <p className="mt-1 text-ink-2">
          {hi ? "ऑर्डर नंबर" : "Order"} <span className="font-semibold">{placed.number}</span> · {inr(placed.total)}
        </p>
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 font-medium shadow-[0_0_0_1px_var(--line)]" aria-live="polite">
          {status?.fulfilment === "delivery" && status.status === "completed" ? (hi ? "पहुँच गया। खाने का मज़ा लें!" : "Delivered. Enjoy your meal!") : status ? pick(STEP[status.status] ?? STEP.new) : pick(STEP.new)}
        </p>
        {status?.fulfilment === "delivery" && (
          <p className="mt-2 flex items-start justify-center gap-1.5 text-sm text-ink-2">
            <Bike aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {status.deliveryBy === "zomato_rider" ? (hi ? "Zomato राइडर पहुँचाएगा" : "A Zomato rider is delivering this") : hi ? "रेस्टोरेंट का स्टाफ़ पहुँचाएगा" : "The restaurant's staff are delivering this"}
              {status.address && <span className="block text-muted">{status.address}</span>}
            </span>
          </p>
        )}
        {status?.paymentStatus === "paid" && <p className="mt-2 text-sm text-leaf">{hi ? "भुगतान मिल गया" : "Payment received"}</p>}
        {placed.checkout && status?.paymentStatus !== "paid" && !done && (
          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <p className="font-medium">{hi ? "भुगतान बाक़ी है" : "Your payment didn't go through"}</p>
            <p className="mt-1 text-sm text-muted">{hi ? "भुगतान होते ही ऑर्डर किचन में जाएगा।" : "The kitchen gets the order as soon as it's paid."}</p>
            <button
              type="button"
              onClick={async () => {
                const proof = await payOnline(placed.checkout!, { name: "", contact: "" }).catch(() => null);
                if (proof) await api(`/api/storefront/${slug}/orders/${placed.orderId}/paid`, { method: "POST", json: { token: placed.token, ...proof } }).catch(() => {});
              }}
              className="mt-3 rounded-full bg-ink px-6 py-3 font-medium text-paper"
            >
              {hi ? `${inr(placed.total)} का भुगतान करें` : `Pay ${inr(placed.total)}`}
            </button>
          </div>
        )}
        <a href={`/t/${placed.token}`} className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
          {hi ? "ऑर्डर ट्रैक करें" : "Track your order"}
        </a>

        {upi && status?.paymentStatus !== "paid" && (
          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <p className="font-medium">{hi ? `UPI से ${inr(placed.total)} दें` : `Pay ${inr(placed.total)} by UPI`}</p>
            <a href={upi} className="mt-3 inline-block rounded-full bg-ink px-6 py-3 font-medium text-paper">
              {hi ? "UPI ऐप खोलें" : "Open UPI app"}
            </a>
            {qr && <img src={qr} alt={hi ? "भुगतान के लिए QR कोड" : "QR code to pay"} width={180} height={180} className="mx-auto mt-4" />}
            <p className="mt-2 text-sm text-muted">
              {status?.fulfilment === "delivery" ? (hi ? "भुगतान होते ही रेस्टोरेंट को पता चल जाएगा।" : "The restaurant sees it as soon as you've paid.") : hi ? "भुगतान के बाद काउंटर पर ऑर्डर नंबर बताएँ।" : "After paying, show your order number at the counter."}
            </p>
          </div>
        )}

        <button type="button" onClick={onNew} className="mt-6 rounded-full px-6 py-3 font-medium shadow-[inset_0_0_0_1.5px_var(--ink)]">
          {done ? (hi ? "फिर से ऑर्डर करें" : "Order again") : hi ? "मेन्यू पर वापस" : "Back to the menu"}
        </button>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense>
      <Storefront slug={slug} />
    </Suspense>
  );
}
