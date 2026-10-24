"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bike, Camera, Check, ChevronLeft, Copy, ExternalLink, Loader2, LocateFixed, MessageCircle, Plus, Store, Trash2 } from "lucide-react";
import { ChannelTag, Wordmark } from "@/components/bits";
import { ListingPreview } from "@/components/listing-preview";
import { MailboxCard } from "@/components/mailbox-card";
import { GoogleButton } from "@/components/google-button";
import { PhoneLogin } from "@/components/phone-login";
import { FoodWall } from "@/components/food-wall";
import { siteFonts } from "@/components/landing/site-fonts";
import { api, ApiError, refreshAll } from "@/lib/api";
import { signOutHere, useMe } from "@/lib/auth-client";
import { cityName, parseListing } from "@/lib/listing";
import { CHANNEL_NAME, PLATFORMS, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import type { OutletDTO, PlatformListing } from "@/lib/types";

// Onboarding, kept short, ending with the seller's own ordering page live.
//
//   Home kitchens (?journey=new): your kitchen (name and a few details) → your menu, from a photo → live.
//   Restaurants (?journey=live): your Zomato or Swiggy link (name, menu and photos come from it) →
//   connect email → live. Without a link, or if the listing has no dishes, they add the menu by hand.
//
// Address, FSSAI, GSTIN, PAN, UPI and the kitchen's location are optional, tucked under "More details".
// Delivery starts on the defaults (Zomato riders and pickup); it can be changed later.

type Journey = "new" | "live";
type StepId = "kind" | "details" | "menu" | "email" | "live";
type Kind = "home" | "tiffin" | "stall";

type Details = { ownerName: string; ownerPhone: string; name: string; area: string; city: string; address: string; fssai: string; gstin: string; pan: string; upi: string; listings: Partial<Record<Platform, string>> };
type ListingRead = { url: string; state: "loading" } | { url: string; state: "ok"; listing: PlatformListing } | { url: string; state: "error"; message: string };
type Dish = { name: string; category: string; price: number; veg: boolean; description: string };
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
    <div className={`relative min-h-dvh overflow-x-clip ${siteFonts}`} style={{ fontFamily: "var(--font-site), var(--font-site-deva), system-ui, sans-serif" }}>
      <FoodWall />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Back to start" className="inline-flex items-center gap-1 text-[#f1f1ec]/80 hover:text-[#f1f1ec]">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark className="text-[34px]" />
        </Link>
        <SignedInAs />
      </header>
      {/* The card, in front of the wall */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-84px)] max-w-[680px] items-start justify-center px-3 pb-10 pt-4 sm:pt-0 sm:items-center sm:px-6">
        <div className="mx-auto w-full rounded-[32px] bg-[#16191c] p-6 has-[[data-login]]:max-w-[540px] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.07)] sm:p-10">
          <Suspense>
            <JoinInner />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

/** Who this is, so someone already signed in on this browser knows why there's no login, and can switch. */
function SignedInAs() {
  const { data: me } = useMe();
  const hi = useHi();
  const who = me?.user?.phone ?? me?.user?.email ?? me?.user?.name;
  if (!who) return null;
  return (
    <p className="flex items-center gap-3 rounded-full bg-[#16191c]/85 px-4 py-2 text-[14px] text-[#c9cdd1] backdrop-blur">
      <span className="max-w-[40vw] truncate">{who}</span>
      <button
        type="button"
        onClick={async () => {
          await signOutHere();
          window.location.reload();
        }}
        className="font-semibold text-[#f1f1ec] underline underline-offset-4"
      >
        {hi ? "लॉग आउट" : "Log out"}
      </button>
    </p>
  );
}

function JoinInner() {
  const { outlet, outletError } = useApp();
  const { data: me } = useMe();
  const params = useSearchParams();
  const journey: Journey = params.get("journey") === "new" ? "new" : "live";
  const hi = useHi();

  if (me && !me.user) {
    return (
      <div data-login className="-mx-6 -mt-6 sm:-mx-10 sm:-mt-10">
        <h1 className="border-b border-white/10 px-6 py-5 text-center text-[16px] font-bold">{hi ? "लॉग इन या साइन अप" : "Log in or sign up"}</h1>
        <div className="px-6 pt-7 sm:px-10">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">{hi ? "Zest में स्वागत है" : "Welcome to Zest"}</h2>
          <p className="mt-1.5 text-[15px] text-[#9aa0a6]">
            {journey === "new" ? (hi ? "अपनी रसोई को कुछ ही मिनट में ऑनलाइन लाइए।" : "Get your kitchen online in a few minutes.") : hi ? "कुछ ही मिनट में अपना ऑर्डर पेज बनाइए।" : "Create your ordering page in a few minutes."}
          </p>
          <div className="mt-6">
            <PhoneLogin onDone={() => window.location.reload()} />
            <GoogleButton returnTo={`/join?journey=${journey}`} error={params.get("error")} />
          </div>
        </div>
      </div>
    );
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
    ownerPhone: mine?.ownerPhone ?? me.user?.phone?.replace(/^\+91/, "") ?? "",
    name: mine?.name === "My restaurant" ? "" : (mine?.name ?? ""),
    area: mine?.area ?? "",
    city: mine?.city ?? "",
    address: mine?.address ?? "",
    fssai: mine?.fssai ?? "",
    gstin: mine?.gstin ?? "",
    pan: mine?.pan ?? "",
    upi: mine?.upiId ?? "",
    listings: { ...(mine?.listings ?? {}) },
  };
  // A listing link pasted on the landing page arrives as ?zomato= or ?swiggy=.
  for (const p of PLATFORMS) {
    const link = params.get(p);
    if (link && !initial.listings[p]) initial.listings[p] = link;
  }
  // Keyed by journey only: creating the restaurant changes the outlet, and the steps must carry on.
  const resume: StepId = params.get("step") === "email" && journey === "live" ? "email" : journey === "new" ? "kind" : "details";
  return <Wizard key={journey} journey={journey} initial={initial} start={resume} />;
}

function Wizard({ journey, initial, start }: { journey: Journey; initial: Details; start: StepId }) {
  const hi = useHi();
  // Home kitchens always add their menu; restaurants only when their listing brought no dishes.
  const [needsMenu, setNeedsMenu] = useState(journey === "new");
  const [kind, setKind] = useState<Kind>("home");
  const NEW: StepId[] = ["kind", "details", "menu", "live"];
  const steps: StepId[] = journey === "new" ? NEW : needsMenu ? ["details", "menu", "email", "live"] : ["details", "email", "live"];
  const [step, setStep] = useState<StepId>(start);
  const at = Math.max(0, steps.indexOf(step));
  const go = (s: StepId) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = (list = steps) => go(list[Math.min(list.indexOf(step) + 1, list.length - 1)]);
  const back = () => go(steps[Math.max(at - 1, 0)]);
  const afterDetails = (menu: boolean) => {
    const need = journey === "new" || menu;
    setNeedsMenu(need);
    next(journey === "new" ? NEW : need ? ["details", "menu", "email", "live"] : ["details", "email", "live"]);
  };

  const LABEL: Record<StepId, string> = {
    kind: hi ? "आप क्या बेचते हैं" : "What you sell",
    details: journey === "new" ? (hi ? "आपकी रसोई" : "Your kitchen") : hi ? "आपका रेस्टोरेंट" : "Your restaurant",
    menu: hi ? "मेन्यू" : "Menu",
    email: hi ? "ईमेल" : "Email",
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

      <div key={step} className="ob-in">
      {step === "kind" && <KindStep value={kind} onPick={setKind} onDone={() => next()} />}
      {step === "details" && <DetailsStep journey={journey} kind={kind} initial={initial} onDone={afterDetails} />}
      {step === "menu" && <MenuStep onDone={() => next()} onBack={back} />}
      {step === "email" && <EmailStep onDone={() => next()} />}
      {step === "live" && <LiveStep journey={journey} />}
      </div>
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

/* ---------------- home sellers: what do you sell from? ---------------- */

const KIND_LABEL: Record<Kind, { en: string; hi: string }> = {
  home: { en: "Home kitchen", hi: "घर की रसोई" },
  tiffin: { en: "Tiffin service", hi: "टिफ़िन सर्विस" },
  stall: { en: "Street stall", hi: "ठेला या स्टॉल" },
};
const KINDS: { id: Kind; emoji: string; line: { en: string; hi: string } }[] = [
  { id: "home", emoji: "🍲", line: { en: "Cooking from home for your area", hi: "घर से, अपने इलाक़े के लिए" } },
  { id: "tiffin", emoji: "🍱", line: { en: "Daily or weekly meals for regulars", hi: "पुराने ग्राहकों के लिए रोज़ या हफ़्ते का खाना" } },
  { id: "stall", emoji: "🛺", line: { en: "A thela, cart or stall", hi: "ठेला, गाड़ी या स्टॉल" } },
];

function KindStep({ value, onPick, onDone }: { value: Kind; onPick: (k: Kind) => void; onDone: () => void }) {
  const hi = useHi();
  const [picked, setPicked] = useState<Kind | null>(null);
  return (
    <div>
      <h1 className="mt-1 text-[clamp(1.8rem,4.5vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">{hi ? "आप क्या बेचते हैं?" : "What do you sell from?"}</h1>
      <div role="radiogroup" aria-label={hi ? "आप क्या बेचते हैं" : "What you sell from"} className="mt-8 grid gap-3 sm:grid-cols-3">
        {KINDS.map((k) => {
          const on = (picked ?? value) === k.id && picked !== null;
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setPicked(k.id);
                onPick(k.id);
              }}
              className={`group flex items-center gap-4 rounded-[24px] p-5 text-left transition-[box-shadow,transform] sm:flex-col sm:justify-center sm:gap-3 sm:py-9 sm:text-center ${on ? "bg-[#22262b] shadow-[inset_0_0_0_2px_#e9a31a]" : "bg-[#1c1f23] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]"}`}
            >
              <span aria-hidden className="text-[44px] leading-none transition-transform group-hover:scale-110 sm:text-[64px]">
                {k.emoji}
              </span>
              <span>
                <span className="block text-[18px] font-semibold">{hi ? KIND_LABEL[k.id].hi : KIND_LABEL[k.id].en}</span>
                <span className="mt-0.5 block text-[14px] text-[#9aa0a6]">{hi ? k.line.hi : k.line.en}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end border-t border-white/10 pt-6">{/* taste-skill-ignore */}
        <button type="button" disabled={!picked} onClick={onDone} className={primary}>
          {hi ? "आगे" : "Next"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- step 1: who and where ---------------- */

function DetailsStep({ journey, kind = "home", initial, onDone }: { journey: Journey; kind?: Kind; initial: Details; onDone: (needsMenu: boolean) => void }) {
  const hi = useHi();
  const { lang, outlet } = useApp();
  const [f, setF] = useState<Details>(initial);
  const [read, setRead] = useState<Partial<Record<Platform, ListingRead>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(!!(initial.address || initial.fssai || initial.gstin || initial.pan || initial.upi));
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
    setBusy(true);
    setError(null);
    try {
      const made = await api<OutletDTO & { read: Partial<Record<Platform, { imported: number; matched: number } | { error: string }>> }>("/api/outlet", {
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
          fssai: f.fssai.replace(/\s/g, "") || null,
          gstin: f.gstin.trim() || null,
          pan: f.pan.trim() || null,
          listings: Object.fromEntries(linked.map((p) => [p, f.listings[p] ?? ""])),
        },
      });
      // The page goes live straight away, on the default delivery (Zomato riders and pickup).
      await api("/api/outlet", { method: "PATCH", json: { ordering: true, upiId: f.upi.trim() || null, ...(live ? {} : { cuisines: KIND_LABEL[kind].en }), ...(loc.where ? { location: loc.where } : {}) } });
      refreshAll();
      const dishes = Object.values(made.read ?? {}).reduce((n, r) => n + (r && "imported" in r ? r.imported + r.matched : 0), 0);
      onDone(dishes === 0);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-1">
      <Title sub={live ? (hi ? "अपना Zomato या Swiggy लिंक डालिए, नाम, मेन्यू और फ़ोटो वहीं से आ जाएँगे। लिंक नहीं है? नीचे भर दीजिए।" : "Paste your Zomato or Swiggy link and your name, menu and photos come from it. No link? Fill in the details below.") : hi ? "बस नाम और इलाक़ा। बाक़ी सब ज़रूरी नहीं।" : "Just a name and where you are. Everything else is optional."}>
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
        <Field className="sm:col-span-2" label={live ? (hi ? "रेस्टोरेंट का नाम" : "Restaurant name") : kind === "stall" ? (hi ? "ठेले या स्टॉल का नाम" : "Stall name") : kind === "tiffin" ? (hi ? "टिफ़िन सर्विस का नाम" : "Tiffin service name") : hi ? "रसोई का नाम" : "Kitchen name"} value={f.name} onChange={set("name")} autoComplete="organization" placeholder={live ? "" : kind === "stall" ? (hi ? "जैसे राजू पाव भाजी" : "e.g. Raju Pav Bhaji") : kind === "tiffin" ? (hi ? "जैसे अन्नपूर्णा टिफ़िन" : "e.g. Annapurna Tiffins") : hi ? "जैसे मीना की रसोई" : "e.g. Meena's Kitchen"} required />
        <Field label={hi ? "इलाक़ा" : "Area or locality"} value={f.area} onChange={set("area")} placeholder={hi ? "जैसे ग्रीन पार्क" : "e.g. Green Park"} required />
        <Field label={hi ? "शहर" : "City"} value={f.city} onChange={set("city")} autoComplete="address-level2" required />
      </fieldset>

      {/* Optional: everything a page can go live without */}
      <fieldset className="mt-8">
        <legend className="sr-only">{hi ? "और जानकारी" : "More details"}</legend>
        <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3.5 text-left shadow-[inset_0_0_0_1px_var(--line)]">
          <span>
            <span className="block font-medium">{hi ? "और जानकारी" : "More details"}</span>
            <span className="block text-sm text-muted">{hi ? "पता, FSSAI, GSTIN, PAN, UPI · ज़रूरी नहीं" : "Address, FSSAI, GSTIN, PAN, UPI · optional"}</span>
          </span>
          <Plus aria-hidden className={`size-5 shrink-0 transition-transform ${more ? "rotate-45" : ""}`} />
        </button>
        {more && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label={hi ? "पूरा पता" : "Full address"} hint={journey === "new" ? (hi ? "ग्राहकों को नहीं दिखता" : "not shown to customers") : undefined} value={f.address} onChange={set("address")} autoComplete="street-address" placeholder={hi ? "मकान/दुकान नं., गली, लैंडमार्क" : "House or shop no., street, landmark"} />
            <Field label={hi ? "FSSAI नंबर" : "FSSAI number"} hint={hi ? "14 अंक" : "14 digits"} value={f.fssai} onChange={set("fssai")} inputMode="numeric" maxLength={17} />
            <Field label="GSTIN" hint={hi ? "अगर रजिस्टर्ड हैं" : "if registered"} value={f.gstin} onChange={(e) => setF((x) => ({ ...x, gstin: e.target.value.toUpperCase() }))} maxLength={15} />
            <Field label="PAN" value={f.pan} onChange={(e) => setF((x) => ({ ...x, pan: e.target.value.toUpperCase() }))} maxLength={10} />
            <Field label={hi ? "UPI ID" : "UPI ID"} hint={hi ? "ग्राहक सीधे भुगतान करें" : "for direct payments"} value={f.upi} onChange={set("upi")} placeholder="name@okhdfc" autoComplete="off" />
            <div className="sm:col-span-2">
              <LocateButton loc={loc} saved={!!outlet?.location} />
            </div>
          </div>
        )}
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

/* ---------------- the menu, from photos ---------------- */

// Dishes grouped by their section, sections in the order a menu reads (starters before mains before
// breads, rice and sweets), dishes cheapest first inside a section.
const SECTION_ORDER = ["breakfast", "snack", "starter", "chaat", "soup", "salad", "thali", "combo", "main", "curry", "sabzi", "dal", "biryani", "rice", "bread", "roti", "paratha", "chinese", "dessert", "sweet", "beverage", "drink"];
function sectionRank(c: string) {
  const k = c.toLowerCase();
  const i = SECTION_ORDER.findIndex((w) => k.includes(w));
  return i < 0 ? SECTION_ORDER.length : i;
}
function sortMenu(list: Dish[]): Dish[] {
  return [...list].sort((a, b) => sectionRank(a.category) - sectionRank(b.category) || a.category.localeCompare(b.category) || a.price - b.price);
}

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
          return sortMenu([...d, ...items.filter((x) => !seen.has(x.name.toLowerCase()))]);
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
      await api("/api/menu/import", { method: "POST", json: { items: sortMenu(good).map((d) => ({ ...d, name: d.name.trim(), category: d.category.trim() || "Menu", price: Math.round(d.price) })) } });
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

/* ---------------- restaurants: connect email ---------------- */

function EmailStep({ onDone }: { onDone: () => void }) {
  const hi = useHi();
  return (
    <div>
      <Title sub={hi ? "Zest आपके Zomato और Swiggy के ऑर्डर, पेआउट और रेटिंग वाले ईमेल पढ़कर हर सुबह WhatsApp पर हिसाब भेजता है। सिर्फ़ पढ़ता है, कभी भेजता नहीं।" : "Zest reads your order, payout and rating emails from Zomato and Swiggy and sends you a summary on WhatsApp every morning. It only reads; it never sends."}>
        {hi ? "अपना ईमेल जोड़िए" : "Connect your email"}
      </Title>
      <div className="mt-8">
        <MailboxCard returnTo="/join?journey=live&step=email" />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onDone} className={primary}>
          {hi ? "आगे बढ़ें" : "Continue"}
        </button>
        <button type="button" onClick={onDone} className="px-3 text-ink-2 underline underline-offset-4">
          {hi ? "बाद में" : "Do this later"}
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
