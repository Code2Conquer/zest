"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import { ThemeToggle, Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { AGENT_ICON, AgentConsole, ApprovalTrail, GrowthCard, GuestCard, MenuSync, PayoutCard, PhonePage, ReviewCard, SearchResult, SetupCard, type AgentId } from "@/components/landing/mocks";

// The pitch: Zest is a team of AI agents that runs a restaurant's online business around the clock
// (its own website and Google, Zomato and Swiggy, payouts, reviews, regulars, offers) and brings the
// owner in only for decisions. It starts from a listing link and an email connection. Every picture
// of the product on this page is the product's own interface with the sample restaurant's data.

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
      // Fire a little before the section arrives, so its parts are already moving when it is seen.
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

const AGENTS: { id: AgentId; name: string; does: string; asks: string }[] = [
  { id: "website", name: "Website", does: "Builds your own ordering page from your listing, keeps it in step with your menu, and writes it the way Google reads it.", asks: "before your page goes live" },
  { id: "listings", name: "Listings", does: "Keeps dishes, prices, stock and hours the same on Zomato, Swiggy and your page, and spots the ones that drift.", asks: "before any price changes" },
  { id: "payouts", name: "Payouts", does: "Reads every payout mail and statement, explains where each rupee went, and drafts disputes for wrong deductions.", asks: "before a dispute is sent" },
  { id: "reviews", name: "Reviews", does: "Drafts a reply to every review on every app, in your voice, and tells you what keeps coming up.", asks: "before a reply is posted" },
  { id: "guests", name: "Guests", does: "Remembers everyone who orders from your page: what they order, how often and how they like it. Zomato and Swiggy keep their customers; these ones are yours.", asks: "before their details are used" },
  { id: "growth", name: "Growth", does: "Runs offers inside the budget you set and shows which dishes are winning and which are losing stars.", asks: "before an offer starts" },
];

const PANEL: Record<AgentId, React.ReactNode> = {
  website: (
    <div className="grid items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
      <SearchResult />
      <PhonePage className="mx-auto" />
    </div>
  ),
  listings: <MenuSync />,
  payouts: <PayoutCard />,
  reviews: <ReviewCard />,
  guests: <GuestCard />,
  growth: <GrowthCard />,
};

const COMPARE: [string, string, string][] = [
  ["What it does", "Rings up bills and prints kitchen tickets", "Grows and runs your business online"],
  ["Your own website and Google", "An add-on, if at all", "Built from your listing, written for search"],
  ["Zomato and Swiggy", "Passes orders to the counter", "Menu, prices, payouts and reviews kept right"],
  ["Payouts", "A report for you to read", "Every rupee explained, disputes drafted"],
  ["Reviews and regulars", "Not its job", "Replies drafted, regulars remembered"],
  ["When you're closed", "Waits for you", "Agents keep working, and ask before acting"],
  ["To start", "Hardware, setup visit, training", "A listing link and your email"],
];

const FAQ: { q: string; a: string }[] = [
  { q: "Does Zest replace Zomato or Swiggy?", a: "No. Your listings keep running as they do. Zest's agents look after them for you, and your own page brings in the customers who already know you." },
  { q: "Will the agents change things without asking?", a: "No. Menu and price changes, review replies, disputes and offers all wait for your yes. Offers stop at the limit you set, and every change has a record and an undo." },
  { q: "Why does Zest need my email?", a: "Zomato and Swiggy send payout mails, statements and review alerts to your inbox. Zest reads only those, so it can explain your money and answer your reviews. You can disconnect it any time." },
  { q: "Do I need a POS or new hardware?", a: "No. Keep your billing counter as it is. Zest runs on the phone, tablet or laptop you already have." },
  { q: "How do customers pay on my page?", a: "By UPI straight to your own UPI ID, or at the counter. The money comes to you directly; Zest never holds it." },
  { q: "Which languages does it speak?", a: "Write to Zest in English, Hindi or Hinglish and it answers the same way." },
];

