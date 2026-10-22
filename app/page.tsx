"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Star } from "lucide-react";
import { Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { MENU, ORDERS, PAYOUTS } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The landing page. One idea runs it: the kitchen order ticket. Every job Zest does reaches the owner
// as a ticket to approve, so the ticket's shape (a square slip, notched on both sides, with a printed
// band) is the page's only motif: the hero card, the interface panels, the setup card, the FAQ slips.

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Sections fade their parts in, one after another, the first time they scroll into view. */
function useReveal() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("lp-seen");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
}

const PHOTOS: { src: string; caption: Bi }[] = [
  { src: "/photos/team-pass.webp", caption: { en: "Plates at the pass, dinner service", hi: "डिनर सर्विस में पास पर तैयार प्लेटें" } },
  { src: "/photos/team-chef.webp", caption: { en: "Finishing plates under the pass lamps", hi: "पास की लाइट के नीचे प्लेट सजाते शेफ़" } },
  { src: "/photos/team-guests.webp", caption: { en: "A long table of regulars", hi: "रेगुलर मेहमानों की लंबी टेबल" } },
  { src: "/photos/team-rider.webp", caption: { en: "An order leaving for delivery", hi: "डिलीवरी के लिए निकलता ऑर्डर" } },
];

/** The kitchen, in four photographs that crossfade slowly like light moving through a day. */
function Room() {
  const { pick } = useApp();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % PHOTOS.length);
    }, 5600);
    return () => clearInterval(t);
  }, []);
  return (
    <figure className="relative m-0 h-[30svh] overflow-hidden sm:h-[48svh] lg:sticky lg:top-3 lg:h-[calc(100svh-24px)]">
      {PHOTOS.map((p, n) => (
        <img key={p.src} src={p.src} alt={pick(p.caption)} width={1600} height={1200} loading={n === 0 ? "eager" : "lazy"} className={`lp-fade size-full object-cover ${n === i ? "on" : ""}`} />
      ))}
      <figcaption className="absolute bottom-0 left-0 bg-[var(--lp-ink)] px-4 py-2.5 text-[15px] text-[var(--lp-paper)]">{pick(PHOTOS[i].caption)}</figcaption>
    </figure>
  );
}

