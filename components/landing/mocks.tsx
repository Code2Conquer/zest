"use client";

import { useEffect, useState } from "react";
import { Check, Clock, MessageCircle, Search, Star } from "lucide-react";
import { MENU, PAYOUTS } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The product, drawn as it looks inside Zest, with the sample restaurant's numbers. These are
// interface pieces (data-ui), not illustrations: every label here exists in the app.

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const dish = (id: string) => MENU.find((m) => m.id === id)!;

type Channel = "zomato" | "swiggy" | "web";
const CH: Record<Channel, { name: Bi; color: string }> = {
  zomato: { name: { en: "Zomato", hi: "Zomato" }, color: "var(--lp-zomato)" },
  swiggy: { name: { en: "Swiggy", hi: "Swiggy" }, color: "var(--lp-swiggy)" },
  web: { name: { en: "Your page", hi: "आपका पेज" }, color: "var(--lp-web)" },
};

function Dot({ c }: { c: Channel }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: CH[c].color }} />;
}

function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? "var(--lp-good)" : "var(--lp-bad)";
  return (
    <span aria-label={veg ? "Veg" : "Non-veg"} className="grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px]" style={{ borderColor: c }}>
      <span className="size-1.5 rounded-full" style={{ background: c }} />
    </span>
  );
}

/** The restaurant's own ordering page, on a phone. */
export function PhonePage({ className = "" }: { className?: string }) {
  const { pick } = useApp();
  const items = ["m1", "m3", "m2"].map(dish);
  return (
    <div data-ui className={`w-[290px] rounded-[38px] bg-[var(--lp-ink)] p-[9px] ${className}`}>
      <div className="overflow-hidden rounded-[30px] bg-[var(--lp-ground)]">
        <div className="relative h-[120px]">
          <img src="/photos/menu-paneer-tikka.webp" alt="" className="size-full object-cover" />
          <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[var(--lp-ink)]" />
        </div>
        <div className="relative -mt-8 mx-3 rounded-2xl bg-white p-3.5">
          <p className="text-[17px] font-semibold leading-tight">Rasoi 27</p>
          <p className="text-[12px] text-[var(--lp-muted)]">North Indian · Biryani · Indiranagar</p>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            {(["zomato", "swiggy"] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-md bg-[var(--lp-good)] px-1.5 py-0.5 font-semibold text-white">
                {p === "zomato" ? "4.2" : "4.0"} <Star aria-hidden size={10} fill="currentColor" strokeWidth={0} />
                <span className="font-normal opacity-90">{p === "zomato" ? "Zomato" : "Swiggy"}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 text-[11px]">
            <span className="rounded-full bg-[var(--lp-sunken)] px-2 py-0.5">₹600 {pick({ en: "for two", hi: "दो के लिए" })}</span>
            <span className="rounded-full bg-[var(--lp-accent-soft)] px-2 py-0.5">{pick({ en: "Pickup · UPI", hi: "पिकअप · UPI" })}</span>
          </div>
        </div>
        <div className="mx-3 mt-2.5 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] text-[var(--lp-muted)]">
          <Search aria-hidden size={13} /> {pick({ en: "Search dishes", hi: "डिश खोजें" })}
        </div>
        <ul className="mt-1 px-3 pb-4">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <VegMark veg={m.veg} />
                  {m.bestseller && <span className="rounded bg-[var(--lp-accent-soft)] px-1 text-[9.5px] font-semibold uppercase tracking-wide">Bestseller</span>}
                </div>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight">{m.name}</p>
                <p className="text-[12px]">{inr(m.price.zomato)}</p>
              </div>
              <div className="relative">
                <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-[var(--lp-line)] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[var(--lp-good)]">ADD</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The alert an owner sees when someone orders from their page. */
export function OrderPing({ className = "" }: { className?: string }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`lp-ui w-[270px] p-4 ${className}`}>
      <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--lp-web)]">
        <Dot c="web" /> {pick({ en: "New order on your page", hi: "आपके पेज पर नया ऑर्डर" })}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold">Ananya R. · {inr(638)}</p>
      <p className="text-[13px] text-[var(--lp-muted)]">Dal makhani, 2 garlic naan</p>
      <p className="mt-2 rounded-lg bg-[var(--lp-accent-soft)] px-2.5 py-1.5 text-[12px]">
        {pick({ en: "12th order · usually asks for less spice", hi: "12वाँ ऑर्डर · अक्सर कम तीखा माँगती हैं" })}
      </p>
    </div>
  );
}

