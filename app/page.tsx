"use client";

import "./landing.css";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, Plus } from "lucide-react";
import { Wordmark } from "@/components/bits";
import { RouterDialog } from "@/components/landing/router";
import { DishBoard, GuestCard, MenuSync, NextPayouts, OrderBoard, OrderPing, PayoutCard, PhonePage, PromoCard, ReviewCard } from "@/components/landing/mocks";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The landing page tells one story in three parts, the three jobs Zest does for a restaurant online:
// sell (your own page plus Zomato and Swiggy), know the people who order, and win (payouts, offers,
// dishes). Every picture of the product is the product's own interface with the sample restaurant's data.

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

const FAQ: { q: Bi; a: Bi }[] = [
  {
    q: { en: "Does Zest replace Zomato or Swiggy?", hi: "क्या Zest, Zomato या Swiggy की जगह लेता है?" },
    a: { en: "No. Your listings keep running as they do, and Zest helps you run them: orders, menu, reviews and payouts in one place. Your own page is for customers who already know you.", hi: "नहीं। आपकी लिस्टिंग वैसे ही चलती हैं, और Zest उन्हें चलाने में मदद करता है: ऑर्डर, मेन्यू, रिव्यू और पेआउट एक जगह। आपका पेज उन ग्राहकों के लिए है जो आपको पहले से जानते हैं।" },
  },
  {
    q: { en: "Will the AI change things without asking?", hi: "क्या AI बिना पूछे कुछ बदलेगा?" },
    a: { en: "No. Every price change, reply, dispute and promo waits for your approval. Promos carry a hard spend cap, and everything is on record with undo.", hi: "नहीं। हर क़ीमत, जवाब, डिस्प्यूट और प्रोमो आपकी मंज़ूरी का इंतज़ार करता है। प्रोमो पर पक्की ख़र्च सीमा, और हर काम का रिकॉर्ड और undo।" },
  },
  {
    q: { en: "Can my staff use it without my password?", hi: "क्या स्टाफ़ मेरे पासवर्ड के बिना इस्तेमाल कर सकता है?" },
    a: { en: "Yes. Give each person a role and a 4-digit PIN. The kitchen sees only the order board; managers can do more; only you see everything.", hi: "हाँ। हर व्यक्ति को एक रोल और 4 अंकों का PIN दें। किचन सिर्फ़ ऑर्डर बोर्ड देखता है; मैनेजर ज़्यादा कर सकते हैं; सब कुछ सिर्फ़ आप देखते हैं।" },
  },
  {
    q: { en: "Do I need a POS or new hardware?", hi: "क्या POS या नया हार्डवेयर चाहिए?" },
    a: { en: "No. Zest runs on the phone, tablet or laptop you already have. Connections to POS systems such as Petpooja are on the way.", hi: "नहीं। Zest आपके मौजूदा फ़ोन, टैबलेट या लैपटॉप पर चलता है। Petpooja जैसे POS से कनेक्शन आ रहे हैं।" },
  },
  {
    q: { en: "How do customers pay on my page?", hi: "मेरे पेज पर ग्राहक भुगतान कैसे करते हैं?" },
    a: { en: "By UPI straight to your own UPI ID, or at the counter. The money comes to you directly; Zest never holds it.", hi: "UPI से सीधे आपके UPI ID पर, या काउंटर पर। पैसा सीधे आपके पास आता है; Zest कभी नहीं रखता।" },
  },
  {
    q: { en: "Can I use it in Hindi?", hi: "क्या इसे हिंदी में इस्तेमाल कर सकते हैं?" },
    a: { en: "Yes. The whole app works in Hindi and English, and the assistant answers in Hindi when you write in Hindi or Hinglish.", hi: "हाँ। पूरा ऐप हिंदी और अंग्रेज़ी में चलता है, और आप हिंदी या हिंग्लिश में लिखें तो असिस्टेंट हिंदी में जवाब देता है।" },
  },
];

