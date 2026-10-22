"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BellRing, Bike, Check, Hand, Languages, MessageCircle, Mic, PhoneOff, Plus, Printer, Search, Tablet } from "lucide-react";
import { ThemeToggle, Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { DemoPlayer } from "@/components/landing/demo";
import { AgentFlow } from "@/components/landing/flow";
import { PhonePage } from "@/components/landing/mocks";
import { SyncDemo, ZestyDevice, ZestyStage } from "@/components/landing/zesty";

// The pitch: Zest turns the people who already know a restaurant into orders, on its own website,
// WhatsApp and Google, delivered by Zomato riders and announced in the kitchen by Zesty, the order
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

const WORDS = ["regulars", "Instagram", "Google", "WhatsApp", "own website"];

const ZESTY_FEATURES: { icon: typeof Check; title: string; text: string }[] = [
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
  { q: "What if I miss an order?", a: "Zesty won't let you. It announces every order, gets louder if nobody accepts, and then calls your phone." },
  { q: "Who owns my customer data?", a: "You do. Orders on your website, WhatsApp and Google come with your guest's name, number and favourite dishes, and they stay yours." },
  { q: "Which languages does Zesty speak?", a: "Hindi and English today, with more Indian languages on the way. Write to the agents in Hinglish and they'll answer in kind." },
  { q: "Do I need a tech person?", a: "No. If you can use WhatsApp, you can use Zest. Paste your Zomato link and the rest is set up for you." },
];

export default function Landing() {
  const root = useReveal();
  const [routerOpen, setRouterOpen] = useState(false);
  const [link, setLink] = useState("");
  const [word, setWord] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
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

      {/* Hero, on the dark kitchen band */}
      <div className="bg-[var(--lp-band)] text-[#eaf0eb]">
        <header className="lp-wrap flex h-[76px] items-center justify-between gap-6">
          <a href="/" aria-label="Zest home">
            <Wordmark className="text-[30px]" />
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[16px] font-medium lg:flex">
            {[
              ["#how", "How it works"],
              ["#zesty", "Zesty"],
              ["#agents", "Agents"],
              ["#faq", "Questions"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-[#cdd8d0] hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-[16px] font-medium sm:gap-4">
            <ThemeToggle />
            <a href="/login" className="hidden px-2 text-[#cdd8d0] hover:text-white sm:inline">
              Log in
            </a>
            <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn haldi min-h-11 px-5 text-[15px]">
              Get started
            </button>
          </div>
        </header>

        <section data-reveal aria-labelledby="hero-h" className="lp-wrap grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-20 pt-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,12fr)] lg:gap-14 lg:pb-28 lg:pt-14">
          <div>
            <h1 id="hero-h" className="lp-in lp-display text-[36px] leading-[1.04] sm:text-[54px] lg:text-[clamp(46px,4.2vw,62px)]" style={i(0)}>
              Every order, not just the app orders.
            </h1>
            <p className="lp-in lp-display mt-4 text-[24px] leading-tight text-[#cdd8d0] sm:text-[32px]" style={i(1)}>
              Orders from your{" "}
              <span className="relative inline-block min-w-[6.5em] text-[var(--lp-accent)]">
                <span key={word} className="lp-word" aria-hidden>
                  {WORDS[word]}.
                </span>
                <span className="sr-only">regulars, Instagram, Google, WhatsApp and your own website.</span>
              </span>
            </p>
            <p className="lp-in mt-6 max-w-[33em] text-[18px] leading-relaxed text-[#b9c7bd]" style={i(2)}>
              Zest turns the people who already know your restaurant into orders: your own website, WhatsApp and Google ordering, delivered by Zomato riders and announced in your kitchen by Zesty. AI agents run the rest, around the clock.
            </p>
            <div className="lp-in mt-9" style={i(3)}>
              {linkForm("hero-link")}
              <p className="mt-4 px-2 text-[15px] text-[#a9b8ae]">
                Your ordering website is ready in minutes.{" "}
                <button type="button" onClick={openDemo} className="lp-link font-medium text-white">
                  Or try a sample restaurant
                </button>
              </p>
            </div>
          </div>
          <div className="lp-in" style={i(2)}>
            <ZestyStage />
          </div>
        </section>
      </div>

      {/* The problem */}
      <section data-reveal aria-labelledby="problem-h" className="py-24 lg:py-32">
        <div className="lp-wrap">
          <h2 id="problem-h" className={`lp-in max-w-[22ch] ${H2}`} style={i(0)}>
            Your best customers can't order from you.
          </h2>
          <ul className="mt-12 grid gap-x-16 gap-y-8 md:grid-cols-2">
            {(
              [
                [PhoneOff, "A regular calls at 9 pm. The line is busy."],
                [MessageCircle, "Someone DMs on Instagram asking for the menu. Nobody replies until morning."],
                [Search, "Google shows your restaurant with no way to order."],
                [Tablet, "Three tablets beep in the kitchen. One order gets missed."],
              ] as const
            ).map(([Icon, text], k) => (
              <li key={text} className="lp-in flex gap-4 text-[22px] leading-snug" style={i(k + 1)}>
                <Icon aria-hidden size={22} className="mt-1 shrink-0 text-[var(--lp-muted)]" />
                {text}
              </li>
            ))}
          </ul>
          <p className="lp-in lp-display mt-14 text-[clamp(24px,2.4vw,32px)] leading-tight [text-wrap:balance]" style={i(5)}>
            The demand is already there. <span className="text-[var(--lp-muted)]">It just has nowhere to go.</span>
          </p>
        </div>
      </section>

      {/* How it works: one order, start to finish */}
      <section id="how" data-reveal aria-labelledby="how-h" className="scroll-mt-6 bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <h2 id="how-h" className={`lp-in ${H2}`} style={i(0)}>
              Found. Ordered. Delivered. Done right.
            </h2>
            <p className={`lp-in ${LEAD}`} style={i(1)}>
              Guests find you on Google, Instagram and in AI answers, then order on your website, WhatsApp or the phone. Here is one of those orders at the sample restaurant, from first message to review.
            </p>
          </div>
          <div className="lp-in mt-12" style={i(2)}>
            <DemoPlayer />
          </div>
        </div>
      </section>

      {/* Zesty */}
      <section id="zesty" data-reveal aria-labelledby="zesty-h" className="scroll-mt-6 bg-[var(--lp-band)] py-24 text-[#eaf0eb] lg:py-32">
        <div className="lp-wrap">
          <div className="mx-auto max-w-[46rem] text-center">
            <h2 id="zesty-h" className={`lp-in ${H2}`} style={i(0)}>
              Meet Zesty. It hears every order so you don't have to.
            </h2>
            <p className="lp-in mt-5 text-[18px] leading-relaxed text-[#b9c7bd]" style={i(1)}>
              A small box on your counter that speaks every new order out loud, in your language, from every channel. Press the big button to accept and it prints the kitchen ticket. When the food is ready, press again and the rider is on the way.
            </p>
          </div>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-14">
            <ul className="grid gap-8 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:text-right">
              {ZESTY_FEATURES.slice(0, 3).map((f, k) => (
                <Feature key={f.title} f={f} i={k + 2} right />
              ))}
            </ul>
            <div className="lp-in order-first flex justify-center pt-[140px] lg:order-2" style={i(2)}>
              <ZestyLoop />
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:order-3 lg:grid-cols-1">
              {ZESTY_FEATURES.slice(3).map((f, k) => (
                <Feature key={f.title} f={f} i={k + 3} />
              ))}
            </ul>
          </div>
          <div className="lp-in mt-16 flex flex-col items-center gap-6 text-center" style={i(4)}>
            <p className="lp-display max-w-[24ch] text-[clamp(24px,2.6vw,36px)] leading-tight [text-wrap:balance]">
              You've trusted a soundbox with your payments. <span className="text-[var(--lp-accent)]">Trust Zesty with your orders.</span>
            </p>
            <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn haldi">
              Join the Zesty pilot <ArrowRight aria-hidden size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" data-reveal aria-labelledby="agents-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <h2 id="agents-h" className={`lp-in ${H2}`} style={i(0)}>
              A team that never sleeps. You make the calls.
            </h2>
            <p className={`lp-in ${LEAD}`} style={i(1)}>
              Six agents, Storefront, Discovery, Menu, Offers, Dispatch and Reviews, pass each job between them until it's done. They learn from every edit you make: the more you approve, the less you need to.
            </p>
          </div>
          <div className="lp-in mt-12" style={i(2)}>
            <AgentFlow />
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
              Tell Zesty a dish is finished and it goes off your website, your WhatsApp menu, Google and every app you sell on, in seconds.
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
                ["Zesty arrives at your kitchen.", "Plug it in, and every order speaks up."],
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

function Feature({ f, i, right = false }: { f: (typeof ZESTY_FEATURES)[number]; i: number; right?: boolean }) {
  return (
    <li className="lp-in" style={{ "--i": i } as React.CSSProperties}>
      <p className={`flex items-center gap-2 text-[18px] font-semibold ${right ? "lg:justify-end" : ""}`}>
        <f.icon aria-hidden size={19} className="text-[var(--lp-accent)]" /> {f.title}
      </p>
      <p className="mt-1 text-[16px] leading-relaxed text-[#a9b8ae]">{f.text}</p>
    </li>
  );
}

/** Zesty on its own in the product section: an order arrives, is accepted, the next one arrives. */
function ZestyLoop() {
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
  return <ZestyDevice order={orders[n % orders.length]} n={n} accepted={k % 2 === 1} onAccept={() => setK((v) => (v % 2 ? v : v + 1))} />;
}
