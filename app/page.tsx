"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";
import { ArrowRight, BellRing, Bike, Check, Hand, Languages, MessageCircle, Mic, PhoneOff, Plus, Printer, Search, Tablet } from "lucide-react";
import { LangToggle, ThemeToggle, Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { OneDay } from "@/components/landing/day";
import { HeroSequence } from "@/components/landing/hero-sequence";
import { SiteHeader } from "@/components/landing/site-header";
import { AgentFlow } from "@/components/landing/flow";
import { PhonePage } from "@/components/landing/mocks";
import { SyncDemo, SoundboxDevice, SoundboxStage } from "@/components/landing/soundbox-stage";

// The pitch: Zest turns the people who already know a restaurant into orders, on its own website,
// WhatsApp and Google, delivered by Zomato riders and announced in the kitchen by Zest Soundbox, the order
// soundbox. Six agents run the rest and bring the owner in for decisions.

/** Sections bring their parts in the first time they come near the screen. */
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
      { rootMargin: "0px 0px 15% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
}

/** A Zomato or Swiggy link goes to sign-up with the listing filled in; anything else starts blank. */
function joinUrl(raw: string) {
  const link = raw.trim();
  const platform = /swiggy/i.test(link) ? "swiggy" : "zomato";
  const q = new URLSearchParams({ journey: "live", live: platform, ...(/zomato|swiggy/i.test(link) ? { [platform]: link } : {}) });
  return `/join?${q}`;
}

const AGENT_LIST: { name: Bi; does: Bi }[] = [
  { name: { en: "Storefront", hi: "स्टोरफ़्रंट" }, does: { en: "Your website from a menu photo, set up for Google search, WhatsApp ordering, UPI payments, your Google listing, the counter QR", hi: "मेन्यू की फ़ोटो से आपकी वेबसाइट, Google सर्च के लिए तैयार, WhatsApp ऑर्डर, UPI पेमेंट, आपकी Google लिस्टिंग, काउंटर QR" } },
  { name: { en: "Orders and delivery", hi: "ऑर्डर और डिलीवरी" }, does: { en: "Accepts, prints the KOT, picks pickup, your own helper or a Zomato rider, tracks to the door", hi: "ऑर्डर मंज़ूर करता है, KOT छापता है, पिकअप, आपका अपना हेल्पर या Zomato राइडर चुनता है, दरवाज़े तक ट्रैक करता है" } },
  { name: { en: "Regulars", hi: "पुराने ग्राहक" }, does: { en: "Remembers every guest and their usual, welcome offers for new guests, reminders that bring regulars back", hi: "हर ग्राहक और उनकी पसंद याद रखता है, नए ग्राहकों के लिए स्वागत ऑफ़र, पुराने ग्राहकों को वापस लाने वाले रिमाइंडर" } },
  { name: { en: "Reviews", hi: "रिव्यू" }, does: { en: "Asks every guest how it was, answers complaints in your voice, spots repeat problems", hi: "हर ग्राहक से पूछता है कैसा लगा, आपकी भाषा में शिकायतों का जवाब देता है, बार-बार की परेशानी पकड़ता है" } },
  { name: { en: "Growth", hi: "ग्रोथ" }, does: { en: "Shows up in AI answers, Instagram posts and ads on Instagram and Facebook within your budget, spots what people nearby search for, suggests new combos, lunch boxes and festive hampers", hi: "AI जवाबों में दिखता है, Instagram पोस्ट और आपके बजट में Instagram व Facebook विज्ञापन, आस-पास लोग क्या खोजते हैं यह देखता है, नए कॉम्बो, लंच बॉक्स और त्योहार के डिब्बे सुझाता है" } },
];

const SOUNDBOX_FEATURES: { icon: typeof Check; title: string; text: string }[] = [
  { icon: Languages, title: "Speaks every order", text: "Out loud, in Hindi or English, from every channel." },
  { icon: Hand, title: "One big button to accept", text: "Accept with oily hands. No phone, no passcode." },
  { icon: Printer, title: "Prints the ticket", text: "A kitchen printer built in." },
  { icon: Bike, title: "A button for food ready", text: "It calls the Zomato rider. No waiting, no phone calls." },
  { icon: Mic, title: "Push to talk", text: "Say “dal makhani khatam” and it's off every menu. Say it's back, and it's back." },
  { icon: BellRing, title: "Never misses an order", text: "If nobody accepts, it gets louder, then calls the owner." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Do I need to leave Zomato or Swiggy?", a: "No. Zest works alongside them. Your listings keep running as they do, and Zest keeps their menus in sync with everything else." },
  { q: "Who delivers my orders?", a: "Zomato riders, with live tracking for your guest. Zest books the rider when you press “Food ready”." },
  { q: "What if I miss an order?", a: "The Soundbox won't let you. It announces every order, gets louder if nobody accepts, and then calls your phone." },
  { q: "Who owns my customer data?", a: "You do. Orders on your website, WhatsApp and Google come with your guest's name, number and favourite dishes, and they stay yours." },
  { q: "Which languages does the Soundbox speak?", a: "Hindi and English today, with more Indian languages on the way. Write to the agents in Hinglish and they'll answer in kind." },
  { q: "Do I need a tech person?", a: "No. If you can use WhatsApp, you can use Zest. Paste your Zomato link and the rest is set up for you." },
];

export default function Landing() {
  const { pick } = useApp();
  const root = useReveal();
  const [routerOpen, setRouterOpen] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
  }, []);

  async function openDemo() {
    await fetch("/api/outlet/demo", { method: "POST" });
    window.location.href = "/app";
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = joinUrl(link);
  }

  const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
  const H2 = "lp-display text-[clamp(32px,3.8vw,54px)] leading-[1.04] [text-wrap:balance]";
  const LEAD = "text-[18px] leading-relaxed text-[var(--lp-muted)]";

  const linkForm = (id: string) => (
    <form onSubmit={start} className="flex w-full max-w-[560px] flex-col gap-2 rounded-[28px] border border-[#2a3a31] bg-[#151b17] p-2 sm:flex-row sm:rounded-full">
      <label htmlFor={id} className="sr-only">
        Your Zomato link
      </label>
      <input
        id={id}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        inputMode="url"
        placeholder="Paste your Zomato link"
        className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[18px] text-[#eaf0eb] outline-none placeholder:text-[#8b988f]"
      />
      <button type="submit" className="lp-btn haldi shrink-0">
        Get started free <ArrowRight aria-hidden size={18} />
      </button>
    </form>
  );

  return (
    <div ref={root} className="lp min-h-dvh overflow-x-clip">
      <noscript>
        <style>{`.lp-in,.lp-bar{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <SiteHeader start={{ href: "/join?journey=new", label: { en: "Start free", hi: "मुफ़्त शुरू करें" } }} />

      {/* Hero */}
      <section aria-labelledby="hero-h" className="lp-wrap grid grid-cols-[minmax(0,1fr)] items-start gap-12 pb-20 pt-6 lg:pb-28 lg:pt-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-12">
        <div className="xl:pt-6">
          <h1 id="hero-h" className="lp-display text-[40px] leading-[1.02] sm:text-[60px] xl:text-[clamp(56px,5vw,76px)]">
            {pick({ en: "Your kitchen, online in a minute. Zest does the rest.", hi: "आपकी रसोई, एक मिनट में ऑनलाइन। बाक़ी सब Zest करेगा।" })}
          </h1>
          <p className="mt-6 max-w-[36em] text-[18px] leading-relaxed text-[var(--lp-muted)]">
            {pick({
              en: "Send a photo of your menu and your own ordering page is live, with WhatsApp orders, UPI payments and delivery by Zomato riders. Zest's AI agents take orders, bring back your regulars and find new customers. The Zest Soundbox tells you every order out loud.",
              hi: "अपने मेन्यू की फ़ोटो भेजिए और आपका अपना ऑर्डर पेज तैयार, WhatsApp ऑर्डर, UPI पेमेंट और Zomato राइडर से डिलीवरी के साथ। Zest के AI एजेंट ऑर्डर लेते हैं, पुराने ग्राहकों को वापस लाते हैं और नए ग्राहक ढूँढते हैं। Zest Soundbox हर ऑर्डर बोलकर बताता है।",
            })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/join?journey=new&from=menu-photo" className="lp-btn haldi">
              {pick({ en: "Upload menu photo", hi: "मेन्यू की फ़ोटो भेजें" })}
            </a>
            <a href="#waitlist" className="lp-ghost">
              {pick({ en: "Start on WhatsApp", hi: "WhatsApp पर शुरू करें" })}
            </a>
          </div>
          <p className="mt-4 text-[16px] font-medium">{pick({ en: "Free to start. No app to learn.", hi: "शुरुआत मुफ़्त। कोई ऐप सीखने की ज़रूरत नहीं।" })}</p>
          <p className="mt-6 text-[16px] text-[var(--lp-muted)]">
            {pick({ en: "Already on Zomato or Swiggy?", hi: "पहले से Zomato या Swiggy पर हैं?" })}{" "}
            <a href="/restaurants" className="lp-link font-medium text-[var(--lp-ink)]">
              {pick({ en: "See Zest for restaurants", hi: "रेस्टोरेंट के लिए Zest देखें" })}
            </a>
          </p>
        </div>
        <HeroSequence />
      </section>

      {/* One day at Meena's Kitchen */}
      <section id="day" aria-labelledby="day-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="day-h" className={H2}>
            {pick({ en: "One day at Meena's Kitchen.", hi: "मीना की रसोई में एक दिन।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>{pick({ en: "Meena cooks. Zest's agents do everything else.", hi: "मीना खाना बनाती हैं। बाक़ी सब Zest के एजेंट करते हैं।" })}</p>
          <div className="mt-12">
            <OneDay />
          </div>
          <p className="mt-10 text-[18px] font-semibold">{pick({ en: "Anything that costs money or goes public waits for your OK.", hi: "जिसमें पैसा लगे या जो सबको दिखे, वह आपकी हाँ के बिना नहीं होता।" })}</p>
        </div>
      </section>

      {/* The agents */}
      <section id="agents" aria-labelledby="agents-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
            <h2 id="agents-h" className={H2}>
              {pick({ en: "Your online team. It never sleeps. You make the calls.", hi: "आपकी ऑनलाइन टीम। कभी नहीं सोती। फ़ैसला आपका।" })}
            </h2>
            <p className={LEAD}>
              {pick({
                en: "Five agents pass each job between them until it's done. They learn from every edit you make: the more you approve, the less you need to.",
                hi: "पाँच एजेंट हर काम आपस में आगे बढ़ाते हैं, जब तक वह पूरा न हो जाए। आप जो भी बदलाव करते हैं, उससे वे सीखते हैं: जितना आप मंज़ूर करेंगे, उतना कम पूछना पड़ेगा।",
              })}
            </p>
          </div>
          <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {AGENT_LIST.map((x) => (
              <div key={x.name.en}>
                <dt className="text-[17px] font-semibold">{pick(x.name)}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-[var(--lp-muted)]">{pick(x.does)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12">
            <AgentFlow />
          </div>
        </div>
      </section>

      {/* Zest Soundbox */}
      <section id="soundbox" data-reveal aria-labelledby="soundbox-h" className="scroll-mt-6 bg-[var(--lp-band)] py-24 text-[#eaf0eb] lg:py-32">
        <div className="lp-wrap">
          <div className="mx-auto max-w-[46rem] text-center">
            <h2 id="soundbox-h" className={`lp-in ${H2}`} style={i(0)}>
              Meet the Zest Soundbox.
            </h2>
            <p className="lp-in mt-5 text-[18px] leading-relaxed text-[#b9c7bd]" style={i(1)}>
              A small box on your counter that speaks every new order out loud, in your language, from every channel. Press the big button to accept and it prints the kitchen ticket. When the food is ready, press again and the rider is on the way.
            </p>
          </div>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-14">
            <ul className="grid gap-8 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:text-right">
              {SOUNDBOX_FEATURES.slice(0, 3).map((f, k) => (
                <Feature key={f.title} f={f} i={k + 2} right />
              ))}
            </ul>
            <div className="lp-in order-first flex justify-center pt-[140px] lg:order-2" style={i(2)}>
              <SoundboxLoop />
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:order-3 lg:grid-cols-1">
              {SOUNDBOX_FEATURES.slice(3).map((f, k) => (
                <Feature key={f.title} f={f} i={k + 3} />
              ))}
            </ul>
          </div>
          <div className="lp-in mt-16 flex flex-col items-center gap-6 text-center" style={i(4)}>
            <p className="lp-display max-w-[24ch] text-[clamp(24px,2.6vw,36px)] leading-tight [text-wrap:balance]">
              You've trusted a soundbox with your payments. <span className="text-[var(--lp-accent)]">Now trust one with your orders.</span>
            </p>
            <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn haldi">
              Join the Soundbox waitlist <ArrowRight aria-hidden size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* One menu */}
      <section data-reveal aria-labelledby="sync-h" className="bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="max-w-[44rem]">
            <h2 id="sync-h" className={`lp-in ${H2}`} style={i(0)}>
              Change it once. It's right everywhere.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Tell Zest a dish is finished and it goes off your website, your WhatsApp menu, Google and every app you sell on, in seconds.
            </p>
          </div>
          <div className="lp-in mt-14" style={i(2)}>
            <SyncDemo />
          </div>
        </div>
      </section>

      {/* Start */}
      <section data-reveal aria-labelledby="start-h" className="bg-[var(--lp-band)] py-24 text-[#eaf0eb] lg:py-32">
        <div className="lp-wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="start-h" className={`lp-in ${H2}`} style={i(0)}>
              Live before lunch.
            </h2>
            <ol className="mt-10 space-y-6">
              {[
                ["Paste your Zomato link.", "Zest reads your menu, photos, prices and ratings."],
                ["Your website and menu are ready in minutes.", "Share it on Instagram, WhatsApp and Google."],
                ["The Zest Soundbox arrives at your kitchen.", "Plug it in, and every order speaks up."],
              ].map(([t, d], k) => (
                <li key={t} className="lp-in flex gap-4" style={i(k + 1)}>
                  <span aria-hidden className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--lp-accent)] text-[#121a16]">
                    <Check size={18} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-[22px] font-semibold leading-snug">{t}</p>
                    <p className="mt-1 text-[18px] text-[#a9b8ae]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="lp-in mt-10" style={i(4)}>
              {linkForm("start-link")}
            </div>
          </div>
          <div className="lp-in flex justify-center" style={i(2)}>
            <PhonePage />
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="faq" data-reveal aria-labelledby="faq-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap grid gap-10 lg:grid-cols-12">
          <h2 id="faq-h" className={`lp-in lg:col-span-4 ${H2}`} style={i(0)}>
            Questions owners ask
          </h2>
          <div className="lp-in grid gap-3 lg:col-span-7 lg:col-start-6" style={i(1)}>
            {FAQ.map((f, n) => (
              <details key={f.q} open={n === 0} className="group rounded-2xl bg-[var(--lp-paper)] px-6">
                <summary className="flex min-h-[68px] items-center justify-between gap-6 py-4 text-[18px] font-semibold">
                  {f.q}
                  <Plus aria-hidden size={22} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[56ch] pb-6 text-[18px] leading-relaxed text-[var(--lp-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--lp-paper)] py-16">
        <div className="lp-wrap grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <div>
            <Wordmark className="text-[36px]" />
            <p className="mt-4 max-w-[26em] text-[16px] leading-relaxed text-[var(--lp-muted)]">Every order, not just the app orders.</p>
            <p className="mt-8 text-[14px] text-[var(--lp-muted)]">© 2026 Zest</p>
          </div>
          <div className="flex flex-col items-start gap-3 text-[16px]">
            <p className="font-semibold">Start</p>
            <button type="button" onClick={() => setRouterOpen(true)} className="text-[var(--lp-muted)] hover:underline hover:underline-offset-4">
              Set up my restaurant
            </button>
            <a href="/login" className="text-[var(--lp-muted)] hover:underline hover:underline-offset-4">
              Log in
            </a>
            <a href="/login/staff" className="text-[var(--lp-muted)] hover:underline hover:underline-offset-4">
              Staff sign-in
            </a>
          </div>
          <div className="flex flex-col items-start gap-3 text-[16px]">
            <p className="font-semibold">See it</p>
            <button type="button" onClick={openDemo} className="text-[var(--lp-muted)] hover:underline hover:underline-offset-4">
              Sample restaurant
            </button>
            <a href="/r/rasoi-27" className="text-[var(--lp-muted)] hover:underline hover:underline-offset-4">
              A restaurant's own website
            </a>
          </div>
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}

function Feature({ f, i, right = false }: { f: (typeof SOUNDBOX_FEATURES)[number]; i: number; right?: boolean }) {
  return (
    <li className="lp-in" style={{ "--i": i } as React.CSSProperties}>
      <p className={`flex items-center gap-2 text-[18px] font-semibold ${right ? "lg:justify-end" : ""}`}>
        <f.icon aria-hidden size={19} className="text-[var(--lp-accent)]" /> {f.title}
      </p>
      <p className="mt-1 text-[16px] leading-relaxed text-[#a9b8ae]">{f.text}</p>
    </li>
  );
}

/** Zest Soundbox on its own in the product section: an order arrives, is accepted, the next one arrives. */
function SoundboxLoop() {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setK((v) => v + 1), 2800);
    return () => clearInterval(t);
  }, []);
  const orders = [
    { ch: "whatsapp" as const, guest: "Rahul M.", items: "Chicken biryani, raita", total: 409, say: "", sayHi: "" },
    { ch: "web" as const, guest: "Ananya R.", items: "2 butter naan, 1 dal makhani", total: 367, say: "", sayHi: "" },
    { ch: "google" as const, guest: "Priya S.", items: "Paneer tikka, 2 garlic naan", total: 427, say: "", sayHi: "" },
  ];
  const n = Math.floor(k / 2);
  return <SoundboxDevice order={orders[n % orders.length]} n={n} accepted={k % 2 === 1} onAccept={() => setK((v) => (v % 2 ? v : v + 1))} />;
}
