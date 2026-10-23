"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bike, Camera, Check, ChevronLeft, Copy, ExternalLink, FileText, Leaf, Loader2, LocateFixed, MessageCircle, Plus, Store, Trash2, Upload } from "lucide-react";
import { ChannelTag, Wordmark } from "@/components/bits";
import { ListingPreview } from "@/components/listing-preview";
import { SignInCard } from "@/components/sign-in";
import { api, ApiError, refreshAll } from "@/lib/api";
import { useMe } from "@/lib/auth-client";
import { DEFAULT_DELIVERY, type DeliverySettings } from "@/lib/delivery";
import { cityName, parseListing } from "@/lib/listing";
import { CHANNEL_NAME, PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import type { OutletDTO, PlatformListing } from "@/lib/types";

// Onboarding, in steps, ending with the restaurant's own ordering page live.
//
//   Home chefs and new kitchens (?journey=new): your kitchen → your menu, read from photos →
//   FSSAI and GSTIN, read from photos → delivery and payment → your page.
//   Restaurants already on Zomato or Swiggy (?journey=live): the basics and your listing link (the menu
//   comes from the listing) → delivery and payment → your page.
//
// The owner signs in first, so the restaurant is created with them as its owner. Every step saves as it
// goes, so leaving and coming back picks up where they were.

type Journey = "new" | "live";
type StepId = "details" | "menu" | "docs" | "delivery" | "live";
const STEPS: Record<Journey, StepId[]> = { new: ["details", "menu", "docs", "delivery", "live"], live: ["details", "delivery", "live"] };

type Details = { ownerName: string; ownerPhone: string; name: string; area: string; city: string; address: string; listings: Partial<Record<Platform, string>> };
type ListingRead = { url: string; state: "loading" } | { url: string; state: "ok"; listing: PlatformListing } | { url: string; state: "error"; message: string };
type Dish = { name: string; category: string; price: number; veg: boolean; description: string };
type DocResult = { is_expected_document: boolean; problem: string; holder_name: string; number: string; valid_until: string; extra: string };
type LatLng = { lat: number; lng: number };

const input = "w-full rounded-xl bg-surface px-3.5 py-3 text-[1.02rem] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-turmeric px-6 font-semibold text-[#1c1f23] disabled:opacity-50";
const secondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] hover:shadow-[inset_0_0_0_1.5px_var(--ink-2)]";

function useHi() {
  const { lang } = useApp();
  return lang === "hi";
}

/* ---------------- the page ---------------- */

export default function Join() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-8">
        <Suspense>
          <JoinInner />
        </Suspense>
      </main>
    </div>
  );
}

function JoinInner() {
  const { outlet, outletError } = useApp();
  const { data: me } = useMe();
  const params = useSearchParams();
  const journey: Journey = params.get("journey") === "new" ? "new" : "live";

  if (me && !me.user) {
    const here = `/join${params.toString() ? `?${params}` : ""}`;
    return <SignInCard returnTo={here} />;
  }
  if (!me || (!outlet && !outletError)) {
    return (
      <p className="flex items-center gap-2 py-16 text-muted">
        <Loader2 aria-hidden className="size-4 animate-spin" />
      </p>
    );
  }
  const mine = outlet && !outlet.isDemo ? outlet : null;
  const initial: Details = {
    ownerName: mine?.ownerName ?? "",
    ownerPhone: mine?.ownerPhone ?? "",
    name: mine?.name === "My restaurant" ? "" : (mine?.name ?? ""),
    area: mine?.area ?? "",
    city: mine?.city ?? "",
    address: mine?.address ?? "",
    listings: { ...(mine?.listings ?? {}) },
  };
  // A listing link pasted on the landing page arrives as ?zomato= or ?swiggy=.
  for (const p of PLATFORMS) {
    const link = params.get(p);
    if (link && !initial.listings[p]) initial.listings[p] = link;
  }
  // Keyed by journey only: creating the restaurant changes the outlet, and the steps must carry on.
  return <Wizard key={journey} journey={journey} initial={initial} />;
}

