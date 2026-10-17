"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, Search, Sparkles, X } from "lucide-react";
import { ChannelTag } from "@/components/bits";
import { Dish } from "@/components/dishes";
import { ApprovalTicket } from "@/components/approval-ticket";
import { rupees } from "@/components/cards";
import { api, refreshAll, useApi } from "@/lib/api";
import type { ApprovalDTO, MenuItemDTO } from "@/lib/types";
import { CHANNEL_NAME, type Platform } from "@/lib/platforms";
import { useApp, useOutlet } from "@/lib/state";

type Item = MenuItemDTO;

// Keyed by dish name; in production these come from the menu agent.
const SUGGESTED_DESCRIPTION: Record<string, string> = {
  "Dal tadka with rice": "Yellow toor dal tempered with ghee, cumin, garlic and red chilli, served with steamed basmati rice.",
};

/** What changed on each dish, in words an owner would use. */
function describeChanges(before: Item, after: Item, live: Platform[], hi: boolean): string[] {
  const out: string[] = [];
  const join = (ps: Platform[]) => ps.map((p) => CHANNEL_NAME[p]).join(hi ? " और " : " and ");
  const wentOff = live.filter((p) => before.available[p] && !after.available[p]);
  const cameBack = live.filter((p) => !before.available[p] && after.available[p]);
  if (wentOff.length) out.push(hi ? `${join(wentOff)} पर आउट ऑफ़ स्टॉक` : `out of stock on ${join(wentOff)}`);
  if (cameBack.length) out.push(hi ? `${join(cameBack)} पर वापस स्टॉक में` : `back in stock on ${join(cameBack)}`);
  for (const p of live) {
    if (before.price[p] !== after.price[p]) out.push(`${CHANNEL_NAME[p]} ${rupees(before.price[p])} → ${rupees(after.price[p])}`);
  }
  if (before.name !== after.name) out.push(hi ? `नया नाम "${after.name}"` : `renamed to "${after.name}"`);
  if (before.description !== after.description) out.push(hi ? "नया विवरण" : "new description");
  if (before.veg !== after.veg) out.push(after.veg ? (hi ? "वेज मार्क किया" : "marked veg") : hi ? "नॉन-वेज मार्क किया" : "marked non-veg");
  if (!!before.bestseller !== !!after.bestseller) out.push(after.bestseller ? (hi ? "बेस्टसेलर टैग जोड़ा" : "bestseller tag added") : hi ? "बेस्टसेलर टैग हटाया" : "bestseller tag removed");
  if (before.photo !== after.photo) out.push(hi ? "नई फ़ोटो" : "new photo");
  return out;
}

