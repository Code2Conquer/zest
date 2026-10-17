"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { ChannelTag, LangToggle, Wordmark } from "@/components/bits";
import { api, refreshAll } from "@/lib/api";
import { cityName, parseListing } from "@/lib/listing";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import { ListingPreview } from "@/components/listing-preview";
import type { OutletDTO, ZomatoListing } from "@/lib/types";

type Journey = "new" | "notlive" | "live";

type Form = {
  ownerName: string;
  ownerPhone: string;
  name: string;
  area: string;
  city: string;
  address: string;
  fssai: string;
  gstin: string;
  listings: Partial<Record<Platform, string>>;
};

const fromOutlet = (o: OutletDTO | null): Form => {
  const mine = o && !o.isDemo ? o : null;
  return {
    ownerName: mine?.ownerName ?? "",
    ownerPhone: mine?.ownerPhone ?? "",
    name: mine?.name === "My restaurant" ? "" : (mine?.name ?? ""),
    area: mine?.area ?? "",
    city: mine?.city ?? "",
    address: mine?.address ?? "",
    fssai: mine?.fssai ?? "",
    gstin: mine?.gstin ?? "",
    listings: mine?.listings ?? {},
  };
};

/** Step 1 for a new owner: who they are and which restaurant. Creates both on the server. */
function JoinInner() {
  const { outlet, outletError } = useApp();
  const params = useSearchParams();
  const raw = params.get("journey");
  const journey: Journey = raw === "new" || raw === "notlive" ? raw : "live";
  const live = (params.get("live") ?? "").split(",").filter((p): p is Platform => (PLATFORMS as string[]).includes(p));
  const platforms = journey === "live" ? (live.length ? live : PLATFORMS) : [];

  // Wait for the current outlet so a returning owner sees what they filled in before.
  if (!outlet && !outletError) {
    return (
      <p className="flex items-center gap-2 py-16 text-muted">
        <Loader2 aria-hidden className="size-4 animate-spin" />
      </p>
    );
  }
  return <JoinForm key={outlet?.id ?? "new"} journey={journey} platforms={platforms} initial={fromOutlet(outlet)} />;
}