/** One dish, switched off once, gone from every app. */
export function MenuSync() {
  const { pick } = useApp();
  const [off, setOff] = useState(false);
  const m = dish("m3");
  return (
    <div data-ui className="lp-ui p-5">
      <div className="flex items-center gap-3">
        <img src={m.photo} alt="" className="size-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold">{m.name}</p>
          <p className="text-[14px] text-[var(--lp-muted)]">{inr(m.price.zomato)} · {pick({ en: "121 orders this week", hi: "इस हफ़्ते 121 ऑर्डर" })}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!off}
          aria-label={pick({ en: "In stock", hi: "स्टॉक में" })}
          onClick={() => setOff((v) => !v)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${off ? "bg-[#c9cfc8]" : "bg-[var(--lp-good)]"}`}
        >
          <span className={`absolute top-1 size-6 rounded-full bg-white transition-transform ${off ? "left-1" : "left-1 translate-x-6"}`} />
        </button>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
        {(["zomato", "swiggy", "web"] as const).map((c, n) => (
          <li key={c} className="rounded-xl bg-[var(--lp-ground)] px-3 py-2.5">
            <p className="flex items-center gap-1.5 font-medium">
              <Dot c={c} /> {pick(CH[c].name)}
            </p>
            <p className={`mt-1 transition-colors ${off ? "text-[var(--lp-bad)]" : "text-[var(--lp-good)]"}`} style={{ transitionDelay: `${n * 140}ms` }}>
              {off ? pick({ en: "Out of stock", hi: "स्टॉक ख़त्म" }) : pick({ en: "Live", hi: "लाइव" })}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-[var(--lp-muted)]">{pick({ en: "Tap the switch: one change, every app.", hi: "स्विच दबाएँ: एक बदलाव, हर ऐप पर।" })}</p>
    </div>
  );
}

type BoardOrder = { id: string; c: Channel | "dine"; items: string; amount: number; mins: number; late?: boolean };
const BOARD: BoardOrder[] = [
  { id: "W-0013", c: "web", items: "Veg thali, gajar halwa", amount: 412, mins: 1 },
  { id: "#7841", c: "zomato", items: "Paneer tikka, 2 butter naan", amount: 486, mins: 9 },
  { id: "#3390", c: "swiggy", items: "Dal makhani, jeera rice", amount: 342, mins: 21, late: true },
  { id: "T4", c: "dine", items: "Thali x3, masala chaas x3", amount: 1170, mins: 12 },
  { id: "#7852", c: "zomato", items: "Chicken biryani x2", amount: 698, mins: 4 },
];

/** Every channel's orders on one board; a new one lands every few seconds. */
export function OrderBoard() {
  const { pick } = useApp();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setN((v) => v + 1), 3800);
    return () => clearInterval(t);
  }, []);
  const list = Array.from({ length: 4 }, (_, k) => BOARD[(n + k) % BOARD.length]);
  const color = (c: BoardOrder["c"]) => (c === "dine" ? "var(--lp-dine)" : CH[c].color);
  const name = (c: BoardOrder["c"]) => (c === "dine" ? pick({ en: "Dine-in", hi: "डाइन-इन" }) : pick(CH[c].name));
  return (
    <div data-ui className="lp-ui p-4">
      <p className="flex items-center justify-between px-1 text-[13px] font-semibold">
        {pick({ en: "Orders now", hi: "अभी के ऑर्डर" })}
        <span className="flex items-center gap-1.5 text-[var(--lp-good)]">
          <span className="lp-pulse size-2 rounded-full bg-[var(--lp-good)]" /> Live
        </span>
      </p>
      <ul className="mt-3 space-y-2">
        {list.map((o, k) => (
          <li key={`${o.id}-${n + k}`} className={`rounded-xl bg-[var(--lp-ground)] px-3.5 py-3 ${k === 0 ? "lp-arrive" : ""}`}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 font-semibold">
                <span aria-hidden className="size-2 rounded-full" style={{ background: color(o.c) }} />
                {name(o.c)}
              </span>
              <span className="text-[var(--lp-muted)]">{o.id}</span>
            </div>
            <p className="mt-1 text-[14px]">{o.items}</p>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className={o.late ? "font-semibold text-[var(--lp-bad)]" : "text-[var(--lp-muted)]"}>
                {o.late ? pick({ en: `Running late, ${o.mins} min`, hi: `देर हो रही, ${o.mins} मिनट` }) : pick({ en: `Preparing, ${o.mins} min`, hi: `बन रहा, ${o.mins} मिनट` })}
              </span>
              <span className="font-semibold">{inr(o.amount)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What Zest knows about a regular who orders from the restaurant's own page. */
export function GuestCard() {
  const { pick } = useApp();
  const rows: [Bi, Bi][] = [
    [{ en: "Orders", hi: "ऑर्डर" }, { en: "12 since June", hi: "जून से 12" }],
    [{ en: "Spent", hi: "ख़र्च" }, { en: inr(7840), hi: inr(7840) }],
    [{ en: "Usually", hi: "अक्सर" }, { en: "Dal makhani, 2 garlic naan", hi: "दाल मखनी, 2 गार्लिक नान" }],
    [{ en: "Note", hi: "नोट" }, { en: "Less spice. Friday dinners.", hi: "कम तीखा। शुक्रवार डिनर।" }],
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--lp-accent-soft)] text-[17px] font-semibold">AR</span>
        <div>
          <p className="text-[17px] font-semibold">Ananya Rao</p>
          <p className="text-[14px] text-[var(--lp-muted)]">{pick({ en: "Regular · last order 9 days ago", hi: "रेगुलर · आख़िरी ऑर्डर 9 दिन पहले" })}</p>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-[var(--lp-line)] text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k.en} className="flex justify-between gap-4 py-2">
            <dt className="text-[var(--lp-muted)]">{pick(k)}</dt>
            <dd className="text-right font-medium">{pick(v)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 rounded-xl bg-[var(--lp-ground)] p-3 text-[14px]">
        <p className="flex items-center gap-1.5 font-semibold">
          <MessageCircle aria-hidden size={15} /> {pick({ en: "Zest suggests", hi: "Zest का सुझाव" })}
        </p>
        <p className="mt-1">{pick({ en: "She hasn't ordered in 9 days. Send her Friday's dal makhani offer on WhatsApp?", hi: "9 दिन से ऑर्डर नहीं किया। शुक्रवार का दाल मखनी ऑफ़र WhatsApp पर भेजें?" })}</p>
      </div>
    </div>
  );
}

/** A low review with the reply Zest drafted. */
export function ReviewCard() {
  const { pick } = useApp();
  const [sent, setSent] = useState(false);
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
        <span className="font-semibold">Karthik R.</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--lp-bad)]">
          2 <Star aria-hidden size={12} fill="currentColor" strokeWidth={0} />
        </span>
        <span className="flex items-center gap-1.5 text-[var(--lp-muted)]">
          <Dot c="swiggy" /> Swiggy · 10:57 am
        </span>
      </p>
      <p className="mt-2 text-[15px]">“Dal was cold by the time it reached and the rice was less than usual.”</p>
      <p className="mt-4 text-[13px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Reply drafted in your voice", hi: "आपकी भाषा में तैयार जवाब" })}</p>
      <p className="mt-1.5 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px] leading-relaxed">
        Karthik, sorry the dal reached you cold, that's not how it leaves our kitchen. We've moved dal to sealed containers from today and added a ₹75 credit to your next order.
      </p>
      <button type="button" onClick={() => setSent(true)} className={`mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${sent ? "bg-[var(--lp-good)] text-white" : "bg-[var(--lp-ink)] text-white"}`}>
        {sent ? (
          <>
            <Check aria-hidden size={15} /> {pick({ en: "Reply posted", hi: "जवाब पोस्ट हुआ" })}
          </>
        ) : (
          pick({ en: "Post reply", hi: "जवाब पोस्ट करें" })
        )}
      </button>
    </div>
  );
}

/** A payout split into what the restaurant kept and where the rest went. */
export function PayoutCard() {
  const { pick } = useApp();
  const [p, setP] = useState<"zomato" | "swiggy">("swiggy");
  const cur = PAYOUTS.find((x) => x.platform === p)!;
  const parts = [
    { label: { en: "You keep", hi: "आपको मिला" }, v: cur.net, color: "var(--lp-good)" },
    { label: { en: "Commission", hi: "कमीशन" }, v: cur.commission, color: "#9aa59e" },
    { label: { en: "Ads", hi: "ऐड" }, v: cur.ads, color: "var(--lp-accent)" },
    { label: { en: "Deductions", hi: "कटौती" }, v: cur.deductions, color: "var(--lp-bad)" },
  ];
  const wrong = p === "swiggy" ? { amount: 412, order: "3381" } : { amount: 286, order: "7712" };
  return (
    <div data-ui className="lp-ui p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Payout, 7 to 13 Oct", hi: "पेआउट, 7 से 13 अक्टूबर" })}</p>
        <div role="radiogroup" aria-label={pick({ en: "Platform", hi: "प्लेटफ़ॉर्म" })} className="flex rounded-full bg-[var(--lp-ground)] p-1 text-[14px]">
          {(["zomato", "swiggy"] as const).map((x) => (
            <button key={x} type="button" role="radio" aria-checked={p === x} onClick={() => setP(x)} className={`min-h-9 rounded-full px-4 font-semibold transition-colors ${p === x ? (x === "zomato" ? "text-white" : "text-[var(--lp-ink)]") : "text-[var(--lp-muted)]"}`} style={p === x ? { background: CH[x].color } : undefined}>
              {x === "zomato" ? "Zomato" : "Swiggy"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[14px] text-[var(--lp-muted)]">
        {pick({ en: "Sales", hi: "बिक्री" })} {inr(cur.gross)}
      </p>
      <p className="text-[clamp(34px,3.6vw,48px)] font-semibold leading-tight tracking-tight">{inr(cur.net)}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--lp-ground)]">
        {parts.map((x) => (
          <span key={x.label.en} className="lp-bar h-full" style={{ width: `${(x.v / cur.gross) * 100}%`, background: x.color }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
        {parts.map((x) => (
          <li key={x.label.en} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[var(--lp-muted)]">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: x.color }} />
              {pick(x.label)}
            </span>
            <span className="font-medium">{inr(x.v)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fbe6e2] p-3.5 text-[14px]">
        <div>
          <p className="font-semibold">{pick({ en: `${inr(wrong.amount)} deducted by mistake`, hi: `${inr(wrong.amount)} ग़लती से कटे` })}</p>
          <p className="text-[var(--lp-muted)]">{pick({ en: `Order #${wrong.order} was cancelled after cooking started.`, hi: `ऑर्डर #${wrong.order} खाना बनने के बाद कैंसल हुआ।` })}</p>
        </div>
        <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--lp-ink)] px-4 font-semibold text-white">{pick({ en: "Dispute drafted", hi: "डिस्प्यूट तैयार" })}</span>
      </div>
    </div>
  );
}

