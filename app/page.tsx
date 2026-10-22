"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BellRing, Bike, Check, Hand, Languages, MessageCircle, PhoneOff, Plus, Printer, Search, Star, Tablet, Utensils } from "lucide-react";
import { ThemeToggle, Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { GuestCard, MenuSync, PhonePage, ReviewCard, SearchResult } from "@/components/landing/mocks";
import { CHANNEL, DeliveryCard, GrowthPanel, OfferCard, SyncDemo, ZestyDevice, ZestyStage, type ChannelId } from "@/components/landing/zesty";

// The pitch: Zest turns the people who already know a restaurant into orders, on its own website,
// WhatsApp and Google, delivered by Zomato riders and announced in the kitchen by Zesty, the order
// soundbox. AI agents run the rest. Marketplaces keep bringing new customers; Zest serves the ones
// who already know you, and keeps every menu in sync.

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

const AGENTS: { id: string; name: string; does: string; asks: string; panel: React.ReactNode }[] = [
  {
    id: "presence",
    name: "Presence",
    does: "Builds and runs your website, your WhatsApp ordering and your Google profile, from your Zomato listing.",
    asks: "before anything goes live",
    panel: (
      <div className="grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <SearchResult />
        <PhonePage className="mx-auto" />
      </div>
    ),
  },
  { id: "growth", name: "Growth", does: "Sets you up for search and AI answers, keeps Instagram pointing at your menu, and runs Meta ads inside your budget.", asks: "before spending a rupee", panel: <GrowthPanel /> },
  { id: "menu", name: "Menu", does: "One menu, one set of prices and one stock list, correct everywhere you sell.", asks: "before a price changes", panel: <MenuSync /> },
  { id: "offers", name: "Offers", does: "Welcome offers for new guests and rewards for regulars, from one set of rules.", asks: "before an offer starts", panel: <OfferCard /> },
  { id: "delivery", name: "Delivery", does: "Books a Zomato rider when food is ready, tracks every order and flags delays.", asks: "when an order is running late", panel: <DeliveryCard /> },
  { id: "reviews", name: "Reviews", does: "Answers every review and complaint in your voice, wherever it's posted, and spots the issues that keep coming back.", asks: "before a reply is posted", panel: <ReviewCard /> },
];

const ZESTY_FEATURES: { icon: typeof Check; title: string; text: string }[] = [
  { icon: Languages, title: "Speaks every order", text: "Out loud, in Hindi or English, from every channel." },
  { icon: Hand, title: "One big button", text: "Accept with oily hands. No phone, no passcode." },
  { icon: Printer, title: "Prints the ticket", text: "A kitchen printer built in." },
  { icon: Bike, title: "“Food ready” calls the rider", text: "No waiting, no phone calls." },
  { icon: Utensils, title: "“Dal makhani khatam”", text: "Say it or press it, and the dish goes off every menu." },
  { icon: BellRing, title: "Never misses an order", text: "If nobody accepts, it gets louder, then calls the owner." },
];

const BOARD: { ch: ChannelId; who: string; items: string; total: number; state: string }[] = [
  { ch: "web", who: "Ananya R.", items: "2 butter naan, dal makhani", total: 367, state: "Cooking" },
  { ch: "zomato", who: "#7841", items: "Paneer tikka, 2 butter naan", total: 486, state: "Rider 4 min away" },
  { ch: "whatsapp", who: "Rahul M.", items: "Chicken biryani, raita", total: 409, state: "Accepted" },
  { ch: "swiggy", who: "#3390", items: "Dal makhani, jeera rice", total: 342, state: "Ready" },
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
  const [agent, setAgent] = useState(AGENTS[0].id);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  // The agent tabs walk through on their own until someone picks one.
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setAgent((a) => AGENTS[(AGENTS.findIndex((x) => x.id === a) + 1) % AGENTS.length].id), 7000);
    return () => clearTimeout(t);
  }, [agent, auto]);

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
  const current = AGENTS.find((a) => a.id === agent)!;

  const linkForm = (id: string) => (
    <form onSubmit={start} className="flex w-full max-w-[560px] flex-col gap-2 rounded-[28px] bg-[#151b17] p-2 sm:flex-row sm:rounded-full">
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
        <div className="lp-wrap grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <div>
            <h2 id="problem-h" className={`lp-in ${H2}`} style={i(0)}>
              Your best customers can't order from you.
            </h2>
            <ul className="mt-10 space-y-6">
              {(
                [
                  [PhoneOff, "A regular calls at 9 pm. The line is busy."],
                  [MessageCircle, "Someone DMs on Instagram asking for the menu. Nobody replies until morning."],
                  [Search, "Google shows your restaurant with no way to order."],
                  [Tablet, "Three tablets beep in the kitchen. One order gets missed."],
                ] as const
              ).map(([Icon, text], k) => (
                <li key={text} className="lp-in flex gap-4 text-[18px] leading-snug sm:text-[22px]" style={i(k + 1)}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--lp-paper)]">
                    <Icon aria-hidden size={20} />
                  </span>
                  <span className="pt-2">{text}</span>
                </li>
              ))}
            </ul>
            <p className="lp-in lp-display mt-12 text-[clamp(24px,2.4vw,32px)] leading-tight [text-wrap:balance]" style={i(5)}>
              The demand is already there. <span className="text-[var(--lp-muted)]">It just has nowhere to go.</span>
            </p>
          </div>
          <figure className="lp-in mx-auto w-full max-w-[380px]" style={i(2)}>
            <video
              className="aspect-[9/16] w-full rounded-[28px] bg-[#0b0f0d] object-cover"
              src="https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2b/Making_tandoori_bread_in_Old_Delhi.ogv/Making_tandoori_bread_in_Old_Delhi.ogv.1080p.vp9.webm"
              poster="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Making_tandoori_bread_in_Old_Delhi.ogv/960px--Making_tandoori_bread_in_Old_Delhi.ogv.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A tandoor cook in Old Delhi slapping rotis onto the oven wall during service"
            />
            <figcaption className="mt-3 px-2 text-[14px] text-[var(--lp-muted)]">9 pm in a busy kitchen. Nobody has a free hand for a phone.</figcaption>
          </figure>
        </div>
      </section>

      {/* How it works */}
      <section id="how" data-reveal aria-labelledby="how-h" className="scroll-mt-6 bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap">
          <h2 id="how-h" className={`lp-in max-w-[20ch] ${H2}`} style={i(0)}>
            Found. Ordered. Delivered. Done right.
          </h2>
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Step i={1} title="Get found" text="On Google, in AI answers like ChatGPT, on Instagram and through Meta ads.">
              <p className="text-[var(--lp-muted)]">best dal makhani near me</p>
              <p className="mt-2 text-[16px] text-[var(--lp-google)]">Rasoi 27, Indiranagar</p>
              <p className="mt-0.5 text-[var(--lp-muted)]">4.2 · Open now · ₹600 for two</p>
              <span className="mt-3 inline-flex min-h-9 items-center rounded-full bg-[var(--lp-google)] px-4 font-semibold text-white">Order online</span>
            </Step>
            <Step i={2} title="Get ordered" text="Your own website, WhatsApp and phone, with offers for new and returning guests." chat>
              <p className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2">1 dal makhani, 2 garlic naan please</p>
              <p className="mt-2 w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-white px-3 py-2">Done, ₹367 with your ₹75 welcome offer. Ready in 25 min.</p>
            </Step>
            <Step i={3} title="Get delivered" text="Zomato riders pick up and deliver, with live tracking for your guest.">
              <p className="flex items-center gap-2 font-semibold">
                <Bike aria-hidden size={16} /> Rider arriving in 4 min
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--lp-ground)]">
                <span className="lp-bar block h-full w-[70%] rounded-full bg-[var(--lp-zomato)]" />
              </div>
              <p className="mt-2 text-[var(--lp-muted)]">Ananya is tracking it live</p>
            </Step>
            <Step i={4} title="Get it right" text="Zesty announces every order in your kitchen, and reviews and complaints are handled for you.">
              <p className="flex items-center gap-1 font-semibold">
                5 <Star aria-hidden size={13} fill="currentColor" strokeWidth={0} className="text-[var(--lp-accent)]" /> “Hot, quick, and they remembered no onions.”
              </p>
              <p className="mt-2 text-[var(--lp-muted)]">Reply posted: “Thank you, Ananya! See you Friday.”</p>
            </Step>
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
          <div className="max-w-[44rem]">
            <h2 id="agents-h" className={`lp-in ${H2}`} style={i(0)}>
              A team that never sleeps. You make the calls.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Six AI agents, each running one part of your restaurant online, every hour of every day.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div role="tablist" aria-label="Agents" className="lp-in grid content-start gap-1.5" style={i(2)}>
              {AGENTS.map((a) => {
                const on = a.id === agent;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="agent-panel"
                    onClick={() => {
                      setAgent(a.id);
                      setAuto(false);
                    }}
                    className={`lp-tab relative overflow-hidden rounded-2xl px-5 py-4 text-left transition-colors ${on ? "bg-[var(--lp-paper)]" : "hover:bg-[var(--lp-sunken)]"}`}
                  >
                    <span className="flex items-center justify-between gap-3 text-[18px] font-semibold">
                      {a.name} agent
                      {on && <span className="lp-pulse size-2 rounded-full bg-[var(--lp-good)]" aria-hidden />}
                    </span>
                    {on && (
                      <>
                        <span className="mt-2 block text-[16px] leading-relaxed text-[var(--lp-muted)]">{a.does}</span>
                        <span className="mt-2 flex items-center gap-1.5 text-[14px] font-medium">
                          <Check aria-hidden size={15} className="text-[var(--lp-good)]" /> Asks you {a.asks}
                        </span>
                        {auto && <span key={a.id} aria-hidden className="lp-tick absolute inset-x-0 bottom-0 h-[3px] bg-[var(--lp-accent)]" />}
                      </>
                    )}
                  </button>
                );
              })}
              <p className="mt-4 px-5 text-[16px] font-medium">They learn from every edit you make. The more you approve, the less you need to.</p>
            </div>
            <div id="agent-panel" role="tabpanel" aria-label={`${current.name} agent`} className="lp-in lg:min-h-[520px]" style={i(3)}>
              <div key={agent} className="lp-swap">
                {current.panel}
              </div>
            </div>
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
              Tap “khatam” on Zesty and the dish goes off your website, your WhatsApp menu, Google and every app you sell on, in seconds.
            </p>
          </div>
          <div className="lp-in mt-14" style={i(2)}>
            <SyncDemo />
          </div>
        </div>
      </section>

      {/* Your customers */}
      <section data-reveal aria-labelledby="yours-h" className="py-24 lg:py-32">
        <div className="lp-wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="yours-h" className={`lp-in ${H2}`} style={i(0)}>
              Your guests. Your data. Your relationship.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Orders on your website belong to you: names, numbers, favourite dishes. Zomato delivers the food; it doesn't get your customer list.
            </p>
            <img src="/photos/team-guests.webp" alt="Regulars sharing a long table at dinner" width={1600} height={1200} loading="lazy" className="lp-in mt-10 aspect-[16/10] w-full rounded-[24px] object-cover" style={i(2)} />
          </div>
          <div className="lp-in" style={i(2)}>
            <GuestCard />
          </div>
        </div>
      </section>

      {/* Marketplaces */}
      <section data-reveal aria-labelledby="apps-h" className="bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap">
          <h2 id="apps-h" className={`lp-in max-w-[28ch] ${H2}`} style={i(0)}>
            New guests on the apps. Regulars on Zest.
          </h2>
          <div className="mt-12 grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            <p className={`lp-in lg:order-2 ${LEAD}`} style={i(1)}>
              Keep selling on Zomato and Swiggy: they bring you people who don't know you yet. Zest brings all your orders onto one board, keeps your menu in sync, and answers every review, wherever it's posted.
            </p>
            <div data-ui className="lp-in lp-ui p-4 lg:order-1" style={i(2)}>
              <p className="flex items-center justify-between px-1 text-[14px] font-semibold">
                Every order, one board
                <span className="flex items-center gap-1.5 text-[var(--lp-good)]">
                  <span className="lp-pulse size-2 rounded-full bg-[var(--lp-good)]" /> Live
                </span>
              </p>
              <ul className="mt-3 space-y-2">
                {BOARD.map((o) => {
                  const c = CHANNEL[o.ch];
                  return (
                    <li key={o.who} className="flex items-center gap-3 rounded-xl bg-[var(--lp-ground)] px-3.5 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: c.color }}>
                        <c.icon aria-hidden size={16} className="text-white" />
                      </span>
                      <div className="min-w-0 flex-1 text-[14px]">
                        <p className="font-semibold">
                          {c.name} · {o.who}
                        </p>
                        <p className="truncate text-[var(--lp-muted)]">{o.items}</p>
                      </div>
                      <div className="text-right text-[14px]">
                        <p className="font-semibold tabular-nums">₹{o.total}</p>
                        <p className="text-[var(--lp-muted)]">{o.state}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
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
            <p className="mt-2 max-w-[40em] text-[14px] text-[var(--lp-muted)]">
              Video:{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Making_tandoori_bread_in_Old_Delhi.ogv" className="underline underline-offset-2">
                “Making tandoori bread in Old Delhi”
              </a>{" "}
              by Fowler&amp;fowler, CC BY-SA 4.0, via Wikimedia Commons.
            </p>
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

/** One step of "how it works": what happens, and a small piece of what it looks like. */
function Step({ i, title, text, chat = false, children }: { i: number; title: string; text: string; chat?: boolean; children: React.ReactNode }) {
  return (
    <div className="lp-in lp-lift flex flex-col rounded-[24px] bg-[var(--lp-ground)] p-6" style={{ "--i": i } as React.CSSProperties}>
      <p className="text-[22px] font-semibold">{title}</p>
      <p className="mt-2 text-[16px] leading-relaxed text-[var(--lp-muted)]">{text}</p>
      <div data-ui className={`mt-auto pt-6`}>
        <div className={`rounded-2xl p-4 text-[14px] ${chat ? "bg-[#e5ddd5] text-[#121a16]" : "bg-[var(--lp-paper)]"}`}>{children}</div>
      </div>
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