export default function Landing() {
  const root = useReveal();
  const [routerOpen, setRouterOpen] = useState(false);
  const [link, setLink] = useState("");
  const [agent, setAgent] = useState<AgentId>("website");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
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
    <form onSubmit={start} className="flex w-full max-w-[560px] flex-col gap-2 rounded-[28px] bg-[var(--lp-paper)] p-2 sm:flex-row sm:rounded-full">
      <label htmlFor={id} className="sr-only">
        Your Zomato or Swiggy link
      </label>
      <input
        id={id}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        inputMode="url"
        placeholder="Paste your Zomato or Swiggy link"
        className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[18px] text-[var(--lp-ink)] outline-none placeholder:text-[var(--lp-faint)]"
      />
      <button type="submit" className="lp-btn shrink-0">
        Start free <ArrowRight aria-hidden size={18} />
      </button>
    </form>
  );

  return (
    <div ref={root} className="lp min-h-dvh overflow-x-clip">
      <noscript>
        <style>{`.lp-in,.lp-bar{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* Header */}
      <header className="lp-wrap flex h-[76px] items-center justify-between gap-6">
        <a href="/" aria-label="Zest home">
          <Wordmark className="text-[30px]" />
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-[16px] font-medium lg:flex">
          <a href="#agents" className="hover:underline hover:underline-offset-4">
            Agents
          </a>
          <a href="#control" className="hover:underline hover:underline-offset-4">
            How you stay in charge
          </a>
          <a href="#compare" className="hover:underline hover:underline-offset-4">
            Zest vs billing software
          </a>
        </nav>
        <div className="flex items-center gap-2 text-[16px] font-medium sm:gap-4">
          <ThemeToggle />
          <a href="/login" className="hidden px-2 hover:underline hover:underline-offset-4 sm:inline">
            Log in
          </a>
          <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn min-h-11 px-5 text-[14px]">
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section data-reveal aria-labelledby="hero-h" className="lp-wrap grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-24 pt-10 lg:grid-cols-[minmax(0,13fr)_minmax(0,11fr)] lg:gap-16 lg:pb-32 lg:pt-16">
        <div>
          <h1 id="hero-h" className="lp-in lp-display text-[34px] leading-[1.04] sm:text-[52px] lg:text-[clamp(44px,4vw,58px)]" style={i(0)}>
            An AI team that runs
            <br className="hidden sm:block" /> your restaurant online.
          </h1>
          <p className={`lp-in mt-6 max-w-[33em] sm:text-[20px] ${LEAD}`} style={i(2)}>
            Zest's agents build your website, get you found on Google, keep Zomato and Swiggy in shape, check every payout and answer every review. Day and night. They come to you only when a decision is yours.
          </p>
          <div className="lp-in mt-9" style={i(3)}>
            {linkForm("hero-link")}
            <p className="mt-4 px-2 text-[14px] text-[var(--lp-muted)]">
              A link and your email is all it takes. No link?{" "}
              <button type="button" onClick={openDemo} className="lp-link font-medium text-[var(--lp-ink)]">
                Watch the agents on a sample restaurant
              </button>
            </p>
          </div>
        </div>
        <div className="lp-in" style={i(2)}>
          <AgentConsole />
        </div>
      </section>

      {/* The idea in one line */}
      <section data-reveal aria-labelledby="idea-h" className="bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="idea-h" className={`lp-in ${H2}`} style={i(0)}>
              Software makes you do the work. Zest does it.
            </h2>
            <figure className="lp-in mt-10 overflow-hidden rounded-[24px]" style={i(1)}>
              <img src="/photos/team-pass.webp" alt="Plates going out at the pass during dinner service" width={1600} height={1200} className="aspect-[16/10] w-full object-cover" />
              <figcaption className="bg-[var(--lp-sunken)] px-5 py-3 text-[14px] text-[var(--lp-muted)]">11:48 pm. The kitchen is closing. The agents are not.</figcaption>
            </figure>
          </div>
          <div className="lp-in grid content-center gap-10 sm:grid-cols-3 lg:col-span-5 lg:col-start-8 lg:grid-cols-1" style={i(2)}>
            {[
              ["24×7", "Agents watch your listings, inbox and page while you cook, serve and sleep."],
              ["1 inbox", "Everything that needs you, in one place, each with the reason and a yes or no."],
              ["0 forms", "Start from your Zomato or Swiggy link. Zest reads the rest."],
            ].map(([big, text]) => (
              <div key={big}>
                <p className="lp-display text-[clamp(30px,3.6vw,52px)] leading-none text-[var(--lp-ink)]">{big}</p>
                <p className="mt-3 text-[18px] leading-relaxed text-[var(--lp-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" data-reveal aria-labelledby="agents-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="max-w-[44rem]">
            <h2 id="agents-h" className={`lp-in ${H2}`} style={i(0)}>
              Six agents. One job each.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Organic and paid, your own page and every app: each agent owns one part of your online business and works on it all the time.
            </p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div role="tablist" aria-label="Agents" className="lp-in grid content-start gap-1.5" style={i(2)}>
              {AGENTS.map((a) => {
                const Icon = AGENT_ICON[a.id];
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
                    <span className="flex items-center gap-3 text-[18px] font-semibold">
                      <span className={`grid size-9 place-items-center rounded-xl ${on ? "bg-[var(--lp-accent)] text-[var(--lp-accent-ink)]" : "bg-[var(--lp-sunken)]"}`}>
                        <Icon aria-hidden size={18} />
                      </span>
                      {a.name}
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
            </div>
            <div id="agent-panel" role="tabpanel" aria-label={`${current.name} agent`} className="lp-in lg:min-h-[520px]" style={i(3)}>
              <div key={agent} className="lp-swap">
                {PANEL[agent]}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control */}
      <section id="control" data-reveal aria-labelledby="control-h" className="scroll-mt-6 bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="control-h" className={`lp-in ${H2}`} style={i(0)}>
              They do the work. You make the calls.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Nothing that touches your prices, your customers or your money goes out without your yes. Give your staff a PIN instead of your password, and see who did what.
            </p>
            <ul className="lp-in mt-8 space-y-4 text-[18px]" style={i(2)}>
              {[
                "Every suggestion comes with the reason, in one line",
                "Offers stop at the spending limit you set",
                "Every change is on record, with undo",
                "Staff see only what their role needs",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--lp-good)]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-in" style={i(2)}>
            <ApprovalTrail />
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" data-reveal aria-labelledby="compare-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="max-w-[44rem]">
            <h2 id="compare-h" className={`lp-in ${H2}`} style={i(0)}>
              Not another billing app.
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              Billing software records what already happened at your counter. Zest works on what happens next, online. Keep your billing counter as it is: Zest sits beside it.
            </p>
          </div>
          <ul className="lp-in mt-10 grid gap-3 sm:hidden" style={i(2)}>
            {COMPARE.map(([row, pos, zest]) => (
              <li key={row} className="rounded-2xl bg-[var(--lp-paper)] p-5 text-[16px]">
                <p className="font-semibold">{row}</p>
                <p className="mt-3 flex gap-2 text-[var(--lp-muted)]">
                  <Minus aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--lp-faint)]" />
                  {pos}
                </p>
                <p className="mt-2 flex gap-2 font-medium">
                  <Check aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--lp-good)]" />
                  {zest}
                </p>
              </li>
            ))}
          </ul>
          <div className="lp-in mt-12 hidden sm:block" style={i(2)}>
            <table className="w-full border-separate border-spacing-0 text-left text-[16px]">
              <thead>
                <tr>
                  <th className="w-[26%] pb-4 font-medium text-[var(--lp-muted)]">
                    <span className="sr-only">Compared on</span>
                  </th>
                  <th className="w-[34%] pb-4 pl-5 text-[18px] font-semibold text-[var(--lp-muted)]">Billing and POS software</th>
                  <th className="w-[40%] rounded-t-2xl bg-[var(--lp-paper)] px-5 pb-4 pt-5 text-[18px] font-semibold">
                    <Wordmark className="text-[24px]" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([row, pos, zest], n) => (
                  <tr key={row}>
                    <th scope="row" className="py-4 pr-4 align-top font-semibold">
                      {row}
                    </th>
                    <td className="py-4 pl-5 align-top text-[var(--lp-muted)]">
                      <span className="flex gap-2">
                        <Minus aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--lp-faint)]" />
                        {pos}
                      </span>
                    </td>
                    <td className={`bg-[var(--lp-paper)] px-5 py-4 align-top font-medium ${n === COMPARE.length - 1 ? "rounded-b-2xl" : ""}`}>
                      <span className="flex gap-2">
                        <Check aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--lp-good)]" />
                        {zest}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Start */}
      <section data-reveal aria-labelledby="start-h" className="bg-[var(--lp-console)] py-24 text-[var(--lp-console-ink)] lg:py-32">
        <div className="lp-wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="start-h" className={`lp-in ${H2}`} style={i(0)}>
              Live before lunch.
            </h2>
            <p className="lp-in mt-5 text-[18px] leading-relaxed text-[var(--lp-console-muted)]" style={i(1)}>
              Paste your Zomato or Swiggy link and Zest builds your page from it: menu, photos, prices, ratings. Connect your email and the payout and review agents start reading. That's the whole setup.
            </p>
            <div className="lp-in mt-9" style={i(2)}>
              {linkForm("start-link")}
              <p className="mt-4 px-2 text-[14px] text-[var(--lp-console-muted)]">Sign in with Google next. No card, no hardware.</p>
            </div>
          </div>
          <div className="lp-in" style={i(3)}>
            <SetupCard />
          </div>
        </div>
      </section>

      {/* Questions */}
      <section data-reveal aria-labelledby="faq-h" className="py-24 lg:py-32">
        <div className="lp-wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="faq-h" className={`lp-in ${H2}`} style={i(0)}>
              Questions owners ask
            </h2>
            <img src="/photos/team-guests.webp" alt="Regulars sharing a long table" width={1600} height={1200} className="lp-in mt-10 hidden aspect-[4/5] w-full rounded-[24px] object-cover lg:block" style={i(1)} />
          </div>
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
            <p className="mt-4 max-w-[26em] text-[16px] leading-relaxed text-[var(--lp-muted)]">AI agents that run your restaurant online, day and night.</p>
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
              A restaurant's own page
            </a>
          </div>
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}
