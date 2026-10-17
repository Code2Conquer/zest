"use client";

import { useState } from "react";
import { Clock, Loader2, MapPin, RefreshCw, Star, UtensilsCrossed } from "lucide-react";
import { api, refreshAll } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { ListingSummary, OutletDTO, ZomatoListing } from "@/lib/types";
import { rupees } from "./cards";

/** What Zomato shows for this restaurant, as read from its listing page. */
export function ListingPreview({ listing }: { listing: ZomatoListing | ListingSummary }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const dishes = "menu" in listing ? listing.menu.length : listing.menuCount;
  const dishPhotos = "menu" in listing ? listing.menu.flatMap((m) => (m.photo ? [m.photo] : [])).slice(0, 4) : [];
  const cover = listing.photos[0] ?? dishPhotos[0];
  const r = listing.rating.delivery ?? listing.rating.dining;

  return (
    <article className="overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_var(--line)]">
      <div className="flex gap-4 p-4">
        {cover && <img src={cover} alt="" className="size-20 shrink-0 rounded-xl bg-sunken object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium leading-tight">{listing.name}</p>
            {r && (
              <span className="inline-flex items-center gap-1 rounded-md bg-leaf px-1.5 py-0.5 text-sm font-medium text-paper">
                {r.value.toFixed(1)}
                <Star aria-hidden className="size-3 fill-current" />
              </span>
            )}
            {r && (
              <span className="text-sm text-muted">
                {r.count} {listing.rating.delivery ? (hi ? "डिलीवरी रिव्यू" : "delivery reviews") : hi ? "रिव्यू" : "reviews"}
              </span>
            )}
          </div>
          {listing.cuisines.length > 0 && <p className="mt-0.5 truncate text-sm text-ink-2">{listing.cuisines.join(", ")}</p>}
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
            <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{listing.address || listing.locality}</span>
          </p>
        </div>
      </div>
      {listing.status !== "open" && (
        <p className="bg-chilli-soft px-4 py-2 text-sm text-chilli">
          {listing.status === "closed" ? (hi ? "Zomato पर यह रेस्टोरेंट बंद दिख रहा है।" : "Zomato shows this restaurant as permanently closed.") : hi ? "Zomato पर यह अभी अस्थायी रूप से बंद है।" : "Zomato shows this restaurant as temporarily closed."}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">{hi ? "मेन्यू" : "Menu"}</dt>
          <dd className="flex items-center gap-1 font-medium">
            <UtensilsCrossed aria-hidden className="size-3.5" />
            {dishes} {hi ? "डिश" : "dishes"}
          </dd>
        </div>
        {listing.costForTwo && (
          <div>
            <dt className="text-muted">{hi ? "दो लोगों का" : "Cost for two"}</dt>
            <dd className="font-medium">{rupees(listing.costForTwo)}</dd>
          </div>
        )}
        {listing.hours[0] && (
          <div>
            <dt className="text-muted">{hi ? "समय" : "Hours"}</dt>
            <dd className="flex items-center gap-1 font-medium">
              <Clock aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{listing.hours[0]}</span>
            </dd>
          </div>
        )}
        {listing.fssai && (
          <div>
            <dt className="text-muted">FSSAI</dt>
            <dd className="font-medium tabular-nums">{listing.fssai}</dd>
          </div>
        )}
      </dl>
      {dishPhotos.length > 0 && (
        <div className="flex gap-2 border-t border-line px-4 py-3">
          {dishPhotos.map((src) => (
            <img key={src} src={src} alt="" className="size-14 rounded-lg bg-sunken object-cover" />
          ))}
          {dishes > dishPhotos.length && <span className="grid size-14 place-items-center rounded-lg bg-sunken text-sm text-muted">+{dishes - dishPhotos.length}</span>}
        </div>
      )}
    </article>
  );
}

/** The outlet's Zomato listing: read it from a link, or read it again for fresh ratings. */
export function ZomatoListingCard() {
  const { lang, outlet } = useApp();
  const hi = lang === "hi";
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  if (!outlet || outlet.isDemo) return null;
  const saved = outlet.zomato;

  async function read() {
    setBusy(true);
    setNote(null);
    try {
      const r = await api<{ outlet: OutletDTO; imported: number }>("/api/listing/zomato", { method: "POST", json: url.trim() ? { url: url.trim() } : {} });
      setUrl("");
      setNote({
        ok: true,
        text: r.imported
          ? hi ? `लिस्टिंग पढ़ी और ${r.imported} डिश मेन्यू में जोड़ीं।` : `Listing read, and ${r.imported} dishes added to your menu.`
          : hi ? "लिस्टिंग और रेटिंग अपडेट हो गईं।" : "Listing and rating updated.",
      });
      refreshAll();
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {saved ? (
        <>
          <ListingPreview listing={saved} />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button type="button" onClick={read} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken disabled:opacity-50">
              <RefreshCw aria-hidden className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              {hi ? "Zomato से दोबारा पढ़ें" : "Read again from Zomato"}
            </button>
            <span className="text-muted">
              {hi ? "आख़िरी बार " : "Last read "}
              {new Date(saved.fetchedAt).toLocaleString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </span>
            <a href={saved.url} target="_blank" rel="noreferrer" className="text-ink-2 underline underline-offset-2 hover:text-ink">
              {hi ? "Zomato पर देखें" : "View on Zomato"}
            </a>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            inputMode="url"
            value={url || outlet.listings.zomato || ""}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.zomato.com/ncr/your-restaurant-area"
            aria-label={hi ? "Zomato लिंक" : "Zomato link"}
            className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
          />
          <button type="button" onClick={read} disabled={busy || !(url.trim() || outlet.listings.zomato)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-40">
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {hi ? "Zomato से पढ़ें" : "Read from Zomato"}
          </button>
        </div>
      )}
      {note && <p className={`text-sm ${note.ok ? "text-leaf" : "text-chilli"}`}>{note.text}</p>}
    </div>
  );
}
