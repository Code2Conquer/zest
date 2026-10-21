"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Check, Loader2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { LangToggle } from "@/components/bits";
import { api } from "@/lib/api";
import { useApp } from "@/lib/state";

// The restaurant's own ordering site. Phone first: browse, add dishes, give a name and number,
// pick up or eat at the table, and pay by UPI to the restaurant or at the counter.

type Dish = { id: string; name: string; category: string; description: string; veg: boolean; bestseller: boolean; photo: string | null; price: number };
type Shop = { name: string; area: string; cuisines: string; fssai: string | null; open: boolean; upi: boolean; menu: Dish[] };
type Placed = { orderId: string; number: string; total: number; token: string; upiLink: string | null };
type Status = { number: string; status: string; total: number; items: string; paymentStatus: "unpaid" | "paid" | null; fulfilment: string | null; table: string | null; upiLink: string | null };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STEP: Record<string, { en: string; hi: string }> = {
  new: { en: "Sent to the kitchen", hi: "किचन को भेजा गया" },
  accepted: { en: "Accepted", hi: "स्वीकार हुआ" },
  preparing: { en: "Being prepared", hi: "बन रहा है" },
  ready: { en: "Ready", hi: "तैयार है" },
  completed: { en: "Collected. Enjoy!", hi: "ले लिया गया। मज़े करें!" },
  served: { en: "Served. Enjoy!", hi: "परोसा गया। मज़े करें!" },
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

  useEffect(() => {
    api<Shop>(`/api/storefront/${slug}`).then(setShop, (e: Error) => setError(e.message));
    // Come back to an order placed earlier on this phone.
    try {
      const saved = localStorage.getItem(`zest:order:${slug}`);
      if (saved) setPlaced(JSON.parse(saved) as Placed);
    } catch {}
  }, [slug]);

  const categories = useMemo(() => [...new Set(shop?.menu.map((m) => m.category) ?? [])], [shop]);
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

  return (
    <div className="min-h-dvh bg-paper pb-28 text-ink">
      <header className="bg-curry px-5 pb-6 pt-6 text-[#f4efe6]">
        <div className="mx-auto flex max-w-xl items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#f4efe6]/60">{shop.area}</p>
            <h1 className="font-sign mt-1 text-[2.2rem] leading-none">{shop.name}</h1>
            {shop.cuisines && <p className="mt-2 text-[#f4efe6]/75">{shop.cuisines}</p>}
            <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${shop.open ? "bg-haldi text-ink" : "bg-white/15 text-[#f4efe6]"}`}>
              {shop.open ? (table ? (hi ? `टेबल ${table} से ऑर्डर` : `Ordering for table ${table}`) : hi ? "पिकअप के लिए ऑर्डर करें" : "Order for pickup") : hi ? "अभी बंद है" : "Closed right now"}
            </p>
          </div>
          <LangToggle />
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

      <main className="mx-auto max-w-xl px-5">
        {shop.menu.length === 0 && <p className="py-16 text-center text-muted">{hi ? "मेन्यू अपडेट हो रहा है।" : "The menu is being updated."}</p>}
        {categories.map((c) => (
          <section key={c} id={encodeURIComponent(c)} className="scroll-mt-16 pt-8">
            <h2 className="text-lg font-semibold">{c}</h2>
            <ul className="mt-2 divide-y divide-line">
              {shop.menu
                .filter((m) => m.category === c)
                .map((m) => (
                  <li key={m.id} className="flex gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <span className={`food-mark ${m.veg ? "text-veg" : "nonveg text-nonveg"}`} aria-label={m.veg ? "Veg" : "Non-veg"} />
                      <p className="mt-1 font-medium">{m.name}</p>
                      <p className="text-sm text-ink-2">{inr(m.price)}</p>
                      {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      {m.photo && <img src={m.photo} alt="" width={112} height={84} loading="lazy" className="h-[84px] w-[112px] rounded-xl object-cover" />}
                      {shop.open &&
                        (cart[m.id] ? (
                          <span className="inline-flex items-center gap-3 rounded-lg bg-ink px-2 py-1.5 text-paper">
                            <button type="button" aria-label={hi ? "एक कम" : "One less"} onClick={() => add(m.id, -1)}>
                              <Minus aria-hidden className="size-4" />
                            </button>
                            <span className="min-w-4 text-center font-medium">{cart[m.id]}</span>
                            <button type="button" aria-label={hi ? "एक और" : "One more"} onClick={() => add(m.id, 1)}>
                              <Plus aria-hidden className="size-4" />
                            </button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => add(m.id, 1)} className="rounded-lg bg-surface px-5 py-1.5 font-medium text-leaf shadow-[0_0_0_1px_var(--line)]">
                            {hi ? "जोड़ें" : "Add"}
                          </button>
                        ))}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        <p className="mt-10 text-center text-xs text-muted">
          {shop.fssai ? `FSSAI ${shop.fssai} · ` : ""}
          {hi ? "क़ीमतों में लागू टैक्स शामिल। Zest द्वारा ऑर्डरिंग।" : "Prices include taxes where applicable. Ordering by Zest."}
        </p>
      </main>

      {count > 0 && !checkout && (
        <button type="button" onClick={() => setCheckout(true)} className="fixed inset-x-4 bottom-4 z-20 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-ink px-5 py-4 text-paper shadow-xl">
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

function OrderPlaced({ slug, placed, onNew }: { slug: string; placed: Placed; onNew: () => void }) {
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
        <h1 className="mt-4 text-2xl font-semibold">{hi ? "ऑर्डर मिल गया" : "Order received"}</h1>
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

        {done && (
          <button type="button" onClick={onNew} className="mt-6 rounded-full px-6 py-3 font-medium shadow-[inset_0_0_0_1.5px_var(--ink)]">
            {hi ? "नया ऑर्डर" : "Order again"}
          </button>
        )}
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