export default function Landing() {
  const { pick, lang } = useApp();
  const hi = lang === "hi";
  const root = useReveal();
  const [routerOpen, setRouterOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [platform, setPlatform] = useState<"zomato" | "swiggy">("zomato");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
    QRCode.toDataURL(`${window.location.origin}/r/rasoi-27`, { margin: 0, width: 240 }).then(setQr, () => {});
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
  const H2 = "font-sign text-[clamp(30px,3.6vw,52px)] leading-[1.04] tracking-[-0.01em] [text-wrap:balance]";
  const LEAD = "text-[18px] leading-relaxed text-[var(--lp-muted)]";
  const H3 = "text-[22px] font-semibold leading-snug";
  const BODY = "text-[17px] leading-relaxed text-[var(--lp-muted)]";

  const nav: [string, Bi][] = [
    ["#sell", { en: "Sell online", hi: "ऑनलाइन बेचें" }],
    ["#know", { en: "Customers", hi: "ग्राहक" }],
    ["#win", { en: "Payouts & growth", hi: "पेआउट और ग्रोथ" }],
  ];

  return (
    <div ref={root} className="lp min-h-dvh overflow-x-clip">
      <noscript>
        <style>{`.lp-in,.lp-bar{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* Header */}
      <header className="lp-wrap flex h-[76px] items-center justify-between gap-6">
        <a href="/" aria-label="Zest">
          <Wordmark className="text-[30px]" />
        </a>
        <nav aria-label={pick({ en: "Sections", hi: "हिस्से" })} className="hidden items-center gap-8 text-[17px] font-medium lg:flex">
          {nav.map(([href, label]) => (
            <a key={href} href={href} className="hover:underline hover:underline-offset-4">
              {pick(label)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-[17px] font-medium">
          <LpLang />
          <a href="/login" className="hidden hover:underline hover:underline-offset-4 sm:inline">
            {pick({ en: "Log in", hi: "लॉग इन" })}
          </a>
          <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn hidden min-h-11 px-5 text-[15px] sm:inline-flex">
            {pick({ en: "Get started", hi: "शुरू करें" })}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section data-reveal aria-labelledby="hero-h" className="lp-wrap grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-20 pt-8 lg:grid-cols-[minmax(0,11fr)_minmax(0,12fr)] lg:pb-28 lg:pt-14">
        <div>
          <h1 id="hero-h" className="lp-in font-sign text-[38px] leading-[1.02] tracking-[-0.015em] sm:text-[56px] lg:text-[clamp(44px,4.1vw,60px)]" style={i(0)}>
            {hi ? (
              <>
                ऑनलाइन ज़्यादा बेचें,
                <br />
                ज़्यादा बचाएँ।
              </>
            ) : (
              <>
                Sell more online.
                <br />
                Keep more of it.
              </>
            )}
          </h1>
          <p className={`lp-in mt-6 max-w-[34em] ${LEAD}`} style={i(1)}>
            {pick({
              en: "Zest gives your restaurant its own ordering page, keeps your Zomato and Swiggy listings right, remembers the people who order, and shows you where every rupee of your payout went.",
              hi: "Zest आपके रेस्टोरेंट को अपना ऑर्डरिंग पेज देता है, Zomato और Swiggy लिस्टिंग ठीक रखता है, ऑर्डर करने वालों को याद रखता है, और बताता है कि पेआउट का हर रुपया कहाँ गया।",
            })}
          </p>
          <div className="lp-in mt-8 flex flex-wrap gap-3" style={i(2)}>
            <button type="button" onClick={() => setRouterOpen(true)} className="lp-btn">
              {pick({ en: "Set up my restaurant", hi: "अपना रेस्टोरेंट जोड़ें" })}
            </button>
            <a href="/r/rasoi-27" className="lp-ghost">
              {pick({ en: "See a live page", hi: "लाइव पेज देखें" })} <ArrowRight aria-hidden size={18} />
            </a>
          </div>
          <p className="lp-in mt-6 text-[15px] text-[var(--lp-muted)]" style={i(3)}>
            {pick({ en: "Works alongside your Zomato and Swiggy listings. In English and Hindi.", hi: "आपकी Zomato और Swiggy लिस्टिंग के साथ चलता है। हिंदी और अंग्रेज़ी में।" })}{" "}
            <button type="button" onClick={openDemo} className="lp-link font-medium text-[var(--lp-ink)]">
              {pick({ en: "Open the demo kitchen", hi: "डेमो किचन खोलें" })}
            </button>
          </p>
        </div>

        <div className="lp-in relative h-[560px] sm:h-[600px] lg:h-[640px]" style={i(1)}>
          <div className="absolute inset-y-0 right-0 w-full overflow-hidden rounded-[28px] sm:w-[82%]">
            <img src="/photos/hero-biryani.webp" alt={pick({ en: "Veg dum biryani in a clay handi", hi: "मिट्टी की हांडी में वेज दम बिरयानी" })} width={1000} height={1250} className="lp-drift size-full object-cover" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0">
            <PhonePage className="lp-float" />
          </div>
          <div className="absolute right-4 top-6 hidden sm:block lg:-right-2 lg:top-14">
            <OrderPing className="lp-float late" />
          </div>
        </div>
      </section>

      {/* The three jobs */}
      <section data-reveal aria-labelledby="jobs-h" className="bg-[var(--lp-field)] py-20 text-[var(--lp-field-ink)] lg:py-28">
        <div className="lp-wrap">
          <h2 id="jobs-h" className={`lp-in max-w-[18ch] ${H2}`} style={i(0)}>
            {pick({ en: "Three jobs online. One app for all of them.", hi: "ऑनलाइन तीन काम। सबके लिए एक ऐप।" })}
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {(
              [
                ["#sell", { en: "Sell", hi: "बेचें" }, { en: "Your own ordering page, and Zomato and Swiggy listings that stay right: one menu, stock, prices and hours for all three.", hi: "आपका अपना ऑर्डरिंग पेज, और Zomato व Swiggy लिस्टिंग जो सही रहें: तीनों के लिए एक मेन्यू, स्टॉक, क़ीमत और समय।" }, "/photos/menu-paneer-tikka.webp"],
                ["#know", { en: "Know", hi: "जानें" }, { en: "Every review answered in your voice, every complaint handled, and a customer list from your own page that is yours to keep.", hi: "हर रिव्यू का जवाब आपकी भाषा में, हर शिकायत का हल, और आपके पेज से बनी ग्राहक सूची जो आपकी है।" }, "/photos/team-rider.webp"],
                ["#win", { en: "Win", hi: "जीतें" }, { en: "Every payout explained, wrong deductions disputed, offers that stop at your limit, and the dishes that cost you stars.", hi: "हर पेआउट समझाया, ग़लत कटौती पर डिस्प्यूट, आपकी सीमा पर रुकने वाले ऑफ़र, और वो डिश जो स्टार घटा रही हैं।" }, "/photos/team-money.webp"],
              ] as [string, Bi, Bi, string][]
            ).map(([href, word, text, photo], n) => (
              <a key={href} href={href} className="lp-in group block" style={i(n + 1)}>
                <div className="overflow-hidden rounded-2xl">
                  <img src={photo} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <p className="font-sign mt-6 text-[clamp(30px,3.6vw,52px)] leading-none text-[var(--lp-accent)]">{pick(word)}</p>
                <p className="mt-3 text-[17px] leading-relaxed text-[var(--lp-field-muted)]">{pick(text)}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[17px] font-semibold">
                  {pick({ en: "See how", hi: "कैसे, देखें" })} <ArrowRight aria-hidden size={17} className="transition-transform group-hover:translate-x-1" />
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sell */}
      <section id="sell" data-reveal aria-labelledby="sell-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="max-w-[46rem]">
            <h2 id="sell-h" className={`lp-in ${H2}`} style={i(0)}>
              {pick({ en: "Sell on your own page and on every app.", hi: "अपने पेज पर और हर ऐप पर बेचें।" })}
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              {pick({
                en: "People who already know you can order straight from you. Everyone else finds you on Zomato and Swiggy. Zest runs both from one menu, and every order lands on one board.",
                hi: "जो आपको जानते हैं वो सीधे आपसे ऑर्डर करें। बाक़ी आपको Zomato और Swiggy पर ढूँढें। Zest दोनों को एक मेन्यू से चलाता है, और हर ऑर्डर एक बोर्ड पर आता है।",
              })}
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-12">
            <div className="lp-in flex flex-col rounded-[24px] bg-[var(--lp-paper)] p-6 sm:p-8 lg:col-span-7" style={i(2)}>
              <h3 className={H3}>{pick({ en: "Your own ordering page, from your Zomato link", hi: "आपका अपना ऑर्डरिंग पेज, आपके Zomato लिंक से" })}</h3>
              <p className={`mt-2 max-w-[34em] ${BODY}`}>
                {pick({
                  en: "Paste your listing and Zest builds the page: menu, photos, ratings and prices. Customers order for pickup or from the table, and pay by UPI straight to you.",
                  hi: "लिस्टिंग डालें और Zest पेज बना देता है: मेन्यू, फ़ोटो, रेटिंग और क़ीमत। ग्राहक पिकअप या टेबल से ऑर्डर करते हैं, और UPI से सीधे आपको भुगतान।",
                })}
              </p>
              <div className="mt-8 grid flex-1 items-end gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex items-center gap-4 rounded-2xl bg-[var(--lp-ground)] p-4">
                  {qr ? <img src={qr} alt={pick({ en: "QR code for Rasoi 27's page", hi: "Rasoi 27 के पेज का QR कोड" })} width={112} height={112} className="size-28" /> : <span className="size-28" />}
                  <div className="text-[15px]">
                    <p className="font-semibold">{pick({ en: "Table QR", hi: "टेबल QR" })}</p>
                    <p className="text-[var(--lp-muted)]">{pick({ en: "Print it, stick it, take orders.", hi: "प्रिंट करें, लगाएँ, ऑर्डर लें।" })}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-[17px]">
                  {[
                    { en: "Link in your Instagram bio and Google profile", hi: "Instagram बायो और Google प्रोफ़ाइल में लिंक" },
                    { en: "Regulars reorder in two taps", hi: "रेगुलर दो टैप में दोबारा ऑर्डर करें" },
                    { en: "The money comes to your UPI ID", hi: "पैसा आपके UPI ID पर आता है" },
                  ].map((t) => (
                    <li key={t.en} className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[var(--lp-web)]" />
                      {pick(t)}
                    </li>
                  ))}
                  <li className="pt-2">
                    <a href="/r/rasoi-27" className="lp-link font-semibold">
                      {pick({ en: "Open Rasoi 27's page", hi: "Rasoi 27 का पेज खोलें" })}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lp-in flex flex-col gap-4 lg:col-span-5" style={i(3)}>
              <div className="px-1 pt-2">
                <h3 className={H3}>{pick({ en: "One menu for every app", hi: "हर ऐप के लिए एक मेन्यू" })}</h3>
                <p className={`mt-2 ${BODY}`}>{pick({ en: "Out of dal at 9 pm? Switch it off once and it goes off on Zomato, Swiggy and your page.", hi: "रात 9 बजे दाल ख़त्म? एक बार बंद करें, Zomato, Swiggy और आपके पेज पर बंद।" })}</p>
              </div>
              <MenuSync />
            </div>
          </div>

          <div className="mt-6 grid items-center gap-10 rounded-[24px] bg-[var(--lp-paper)] p-6 sm:p-8 lg:grid-cols-2 lg:gap-16 lg:p-12">
            <div className="lp-in" style={i(4)}>
              <h3 className="font-sign text-[clamp(26px,2.6vw,36px)] leading-[1.08]">{pick({ en: "Every order, one board.", hi: "हर ऑर्डर, एक बोर्ड।" })}</h3>
              <p className={`mt-3 max-w-[30em] ${BODY}`}>
                {pick({
                  en: "Zomato, Swiggy, your page and your tables, side by side as they come in. A ticket that is running late turns red before the customer calls.",
                  hi: "Zomato, Swiggy, आपका पेज और टेबल, आते ही साथ-साथ। देर हो रहा ऑर्डर ग्राहक के फ़ोन से पहले लाल हो जाता है।",
                })}
              </p>
              <button type="button" onClick={openDemo} className="lp-ghost mt-6">
                {pick({ en: "Try the live board", hi: "लाइव बोर्ड आज़माएँ" })} <ArrowRight aria-hidden size={18} />
              </button>
            </div>
            <div className="lp-in" style={i(5)}>
              <OrderBoard />
            </div>
          </div>
        </div>
      </section>

      {/* Know */}
      <section id="know" data-reveal aria-labelledby="know-h" className="scroll-mt-6 bg-[var(--lp-paper)] py-24 lg:py-32">
        <div className="lp-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-12">
              <h2 id="know-h" className={`lp-in ${H2}`} style={i(0)}>
                {pick({ en: "Know the people who order online.", hi: "ऑनलाइन ऑर्डर करने वालों को जानें।" })}
              </h2>
              <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
                {pick({
                  en: "Zomato and Swiggy keep their customers' numbers. Orders on your own page don't, so every regular you win there is yours to remember and bring back.",
                  hi: "Zomato और Swiggy अपने ग्राहकों के नंबर नहीं देते। आपके पेज के ऑर्डर देते हैं, इसलिए वहाँ बना हर रेगुलर आपका है: याद रखने और वापस बुलाने के लिए।",
                })}
              </p>
              <div className="lp-in mt-10 overflow-hidden rounded-[24px]" style={i(2)}>
                <img src="/photos/team-guests.webp" alt={pick({ en: "Regulars sharing a table", hi: "एक टेबल पर रेगुलर ग्राहक" })} className="aspect-[4/3] w-full object-cover" />
              </div>
            </div>
          </div>
          <div className="grid gap-12 lg:col-span-6 lg:col-start-7">
            <div className="lp-in" style={i(2)}>
              <h3 className={H3}>{pick({ en: "A customer list that is yours", hi: "ग्राहक सूची जो आपकी है" })}</h3>
              <p className={`mt-2 ${BODY}`}>{pick({ en: "What they order, how they like it, when they last came. Zest spots the regulars who have gone quiet.", hi: "क्या मँगाते हैं, कैसा पसंद है, आख़िरी बार कब आए। Zest बताता है कौन से रेगुलर ग़ायब हैं।" })}</p>
              <div className="mt-5">
                <GuestCard />
              </div>
            </div>
            <div className="lp-in" style={i(3)}>
              <h3 className={H3}>{pick({ en: "Every review answered, in your voice", hi: "हर रिव्यू का जवाब, आपकी भाषा में" })}</h3>
              <p className={`mt-2 ${BODY}`}>{pick({ en: "Zomato and Swiggy reviews in one list, each with a reply drafted. You read it, change a word if you like, and post.", hi: "Zomato और Swiggy रिव्यू एक सूची में, हर एक का जवाब तैयार। पढ़ें, चाहें तो बदलें, और पोस्ट करें।" })}</p>
              <div className="mt-5">
                <ReviewCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Win */}
      <section id="win" data-reveal aria-labelledby="win-h" className="scroll-mt-6 py-24 lg:py-32">
        <div className="lp-wrap">
          <div className="max-w-[46rem]">
            <h2 id="win-h" className={`lp-in ${H2}`} style={i(0)}>
              {pick({ en: "Win online, week after week.", hi: "ऑनलाइन जीतें, हर हफ़्ते।" })}
            </h2>
            <p className={`lp-in mt-5 ${LEAD}`} style={i(1)}>
              {pick({
                en: "See what each app paid you and why, catch the deductions that shouldn't be there, spend on offers only up to the limit you set, and fix the dishes that cost you stars.",
                hi: "देखें हर ऐप ने क्या दिया और क्यों, ग़लत कटौती पकड़ें, ऑफ़र पर उतना ही ख़र्च करें जितनी सीमा रखी, और वो डिश ठीक करें जो स्टार घटा रही हैं।",
              })}
            </p>
          </div>
          <div className="mt-16 grid gap-6 lg:grid-cols-12">
            <div className="lp-in lg:col-span-7" style={i(2)}>
              <h3 className={`px-1 ${H3}`}>{pick({ en: "Every payout, explained", hi: "हर पेआउट, समझाया हुआ" })}</h3>
              <p className={`mt-2 px-1 ${BODY}`}>{pick({ en: "Zest reads the payout mails and statements in your inbox and splits each one line by line.", hi: "Zest आपके इनबॉक्स के पेआउट मेल और स्टेटमेंट पढ़कर हर एक को लाइन-दर-लाइन बाँटता है।" })}</p>
              <div className="mt-5">
                <PayoutCard />
              </div>
            </div>
            <div className="grid gap-10 lg:col-span-5">
              <div className="lp-in" style={i(3)}>
                <h3 className={`px-1 ${H3}`}>{pick({ en: "Offers with a hard limit", hi: "पक्की सीमा वाले ऑफ़र" })}</h3>
                <p className={`mt-2 px-1 ${BODY}`}>{pick({ en: "Set the weekly spend once. The offer stops by itself when it is reached.", hi: "हफ़्ते का ख़र्च एक बार तय करें। सीमा पर ऑफ़र अपने-आप रुकता है।" })}</p>
                <div className="mt-5">
                  <PromoCard />
                </div>
              </div>
              <div className="lp-in" style={i(4)}>
                <h3 className={`px-1 ${H3}`}>{pick({ en: "Know when the money lands", hi: "जानें पैसा कब आएगा" })}</h3>
                <p className={`mt-2 px-1 ${BODY}`}>{pick({ en: "Every app's next payout and its date, in one list.", hi: "हर ऐप का अगला पेआउट और उसकी तारीख़, एक सूची में।" })}</p>
                <div className="mt-5">
                  <NextPayouts />
                </div>
              </div>
            </div>
            <div className="lp-in lg:col-span-12" style={i(4)}>
              <div className="grid items-start gap-6 rounded-[24px] bg-[var(--lp-paper)] p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:p-12">
                <div>
                  <h3 className="font-sign text-[clamp(26px,2.6vw,36px)] leading-[1.08]">{pick({ en: "Know which dishes win.", hi: "जानें कौन सी डिश जीतती है।" })}</h3>
                  <p className={`mt-3 ${BODY}`}>
                    {pick({
                      en: "Orders and ratings for every dish on every app, side by side, with the reason when one slips: the reviews that mention it.",
                      hi: "हर ऐप पर हर डिश के ऑर्डर और रेटिंग, साथ-साथ, और जब कोई गिरे तो वजह: उसका ज़िक्र करने वाले रिव्यू।",
                    })}
                  </p>
                </div>
                <DishBoard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Start */}
      <section data-reveal aria-labelledby="start-h" className="bg-[var(--lp-field)] py-24 text-[var(--lp-field-ink)] lg:py-32">
        <div className="lp-wrap grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="start-h" className={`lp-in ${H2}`} style={i(0)}>
              {pick({ en: "Live before lunch.", hi: "लंच से पहले लाइव।" })}
            </h2>
            <ul className="mt-10 space-y-7">
              {(
                [
                  [{ en: "Sign in with Google", hi: "Google से साइन इन करें" }, { en: "No forms, no passwords to remember.", hi: "न फ़ॉर्म, न याद रखने वाले पासवर्ड।" }],
                  [{ en: "Paste your Zomato or Swiggy link", hi: "अपना Zomato या Swiggy लिंक डालें" }, { en: "Zest reads your menu, photos, prices and ratings.", hi: "Zest आपका मेन्यू, फ़ोटो, क़ीमत और रेटिंग पढ़ लेता है।" }],
                  [{ en: "Share your page", hi: "अपना पेज शेयर करें" }, { en: "Print the table QR and put the link in your bio. Connect your inbox when you're ready for payouts.", hi: "टेबल QR प्रिंट करें और बायो में लिंक डालें। पेआउट के लिए जब चाहें इनबॉक्स जोड़ें।" }],
                ] as [Bi, Bi][]
              ).map(([t, d], n) => (
                <li key={t.en} className="lp-in flex gap-5" style={i(n + 1)}>
                  <span aria-hidden className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--lp-accent)] text-[var(--lp-accent-ink)]">
                    <ArrowRight size={18} />
                  </span>
                  <div>
                    <p className="text-[22px] font-semibold leading-snug">{pick(t)}</p>
                    <p className="mt-1 text-[17px] leading-relaxed text-[var(--lp-field-muted)]">{pick(d)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <form data-ui onSubmit={startWithLink} className="lp-in w-full rounded-[24px] bg-[var(--lp-paper)] p-6 text-[var(--lp-ink)] sm:p-9 lg:col-span-5 lg:col-start-8" style={i(2)}>
            <p className="text-[22px] font-semibold">{pick({ en: "Set up your restaurant", hi: "अपना रेस्टोरेंट जोड़ें" })}</p>
            <div role="radiogroup" aria-label={pick({ en: "Where you're listed", hi: "आप कहाँ लिस्टेड हैं" })} className="mt-5 grid grid-cols-2 rounded-full bg-[var(--lp-ground)] p-1 text-[15px]">
              {(["zomato", "swiggy"] as const).map((x) => (
                <button key={x} type="button" role="radio" aria-checked={platform === x} onClick={() => setPlatform(x)} className={`min-h-11 rounded-full font-semibold transition-colors ${platform === x ? "bg-[var(--lp-ink)] text-white" : "text-[var(--lp-muted)]"}`}>
                  {x === "zomato" ? "Zomato" : "Swiggy"}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-[15px] font-medium">
              {pick({ en: `Your ${platform === "zomato" ? "Zomato" : "Swiggy"} link`, hi: `आपका ${platform === "zomato" ? "Zomato" : "Swiggy"} लिंक` })}
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                inputMode="url"
                placeholder={platform === "zomato" ? "zomato.com/bangalore/your-restaurant" : "swiggy.com/restaurants/your-restaurant"}
                className="mt-2 block min-h-12 w-full rounded-xl bg-[var(--lp-ground)] px-4 text-[17px] outline-none placeholder:text-[#7b8680] focus:ring-2 focus:ring-[var(--lp-accent)]"
              />
            </label>
            <p className="mt-2 text-[15px] text-[var(--lp-muted)]">{pick({ en: "No link handy? Leave it empty and add it later.", hi: "लिंक नहीं है? ख़ाली छोड़ें, बाद में जोड़ें।" })}</p>
            <button type="submit" className="lp-btn mt-6 w-full">
              {pick({ en: "Set up my restaurant", hi: "अपना रेस्टोरेंट जोड़ें" })}
            </button>
          </form>
        </div>
      </section>

      {/* Questions */}
      <section data-reveal aria-labelledby="faq-h" className="py-24 lg:py-32">
        <div className="lp-wrap grid gap-10 lg:grid-cols-12">
          <h2 id="faq-h" className={`lp-in lg:col-span-4 ${H2}`} style={i(0)}>
            {pick({ en: "Questions owners ask", hi: "मालिक क्या पूछते हैं" })}
          </h2>
          <div className="lp-in grid gap-3 lg:col-span-7 lg:col-start-6" style={i(1)}>
            {FAQ.map((f, n) => (
              <details key={f.q.en} open={n === 0} className="group rounded-2xl bg-[var(--lp-paper)] px-6">
                <summary className="flex min-h-[68px] items-center justify-between gap-6 py-4 text-[18px] font-semibold">
                  {pick(f.q)}
                  <Plus aria-hidden size={22} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[56ch] pb-6 text-[17px] leading-relaxed text-[var(--lp-muted)]">{pick(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--lp-field)] py-16 text-[var(--lp-field-ink)]">
        <div className="lp-wrap">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <div>
              <Wordmark className="text-[36px]" />
              <p className="mt-4 max-w-[26em] text-[17px] leading-relaxed text-[var(--lp-field-muted)]">
                {pick({ en: "Sell online, know your customers and win on every app, from one place.", hi: "ऑनलाइन बेचें, ग्राहकों को जानें और हर ऐप पर जीतें, एक जगह से।" })}
              </p>
            </div>
            <FootCol title={{ en: "Product", hi: "प्रोडक्ट" }}>
              {nav.map(([href, label]) => (
                <a key={href} href={href} className="hover:underline hover:underline-offset-4">
                  {pick(label)}
                </a>
              ))}
            </FootCol>
            <FootCol title={{ en: "Start", hi: "शुरू करें" }}>
              <button type="button" onClick={() => setRouterOpen(true)} className="text-left hover:underline hover:underline-offset-4">
                {pick({ en: "Set up my restaurant", hi: "अपना रेस्टोरेंट जोड़ें" })}
              </button>
              <a href="/login" className="hover:underline hover:underline-offset-4">
                {pick({ en: "Log in", hi: "लॉग इन" })}
              </a>
              <a href="/login/staff" className="hover:underline hover:underline-offset-4">
                {pick({ en: "Staff sign-in", hi: "स्टाफ़ साइन-इन" })}
              </a>
            </FootCol>
            <FootCol title={{ en: "See it", hi: "देखें" }}>
              <button type="button" onClick={openDemo} className="text-left hover:underline hover:underline-offset-4">
                {pick({ en: "Demo kitchen", hi: "डेमो किचन" })}
              </button>
              <a href="/r/rasoi-27" className="hover:underline hover:underline-offset-4">
                {pick({ en: "A restaurant's page", hi: "एक रेस्टोरेंट का पेज" })}
              </a>
            </FootCol>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 pt-2 text-[15px] text-[var(--lp-field-muted)]">
            <p>© 2026 Zest</p>
            <LpLang />
          </div>
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}

function FootCol({ title, children }: { title: Bi; children: React.ReactNode }) {
  const { pick } = useApp();
  return (
    <div>
      <p className="text-[15px] font-semibold">{pick(title)}</p>
      <div className="mt-4 flex flex-col items-start gap-3 text-[17px] text-[var(--lp-field-muted)]">{children}</div>
    </div>
  );
}

/** English / Hindi, as two plain words; the current one underlined. */
function LpLang() {
  const { lang, setLang } = useApp();
  return (
    <div role="group" aria-label="Language" className="flex gap-3 text-[15px]">
      {(["en", "hi"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={lang === l ? "font-semibold underline decoration-2 underline-offset-4" : "opacity-75 hover:opacity-100"}>
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