function JoinForm({ journey, platforms, initial }: { journey: Journey; platforms: Platform[]; initial: Form }) {
  const { lang } = useApp();
  const router = useRouter();
  const hi = lang === "hi";
  const [f, setF] = useState<Form>(initial);
  const [docsOpen, setDocsOpen] = useState(!!(initial.fssai || initial.gstin));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zomato, setZomato] = useState<{ url: string; state: "loading" } | { url: string; state: "ok"; listing: ZomatoListing } | { url: string; state: "error"; message: string } | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setF((x) => ({ ...x, [k]: e.target.value }));
  };

  /** Fills empty fields from a listing link: from the Zomato page itself, or from the link's words. */
  async function fillFromLink(p: Platform) {
    const link = parseListing(f.listings[p] ?? "", f.name);
    if (!link || link.platform !== p) return;
    setF((x) => ({ ...x, city: x.city || (link.city ? cityName(link.city) : ""), area: x.area || link.areaHint || "" }));
    if (p !== "zomato" || zomato?.url === link.url) return;
    setZomato({ url: link.url, state: "loading" });
    try {
      const listing = await api<ZomatoListing>("/api/listing/preview", { method: "POST", json: { url: link.url } });
      setZomato({ url: link.url, state: "ok", listing });
      const keep = (mine: string, theirs: string | null) => (mine.trim() ? mine : (theirs ?? ""));
      setF((x) => ({
        ...x,
        name: keep(x.name, listing.name),
        // The page's locality beats a guess from the link's words.
        area: x.area && x.area !== link.areaHint ? x.area : listing.area || x.area,
        city: x.city && x.city !== (link.city ? cityName(link.city) : "") ? x.city : listing.city || x.city,
        address: keep(x.address, listing.address),
        fssai: keep(x.fssai, listing.fssai),
      }));
      if (listing.fssai) setDocsOpen(true);
    } catch (err) {
      setZomato({ url: link.url, state: "error", message: (err as Error).message });
    }
  }

  const missing = [!f.ownerName.trim() && "ownerName", !f.name.trim() && "name", !f.area.trim() && "area", !f.city.trim() && "city"].filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing.length) {
      setError(hi ? "नाम, रेस्टोरेंट, इलाक़ा और शहर भरें।" : "Fill in your name, the restaurant, area and city.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api<OutletDTO>("/api/outlet", {
        method: "POST",
        json: {
          journey,
          live: platforms,
          lang,
          ownerName: f.ownerName,
          ownerPhone: f.ownerPhone.trim() || null,
          name: f.name,
          area: f.area,
          city: f.city,
          address: f.address,
          fssai: f.fssai.replace(/\s/g, "") || null,
          gstin: f.gstin.trim() || null,
          listings: Object.fromEntries(platforms.map((p) => [p, f.listings[p] ?? ""])),
        },
      });
      // The browser now points at this restaurant; reload everything that showed the old one.
      refreshAll();
      router.push(journey === "live" ? "/connect" : `/start?track=${journey}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-2xl space-y-10">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xl font-medium">{hi ? "आपके बारे में" : "About you"}</legend>
        <Field label={hi ? "आपका नाम" : "Your name"} value={f.ownerName} onChange={set("ownerName")} autoComplete="name" required />
        <Field
          label={hi ? "फ़ोन (WhatsApp)" : "Phone (WhatsApp)"}
          hint={hi ? "अलर्ट के लिए, ज़रूरी नहीं" : "For alerts, optional"}
          value={f.ownerPhone}
          onChange={set("ownerPhone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98xxxxxx21"
        />
      </fieldset>

      {platforms.length > 0 && (
        <fieldset className="space-y-4">
          <legend className="text-xl font-medium">{hi ? "आपकी लिस्टिंग" : "Your listing"}</legend>
          <p className="-mt-2 max-w-[56ch] text-ink-2">
            {hi ? "Zomato पर अपना रेस्टोरेंट खोलें, शेयर करें और लिंक यहाँ पेस्ट करें। बाक़ी हम भर देंगे। ज़रूरी नहीं।" : "Open your restaurant on Zomato, tap share and paste the link here. We'll fill in the rest. Optional."}
          </p>
          {platforms.map((p) => {
            const value = f.listings[p] ?? "";
            const link = value.trim() ? parseListing(value, f.name) : null;
            const wrong = value.trim() && (!link || link.platform !== p);
            return (
              <div key={p}>
                <Field
                  label={<ChannelTag channel={p} className="text-ink" />}
                  value={value}
                  onChange={(e) => {
                    setError(null);
                    setF((x) => ({ ...x, listings: { ...x.listings, [p]: e.target.value } }));
                  }}
                  onBlur={() => fillFromLink(p)}
                  type="url"
                  inputMode="url"
                  placeholder={p === "zomato" ? "https://www.zomato.com/ncr/your-restaurant-area" : "https://www.swiggy.com/restaurants/your-restaurant-area-12345"}
                />
                {wrong ? (
                  <p className="mt-1 text-sm text-chilli">{hi ? `यह ${p === "zomato" ? "Zomato" : "Swiggy"} रेस्टोरेंट का लिंक नहीं लगता।` : `That doesn't look like a ${p === "zomato" ? "Zomato" : "Swiggy"} restaurant link.`}</p>
                ) : link ? (
                  <p className={`mt-1 flex items-center gap-1.5 text-sm ${link.nameMatches === false ? "text-turmeric" : "text-leaf"}`}>
                    {link.nameMatches !== false && <Check aria-hidden className="size-4" />}
                    {link.nameMatches === false
                      ? hi ? "लिंक रेस्टोरेंट के नाम से मेल नहीं खाता। सही लिंक है न?" : "This link doesn't match the restaurant name above. Is it the right one?"
                      : [link.city && cityName(link.city), link.nameMatches && (hi ? "नाम मेल खाता है" : "matches your name")].filter(Boolean).join(" · ") || (hi ? "लिंक सही है" : "Looks right")}
                  </p>
                ) : null}
                {p === "zomato" && zomato && zomato.url === link?.url && (
                  <div className="mt-3">
                    {zomato.state === "loading" ? (
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                        {hi ? "Zomato से आपकी लिस्टिंग पढ़ रहे हैं…" : "Reading your listing from Zomato…"}
                      </p>
                    ) : zomato.state === "error" ? (
                      <p className="text-sm text-turmeric">{zomato.message} {hi ? "आप बाक़ी ख़ुद भर सकते हैं।" : "You can fill in the rest yourself."}</p>
                    ) : (
                      <>
                        <ListingPreview listing={zomato.listing} />
                        <p className="mt-2 text-sm text-leaf">
                          {hi
                            ? `खाली जगहें Zomato से भर दीं। रेस्टोरेंट बनने पर ${zomato.listing.menu.length} डिश फ़ोटो के साथ आपके मेन्यू में आ जाएँगी।`
                            : `We filled in the empty fields from Zomato. Your ${zomato.listing.menu.length} dishes, with photos, come into your menu when you create the restaurant.`}
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

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xl font-medium">{hi ? "आपका रेस्टोरेंट" : "Your restaurant"}</legend>
        <div className="sm:col-span-2">
          <Field label={hi ? "रेस्टोरेंट का नाम" : "Restaurant name"} value={f.name} onChange={set("name")} autoComplete="organization" required />
        </div>
        <Field label={hi ? "इलाक़ा" : "Area or locality"} value={f.area} onChange={set("area")} placeholder={hi ? "जैसे कोरमंगला" : "e.g. Koramangala"} required />
        <Field label={hi ? "शहर" : "City"} value={f.city} onChange={set("city")} autoComplete="address-level2" required />
        <div className="sm:col-span-2">
          <Field label={hi ? "पूरा पता" : "Full address"} hint={hi ? "ज़रूरी नहीं" : "Optional"} value={f.address} onChange={set("address")} autoComplete="street-address" placeholder={hi ? "दुकान नं., गली, लैंडमार्क" : "Shop no., street, landmark"} />
        </div>
      </fieldset>


      <fieldset>
        <legend className="sr-only">{hi ? "दस्तावेज़" : "Documents"}</legend>
        {docsOpen ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-xl font-medium sm:col-span-2">
              {hi ? "दस्तावेज़" : "Documents"} <span className="text-base font-normal text-muted">{hi ? "अभी ज़रूरी नहीं" : "optional for now"}</span>
            </p>
            <Field label={hi ? "FSSAI लाइसेंस नंबर" : "FSSAI licence number"} hint={hi ? "14 अंक" : "14 digits"} value={f.fssai} onChange={set("fssai")} inputMode="numeric" maxLength={17} />
            <Field label="GSTIN" hint={hi ? "अगर GST में रजिस्टर्ड हैं" : "If you're registered"} value={f.gstin} onChange={set("gstin")} maxLength={15} className="uppercase" />
          </div>
        ) : (
          <button type="button" onClick={() => setDocsOpen(true)} className="text-ink-2 underline underline-offset-4 hover:text-ink">
            {hi ? "FSSAI और GST नंबर जोड़ें (ज़रूरी नहीं)" : "Add FSSAI and GST numbers (optional)"}
          </button>
        )}
      </fieldset>

      <div>
        {error && <p className="mb-4 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-40">
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {journey === "live" ? (hi ? "रेस्टोरेंट बनाएँ और ईमेल जोड़ें" : "Create my restaurant and connect email") : hi ? "रेस्टोरेंट बनाएँ" : "Create my restaurant"}
        </button>
        <p className="mt-2 text-sm text-muted">{hi ? "आप ये सब बाद में कनेक्शन में बदल सकते हैं।" : "You can change any of this later in Connections."}</p>
      </div>
    </form>
  );
}

function Field({ label, hint, required, className = "", ...input }: { label: React.ReactNode; hint?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline gap-2 text-sm text-ink-2">
        {label}
        {required && <span aria-hidden className="text-chilli">*</span>}
        {hint && <span className="text-muted">{hint}</span>}
      </span>
      <input
        {...input}
        required={required}
        className={`w-full rounded-lg bg-surface px-3 py-2.5 text-[1.05rem] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)] ${className}`}
      />
    </label>
  );
}

export default function Join() {
  const { lang } = useApp();
  const hi = lang === "hi";
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/?start=1" aria-label="Back to start" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark />
        </Link>
        <LangToggle />
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-muted">{hi ? "पहला क़दम" : "Step 1"}</p>
        <h1 className="mt-1 text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight tracking-[-0.03em]">{hi ? "अपने और रेस्टोरेंट के बारे में बताइए" : "Tell us about you and your restaurant"}</h1>
        <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-ink-2">
          {hi ? "एक मिनट लगेगा। इसके बाद ईमेल जोड़ें और Zest आपके पिछले 30 दिन का हिसाब दिखाएगा।" : "It takes a minute. Then connect your email and Zest shows you what your last 30 days looked like."}
        </p>
        <Suspense>
          <JoinInner />
        </Suspense>
      </main>
    </div>
  );
}