function Perf({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`perf ${className}`}>
      {Array.from({ length: 80 }, (_, k) => (
        <span key={k} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Interface fragments: real pieces of the Zest app, at real size, with real sample data.

type Rail = "all" | "zomato" | "swiggy" | "web" | "dine";
type RailOrder = { id: string; channel: "zomato" | "swiggy" | "dine" | "web"; items: string; amount: number; placedAt: string; status: string; prepMins: number };
const RAIL_ORDERS: RailOrder[] = [
  ...(ORDERS.filter((o) => ["7841", "3390", "T4"].includes(o.id)) as RailOrder[]),
  { id: "W-0012", channel: "web", items: "Chole bhature x2, masala chaas", amount: 438, placedAt: "8:44 pm", status: "preparing" as const, prepMins: 6 },
];
const CH_NAME = { zomato: "Zomato", swiggy: "Swiggy", dine: "Dine-in", web: "Your page" } as const;
const CH_COLOR = { zomato: "var(--lp-zomato)", swiggy: "var(--lp-swiggy)", dine: "var(--ch-dine)", web: "var(--ch-direct)" } as const;

function OrderRail({ rail }: { rail: Rail }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const status = (s: string, mins: number) =>
    s === "delayed" ? (hi ? `देर, ${mins} मिनट` : `Running late, ${mins} min`) : s === "ready" ? (hi ? "पिकअप के लिए तैयार" : "Ready for pickup") : hi ? `बन रहा है, ${mins} मिनट` : `Preparing, ${mins} min`;
  return (
    <div data-ui className="flex h-full flex-col gap-2.5 bg-[var(--lp-ground)] p-5 text-[var(--lp-ink)] sm:p-7">
      <p className="flex items-baseline justify-between text-[15px]">
        <span className="font-semibold">{hi ? "किचन में, अभी" : "In the kitchen now"}</span>
        <span className="text-[var(--lp-muted)]">{hi ? "लाइव" : "Live"}</span>
      </p>
      {RAIL_ORDERS.map((o) => {
        const dim = rail !== "all" && o.channel !== rail;
        return (
          <div key={o.id} className={`bg-[var(--lp-paper)] px-4 py-3 transition-opacity duration-300 ${dim ? "opacity-30" : ""}`}>
            <p className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full" style={{ background: CH_COLOR[o.channel] }} />
                {CH_NAME[o.channel]}
              </span>
              <span className="text-[var(--lp-muted)]">
                #{o.id}, {o.placedAt}
              </span>
            </p>
            <p className="mt-1 text-[15px] font-medium">{o.items}</p>
            <div className="mt-2 h-1.5 bg-[var(--sunken)]">
              <div className="lp-bar h-full" style={{ width: `${Math.min(100, (o.prepMins / 15) * 100)}%`, background: o.status === "delayed" ? "var(--lp-zomato)" : o.status === "ready" ? "var(--veg)" : "var(--haldi-deep)" }} />
            </div>
            <p className={`mt-1.5 flex justify-between text-[15px] ${o.status === "delayed" ? "font-medium text-[var(--lp-zomato)]" : "text-[var(--lp-muted)]"}`}>
              <span>{status(o.status, o.prepMins)}</span>
              <span className="text-[var(--lp-ink)]">{inr(o.amount)}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** The payout explainer: the page's one live thing. Switch platform and the whole field follows. */
function PayoutShowcase() {
  const { lang } = useApp();
  const hi = lang === "hi";
  const [p, setP] = useState<"zomato" | "swiggy">("swiggy");
  const [cur, prev] = PAYOUTS.filter((x) => x.platform === p);
  const drop = prev.net - cur.net;
  const wrong = p === "swiggy" ? { amount: 412, order: "3381", mins: 6 } : { amount: 180, order: "7802", mins: 4 };
  const name = p === "zomato" ? "Zomato" : "Swiggy";
  const field = p === "zomato" ? "var(--lp-zomato)" : "var(--lp-swiggy)";
  const lines: [Bi, number][] = [
    [{ en: "Sales", hi: "बिक्री" }, cur.gross],
    [{ en: "Commission", hi: "कमीशन" }, -cur.commission],
    [{ en: "Ads", hi: "ऐड" }, -cur.ads],
    [{ en: "Deductions", hi: "कटौती" }, -cur.deductions],
  ];

  return (
    <section data-reveal aria-labelledby="payout-h" className="relative overflow-hidden transition-colors duration-500" style={{ background: field, color: p === "zomato" ? "#fff" : "#17201c" }}>
      <div className="relative z-10 grid min-h-[92svh] grid-cols-[minmax(0,1fr)] gap-10 px-[var(--lp-m)] py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="payout-h" className="lp-in font-sign max-w-[16ch] text-[clamp(22px,2.6vw,36px)] leading-[1.05]" style={{ "--i": 0 } as React.CSSProperties}>
            {hi ? `${name} पेआउट कम क्यों आया` : `Why the ${name} payout fell`}
          </h2>
          <p className="lp-in mt-3 max-w-[44ch] text-[18px] leading-relaxed" style={{ "--i": 1 } as React.CSSProperties}>
            {hi ? "Zest आपके इनबॉक्स से स्टेटमेंट पढ़कर एक-एक लाइन समझाता है, और ग़लत कटौती पर डिस्प्यूट तैयार रखता है।" : "Zest reads the statement in your inbox, explains it line by line, and has the dispute ready for the wrong charge."}
          </p>
          <div data-ui className="tkt lp-in mt-8 w-full max-w-[440px] bg-[var(--lp-paper)] text-[var(--lp-ink)]" style={{ "--i": 2 } as React.CSSProperties}>
            <Perf className="h-3 text-[var(--lp-ink)]" />
            <div className="px-7 pb-6 pt-5">
              <p className="flex items-baseline justify-between text-[15px]">
                <span className="font-semibold">{name} · 7 to 13 Oct</span>
                <span className="font-medium text-[var(--lp-zomato)]">
                  −{inr(drop)} {hi ? "पिछले हफ़्ते से" : "on last week"}
                </span>
              </p>
              <p className="mt-1 text-[clamp(32px,3.6vw,56px)] font-semibold leading-none tracking-tight">{inr(cur.net)}</p>
              <dl className="mt-4 space-y-1.5 text-[15px]">
                {lines.map(([l, v]) => (
                  <div key={l.en} className="flex justify-between">
                    <dt className="text-[var(--lp-muted)]">{hi ? l.hi : l.en}</dt>
                    <dd className={v < 0 ? "text-[var(--lp-muted)]" : "font-medium"}>{v < 0 ? `−${inr(-v)}` : inr(v)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 bg-[var(--turmeric-soft)] px-4 py-3 text-[15px] leading-snug">
                <p className="font-semibold">{hi ? `${inr(wrong.amount)} की ग़लत कटौती` : `${inr(wrong.amount)} charged by mistake`}</p>
                <p className="mt-0.5 text-[var(--lp-muted)]">
                  {hi
                    ? `ऑर्डर #${wrong.order} ग्राहक ने खाना बनना शुरू होने के ${wrong.mins} मिनट बाद कैंसल किया। डिस्प्यूट तैयार है।`
                    : `Order #${wrong.order} was cancelled ${wrong.mins} minutes after cooking started. Dispute drafted.`}
                </p>
                <span className="mt-2.5 inline-flex min-h-10 items-center bg-[var(--lp-ink)] px-4 font-medium text-[var(--lp-paper)]">{hi ? "डिस्प्यूट भेजें" : "Raise dispute"}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[15px]">{hi ? "सैंपल रेस्टोरेंट, Rasoi 27 का हफ़्ता।" : "A week at the sample restaurant, Rasoi 27."}</p>
        </div>

        {/* The switch, blown up and cropped by the field's right and bottom edges. */}
        <div className="relative min-h-[90px] sm:min-h-[30svh] lg:min-h-0">
          <div
            data-ui
            role="radiogroup"
            aria-label={hi ? "प्लेटफ़ॉर्म चुनें" : "Choose a platform"}
            className="absolute bottom-[var(--lp-m)] right-[var(--lp-m)] flex bg-[#fff] p-[0.12em] text-[clamp(30px,5vw,80px)] font-semibold leading-none text-[var(--lp-ink)]"
          >
            {(["zomato", "swiggy"] as const).map((x) => (
              <button
                key={x}
                type="button"
                role="radio"
                aria-checked={p === x}
                onClick={() => setP(x)}
                className="px-[0.45em] py-[0.32em] transition-colors duration-300"
                style={p === x ? { background: x === "zomato" ? "var(--lp-zomato)" : "var(--lp-swiggy)", color: x === "zomato" ? "#fff" : "#17201c" } : undefined}
              >
                {x === "zomato" ? "Zomato" : "Swiggy"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const SETUP: { clause: Bi; field: string; ink: string }[] = [
  { clause: { en: "First, sign in with Google.", hi: "पहले, Google से साइन इन करें।" }, field: "#e4e7e3", ink: "#17201c" },
  { clause: { en: "Then paste your Zomato link.", hi: "फिर अपना Zomato लिंक डालें।" }, field: "#d6e4da", ink: "#17201c" },
  { clause: { en: "Connect your inbox.", hi: "अपना इनबॉक्स जोड़ें।" }, field: "#f2b035", ink: "#17201c" },
  { clause: { en: "Open your page, add your team.", hi: "अपना पेज खोलें, टीम जोड़ें।" }, field: "#12261b", ink: "#eef2ec" },
];

/** The setup ticket, further along in each field. */
function SetupCard({ step, qr }: { step: number; qr: string | null }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const rows: [Bi, Bi][] = [
    [{ en: "Signed in", hi: "साइन इन" }, { en: "aditi@rasoi27.in", hi: "aditi@rasoi27.in" }],
    [{ en: "Listing read", hi: "लिस्टिंग पढ़ी" }, { en: `${MENU.length} dishes, 4.2 rating, ₹600 for two`, hi: `${MENU.length} डिश, 4.2 रेटिंग, दो लोगों का ₹600` }],
    [{ en: "Inbox", hi: "इनबॉक्स" }, { en: "4 payouts, 2 statements", hi: "4 पेआउट, 2 स्टेटमेंट" }],
    [{ en: "Your page", hi: "आपका पेज" }, { en: "Live, with table QR codes", hi: "लाइव, टेबल QR के साथ" }],
  ];
  return (
    <div data-ui className="tkt lp-lift w-[260px] bg-[#fff] text-[#17201c]">
      <Perf className="h-3 text-[#17201c]" />
      <div className="px-5 pb-5 pt-4">
        <p className="text-[18px] font-semibold">Rasoi 27</p>
        <p className="text-[15px] text-[#3e4a44]">{hi ? "इंदिरानगर, बेंगलुरु" : "Indiranagar, Bengaluru"}</p>
        <ul className="mt-3 space-y-1.5 text-[15px]">
          {rows.map(([k, v], i) => (
            <li key={k.en} className={`flex gap-2 ${i > step ? "max-lg:hidden lg:opacity-0" : ""}`}>
              <span className="tkt-dot mt-[0.4em] shrink-0 text-[#2b6a4b]" aria-hidden />
              <span>
                <span className="font-medium">{hi ? k.hi : k.en}</span> · {hi ? v.hi : v.en}
              </span>
            </li>
          ))}
        </ul>
        {step === 3 && qr && <img src={qr} alt={hi ? "Rasoi 27 के पेज का QR कोड" : "QR code for Rasoi 27's page"} width={96} height={96} className="mt-3" />}
      </div>
    </div>
  );
}

const FAQ: { tab: Bi; q: Bi; a: Bi }[] = [
  {
    tab: { en: "Zomato & Swiggy", hi: "Zomato और Swiggy" },
    q: { en: "Does Zest replace Zomato or Swiggy?", hi: "क्या Zest, Zomato या Swiggy की जगह लेता है?" },
    a: { en: "No. Your listings keep running as they do, and Zest helps you run them: orders, menu, reviews and payouts in one place. Your own page is for customers who already know you.", hi: "नहीं। आपकी लिस्टिंग वैसे ही चलती हैं, और Zest उन्हें चलाने में मदद करता है: ऑर्डर, मेन्यू, रिव्यू और पेआउट एक जगह। आपका पेज उन ग्राहकों के लिए है जो आपको पहले से जानते हैं।" },
  },
  {
    tab: { en: "Approval", hi: "मंज़ूरी" },
    q: { en: "Will the AI change things without asking?", hi: "क्या AI बिना पूछे कुछ बदलेगा?" },
    a: { en: "No. Every price change, reply, dispute and promo arrives as a ticket you approve. Promos carry a hard spend cap, and everything is on record with undo.", hi: "नहीं। हर क़ीमत, जवाब, डिस्प्यूट और प्रोमो एक टिकट बनकर आता है जिसे आप मंज़ूर करते हैं। प्रोमो पर पक्की ख़र्च सीमा, और हर काम का रिकॉर्ड और undo।" },
  },
  {
    tab: { en: "Staff", hi: "स्टाफ़" },
    q: { en: "Can my staff use it without my password?", hi: "क्या स्टाफ़ मेरे पासवर्ड के बिना इस्तेमाल कर सकता है?" },
    a: { en: "Yes. Give each person a role and a 4-digit PIN. The kitchen sees only the order board; managers can do more; only you see everything.", hi: "हाँ। हर व्यक्ति को एक रोल और 4 अंकों का PIN दें। किचन सिर्फ़ ऑर्डर बोर्ड देखता है; मैनेजर ज़्यादा कर सकते हैं; सब कुछ सिर्फ़ आप देखते हैं।" },
  },
  {
    tab: { en: "Hardware", hi: "हार्डवेयर" },
    q: { en: "Do I need a POS or new hardware?", hi: "क्या POS या नया हार्डवेयर चाहिए?" },
    a: { en: "No. Zest runs on the phone, tablet or laptop you already have. Connections to POS systems such as Petpooja are on the way.", hi: "नहीं। Zest आपके मौजूदा फ़ोन, टैबलेट या लैपटॉप पर चलता है। Petpooja जैसे POS से कनेक्शन आ रहे हैं।" },
  },
  {
    tab: { en: "Payments", hi: "भुगतान" },
    q: { en: "How do customers pay on my page?", hi: "मेरे पेज पर ग्राहक भुगतान कैसे करते हैं?" },
    a: { en: "By UPI straight to your own UPI ID, or at the counter. The money comes to you directly; Zest never holds it.", hi: "UPI से सीधे आपके UPI ID पर, या काउंटर पर। पैसा सीधे आपके पास आता है; Zest कभी नहीं रखता।" },
  },
  {
    tab: { en: "Hindi", hi: "हिंदी" },
    q: { en: "Can I use it in Hindi?", hi: "क्या इसे हिंदी में इस्तेमाल कर सकते हैं?" },
    a: { en: "Yes. The whole app works in Hindi and English, and the assistant answers in Hindi when you write in Hindi or Hinglish.", hi: "हाँ। पूरा ऐप हिंदी और अंग्रेज़ी में चलता है, और आप हिंदी या हिंग्लिश में लिखें तो असिस्टेंट हिंदी में जवाब देता है।" },
  },
];
const FAQ_FIELDS = ["#fff", "#e4e7e3", "#e1efe6"];

export default function Landing() {
  const { pick, lang } = useApp();
  const hi = lang === "hi";
  const root = useReveal();
  const [routerOpen, setRouterOpen] = useState(false);
  const [rail, setRail] = useState<Rail>("all");
  const [faq, setFaq] = useState(0);
  const [qr, setQr] = useState<string | null>(null);
  const [platform, setPlatform] = useState<"zomato" | "swiggy">("zomato");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
    QRCode.toDataURL(`${window.location.origin}/r/rasoi-27`, { margin: 0, width: 192 }).then(setQr, () => {});
  }, []);

  async function openDemo() {
    await fetch("/api/outlet/demo", { method: "POST" });
    window.location.href = "/app";
  }

  function startWithLink(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ journey: "live", live: platform, ...(link.trim() ? { [platform]: link.trim() } : {}) });
    window.location.href = `/join?${q}`;
  }

  const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
  const RAILS: [Rail, Bi][] = [
    ["all", { en: "All", hi: "सभी" }],
    ["zomato", { en: "Zomato", hi: "Zomato" }],
    ["swiggy", { en: "Swiggy", hi: "Swiggy" }],
    ["web", { en: "Your page", hi: "आपका पेज" }],
    ["dine", { en: "Dine-in", hi: "डाइन-इन" }],
  ];

  return (
    <div ref={root} className="lp min-h-dvh overflow-x-clip">
      <noscript>
        <style>{`.lp-in{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* Hero: a printed ticket beside the room */}
      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <div className="tkt flex min-h-full flex-col bg-[var(--lp-paper)] lg:min-h-[calc(100svh-24px)]">
            <Perf className="h-10 text-[var(--lp-ink)] sm:h-14" />
            <div className="flex flex-1 flex-col items-center px-4 pb-10 pt-7 text-center sm:px-12 sm:pt-10">
              <div className="hidden w-full justify-end sm:flex">
                <LpLang />
              </div>
              <Wordmark className="text-[clamp(56px,8vw,120px)] sm:mt-6" />
              <h1 className="font-sign mt-6 text-[28px] leading-[1.04] [text-wrap:balance] sm:text-[44px] lg:text-[clamp(36px,3.4vw,52px)]">
                {hi ? (
                  <>
                    रेस्टोरेंट चलाइए,
                    <br />
                    ऐप नहीं।
                  </>
                ) : (
                  <>
                    Run the restaurant,
                    <br />
                    not the apps.
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-[40ch] text-[18px] leading-relaxed">
                {hi
                  ? "Zest आपके Zomato और Swiggy अकाउंट, टेबल और इनबॉक्स पर नज़र रखता है, हर पेआउट समझाता है, और सुधार तैयार रखता है। आप बस मंज़ूरी देते हैं।"
                  : "Zest watches your Zomato and Swiggy accounts, your tables and your inbox, explains every payout and drafts the fixes. You approve."}
              </p>
              <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn mt-8">
                {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
              </button>
              <nav aria-label={hi ? "और देखें" : "More"} className="mt-auto flex flex-wrap justify-center gap-x-7 gap-y-2 pt-10 text-[15px]">
                <button type="button" onClick={openDemo} className="lp-link">
                  {hi ? "डेमो किचन आज़माएँ" : "Try the demo kitchen"}
                </button>
                <a href="/r/rasoi-27" className="lp-link">
                  {hi ? "एक रेस्टोरेंट पेज देखें" : "See a restaurant page"}
                </a>
                <a href="/login" className="lp-link">
                  {hi ? "लॉग इन" : "Log in"}
                </a>
              </nav>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Room />
        </div>
      </section>

      {/* Orders: the live board beside spare text */}
      <section data-reveal aria-labelledby="orders-h" className="grid min-h-[88svh] grid-cols-[minmax(0,1fr)] items-center gap-10 px-[var(--lp-m)] py-24 lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-10 lg:order-2 lg:min-h-[560px]">
          <div>
            <h2 id="orders-h" className="lp-in font-sign text-[clamp(32px,3.6vw,56px)] leading-[1.02]" style={i(0)}>
              {hi ? "हर ऑर्डर, एक बोर्ड।" : "Every order, one board."}
            </h2>
            <p className="lp-in mt-6 max-w-[40ch] text-[18px] leading-relaxed" style={i(1)}>
              {hi
                ? "Zomato, Swiggy, आपकी टेबल और आपके अपने पेज के ऑर्डर कुछ सेकंड में एक लाइव बोर्ड पर। देर वाला टिकट ग्राहक के फ़ोन से पहले लाल हो जाता है।"
                : "Zomato, Swiggy, your tables and your own page land on one live board within seconds. A late ticket turns red before the customer calls."}
            </p>
          </div>
          <div role="tablist" aria-label={hi ? "चैनल" : "Channel"} className="lp-in flex flex-wrap gap-x-6 gap-y-2 text-[18px]" style={i(2)}>
            {RAILS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={rail === id} onClick={() => setRail(id)} className={rail === id ? "font-semibold underline decoration-[3px] underline-offset-8" : "text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"}>
                {pick(label)}
              </button>
            ))}
          </div>
          <div className="lp-in grid grid-cols-2 gap-1" style={i(3)}>
            <button type="button" onClick={openDemo} className="flex min-h-[72px] items-center bg-[var(--lp-ink)] px-5 text-left text-[18px] font-medium text-[var(--lp-paper)] transition-transform hover:-translate-y-0.5">
              {hi ? "डेमो किचन आज़माएँ" : "Try the demo kitchen"}
            </button>
            <a href="/r/rasoi-27" className="flex min-h-[72px] items-center bg-[var(--sunken)] px-5 text-[18px] font-medium transition-transform hover:-translate-y-0.5">
              {hi ? "एक रेस्टोरेंट पेज देखें" : "See a restaurant page"}
            </a>
          </div>
        </div>
        <div className="tkt lp-in aspect-square w-full max-w-[640px] overflow-hidden bg-[var(--lp-field)] p-5 sm:p-8 lg:order-1" style={i(1)}>
          <div className="h-full overflow-hidden">
            <OrderRail rail={rail} />
          </div>
        </div>
      </section>

      {/* What Zest does, in one paragraph with picture words */}
      <section data-reveal aria-labelledby="does-h" className="bg-[var(--lp-paper)] px-[var(--lp-m)] py-28">
        <h2 id="does-h" className="lp-in font-sign text-[clamp(32px,3.6vw,56px)] leading-[1.02]" style={i(0)}>
          {hi ? "जो काम Zest सँभालता है" : "The work Zest takes off you"}
        </h2>
        <p className="lp-in mt-10 max-w-[30em] text-[clamp(22px,2.6vw,36px)] font-medium leading-[1.3]" style={i(0)}>
          {hi ? "Zest हर पेआउट मेल पढ़ता है " : "Zest reads every payout mail "}
          <Slot>
            <span className="flex h-full items-center justify-center bg-[var(--lp-field)] text-[0.42em] font-semibold text-[var(--lp-accent)]">₹67,238</span>
          </Slot>
          {hi ? " और ग़लत कटौती पकड़ता है, हर रिव्यू का जवाब तैयार करता है " : " and finds the wrong charges, drafts a reply to every review "}
          <Slot>
            <span className="flex h-full items-center justify-center gap-[0.1em] bg-[var(--turmeric-soft)] text-[0.42em] font-semibold">
              4.2
              <Star aria-hidden className="size-[0.8em] fill-[var(--haldi-deep)] text-[var(--haldi-deep)]" />
            </span>
          </Slot>
          {hi ? ", एक मेन्यू " : ", keeps one menu "}
          <Slot>
            <img src="/photos/menu-dal-makhani.webp" alt={hi ? "दाल मखनी" : "Dal makhani"} className="size-full object-cover" />
          </Slot>
          {hi ? " को हर ऐप पर स्टॉक में रखता है, और स्टाफ़ को पासवर्ड की जगह PIN देता है " : " in stock on every app, and gives your staff a PIN "}
          <Slot>
            <span className="flex h-full items-center justify-center gap-[0.12em] bg-[var(--lp-ink)]">
              {[0, 1, 2, 3].map((k) => (
                <span key={k} className="size-[0.16em] rounded-full bg-[var(--lp-paper)]" />
              ))}
            </span>
          </Slot>
          {hi ? "।" : " instead of your password."}
        </p>
        <div className="mt-[72px] grid lg:grid-cols-12">
          <div className="lg:col-start-7 lg:col-span-6">
            <p className="lp-in max-w-[44ch] text-[18px] leading-relaxed" style={i(1)}>
              {hi
                ? "हर काम एक किचन टिकट की तरह आपके पास आता है। आप हाँ कहें, तभी जाता है, और हर बदलाव का रिकॉर्ड और undo रहता है।"
                : "Every job reaches you as a ticket, like an order at the pass. Nothing goes out until you approve it, and every change is on record with undo."}
            </p>
            <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn lp-in mt-6" style={i(2)}>
              {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
            </button>
          </div>
        </div>
      </section>

      {/* The live thing: a week's payout, explained */}
      <PayoutShowcase />

      {/* Getting set up: one ticket, four fields */}
      <section data-reveal aria-labelledby="setup-h" className="grid lg:grid-cols-4">
        {SETUP.map((s, n) => (
          <div key={s.clause.en} className="relative flex flex-col px-5 py-10 sm:min-h-[64svh] lg:min-h-[84svh] lg:px-6" style={{ background: s.field, color: s.ink }}>
            {n === 0 && (
              <h2 id="setup-h" className="lp-in font-sign text-[clamp(22px,2.6vw,36px)] leading-[1.05]" style={i(0)}>
                {hi ? "लंच से पहले तैयार" : "Ready before lunch"}
              </h2>
            )}
            <div className="lp-in mt-10 flex flex-1 items-start justify-center lg:mt-[22svh]" style={i(n + 1)}>
              <SetupCard step={n} qr={qr} />
            </div>
            <p className="lp-in mt-10 max-w-[16ch] text-[clamp(22px,2.6vw,36px)] font-medium leading-[1.15]" style={i(n + 2)}>
              {pick(s.clause)}
            </p>
          </div>
        ))}
      </section>

      {/* FAQ: questions filed like tickets in a drawer */}
      <section data-reveal aria-labelledby="faq-h" className="px-[var(--lp-m)] py-28">
        <div className="mx-auto max-w-[920px]">
          <h2 id="faq-h" className="lp-in font-sign text-[clamp(32px,3.6vw,56px)] leading-[1.02]" style={i(0)}>
            {hi ? "मालिक क्या पूछते हैं" : "What owners ask"}
          </h2>
          <div className="lp-in mt-12" style={i(1)}>
            {FAQ.map((f, n) => {
              const open = faq === n;
              return (
                <div
                  key={f.q.en}
                  className="lp-card relative"
                  style={{ background: FAQ_FIELDS[n % FAQ_FIELDS.length], marginTop: n ? -12 : 0, zIndex: n, "--tab-x": `min(${n * 150}px, calc(100% - 230px))` } as React.CSSProperties}
                >
                  <p className="flex h-10 items-center px-4 text-[15px] font-medium" style={{ marginLeft: `min(${n * 150}px, calc(100% - 230px))` }}>
                    {pick(f.tab)}
                  </p>
                  <button type="button" aria-expanded={open} onClick={() => setFaq(n)} className="flex w-full items-center justify-between gap-6 px-6 pb-6 pt-4 text-left text-[18px] font-semibold">
                    {pick(f.q)}
                    <span aria-hidden className={`relative block size-5 shrink-0 transition-transform before:absolute before:left-0 before:top-[9px] before:h-[2px] before:w-5 before:bg-current after:absolute after:left-[9px] after:top-0 after:h-5 after:w-[2px] after:bg-current ${open ? "rotate-45" : ""}`} />
                  </button>
                  {open && <p className="max-w-[56ch] px-6 pb-8 text-[15px] leading-relaxed">{pick(f.a)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The first step, already open */}
      <section data-reveal aria-labelledby="start-h" className="grid gap-12 bg-[var(--lp-accent)] px-[var(--lp-m)] py-20 text-[var(--lp-accent-ink)] lg:grid-cols-12 lg:items-end lg:py-28">
        <div className="lg:col-span-6 lg:self-end">
          <h2 id="start-h" className="lp-in font-sign text-[clamp(40px,5vw,80px)] leading-[0.95]" style={i(0)}>
            {hi ? (
              <>
                आपका बैक ऑफ़िस,
                <br />
                तैयार।
              </>
            ) : (
              <>
                Your back
                <br />
                office, open.
              </>
            )}
          </h2>
          <p className="lp-in mt-6 max-w-[40ch] text-[18px] leading-relaxed" style={i(1)}>
            {hi
              ? "अपना लिस्टिंग लिंक डालें। Zest आपका मेन्यू, फ़ोटो और रेटिंग पढ़ लेता है, और सर्विस से पहले आपका रेस्टोरेंट तैयार।"
              : "Paste your listing link. Zest reads your menu, photos and ratings, and your restaurant is set up before service."}
          </p>
        </div>
        <form data-ui onSubmit={startWithLink} className="lp-in w-full bg-[#fff] p-7 sm:p-9 lg:max-w-[440px] lg:p-7 text-[#17201c] lg:col-span-5 lg:col-start-8" style={i(2)}>
          <p className="text-[18px] font-semibold">{hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up your restaurant"}</p>
          <div role="radiogroup" aria-label={hi ? "आप कहाँ लिस्टेड हैं" : "Where you're listed"} className="mt-5 grid grid-cols-2 bg-[#e4e7e3] p-1 text-[15px]">
            {(["zomato", "swiggy"] as const).map((x) => (
              <button key={x} type="button" role="radio" aria-checked={platform === x} onClick={() => setPlatform(x)} className={`min-h-11 font-medium transition-colors ${platform === x ? "bg-[#fff]" : "text-[#3e4a44]"}`}>
                {x === "zomato" ? "Zomato" : "Swiggy"}
              </button>
            ))}
          </div>
          <label className="mt-5 block text-[15px] text-[#3e4a44]">
            {hi ? `आपका ${platform === "zomato" ? "Zomato" : "Swiggy"} लिंक` : `Your ${platform === "zomato" ? "Zomato" : "Swiggy"} link`}
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              inputMode="url"
              placeholder={platform === "zomato" ? "zomato.com/bangalore/your-restaurant" : "swiggy.com/restaurants/your-restaurant"}
              className="mt-1.5 block w-full bg-[#eef0ed] px-4 py-3.5 text-[15px] text-[#17201c] outline-none focus:ring-2 focus:ring-[#17201c]"
            />
          </label>
          <p className="mt-2 text-[15px] text-[#3e4a44]">{hi ? "लिंक नहीं है? ख़ाली छोड़ें, बाद में जोड़ सकते हैं।" : "No link handy? Leave it empty and add it later."}</p>
          <button type="submit" className="lp-btn mt-6 w-full">
            {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
          </button>
        </form>
      </section>

      {/* The mark, built large */}
      <footer className="bg-[var(--lp-field)] px-[var(--lp-m)] pb-[var(--lp-m)] pt-16 text-[var(--lp-field-ink)]">
        <div className="grid gap-10 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold">{hi ? "Zest क्या करता है" : "What Zest does"}</p>
            <ul className="mt-3 space-y-2 opacity-90">
              <li>{hi ? "लाइव ऑर्डर" : "Live orders"}</li>
              <li>{hi ? "पेआउट, समझाए हुए" : "Payouts, explained"}</li>
              <li>{hi ? "रिव्यू के जवाब" : "Review replies"}</li>
              <li>{hi ? "आपका अपना पेज" : "Your own page"}</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">{hi ? "शुरू करें" : "Start"}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={() => setRouterOpen(true)} className="lp-link">
                  {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
                </button>
              </li>
              <li>
                <a href="/login" className="lp-link">
                  {hi ? "लॉग इन" : "Log in"}
                </a>
              </li>
              <li>
                <a href="/login/staff" className="lp-link">
                  {hi ? "स्टाफ़ साइन-इन" : "Staff sign-in"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">{hi ? "देखें" : "See it"}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={openDemo} className="lp-link">
                  {hi ? "डेमो किचन" : "Demo kitchen"}
                </button>
              </li>
              <li>
                <a href="/r/rasoi-27" className="lp-link">
                  {hi ? "रेस्टोरेंट पेज" : "Restaurant page"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">{hi ? "भाषा" : "Language"}</p>
            <div className="mt-3">
              <LpLang />
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 text-[15px]">
          <p>© 2026 Zest</p>
          <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn on-dark min-h-11 px-5 text-[15px]">
            {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
          </button>
        </div>
        <div className="mt-14 flex h-[clamp(110px,23vw,360px)] items-end gap-1">
          {[
            ["Z", 1, "#f2b035", "#17201c"],
            ["E", 0.82, "#eef2ec", "#12261b"],
            ["S", 0.72, "#c62f3b", "#fff"],
            ["T", 0.88, "#2b6a4b", "#eef2ec"],
          ].map(([ch, h, bg, fg]) => (
            <div key={ch as string} className="tkt flex flex-1 items-end justify-center overflow-hidden" style={{ height: `${(h as number) * 100}%`, background: bg as string, color: fg as string }}>
              <span className="font-sign translate-y-[0.12em] text-[clamp(72px,16vw,260px)] leading-none">
                {ch}
              </span>
            </div>
          ))}
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}

/** An inline picture slot in the statement: 1em tall, set just below the baseline. */
function Slot({ children }: { children: React.ReactNode }) {
  return (
    <span data-ui className="mx-[0.12em] inline-block h-[1em] w-[1.9em] translate-y-[0.12em] overflow-hidden rounded-[0.18em] align-baseline">
      {children}
    </span>
  );
}

/** English / Hindi, as two plain words; the current one in full ink and underlined. */
function LpLang() {
  const { lang, setLang } = useApp();
  return (
    <div role="group" aria-label="Language" className="flex gap-4 text-[15px]">
      {(["en", "hi"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={lang === l ? "font-semibold underline decoration-2 underline-offset-4" : "opacity-80 hover:opacity-100"}>
          {l === "en" ? "English" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}