export default function MenuPage() {
  const { state } = useApp();
  const { live, outlet } = useOutlet();
  const hi = state.lang === "hi";

  const { data: menu, error: loadError } = useApi<Item[]>(outlet ? `/api/menu?o=${outlet.id}` : null);
  const published = useMemo(() => menu ?? [], [menu]);
  const [draft, setDraft] = useState<Item[]>([]);
  const [approval, setApproval] = useState<ApprovalDTO | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Start from the published menu whenever it reloads.
  useEffect(() => setDraft(published), [published]);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewOn, setPreviewOn] = useState<Platform>(live[0] ?? "zomato");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("");
  const sections = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!live.includes(previewOn) && live[0]) setPreviewOn(live[0]);
  }, [live, previewOn]);

  const changes = useMemo(
    () =>
      draft
        .map((d) => {
          const before = published.find((p) => p.id === d.id);
          return { item: d, before, lines: before ? describeChanges(before, d, live, hi) : [] };
        })
        .filter((c) => c.lines.length > 0),
    [draft, published, live, hi],
  );

  const q = query.trim().toLowerCase();
  const visible = draft.filter((m) => !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  const categories = [...new Set(draft.map((m) => m.category))].filter((c) => visible.some((m) => m.category === c));

  // Highlight the category being read, as the customer apps do.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveCat(top.target.getAttribute("data-cat") ?? "");
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    Object.values(sections.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [categories.length]);

  function patch(id: string, fn: (m: Item) => Item) {
    setDraft((all) => all.map((m) => (m.id === id ? fn(m) : m)));
  }

  function toggleStock(id: string) {
    patch(id, (m) => {
      const anyOn = live.some((p) => m.available[p]);
      const available = { ...m.available };
      live.forEach((p) => (available[p] = !anyOn));
      return { ...m, available };
    });
  }

  const missingDesc = draft.filter((m) => !m.description.trim());
  const priceGaps = live.length > 1 ? draft.filter((m) => new Set(live.map((p) => m.price[p])).size > 1) : [];

  function applySuggestions() {
    setDraft((all) =>
      all.map((m) => {
        let next = m;
        if (!m.description.trim() && SUGGESTED_DESCRIPTION[m.name]) next = { ...next, description: SUGGESTED_DESCRIPTION[m.name] };
        if (priceGaps.some((g) => g.id === m.id)) {
          const top = Math.max(...live.map((p) => m.price[p]));
          const price = { ...m.price };
          live.forEach((p) => (price[p] = top));
          next = { ...next, price };
        }
        return next;
      }),
    );
  }

  /** Sends the edits to the server as one approval, then shows it for the owner to approve. */
  async function review() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = changes.map(({ item: d, before: b }) => {
        const available: Partial<Record<Platform, boolean>> = {};
        const price: Partial<Record<Platform, number>> = {};
        for (const p of live) {
          if (d.available[p] !== b!.available[p]) available[p] = d.available[p];
          if (d.price[p] !== b!.price[p]) price[p] = d.price[p];
        }
        const fields: Record<string, unknown> = {};
        if (d.name !== b!.name) fields.name = d.name;
        if (d.description !== b!.description) fields.description = d.description;
        if (d.veg !== b!.veg) fields.veg = d.veg;
        if (d.bestseller !== b!.bestseller) fields.bestseller = d.bestseller;
        if (d.photo !== b!.photo) fields.photoUrl = d.photo ?? null;
        return { itemId: d.id, ...(Object.keys(available).length ? { available } : {}), ...(Object.keys(price).length ? { price } : {}), ...(Object.keys(fields).length ? { fields } : {}) };
      });
      setApproval(await api<ApprovalDTO>("/api/menu/changes", { method: "POST", json: { changes: payload } }));
      setReviewOpen(true);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function onDecided(a: ApprovalDTO) {
    if (a.status === "executed") {
      setToast(hi ? `${live.map((p) => CHANNEL_NAME[p]).join(" और ")} पर पब्लिश हो गया` : `Published to ${live.map((p) => CHANNEL_NAME[p]).join(" and ")}`);
      setTimeout(() => setToast(null), 3200);
      setTimeout(() => setReviewOpen(false), 1400);
    }
    if (a.status === "skipped") setReviewOpen(false);
    refreshAll();
  }

  const editItem = draft.find((m) => m.id === editing) ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Restaurant header, as customers see it */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <h1 className="text-[clamp(2rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.03em]">{outlet?.name}</h1>
          {outlet?.cuisines && <p className="mt-1 text-ink-2">{outlet.cuisines}</p>}
          {outlet?.area && <p className="text-sm text-muted">{outlet.area}</p>}
        </div>
        <div className="flex gap-4">
          {live.map((p) => {
            const r = outlet?.ratings[p];
            return (
              <div key={p} className="text-center">
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[1.05rem] font-semibold ${r ? "bg-veg text-white" : "bg-sunken text-muted"}`}>
                  {r ? r.value.toFixed(1) : "–"}
                  <svg aria-hidden viewBox="0 0 20 20" className="size-3.5 fill-current">
                    <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.7 1-5.9L1.5 7.7l5.9-.8z" />
                  </svg>
                </span>
                <p className="mt-1 text-[0.8rem] text-muted">
                  <ChannelTag channel={p} className="text-[0.8rem] text-muted" />
                </p>
                <p className="text-[0.75rem] text-muted">{r ? `${r.count.toLocaleString("en-IN")} ${hi ? "रेटिंग" : "ratings"}` : hi ? "अभी नहीं" : "No ratings yet"}</p>
              </div>
            );
          })}
        </div>
      </header>

      {loadError && <p className="mt-4 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{loadError}</p>}
      {menu && menu.length === 0 && (
        <p className="mt-6 rounded-xl bg-sunken px-4 py-6 text-center text-muted">
          {hi ? "मेन्यू खाली है। ऑनबोर्डिंग में अपने पेपर मेन्यू की फ़ोटो से डिश जोड़ें।" : "Your menu is empty. Add dishes from a photo of your paper menu in onboarding."}{" "}
          <a href="/start?track=notlive" className="text-ink underline underline-offset-2">
            {hi ? "फ़ोटो से जोड़ें" : "Add from a photo"}
          </a>
        </p>
      )}

      {/* Mode + search */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div role="tablist" aria-label="Menu view" className="flex rounded-full bg-sunken p-1 text-sm">
          {(
            [
              ["edit", hi ? "मेन्यू बदलें" : "Edit menu"],
              ["preview", hi ? "ग्राहक का व्यू" : "Customer view"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`rounded-full px-4 py-1.5 ${mode === id ? "bg-surface font-medium shadow-[0_0_0_1px_var(--line)]" : "text-ink-2"}`}>
              {label}
            </button>
          ))}
        </div>
        {mode === "preview" && live.length > 1 && (
          <div className="flex gap-1">
            {live.map((p) => (
              <button key={p} type="button" aria-pressed={previewOn === p} onClick={() => setPreviewOn(p)} className={`rounded-full px-3 py-1.5 text-sm ${previewOn === p ? "bg-ink text-paper" : "text-ink-2 hover:bg-sunken"}`}>
                <ChannelTag channel={p} className={previewOn === p ? "text-paper" : ""} />
              </button>
            ))}
          </div>
        )}
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">{hi ? "मेन्यू में खोजें" : "Search within menu"}</span>
          <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hi ? "मेन्यू में खोजें" : "Search within menu"}
            className="w-full rounded-full bg-surface py-2 pl-9 pr-4 text-[0.95rem] outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
          />
        </label>
      </div>

      {/* Zest's suggestions */}
      {mode === "edit" && (missingDesc.length > 0 || priceGaps.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-turmeric-soft px-5 py-4">
          <Sparkles aria-hidden className="size-5 shrink-0 text-turmeric" />
          <p className="min-w-0 flex-1 text-[0.95rem]">
            {hi
              ? `${missingDesc.length} डिश का विवरण नहीं है${priceGaps.length ? ` और ${priceGaps.length} की क़ीमत प्लेटफ़ॉर्म के बीच अलग है` : ""}। बिना विवरण वाली डिश कम बिकती हैं।`
              : `${missingDesc.length} dish${missingDesc.length === 1 ? " has" : "es have"} no description${priceGaps.length ? ` and ${priceGaps.length} ${priceGaps.length === 1 ? "is" : "are"} priced differently across platforms` : ""}. Dishes without a description sell less.`}
          </p>
          <button type="button" onClick={applySuggestions} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
            {hi ? "Zest से ठीक करवाएँ" : "Fix with Zest"}
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
        {/* Category rail */}
        <nav aria-label={hi ? "कैटेगरी" : "Categories"} className="hidden md:block">
          <ul className="sticky top-20 space-y-0.5 border-r border-line pr-4">
            {categories.map((c) => {
              const count = visible.filter((m) => m.category === c).length;
              const on = activeCat === c;
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => sections.current[c]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className={`relative w-full rounded-lg px-3 py-2 text-left text-[0.95rem] ${on ? "bg-chilli-soft font-medium text-chilli" : "text-ink-2 hover:bg-sunken"}`}
                  >
                    {on && <motion.span layoutId="cat-bar" className="absolute -right-[17px] top-1 bottom-1 w-[3px] rounded-full bg-chilli" />}
                    {c} <span className="text-muted">({count})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Dishes */}
        <div>
          {categories.length === 0 && <p className="py-16 text-center text-muted">{hi ? `"${query}" से कोई डिश नहीं मिली` : `No dishes match "${query}"`}</p>}
          {categories.map((c) => (
            <section key={c} ref={(el) => void (sections.current[c] = el)} data-cat={c} className="scroll-mt-24 pb-6">
              <h2 className="pb-1 text-[1.35rem] font-semibold">{c}</h2>
              <ul className="divide-y divide-dashed divide-line">
                {visible
                  .filter((m) => m.category === c)
                  .map((m) => (
                    <DishRow
                      key={m.id}
                      item={m}
                      live={live}
                      mode={mode}
                      platform={previewOn}
                      changed={changes.some((x) => x.item.id === m.id)}
                      onEdit={() => setEditing(m.id)}
                      onToggleStock={() => toggleStock(m.id)}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* Pending changes */}
      <AnimatePresence>
        {changes.length > 0 && mode === "edit" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-paper shadow-2xl lg:bottom-6"
          >
            <span className="grid size-7 place-items-center rounded-full bg-haldi text-sm font-semibold text-ink">{changes.length}</span>
            <span className="flex-1 text-[0.95rem]">{hi ? "बदलाव आपकी मंज़ूरी का इंतज़ार कर रहे हैं" : `change${changes.length === 1 ? "" : "s"} waiting for your OK`}</span>
            <button
              type="button"
              onClick={() => {
                if (approval?.status === "pending") void api(`/api/approvals/${approval.id}`, { method: "POST", json: { action: "skip" } }).then(refreshAll);
                setApproval(null);
                setDraft(published);
              }}
              className="text-sm text-paper/70 hover:text-paper"
            >
              {hi ? "रद्द करें" : "Discard"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => (approval?.status === "pending" ? setReviewOpen(true) : review())}
              className="rounded-full bg-haldi px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              {hi ? "देखें और पब्लिश करें" : "Review and publish"}
            </button>
            {submitError && <p className="w-full text-sm text-haldi">{submitError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review sheet */}
      <AnimatePresence>
        {reviewOpen && (
          <motion.div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReviewOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 sm:max-w-lg sm:rounded-3xl"
            >
              <ul className="mb-3 space-y-1.5 px-1 text-[0.95rem] text-ink-2">
                {changes.map((c) => (
                  <li key={c.item.id}>
                    <span className="font-medium text-ink">{c.item.name}</span>: {c.lines.join(", ")}
                  </li>
                ))}
              </ul>
              {approval && <ApprovalTicket key={approval.id} approval={approval} onDone={onDecided} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit drawer */}
      <AnimatePresence>{editItem && <EditDrawer key={editItem.id} item={editItem} live={live} onClose={() => setEditing(null)} onSave={(next) => (patch(next.id, () => next), setEditing(null))} />}</AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-paper shadow-xl lg:bottom-6"
          >
            <Check aria-hidden className="size-4" />
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Scales a photo to at most 800px and returns a JPEG data URL small enough to store. */
function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function RatingStars({ value, votes }: { value: number; votes: number }) {
  const { state } = useApp();
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-muted">
      <span className="inline-flex" aria-label={`${value} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative inline-block size-3">
              <svg viewBox="0 0 20 20" className="absolute inset-0 size-3 fill-line" aria-hidden>
                <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.7 1-5.9L1.5 7.7l5.9-.8z" />
              </svg>
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg viewBox="0 0 20 20" className="size-3 fill-haldi-deep" aria-hidden>
                  <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.7 1-5.9L1.5 7.7l5.9-.8z" />
                </svg>
              </span>
            </span>
          );
        })}
      </span>
      {votes} {state.lang === "hi" ? "रेटिंग" : votes === 1 ? "rating" : "ratings"}
    </span>
  );
}