function Wizard({ journey, initial }: { journey: Journey; initial: Details }) {
  const hi = useHi();
  const steps = STEPS[journey];
  const [step, setStep] = useState<StepId>("details");
  const at = steps.indexOf(step);
  const next = () => {
    setStep(steps[Math.min(at + 1, steps.length - 1)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep(steps[Math.max(at - 1, 0)]);

  const LABEL: Record<StepId, string> = {
    details: journey === "new" ? (hi ? "आपकी रसोई" : "Your kitchen") : hi ? "आपका रेस्टोरेंट" : "Your restaurant",
    menu: hi ? "मेन्यू" : "Menu",
    docs: hi ? "दस्तावेज़" : "Documents",
    delivery: hi ? "डिलीवरी" : "Delivery",
    live: hi ? "आपका पेज" : "Your page",
  };

  return (
    <div className="pt-2">
      {/* where you are */}
      <ol className="flex items-center gap-1.5" aria-label={hi ? "क़दम" : "Steps"}>
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= at ? "bg-turmeric" : "bg-line"}`} />
            <span className={`hidden text-xs sm:block ${i === at ? "font-semibold text-ink" : "text-muted"}`}>{LABEL[s]}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted">
        {hi ? `क़दम ${at + 1} / ${steps.length}` : `Step ${at + 1} of ${steps.length}`}
      </p>

      {step === "details" && <DetailsStep journey={journey} initial={initial} onDone={next} />}
      {step === "menu" && <MenuStep onDone={next} onBack={back} />}
      {step === "docs" && <DocsStep onDone={next} onBack={back} />}
      {step === "delivery" && <DeliveryStep journey={journey} onDone={next} onBack={back} />}
      {step === "live" && <LiveStep journey={journey} />}
    </div>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mt-1">
      <h1 className="text-[clamp(1.8rem,4.5vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">{children}</h1>
      {sub && <p className="mt-2 max-w-[56ch] text-lg leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

function Field({ label, hint, required, className = "", ...rest }: { label: React.ReactNode; hint?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-baseline gap-2 text-sm text-ink-2">
        {label}
        {required && <span aria-hidden className="text-chilli">*</span>}
        {hint && <span className="text-muted">{hint}</span>}
      </span>
      <input {...rest} required={required} className={input} />
    </label>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p className="mt-4 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli" role="alert">
      {error}
    </p>
  ) : null;
}

/** The kitchen's location from this phone, for pricing delivery by distance. */
function useLocate() {
  const [where, setWhere] = useState<LatLng | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "denied">("idle");
  function locate() {
    if (!navigator.geolocation) return setState("denied");
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setWhere({ lat: p.coords.latitude, lng: p.coords.longitude });
        setState("idle");
      },
      () => setState("denied"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }
  return { where, setWhere, state, locate };
}

/* ---------------- step 1: who and where ---------------- */

function DetailsStep({ journey, initial, onDone }: { journey: Journey; initial: Details; onDone: () => void }) {
  const hi = useHi();
  const { lang, outlet } = useApp();
  const [f, setF] = useState<Details>(initial);
  const [read, setRead] = useState<Partial<Record<Platform, ListingRead>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loc = useLocate();
  const set = (k: keyof Omit<Details, "listings">) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setF((x) => ({ ...x, [k]: e.target.value }));
  };
  const live = journey === "live";
  const linked = PLATFORMS.filter((p) => f.listings[p]?.trim());

  // Read a pasted listing link, and fill empty fields from it.
  async function fillFromLink(p: Platform) {
    const link = parseListing(f.listings[p] ?? "", f.name);
    if (!link || link.platform !== p) return;
    setF((x) => ({ ...x, city: x.city || (link.city ? cityName(link.city) : ""), area: x.area || link.areaHint || "" }));
    if (read[p]?.url === link.url) return;
    setRead((r) => ({ ...r, [p]: { url: link.url, state: "loading" } }));
    try {
      const listing = await api<PlatformListing>("/api/listing/preview", { method: "POST", json: { url: link.url } });
      setRead((r) => ({ ...r, [p]: { url: link.url, state: "ok", listing } }));
      const keep = (mine: string, theirs: string | null) => (mine.trim() ? mine : (theirs ?? ""));
      setF((x) => ({ ...x, name: keep(x.name, listing.name), area: keep(x.area, listing.area), city: keep(x.city, listing.city), address: keep(x.address, listing.address) }));
    } catch (err) {
      setRead((r) => ({ ...r, [p]: { url: link.url, state: "error", message: (err as Error).message } }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.ownerName.trim() || !f.name.trim() || !f.area.trim() || !f.city.trim()) {
      return setError(hi ? "नाम, रसोई/रेस्टोरेंट, इलाक़ा और शहर भरें।" : "Fill in your name, the kitchen's name, area and city.");
    }
    if (live && linked.length === 0) return setError(hi ? "अपना Zomato या Swiggy लिंक डालिए।" : "Paste your Zomato or Swiggy link.");
    setBusy(true);
    setError(null);
    try {
      await api<OutletDTO>("/api/outlet", {
        method: "POST",
        json: {
          journey,
          live: live ? linked : [],
          lang,
          ownerName: f.ownerName,
          ownerPhone: f.ownerPhone.trim() || null,
          name: f.name,
          area: f.area,
          city: f.city,
          address: f.address,
          listings: Object.fromEntries(linked.map((p) => [p, f.listings[p] ?? ""])),
        },
      });
      if (loc.where) await api("/api/outlet", { method: "PATCH", json: { location: loc.where } });
      refreshAll();
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-1">
      <Title sub={live ? (hi ? "अपना Zomato या Swiggy लिंक डालिए। नाम, पता, मेन्यू और फ़ोटो हम वहीं से ले लेंगे।" : "Paste your Zomato or Swiggy link. We bring your name, address, menu and photos from it.") : hi ? "आपकी रसोई के बारे में थोड़ा-सा। एक मिनट लगेगा।" : "A little about you and your kitchen. It takes a minute."}>
        {live ? (hi ? "अपना ऑर्डर पेज बनाइए" : "Create your ordering page") : hi ? "आपकी रसोई" : "Your kitchen"}
      </Title>

      {live && (
        <fieldset className="mt-8 space-y-4">
          <legend className="sr-only">{hi ? "आपकी लिस्टिंग" : "Your listing"}</legend>
          {PLATFORMS.map((p) => {
            const value = f.listings[p] ?? "";
            const link = value.trim() ? parseListing(value, f.name) : null;
            const wrong = value.trim() && (!link || link.platform !== p);
            const r = read[p];
            return (
              <div key={p}>
                <Field
                  label={<ChannelTag channel={p} className="text-ink" />}
                  hint={p === "swiggy" ? (hi ? "अगर हैं" : "if you're on it") : undefined}
                  value={value}
                  onChange={(e) => {
                    setError(null);
                    setF((x) => ({ ...x, listings: { ...x.listings, [p]: e.target.value } }));
                  }}
                  onBlur={() => fillFromLink(p)}
                  type="url"
                  inputMode="url"
                  placeholder={p === "zomato" ? "https://www.zomato.com/bangalore/your-restaurant" : "https://www.swiggy.com/restaurants/your-restaurant-12345"}
                />
                {wrong && <p className="mt-1 text-sm text-chilli">{hi ? `यह ${CHANNEL_NAME[p]} रेस्टोरेंट का लिंक नहीं लगता।` : `That doesn't look like a ${CHANNEL_NAME[p]} restaurant link.`}</p>}
                {r && link && r.url === link.url && (
                  <div className="mt-3">
                    {r.state === "loading" ? (
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                        {hi ? `${CHANNEL_NAME[p]} से आपकी लिस्टिंग पढ़ रहे हैं…` : `Reading your listing from ${CHANNEL_NAME[p]}…`}
                      </p>
                    ) : r.state === "error" ? (
                      <p className="text-sm text-turmeric">
                        {r.message} {hi ? "बाक़ी आप ख़ुद भर सकते हैं।" : "You can fill in the rest yourself."}
                      </p>
                    ) : (
                      <>
                        <ListingPreview listing={r.listing} />
                        <p className="mt-2 text-sm text-leaf">
                          {r.listing.menu.length > 0
                            ? hi ? `${r.listing.menu.length} डिश आपके पेज पर आ जाएँगी।` : `${r.listing.menu.length} dishes will come onto your page.`
                            : hi ? "इस लिस्टिंग में डिश की सूची नहीं मिली; मेन्यू बाद में जोड़ सकते हैं।" : "No dish list on this listing; you can add the menu later."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
      )}

      <fieldset className="mt-8 grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-medium">{hi ? "आपके बारे में" : "About you"}</legend>
        <Field label={hi ? "आपका नाम" : "Your name"} value={f.ownerName} onChange={set("ownerName")} autoComplete="name" required />
        <Field label={hi ? "फ़ोन (WhatsApp)" : "Phone (WhatsApp)"} hint={hi ? "ऑर्डर अलर्ट के लिए" : "for order alerts"} value={f.ownerPhone} onChange={set("ownerPhone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxxxxx21" />
      </fieldset>

      <fieldset className="mt-8 grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-medium">{live ? (hi ? "आपका रेस्टोरेंट" : "Your restaurant") : hi ? "आपकी रसोई" : "Your kitchen"}</legend>
        <Field className="sm:col-span-2" label={live ? (hi ? "रेस्टोरेंट का नाम" : "Restaurant name") : hi ? "रसोई का नाम" : "Kitchen name"} value={f.name} onChange={set("name")} autoComplete="organization" placeholder={live ? "" : hi ? "जैसे मीना की रसोई" : "e.g. Meena's Kitchen"} required />
        <Field label={hi ? "इलाक़ा" : "Area or locality"} value={f.area} onChange={set("area")} placeholder={hi ? "जैसे ग्रीन पार्क" : "e.g. Green Park"} required />
        <Field label={hi ? "शहर" : "City"} value={f.city} onChange={set("city")} autoComplete="address-level2" required />
        <Field className="sm:col-span-2" label={hi ? "पूरा पता" : "Full address"} hint={journey === "new" ? (hi ? "ग्राहकों को नहीं दिखता" : "not shown to customers") : undefined} value={f.address} onChange={set("address")} autoComplete="street-address" placeholder={hi ? "मकान/दुकान नं., गली, लैंडमार्क" : "House or shop no., street, landmark"} />
        <div className="sm:col-span-2">
          <LocateButton loc={loc} saved={!!outlet?.location} />
        </div>
      </fieldset>

      <ErrorLine error={error} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={primary}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "आगे बढ़ें" : "Continue"}
        </button>
      </div>
    </form>
  );
}

function LocateButton({ loc, saved }: { loc: ReturnType<typeof useLocate>; saved: boolean }) {
  const hi = useHi();
  const have = !!loc.where || saved;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <LocateFixed aria-hidden className="size-5 shrink-0 text-turmeric" />
      <p className="min-w-0 flex-1 text-sm text-ink-2">
        {have ? (hi ? "रसोई की लोकेशन मिल गई। डिलीवरी की फ़ीस दूरी से तय होगी।" : "Kitchen location saved. Delivery is priced by distance from here.") : hi ? "अभी रसोई में हैं? लोकेशन दीजिए ताकि डिलीवरी फ़ीस दूरी से तय हो।" : "At the kitchen now? Share its location so delivery is priced by distance."}
        {loc.state === "denied" && <span className="block text-chilli">{hi ? "लोकेशन नहीं मिली। बाद में फिर कोशिश करें।" : "Couldn't get the location. You can try again later."}</span>}
      </p>
      <button type="button" onClick={loc.locate} disabled={loc.state === "busy"} className={`${secondary} min-h-10 text-sm`}>
        {loc.state === "busy" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : have ? <Check aria-hidden className="size-4 text-leaf" /> : <LocateFixed aria-hidden className="size-4" />}
        {have ? (hi ? "फिर से लें" : "Update") : hi ? "लोकेशन दें" : "Use my location"}
      </button>
    </div>
  );
}

/* ---------------- step 2 (home chefs): the menu, from photos ---------------- */

function MenuStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const hi = useHi();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [reading, setReading] = useState<{ n: number; of: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function readPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files];
    for (let i = 0; i < list.length; i++) {
      setReading({ n: i + 1, of: list.length });
      const form = new FormData();
      form.set("file", list[i]);
      try {
        const { items } = await api<{ items: Dish[] }>("/api/onboarding/menu", { method: "POST", body: form });
        setDishes((d) => {
          const seen = new Set(d.map((x) => x.name.toLowerCase()));
          return [...d, ...items.filter((x) => !seen.has(x.name.toLowerCase()))];
        });
      } catch (e) {
        setError(e instanceof ApiError && e.status === 503 ? (hi ? "इस सर्वर पर फ़ोटो से मेन्यू पढ़ना चालू नहीं है। डिश नीचे लिख दीजिए।" : "Reading menus from photos isn't switched on for this server. Type your dishes below.") : (e as Error).message);
      }
    }
    setReading(null);
    if (file.current) file.current.value = "";
  }

  const edit = (i: number, patch: Partial<Dish>) => setDishes((d) => d.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const good = dishes.filter((d) => d.name.trim() && d.price > 0);

  async function save() {
    if (!good.length) return setError(hi ? "कम से कम एक डिश और उसका दाम डालिए।" : "Add at least one dish with its price.");
    setBusy(true);
    setError(null);
    try {
      await api("/api/menu/import", { method: "POST", json: { items: good.map((d) => ({ ...d, name: d.name.trim(), category: d.category.trim() || "Menu", price: Math.round(d.price) })) } });
      refreshAll();
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <Title sub={hi ? "मेन्यू की फ़ोटो लीजिए, जैसा भी लिखा हो। Zest हर डिश, दाम और वेज/नॉन-वेज पढ़ लेगा, आप जाँच लीजिए।" : "Take a photo of your menu, however it's written. Zest reads every dish, price and veg or non-veg; you check it."}>
        {hi ? "आपका मेन्यू" : "Your menu"}
      </Title>

      <label className={`mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-10 text-center hover:border-turmeric ${reading ? "pointer-events-none opacity-70" : ""}`}>
        {reading ? <Loader2 aria-hidden className="size-8 animate-spin text-turmeric" /> : <Camera aria-hidden className="size-8 text-turmeric" />}
        <span className="text-lg font-semibold">{reading ? (hi ? `फ़ोटो ${reading.n} / ${reading.of} पढ़ रहे हैं…` : `Reading photo ${reading.n} of ${reading.of}…`) : hi ? "मेन्यू की फ़ोटो लें या चुनें" : "Take or choose menu photos"}</span>
        <span className="text-sm text-muted">{hi ? "एक या ज़्यादा पन्ने · JPG, PNG या PDF" : "One page or several · JPG, PNG or PDF"}</span>
        <input ref={file} type="file" accept="image/*,application/pdf" multiple capture="environment" className="sr-only" onChange={(e) => readPhotos(e.target.files)} />
      </label>

      {dishes.length > 0 && (
        <p className="mt-6 text-sm font-medium text-leaf">
          {hi ? `${dishes.length} डिश मिलीं। नाम, दाम या वेज ठीक कर लीजिए।` : `Found ${dishes.length} dishes. Fix any name, price or veg mark.`}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {dishes.map((d, i) => (
          <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_88px_auto] items-center gap-2 rounded-2xl bg-surface p-2 shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.7fr)_100px_auto]">
            <button type="button" onClick={() => edit(i, { veg: !d.veg })} aria-label={d.veg ? (hi ? "वेज, बदलें" : "Veg, change") : hi ? "नॉन-वेज, बदलें" : "Non-veg, change"} className="grid size-10 place-items-center">
              <span className={`grid size-4 place-items-center rounded-[3px] border-2 ${d.veg ? "border-leaf" : "border-chilli"}`}>
                <span className={`size-1.5 rounded-full ${d.veg ? "bg-leaf" : "bg-chilli"}`} />
              </span>
            </button>
            <input aria-label={hi ? "डिश" : "Dish"} value={d.name} onChange={(e) => edit(i, { name: e.target.value })} placeholder={hi ? "डिश का नाम" : "Dish name"} className="min-w-0 rounded-lg bg-transparent px-2 py-2 outline-none focus:bg-sunken" />
            <input aria-label={hi ? "सेक्शन" : "Section"} value={d.category} onChange={(e) => edit(i, { category: e.target.value })} placeholder={hi ? "सेक्शन" : "Section"} className="hidden min-w-0 rounded-lg bg-transparent px-2 py-2 text-ink-2 outline-none focus:bg-sunken sm:block" />
            <label className="flex items-center rounded-lg px-2 focus-within:bg-sunken">
              <span className="text-muted">₹</span>
              <input aria-label={hi ? "दाम" : "Price"} value={d.price || ""} onChange={(e) => edit(i, { price: Number(e.target.value.replace(/\D/g, "")) || 0 })} inputMode="numeric" className="w-full bg-transparent px-1 py-2 outline-none" />
            </label>
            <button type="button" onClick={() => setDishes((x) => x.filter((_, k) => k !== i))} aria-label={hi ? "हटाएँ" : "Remove"} className="grid size-10 place-items-center text-muted hover:text-chilli">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setDishes((d) => [...d, { name: "", category: d.at(-1)?.category ?? "", price: 0, veg: true, description: "" }])} className={`${secondary} mt-3 min-h-10 text-sm`}>
        <Plus aria-hidden className="size-4" /> {hi ? "डिश जोड़ें" : "Add a dish"}
      </button>

      <ErrorLine error={error} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !!reading} className={primary}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? `${good.length} डिश सेव करें` : `Save ${good.length} ${good.length === 1 ? "dish" : "dishes"}`}
        </button>
        <button type="button" onClick={onBack} className="px-3 text-ink-2 underline underline-offset-4">
          {hi ? "पीछे" : "Back"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- step 3 (home chefs): FSSAI and GSTIN ---------------- */

function DocsStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const hi = useHi();
  const { outlet } = useApp();
  const [fssai, setFssai] = useState(outlet?.fssai ?? "");
  const [gstin, setGstin] = useState(outlet?.gstin ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(skip: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (!skip) await api("/api/outlet", { method: "PATCH", json: { fssai: fssai.replace(/\s/g, "") || null, gstin: gstin.trim().toUpperCase() || null } });
      refreshAll();
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <Title sub={hi ? "फ़ोटो लीजिए, नंबर हम पढ़ लेंगे। FSSAI नंबर आपके पेज पर दिखता है, जिससे ग्राहक भरोसा करते हैं।" : "Take a photo and we read the number. Your FSSAI number shows on your page, which customers trust."}>
        {hi ? "दस्तावेज़" : "Documents"}
      </Title>
      <div className="mt-8 grid gap-4">
        <DocCard kind="fssai" title={hi ? "FSSAI रजिस्ट्रेशन या लाइसेंस" : "FSSAI registration or licence"} why={hi ? "घर की रसोई के लिए भी, खाना बेचने और पहुँचाने के लिए ज़रूरी।" : "Needed to sell and deliver food, home kitchens included."} value={fssai} onValue={setFssai} pattern={/^\d{14}$/} placeholder="14 digits" />
        <DocCard kind="gst" title="GSTIN" why={hi ? "सिर्फ़ अगर आप GST में रजिस्टर्ड हैं।" : "Only if you're registered for GST."} value={gstin} onValue={(v) => setGstin(v.toUpperCase())} pattern={/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/} placeholder="07ABCDE1234F1Z5" optional />
      </div>
      <ErrorLine error={error} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => save(false)} disabled={busy} className={primary}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {hi ? "आगे बढ़ें" : "Continue"}
        </button>
        <button type="button" onClick={() => save(true)} disabled={busy} className="px-3 text-ink-2 underline underline-offset-4">
          {hi ? "बाद में जोड़ूँगा" : "I'll add these later"}
        </button>
        <button type="button" onClick={onBack} className="px-3 text-ink-2 underline underline-offset-4">
          {hi ? "पीछे" : "Back"}
        </button>
      </div>
    </div>
  );
}

function DocCard({ kind, title, why, value, onValue, pattern, placeholder, optional }: { kind: "fssai" | "gst"; title: string; why: string; value: string; onValue: (v: string) => void; pattern: RegExp; placeholder: string; optional?: boolean }) {
  const hi = useHi();
  const [state, setState] = useState<"idle" | "reading" | "ok" | "problem">(value ? "ok" : "idle");
  const [note, setNote] = useState<string | null>(null);
  const clean = value.replace(/\s/g, "");
  const valid = !clean || pattern.test(clean);

  async function read(f: File | undefined) {
    if (!f) return;
    setState("reading");
    setNote(null);
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", f);
    try {
      const r = await api<DocResult>("/api/onboarding/document", { method: "POST", body: form });
      if (r.is_expected_document && r.number) {
        onValue(r.number.replace(/\s/g, ""));
        setState("ok");
        setNote([r.holder_name, r.valid_until && (hi ? `${r.valid_until} तक मान्य` : `valid till ${r.valid_until}`)].filter(Boolean).join(" · "));
      } else {
        setState("problem");
        setNote(r.problem || (hi ? "यह सही दस्तावेज़ नहीं लगा।" : "That didn't look like the right document."));
      }
    } catch (e) {
      setState("problem");
      setNote(e instanceof ApiError && e.status === 503 ? (hi ? "इस सर्वर पर फ़ोटो पढ़ना चालू नहीं है। नंबर लिख दीजिए।" : "Reading photos isn't switched on for this server. Type the number.") : (e as Error).message);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[inset_0_0_0_1px_var(--line)] sm:p-5">
      <div className="flex items-start gap-3">
        <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-turmeric" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {title} {optional && <span className="text-sm font-normal text-muted">{hi ? "ज़रूरी नहीं" : "optional"}</span>}
          </p>
          <p className="text-sm text-ink-2">{why}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className={`${secondary} min-h-11 cursor-pointer text-sm`}>
          {state === "reading" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
          {state === "reading" ? (hi ? "पढ़ रहे हैं…" : "Reading…") : hi ? "फ़ोटो से पढ़ें" : "Read from a photo"}
          <input type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={(e) => read(e.target.files?.[0])} />
        </label>
        <span className="text-sm text-muted">{hi ? "या" : "or"}</span>
        <input value={value} onChange={(e) => onValue(e.target.value)} placeholder={placeholder} aria-label={title} className={`${input} min-w-0 flex-1 py-2.5 font-mono tracking-wide`} />
      </div>
      {note && <p className={`mt-2 text-sm ${state === "problem" ? "text-chilli" : "text-leaf"}`}>{note}</p>}
      {!valid && <p className="mt-2 text-sm text-chilli">{kind === "fssai" ? (hi ? "FSSAI नंबर में 14 अंक होते हैं।" : "An FSSAI number has 14 digits.") : hi ? "GSTIN में 15 अक्षर होते हैं।" : "A GSTIN has 15 characters."}</p>}
    </div>
  );
}

/* ---------------- delivery and payment (both journeys) ---------------- */

function DeliveryStep({ journey, onDone, onBack }: { journey: Journey; onDone: () => void; onBack: () => void }) {
  const hi = useHi();
  const { outlet } = useApp();
  const [d, setD] = useState<DeliverySettings>(outlet?.delivery ?? DEFAULT_DELIVERY);
  const [upi, setUpi] = useState(outlet?.upiId ?? "");
  const [free, setFree] = useState(d.freeAbove ? String(d.freeAbove) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loc = useLocate();
  const delivers = d.zomatoRider || d.ownStaff;
  const located = !!loc.where || !!outlet?.location;

  async function save() {
    if (!delivers && !d.pickup) return setError(hi ? "डिलीवरी या पिकअप में से कम से कम एक चुनिए।" : "Choose delivery, pickup, or both.");
    setBusy(true);
    setError(null);
    try {
      await api("/api/outlet", {
        method: "PATCH",
        json: { delivery: { ...d, freeAbove: free ? Number(free) : null }, upiId: upi.trim() || null, ordering: true, ...(loc.where ? { location: loc.where } : {}) },
      });
      refreshAll();
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const Toggle = ({ on, onChange, icon: Icon, title, text }: { on: boolean; onChange: (v: boolean) => void; icon: typeof Bike; title: string; text: string }) => (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors ${on ? "bg-surface shadow-[inset_0_0_0_2px_var(--turmeric)]" : "bg-surface shadow-[inset_0_0_0_1px_var(--line)]"}`}>
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${on ? "text-turmeric" : "text-muted"}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-2">{text}</span>
      </span>
      <span aria-hidden className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? "justify-end bg-turmeric" : "justify-start bg-line"}`}>
        <span className="size-5 rounded-full bg-paper" />
      </span>
    </button>
  );

  return (
    <div>
      <Title sub={hi ? "आपके पेज के ऑर्डर ग्राहक तक कैसे पहुँचें, और पैसा कहाँ आए।" : "How orders from your page reach customers, and where the money goes."}>{hi ? "डिलीवरी और भुगतान" : "Delivery and payment"}</Title>

      <div className="mt-8 grid gap-3">
        <Toggle on={d.zomatoRider} onChange={(v) => setD({ ...d, zomatoRider: v })} icon={Bike} title={hi ? "Zomato राइडर से डिलीवरी" : "Delivery by Zomato riders"} text={hi ? "खाना तैयार होते ही राइडर बुक, ग्राहक को लाइव ट्रैकिंग।" : "A rider is booked as the food gets ready; the customer tracks it live."} />
        <Toggle on={d.ownStaff} onChange={(v) => setD({ ...d, ownStaff: v })} icon={Store} title={hi ? "अपने स्टाफ़ से डिलीवरी" : "Delivery by your own staff"} text={d.zomatoRider ? (hi ? "जब Zomato राइडर बंद हों।" : "Used when Zomato riders are switched off.") : hi ? "आपका स्टाफ़ ले जाता है, ग्राहक को ट्रैकिंग लिंक।" : "Your staff take it; the customer gets a tracking link."} />
        <Toggle on={d.pickup} onChange={(v) => setD({ ...d, pickup: v })} icon={Leaf} title={hi ? "पिकअप" : "Pickup"} text={hi ? "ग्राहक ख़ुद ले जाए।" : "Customers collect it themselves."} />
      </div>

      {delivers && (
        <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-2 sm:p-5">
          <fieldset className="sm:col-span-2">
            <legend className="text-sm text-ink-2">{hi ? "डिलीवरी फ़ीस (दूरी से तय) कौन देगा?" : "Who pays the delivery fee (priced by distance)?"}</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
              {(["customer", "restaurant"] as const).map((w) => (
                <button key={w} type="button" aria-pressed={d.feePaidBy === w} onClick={() => setD({ ...d, feePaidBy: w })} className={`min-h-10 rounded-lg font-medium ${d.feePaidBy === w ? "bg-ink text-paper" : "text-ink-2"}`}>
                  {w === "customer" ? (hi ? "ग्राहक" : "The customer") : hi ? "मैं" : "I do"}
                </button>
              ))}
            </div>
          </fieldset>
          {d.feePaidBy === "customer" && <Field label={hi ? "इससे ऊपर के ऑर्डर पर मुफ़्त डिलीवरी" : "Free delivery on orders above"} hint={hi ? "ज़रूरी नहीं" : "optional"} value={free} onChange={(e) => setFree(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="₹ 499" />}
          <label className="block">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "कितनी दूर तक" : "Deliver up to"}</span>
            <select value={d.maxKm} onChange={(e) => setD({ ...d, maxKm: Number(e.target.value) })} className={input}>
              {[3, 5, 7, 10, 15].map((k) => (
                <option key={k} value={k}>
                  {k} km
                </option>
              ))}
            </select>
          </label>
          {!located && (
            <div className="sm:col-span-2">
              <LocateButton loc={loc} saved={false} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Field label={hi ? "आपकी UPI ID" : "Your UPI ID"} hint={hi ? "ग्राहक सीधे इसमें भुगतान करते हैं" : "customers pay straight into it"} value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@okhdfc" autoComplete="off" />
      </div>

      <ErrorLine error={error} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={primary}>
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {journey === "new" ? (hi ? "मेरा पेज बनाइए" : "Create my page") : hi ? "मेरा ऑर्डर पेज बनाइए" : "Create my ordering page"}
        </button>
        <button type="button" onClick={onBack} className="px-3 text-ink-2 underline underline-offset-4">
          {hi ? "पीछे" : "Back"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- your page is live ---------------- */

function LiveStep({ journey }: { journey: Journey }) {
  const hi = useHi();
  const { outlet } = useApp();
  const [qr, setQr] = useState<{ url: string; svg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api<{ url: string; svg: string }>("/api/outlet/site-qr").then(setQr, () => {});
  }, [outlet?.slug]);
  const url = qr?.url ?? (outlet?.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${outlet.slug}` : "");
  const share = `${hi ? "अब हमसे ऑनलाइन ऑर्डर कीजिए" : "You can now order from us online"}: ${url}`;
  const d = outlet?.delivery;

  return (
    <div>
      <span className="mt-2 grid size-14 place-items-center rounded-full bg-leaf-soft text-leaf">
        <Check aria-hidden className="size-7" />
      </span>
      <Title sub={hi ? "लिंक अपने ग्रुप में भेजिए, QR काउंटर पर लगाइए। ऑर्डर आते ही आपको पता चलेगा।" : "Send the link to your groups and put the QR on your counter. You'll know the moment an order comes in."}>
        {hi ? `${outlet?.name ?? "आपका"} पेज तैयार है` : `${outlet?.name ?? "Your"} page is live`}
      </Title>

      <div className="mt-8 grid gap-6 rounded-3xl bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)] sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
        <div className="min-w-0">
          <p className="text-sm text-muted">{hi ? "आपका पेज" : "Your page"}</p>
          <p className="mt-1 break-all text-lg font-semibold">{url.replace(/^https?:\/\//, "")}</p>
          <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
            {d && (d.zomatoRider || d.ownStaff) && (
              <li className="flex items-center gap-2">
                <Bike aria-hidden className="size-4 text-turmeric" /> {d.zomatoRider ? (hi ? `Zomato राइडर से डिलीवरी, ${d.maxKm} किमी तक` : `Delivery by Zomato riders, up to ${d.maxKm} km`) : hi ? `आपके स्टाफ़ से डिलीवरी, ${d.maxKm} किमी तक` : `Delivery by your staff, up to ${d.maxKm} km`}
              </li>
            )}
            {d?.pickup && (
              <li className="flex items-center gap-2">
                <Store aria-hidden className="size-4 text-turmeric" /> {hi ? "पिकअप" : "Pickup"}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Check aria-hidden className="size-4 text-turmeric" /> {outlet?.upiId ? (hi ? `UPI से भुगतान: ${outlet.upiId}` : `UPI payments to ${outlet.upiId}`) : hi ? "भुगतान डिलीवरी/पिकअप पर" : "Payment on delivery or pickup"}
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noreferrer" className={primary}>
              <ExternalLink aria-hidden className="size-4" /> {hi ? "पेज खोलें" : "Open my page"}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(url).then(() => setCopied(true));
              }}
              className={secondary}
            >
              {copied ? <Check aria-hidden className="size-4 text-leaf" /> : <Copy aria-hidden className="size-4" />} {copied ? (hi ? "कॉपी हो गया" : "Copied") : hi ? "लिंक कॉपी करें" : "Copy link"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer" className={secondary}>
              <MessageCircle aria-hidden className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
        {qr && <div className="size-40 justify-self-center rounded-2xl bg-white p-2 sm:size-44" aria-label={hi ? "आपके पेज का QR कोड" : "QR code for your page"} role="img" dangerouslySetInnerHTML={{ __html: qr.svg }} />}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/app" className={secondary}>
          {hi ? "डैशबोर्ड पर जाएँ" : "Go to my dashboard"}
        </Link>
        {journey === "live" && (
          <Link href="/connect" className={secondary}>
            {hi ? "सुबह की रिपोर्ट के लिए ईमेल जोड़ें" : "Connect email for the morning summary"}
          </Link>
        )}
      </div>
    </div>
  );
}