/** An offer with a hard weekly cap, and how it is doing. */
export function PromoCard() {
  const { pick } = useApp();
  const spent = 1840, cap = 3000;
  return (
    <div data-ui className="lp-ui p-5">
      <p className="flex items-center justify-between text-[14px]">
        <span className="flex items-center gap-1.5 font-semibold">
          <Dot c="swiggy" /> {pick({ en: "Weekday lunch, 20% off", hi: "वीकडे लंच, 20% छूट" })}
        </span>
        <span className="rounded-full bg-[#e1efe6] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--lp-good)]">{pick({ en: "Running", hi: "चालू" })}</span>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          [pick({ en: "Orders", hi: "ऑर्डर" }), "46"],
          [pick({ en: "Sales", hi: "बिक्री" }), inr(14260)],
          [pick({ en: "Spent", hi: "ख़र्च" }), inr(spent)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[13px] text-[var(--lp-muted)]">{k}</p>
            <p className="text-[20px] font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--lp-ground)]">
        <span className="lp-bar block h-full rounded-full bg-[var(--lp-accent)]" style={{ width: `${(spent / cap) * 100}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-[var(--lp-muted)]">{pick({ en: `Stops by itself at ${inr(cap)} this week`, hi: `इस हफ़्ते ${inr(cap)} पर अपने-आप रुकेगा` })}</p>
    </div>
  );
}

/** Which dishes sell, and where one is losing stars. */
export function DishBoard() {
  const { pick } = useApp();
  const rows = [
    { m: dish("m2"), z: 4.3, s: 4.2 },
    { m: dish("m1"), z: 4.4, s: 4.3 },
    { m: dish("m3"), z: 4.5, s: 3.8, flag: true },
  ];
  return (
    <div data-ui className="lp-ui p-5">
      <p className="text-[14px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Dishes this week", hi: "इस हफ़्ते की डिश" })}</p>
      <table className="mt-3 w-full text-[14px]">
        <thead>
          <tr className="text-left text-[13px] text-[var(--lp-muted)]">
            <th className="pb-2 font-medium">{pick({ en: "Dish", hi: "डिश" })}</th>
            <th className="pb-2 text-right font-medium">{pick({ en: "Orders", hi: "ऑर्डर" })}</th>
            <th className="pb-2 text-right font-medium">Zomato</th>
            <th className="pb-2 text-right font-medium">Swiggy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, z, s, flag }) => (
            <tr key={m.id} className="border-t border-[var(--lp-line)]">{/* taste-skill-ignore: table row */}
              <td className="py-2.5">
                <span className="flex items-center gap-2">
                  <img src={m.photo} alt="" className="size-8 rounded-lg object-cover" />
                  {m.name}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums">{m.ordersLast7}</td>
              <td className="py-2.5 text-right tabular-nums">{z.toFixed(1)}</td>
              <td className={`py-2.5 text-right tabular-nums ${flag ? "font-semibold text-[var(--lp-bad)]" : ""}`}>{s.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex gap-2 rounded-xl bg-[var(--lp-accent-soft)] p-3 text-[14px]">
        <Clock aria-hidden size={16} className="mt-0.5 shrink-0" />
        {pick({ en: "Dal makhani is 0.7 lower on Swiggy. Three reviews say it arrived cold: try sealed containers.", hi: "Swiggy पर दाल मखनी 0.7 कम है। तीन रिव्यू कहते हैं ठंडी पहुँची: सील डिब्बे आज़माएँ।" })}
      </p>
    </div>
  );
}

/** The next money in, per app, from the payout mails. */
export function NextPayouts() {
  const { pick } = useApp();
  return (
    <div data-ui className="lp-ui p-5">
      <p className="text-[14px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Coming to your bank", hi: "आपके बैंक में आने वाला" })}</p>
      <ul className="mt-3 space-y-2">
        {[...PAYOUTS]
          .filter((x) => x.status === "upcoming")
          .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
          .map((x) => (
            <li key={x.platform} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--lp-ground)] px-3.5 py-3 text-[15px]">
              <span className="flex items-center gap-2 font-semibold">
                <Dot c={x.platform as Channel} /> {x.platform === "zomato" ? "Zomato" : "Swiggy"}
              </span>
              <span className="text-[var(--lp-muted)]">{x.date}</span>
              <span className="font-semibold tabular-nums">{inr(x.net)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
