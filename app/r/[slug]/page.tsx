"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Check, Clock, IndianRupee, Loader2, Minus, Plus, Search, ShoppingBag, Star, Utensils, X } from "lucide-react";
import { ThemeToggle } from "@/components/bits";
import { api } from "@/lib/api";
import { useApp } from "@/lib/state";

// The restaurant's own ordering site. Phone first: browse, add dishes, give a name and number,
// pick up or eat at the table, and pay by UPI to the restaurant or at the counter.

type Dish = { id: string; name: string; category: string; description: string; veg: boolean; bestseller: boolean; photo: string | null; price: number; rating: number | null; votes: number };
type Shop = {
  name: string;
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
  menu: Dish[];
};
type Placed = { orderId: string; number: string; total: number; token: string; upiLink: string | null };
type Status = { number: string; status: string; total: number; items: string; paymentStatus: "unpaid" | "paid" | null; fulfilment: string | null; table: string | null; upiLink: string | null };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const PLATFORM = { zomato: "Zomato", swiggy: "Swiggy" } as const;

const STEP: Record<string, { en: string; hi: string }> = {
  new: { en: "Sent to the kitchen", hi: "किचन को भेजा गया" },
  accepted: { en: "Accepted by the restaurant", hi: "रेस्टोरेंट ने स्वीकार किया" },
  preparing: { en: "Being prepared", hi: "बन रहा है" },
  ready: { en: "Ready", hi: "तैयार है" },
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
  const add = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + d)) }));

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

  const [cover, ...more] = shop.photos;
  const mode = table ? (hi ? `टेबल ${table}` : `Table ${table}`) : hi ? "पिकअप" : "Pickup";

  return (
    <div className="min-h-dvh bg-paper pb-28 text-ink lg:pb-16">
      {/* Cover photos, as listing pages open */}
      <div className="relative">
        <div className="mx-auto grid h-[220px] max-w-6xl gap-1.5 overflow-hidden sm:h-[300px] sm:grid-cols-[2fr_1fr] sm:px-6 sm:pt-6 lg:rounded-b-none">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover sm:rounded-l-2xl max-sm:rounded-none" />
          ) : (
            <div className="size-full bg-[radial-gradient(70%_80%_at_30%_30%,#1c3628,#12261b)]" />
          )}
          {more.length > 0 && (
            <div className="hidden grid-rows-2 gap-1.5 sm:grid">
              {more.slice(0, 2).map((p, i) => (
                <img key={p} src={p} alt="" className={`size-full object-cover ${i === 0 ? "rounded-tr-2xl" : "rounded-br-2xl"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
          <ThemeToggle className="bg-surface text-ink hover:bg-surface" />
        </div>
      </div>

      {/* Restaurant details card */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-12 sm:px-6">
        <section className="rounded-3xl bg-surface p-5 shadow-[0_0_0_1px_var(--line),0_18px_40px_-24px_rgb(0_0_0/0.35)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em]">{shop.name}</h1>
              {shop.cuisines.length > 0 && <p className="mt-1 text-ink-2">{shop.cuisines.join(" · ")}</p>}
              <p className="mt-0.5 text-sm text-muted">{[shop.address, shop.locality && !shop.address.includes(shop.locality) ? shop.locality : null].filter(Boolean).join(", ") || shop.area}</p>
            </div>
            {shop.ratings.length > 0 && (
              <div className="flex gap-3">
                {shop.ratings.map((r) => (
                  <div key={r.platform} className="min-w-[84px] rounded-xl text-center shadow-[0_0_0_1px_var(--line)]">
                    <p className="inline-flex w-full items-center justify-center gap-1 rounded-t-xl bg-veg py-1 text-[1.05rem] font-semibold text-white">
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
              {table ? <Utensils aria-hidden className="size-3.5" /> : <ShoppingBag aria-hidden className="size-3.5" />}
              {table ? (hi ? `टेबल ${table} से ऑर्डर` : `Ordering for table ${table}`) : hi ? "पिकअप के लिए ऑर्डर" : "Order for pickup"}
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
          {shop.menu.length === 0 && <p className="py-16 text-center text-muted">{hi ? "मेन्यू अपडेट हो रहा है।" : "The menu is being updated."}</p>}
          {shop.menu.length > 0 && shown.length === 0 && <p className="py-16 text-center text-muted">{hi ? "कोई डिश नहीं मिली।" : "No dishes match."}</p>}
          {categories.map((c) => (
            <section key={c} id={encodeURIComponent(c)} className="scroll-mt-36 pt-6">
              <h2 className="text-xl font-semibold tracking-[-0.01em]">
                {c} <span className="text-base font-normal text-muted">({shown.filter((m) => m.category === c).length})</span>
              </h2>
              <ul className="mt-2 divide-y divide-dashed divide-line">
                {shown
                  .filter((m) => m.category === c)
                  .map((m) => (
                    <li key={m.id} className="flex gap-5 py-6">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} aria-label={m.veg ? "Veg" : "Non-veg"} />
                          {m.bestseller && <span className="rounded bg-turmeric-soft px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink">{hi ? "बेस्टसेलर" : "Bestseller"}</span>}
                        </p>
                        <h3 className="mt-1.5 text-[1.05rem] font-semibold">{m.name}</h3>
                        <p className="mt-0.5 font-medium">{inr(m.price)}</p>
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
                        {shop.open && (
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<"upi" | "counter">(shop.upi ? "upi" : "counter");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        json: { name, phone, fulfilment: table ? "table" : "pickup", table: table ?? undefined, pay, note: note || undefined, lines },
      });
      try {
        localStorage.setItem(`zest:order:${slug}`, JSON.stringify(placed));
      } catch {}
      onPlaced(placed);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)] outline-none focus:shadow-[0_0_0_2px_var(--ink)]";
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-paper p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{hi ? "आपका ऑर्डर" : "Your order"}</h2>
          <button type="button" aria-label={hi ? "बंद करें" : "Close"} onClick={onClose} className="rounded-full p-2 hover:bg-sunken">
            <X aria-hidden className="size-5" />
          </button>
        </div>
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
          <li className="flex justify-between py-2 font-semibold">
            <span>{hi ? "कुल" : "Total"}</span>
            <span>{inr(total)}</span>
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted">{table ? (hi ? `टेबल ${table} पर परोसा जाएगा` : `Served at table ${table}`) : hi ? "काउंटर से पिकअप" : "Pick up at the counter"}</p>

        <label className="mt-5 block text-sm text-ink-2">
          {hi ? "नाम" : "Name"}
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={field} />
        </label>
        <label className="mt-3 block text-sm text-ink-2">
          {hi ? "मोबाइल नंबर" : "Mobile number"}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" placeholder="98xxxxxx21" className={field} />
        </label>
        <label className="mt-3 block text-sm text-ink-2">
          {hi ? "कुछ कहना है? (ज़रूरी नहीं)" : "Anything to tell the kitchen? (optional)"}
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={field} />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm text-ink-2">{hi ? "भुगतान" : "Payment"}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {shop.upi && (
              <button type="button" aria-pressed={pay === "upi"} onClick={() => setPay("upi")} className={`rounded-xl px-4 py-3 text-left ${pay === "upi" ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
                UPI
                <span className="block text-sm opacity-70">{hi ? "अपने UPI ऐप से" : "From your UPI app"}</span>
              </button>
            )}
            <button type="button" aria-pressed={pay === "counter"} onClick={() => setPay("counter")} className={`rounded-xl px-4 py-3 text-left ${pay === "counter" ? "bg-ink text-paper" : "bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
              {table ? (hi ? "टेबल पर" : "At the table") : hi ? "काउंटर पर" : "At the counter"}
              <span className="block text-sm opacity-70">{hi ? "कैश, कार्ड या UPI" : "Cash, card or UPI"}</span>
            </button>
          </div>
        </fieldset>

        {error && <p className="mt-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-medium text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? `ऑर्डर करें · ${inr(total)}` : `Place order · ${inr(total)}`}
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
          {status ? pick(STEP[status.status] ?? STEP.new) : pick(STEP.new)}
        </p>
        {status?.paymentStatus === "paid" && <p className="mt-2 text-sm text-leaf">{hi ? "भुगतान मिल गया" : "Payment received"}</p>}

        {upi && status?.paymentStatus !== "paid" && (
          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <p className="font-medium">{hi ? `UPI से ${inr(placed.total)} दें` : `Pay ${inr(placed.total)} by UPI`}</p>
            <a href={upi} className="mt-3 inline-block rounded-full bg-ink px-6 py-3 font-medium text-paper">
              {hi ? "UPI ऐप खोलें" : "Open UPI app"}
            </a>
            {qr && <img src={qr} alt={hi ? "भुगतान के लिए QR कोड" : "QR code to pay"} width={180} height={180} className="mx-auto mt-4" />}
            <p className="mt-2 text-sm text-muted">{hi ? "भुगतान के बाद काउंटर पर ऑर्डर नंबर बताएँ।" : "After paying, show your order number at the counter."}</p>
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