function DishImage({ item, size = 132, dim = false }: { item: Item; size?: number; dim?: boolean }) {
  return (
    <div
      className={`grid place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_25%,#fbf3e2,#f0dfbf)] transition ${dim ? "opacity-50 grayscale" : ""}`}
      style={{ width: size, height: size }}
    >
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <Dish kind={item.kind} size={size * 0.84} />
      )}
    </div>
  );
}

function DishRow({
  item,
  live,
  mode,
  platform,
  changed,
  onEdit,
  onToggleStock,
}: {
  item: Item;
  live: Platform[];
  mode: "edit" | "preview";
  platform: Platform;
  changed: boolean;
  onEdit: () => void;
  onToggleStock: () => void;
}) {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const onAll = live.every((p) => item.available[p]);
  const offAll = live.every((p) => !item.available[p]);
  const offOn = live.filter((p) => !item.available[p]);
  const preview = mode === "preview";
  const unavailable = preview ? !item.available[platform] : offAll;
  const samePrice = new Set(live.map((p) => item.price[p])).size === 1;

  return (
    <li className="flex gap-5 py-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`food-mark ${item.veg ? "text-veg" : "nonveg text-nonveg"}`} aria-label={item.veg ? "Veg" : "Non-veg"} />
          {item.bestseller && <span className="rounded-md bg-chilli-soft px-1.5 py-0.5 text-[0.72rem] font-semibold text-chilli">{hi ? "बेस्टसेलर" : "Bestseller"}</span>}
          {changed && !preview && <span className="rounded-md bg-turmeric-soft px-1.5 py-0.5 text-[0.72rem] font-medium text-turmeric">{hi ? "बदला गया" : "Edited"}</span>}
        </div>
        <h3 className={`mt-1.5 text-[1.12rem] font-semibold ${unavailable ? "text-muted" : ""}`}>{item.name}</h3>
        <div className="mt-0.5">
          <RatingStars value={item.rating} votes={item.votes} />
        </div>
        <p className="mt-1.5 text-[1rem] font-medium">
          {preview || samePrice ? (
            rupees(item.price[preview ? platform : live[0]])
          ) : (
            <span className="flex flex-wrap gap-x-4">
              {live.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5">
                  <ChannelTag channel={p} className="text-[0.85rem]" />
                  {rupees(item.price[p])}
                </span>
              ))}
            </span>
          )}
        </p>
        {item.description ? (
          <p className="mt-1.5 line-clamp-2 max-w-[56ch] text-[0.92rem] leading-relaxed text-ink-2">{item.description}</p>
        ) : (
          !preview && (
            <button type="button" onClick={onEdit} className="mt-1.5 text-[0.92rem] text-turmeric underline underline-offset-2">
              {hi ? "विवरण जोड़ें" : "Add a description"}
            </button>
          )
        )}
        {!preview && (
          <button type="button" onClick={onEdit} className="mt-3 rounded-full px-3.5 py-1.5 text-sm text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
            {hi ? "डिश बदलें" : "Edit dish"}
          </button>
        )}
      </div>

      <div className="relative shrink-0 self-start pb-4">
        <DishImage item={item} dim={unavailable} />
        {preview ? (
          unavailable ? (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface px-3 py-1.5 text-[0.78rem] font-medium text-muted shadow-md">
              {hi ? "अभी उपलब्ध नहीं" : "Unavailable"}
            </span>
          ) : null
        ) : (
          <button
            type="button"
            onClick={onToggleStock}
            aria-pressed={!offAll}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold shadow-md transition-colors ${
              onAll ? "bg-surface text-veg" : offAll ? "bg-ink text-paper" : "bg-surface text-turmeric"
            }`}
          >
            {onAll ? (hi ? "स्टॉक में" : "In stock") : offAll ? (hi ? "आउट ऑफ़ स्टॉक" : "Out of stock") : hi ? `${offOn.map((p) => CHANNEL_NAME[p]).join(", ")} पर बंद` : `Off on ${offOn.map((p) => CHANNEL_NAME[p]).join(", ")}`}
          </button>
        )}
      </div>
    </li>
  );
}

function EditDrawer({ item, live, onClose, onSave }: { item: Item; live: Platform[]; onClose: () => void; onSave: (next: Item) => void }) {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const [d, setD] = useState<Item>(item);
  const [samePrice, setSamePrice] = useState(new Set(live.map((p) => item.price[p])).size === 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setPrice(p: Platform, v: number) {
    const price = { ...d.price };
    if (samePrice) live.forEach((x) => (price[x] = v));
    else price[p] = v;
    setD({ ...d, price });
  }

  const field = "w-full rounded-lg bg-surface px-3 py-2.5 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]";

  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
        className="flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">{hi ? "डिश बदलें" : "Edit dish"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
            <X className="size-5" />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-4">
            <DishImage item={d} size={112} />
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                <Camera aria-hidden className="size-4" />
                {hi ? "फ़ोटो बदलें" : "Replace photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void shrinkPhoto(f).then((photo) => setD({ ...d, photo }));
                  }}
                />
              </label>
              <p className="max-w-[24ch] text-[0.8rem] leading-snug text-muted">
                {hi ? "Zest रोशनी और क्रॉप ठीक करके हर प्लेटफ़ॉर्म के साइज़ में भेजेगा।" : "Zest fixes the lighting and crop, then sizes it for each platform."}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-2">{hi ? "नाम" : "Name"}</span>
            <input className={field} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          </label>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-ink-2">{hi ? "विवरण" : "Description"}</span>
              <button
                type="button"
                onClick={() =>
                  setD({
                    ...d,
                    description:
                      SUGGESTED_DESCRIPTION[d.name] ??
                      (d.description ? d.description.replace(/\.$/, "") + ". Made fresh to order." : `${d.name}, made fresh to order in our kitchen.`),
                  })
                }
                className="inline-flex items-center gap-1 text-sm font-medium text-turmeric"
              >
                <Sparkles aria-hidden className="size-3.5" />
                {hi ? "Zest से लिखवाएँ" : "Write with Zest"}
              </button>
            </div>
            <textarea className={`${field} min-h-24`} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                [true, hi ? "वेज" : "Veg"],
                [false, hi ? "नॉन-वेज" : "Non-veg"],
              ] as const
            ).map(([veg, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={d.veg === veg}
                onClick={() => setD({ ...d, veg })}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm ${d.veg === veg ? "bg-surface shadow-[0_0_0_2px_var(--ink)]" : "shadow-[inset_0_0_0_1px_var(--line)]"}`}
              >
                <span className={`food-mark ${veg ? "text-veg" : "nonveg text-nonveg"}`} />
                {label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={!!d.bestseller}
              onClick={() => setD({ ...d, bestseller: !d.bestseller })}
              className={`rounded-full px-3.5 py-2 text-sm ${d.bestseller ? "bg-chilli-soft font-medium text-chilli shadow-[0_0_0_1.5px_var(--chilli)]" : "shadow-[inset_0_0_0_1px_var(--line)]"}`}
            >
              {hi ? "बेस्टसेलर" : "Bestseller"}
            </button>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm text-ink-2">{hi ? "क़ीमत और स्टॉक" : "Price and stock"}</legend>
            {live.length > 1 && (
              <label className="mb-3 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={samePrice} onChange={(e) => setSamePrice(e.target.checked)} className="size-4 accent-[var(--ink)]" />
                {hi ? "हर प्लेटफ़ॉर्म पर एक क़ीमत" : "Same price everywhere"}
              </label>
            )}
            <div className="space-y-2">
              {live.map((p) => (
                <div key={p} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)]">
                  <ChannelTag channel={p} className="w-20" />
                  <label className="relative">
                    <span className="sr-only">{CHANNEL_NAME[p]} price</span>
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={d.price[p]}
                      onChange={(e) => setPrice(p, Number(e.target.value))}
                      className="w-24 rounded-lg bg-paper py-1.5 pl-6 pr-2 outline-none shadow-[inset_0_0_0_1px_var(--line)] focus:shadow-[inset_0_0_0_2px_var(--turmeric)]"
                    />
                  </label>
                  <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={d.available[p]} onChange={(e) => setD({ ...d, available: { ...d.available, [p]: e.target.checked } })} className="peer sr-only" />
                    <span aria-hidden className="relative h-5 w-9 rounded-full bg-line transition-colors peer-checked:bg-veg peer-focus-visible:outline-2 peer-focus-visible:outline-turmeric">
                      <span className={`absolute top-0.5 size-4 rounded-full bg-surface transition-all ${d.available[p] ? "left-[18px]" : "left-0.5"}`} />
                    </span>
                    {d.available[p] ? (hi ? "स्टॉक में" : "In stock") : hi ? "बंद" : "Off"}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-ink-2 hover:text-ink">
            {hi ? "रद्द करें" : "Cancel"}
          </button>
          <button type="button" onClick={() => onSave(d)} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
            {hi ? "बदलाव रखें" : "Keep changes"}
          </button>
        </footer>
      </motion.aside>
    </motion.div>
  );
}
