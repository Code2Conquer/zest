"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChefHat, IndianRupee, Play, Plus, ReceiptText, ShieldCheck, Star, Store, TrendingUp } from "lucide-react";
import { LangToggle, Wordmark } from "@/components/bits";
import { HeroStage } from "@/components/landing/hero-stage";
import { JourneyRouter, RouterDialog } from "@/components/landing/router";
import { Showcase } from "@/components/landing/showcase";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

const BRIGADE: { icon: typeof Star; photo: string; alt: string; role: Bi; name: Bi; does: Bi }[] = [
  {
    icon: ChefHat,
    role: { en: "Head chef", hi: "हेड शेफ़" },
    photo: "team-chef",
    alt: "A chef finishing plates under copper pass lamps",
    name: { en: "Zest", hi: "Zest" },
    does: { en: "Takes your message, decides who handles it, and checks the work before it reaches you.", hi: "आपका मैसेज लेता है, तय करता है कौन संभालेगा, और काम आप तक पहुँचने से पहले जाँचता है।" },
  },
  {
    icon: BookOpen,
    role: { en: "Menu", hi: "मेन्यू" },
    photo: "team-menu",
    alt: "A South Indian meal on a banana leaf",
    name: { en: "Menu agent", hi: "मेन्यू एजेंट" },
    does: { en: "Keeps prices, photos and stock in sync on every platform. Pauses dishes the moment you run out.", hi: "हर प्लेटफ़ॉर्म पर क़ीमत, फ़ोटो और स्टॉक एक जैसा रखता है। सामान ख़त्म होते ही डिश रोक देता है।" },
  },
  {
    icon: ReceiptText,
    role: { en: "Pass", hi: "पास" },
    photo: "team-pass",
    alt: "Plates lined up at the pass, ready to go out",
    name: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
    does: { en: "Watches every ticket, flags late ones, and tells riders and customers before they ask.", hi: "हर टिकट पर नज़र, देर वाले पकड़ता है, और राइडर व ग्राहक को पूछने से पहले बताता है।" },
  },
  {
    icon: Star,
    role: { en: "Front of house", hi: "फ़्रंट ऑफ़ हाउस" },
    photo: "team-guests",
    alt: "Guests eating together at a long table",
    name: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
    does: { en: "Replies to every review and complaint in your voice, and spots patterns like cold dal on Fridays.", hi: "हर रिव्यू और शिकायत का आपके अंदाज़ में जवाब, और पैटर्न पकड़ता है, जैसे शुक्रवार को ठंडी दाल।" },
  },
  {
    icon: IndianRupee,
    role: { en: "Galla", hi: "गल्ला" },
    photo: "team-money",
    alt: "Tandoori chicken with naan and chutneys",
    name: { en: "Money agent", hi: "पैसे वाला एजेंट" },
    does: { en: "Matches payouts to orders and your bank, explains every deduction, and disputes the wrong ones.", hi: "पेआउट को ऑर्डर और बैंक से मिलाता है, हर कटौती समझाता है, और ग़लत वाली पर डिस्प्यूट करता है।" },
  },
  {
    icon: TrendingUp,
    role: { en: "Growth", hi: "ग्रोथ" },
    photo: "team-rider",
    alt: "A delivery rider heading down a narrow street",
    name: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
    does: { en: "Plans promos and ads with a spend cap, then stops them on its own if they aren't paying off.", hi: "ख़र्च सीमा के साथ प्रोमो और ऐड प्लान करता है, और फ़ायदा न हो तो अपने-आप रोक देता है।" },
  },
];

// The four things an owner gets, grouped by outcome. The same grouping runs through the nav and footer.
const PILLARS: { id: string; icon: typeof Star; name: Bi; line: Bi; points: Bi[]; soon?: Bi }[] = [
  {
    id: "service",
    icon: ChefHat,
    name: { en: "Run service", hi: "सर्विस चलाएँ" },
    line: { en: "Every order and every table, on one screen.", hi: "हर ऑर्डर और हर टेबल, एक स्क्रीन पर।" },
    points: [
      { en: "Live orders from Zomato, Swiggy, dine-in and your own page", hi: "Zomato, Swiggy, डाइन-इन और आपके पेज के लाइव ऑर्डर" },
      { en: "Tables, bills, bookings and the waitlist", hi: "टेबल, बिल, बुकिंग और वेटलिस्ट" },
      { en: "One menu, with stock and prices synced everywhere", hi: "एक मेन्यू, स्टॉक और क़ीमत हर जगह एक जैसी" },
      { en: "Staff sign in with a PIN and see only their work", hi: "स्टाफ़ PIN से साइन इन करते हैं और सिर्फ़ अपना काम देखते हैं" },
    ],
  },
  {
    id: "direct",
    icon: Store,
    name: { en: "Sell direct", hi: "सीधे बेचें" },
    line: { en: "A page of your own for the customers who already know you.", hi: "उन ग्राहकों के लिए आपका अपना पेज जो आपको पहले से जानते हैं।" },
    points: [
      { en: "Your restaurant page with menu, photos, ratings and price for two", hi: "आपका रेस्टोरेंट पेज: मेन्यू, फ़ोटो, रेटिंग और दो लोगों का ख़र्च" },
      { en: "Table QR codes, so guests order from their seat", hi: "टेबल QR कोड, ताकि मेहमान अपनी सीट से ऑर्डर करें" },
      { en: "Payment by UPI straight to you, or at the counter", hi: "भुगतान UPI से सीधे आपको, या काउंटर पर" },
      { en: "A customer list that builds itself", hi: "अपने-आप बनती ग्राहक सूची" },
    ],
    soon: { en: "Coming next: ordering on WhatsApp and points for regulars", hi: "आगे: WhatsApp पर ऑर्डर और रेगुलर के लिए पॉइंट" },
  },
  {
    id: "money",
    icon: IndianRupee,
    name: { en: "Know your money", hi: "अपना हिसाब जानें" },
    line: { en: "Every payout, read and explained for you.", hi: "हर पेआउट, पढ़ा और समझाया हुआ।" },
    points: [
      { en: "Payout mails and statements read from your inbox", hi: "पेआउट मेल और स्टेटमेंट आपके इनबॉक्स से पढ़े जाते हैं" },
      { en: "Sales, fees, ads and deductions, line by line", hi: "बिक्री, फ़ीस, ऐड और कटौती, एक-एक लाइन" },
      { en: "Wrong charges found and disputes drafted", hi: "ग़लत कटौती पकड़ी जाती है और डिस्प्यूट तैयार" },
      { en: "Yesterday's sales by channel, every morning", hi: "हर सुबह कल की बिक्री, हर चैनल की" },
    ],
  },
  {
    id: "grow",
    icon: TrendingUp,
    name: { en: "Grow", hi: "बढ़ें" },
    line: { en: "More good reviews and better-run promos, with less effort.", hi: "ज़्यादा अच्छे रिव्यू और बेहतर प्रोमो, कम मेहनत में।" },
    points: [
      { en: "A reply to every review, drafted in your voice", hi: "हर रिव्यू का जवाब, आपके अंदाज़ में" },
      { en: "Promos and ads with a hard spend cap", hi: "पक्की ख़र्च सीमा वाले प्रोमो और ऐड" },
      { en: "Campaigns that pause themselves when they stop paying off", hi: "फ़ायदा न हो तो अपने-आप रुकने वाले कैंपेन" },
      { en: "Festival and slow-hour ideas from your own orders", hi: "आपके ऑर्डर से त्योहार और धीमे घंटों के आइडिया" },
    ],
  },
];

// What an owner juggles today, all of which Zest brings into one place.
const TODAY: Bi[] = [
  { en: "Two partner apps", hi: "दो पार्टनर ऐप" },
  { en: "Three tablets at the counter", hi: "काउंटर पर तीन टैबलेट" },
  { en: "A notebook for bookings", hi: "बुकिंग की कॉपी" },
  { en: "Payouts buried in email", hi: "ईमेल में दबे पेआउट" },
  { en: "Regulars ordering on WhatsApp", hi: "WhatsApp पर रेगुलर के ऑर्डर" },
  { en: "Reviews nobody has time for", hi: "रिव्यू जिनके लिए समय नहीं" },
  { en: "Staff asking for your password", hi: "स्टाफ़ आपका पासवर्ड माँगता है" },
];

const STEPS: { title: Bi; body: Bi }[] = [
  { title: { en: "Sign in with Google", hi: "Google से साइन इन करें" }, body: { en: "No forms to fill and nothing to install. It works on the phone or laptop you already have.", hi: "कोई लंबा फ़ॉर्म नहीं, कुछ इंस्टॉल नहीं। आपके फ़ोन या लैपटॉप पर चलता है।" } },
  { title: { en: "Paste your Zomato or Swiggy link", hi: "अपना Zomato या Swiggy लिंक डालें" }, body: { en: "Your menu, photos, ratings and details come in on their own.", hi: "आपका मेन्यू, फ़ोटो, रेटिंग और जानकारी अपने-आप आ जाती है।" } },
  { title: { en: "Connect your email and platforms", hi: "ईमेल और प्लेटफ़ॉर्म जोड़ें" }, body: { en: "Payouts, statements and orders start showing up, explained.", hi: "पेआउट, स्टेटमेंट और ऑर्डर दिखने लगते हैं, समझाए हुए।" } },
  { title: { en: "Open your page and add your team", hi: "अपना पेज खोलें और टीम जोड़ें" }, body: { en: "Share your link and table QR codes, and give staff a PIN.", hi: "अपना लिंक और टेबल QR शेयर करें, और स्टाफ़ को PIN दें।" } },
];

const FAQ: { q: Bi; a: Bi }[] = [
  {
    q: { en: "Does Zest replace Zomato or Swiggy?", hi: "क्या Zest, Zomato या Swiggy की जगह लेता है?" },
    a: {
      en: "No. Zest works alongside them. Your listings keep running as they do, and Zest helps you run them better: orders, menu, reviews and payouts in one place. Your own page is for customers who already know you.",
      hi: "नहीं। Zest उनके साथ काम करता है। आपकी लिस्टिंग वैसे ही चलती हैं, और Zest उन्हें बेहतर चलाने में मदद करता है: ऑर्डर, मेन्यू, रिव्यू और पेआउट एक जगह। आपका अपना पेज उन ग्राहकों के लिए है जो आपको पहले से जानते हैं।",
    },
  },
  {
    q: { en: "Do I need a POS or new hardware?", hi: "क्या POS या नया हार्डवेयर चाहिए?" },
    a: { en: "No. Zest runs on the phone, tablet or laptop you already use. Connections to POS systems such as Petpooja are on the way.", hi: "नहीं। Zest आपके मौजूदा फ़ोन, टैबलेट या लैपटॉप पर चलता है। Petpooja जैसे POS से कनेक्शन आ रहे हैं।" },
  },
  {
    q: { en: "Can my staff use it without my login?", hi: "क्या स्टाफ़ मेरे लॉगिन के बिना इस्तेमाल कर सकता है?" },
    a: { en: "Yes. Add each person with a role and a 4-digit PIN. Kitchen staff see only the order board; managers can do more; only you see everything.", hi: "हाँ। हर व्यक्ति को एक रोल और 4 अंकों का PIN दें। किचन स्टाफ़ सिर्फ़ ऑर्डर बोर्ड देखता है; मैनेजर ज़्यादा कर सकते हैं; सब कुछ सिर्फ़ आप देखते हैं।" },
  },
  {
    q: { en: "Will the AI change things without asking?", hi: "क्या AI बिना पूछे कुछ बदल देगा?" },
    a: { en: "No. Every change to a platform, every reply and every promo starts as a draft you approve. Promos have a hard spend cap, and everything is on record with undo.", hi: "नहीं। प्लेटफ़ॉर्म पर हर बदलाव, हर जवाब और हर प्रोमो पहले ड्राफ़्ट बनता है जिसे आप मंज़ूर करते हैं। प्रोमो पर पक्की ख़र्च सीमा, और हर काम का रिकॉर्ड और undo।" },
  },
  {
    q: { en: "How do customers pay on my page?", hi: "मेरे पेज पर ग्राहक भुगतान कैसे करते हैं?" },
    a: { en: "By UPI straight to your own UPI ID, or at the counter. The money comes to you directly; Zest never holds it.", hi: "UPI से सीधे आपके UPI ID पर, या काउंटर पर। पैसा सीधे आपके पास आता है; Zest कभी नहीं रखता।" },
  },
  {
    q: { en: "Can I use it in Hindi?", hi: "क्या मैं इसे हिंदी में इस्तेमाल कर सकता हूँ?" },
    a: { en: "Yes. The whole app works in Hindi and English, and the assistant replies in Hindi when you write in Hindi or Hinglish.", hi: "हाँ। पूरा ऐप हिंदी और अंग्रेज़ी में चलता है, और आप हिंदी या हिंग्लिश में लिखें तो असिस्टेंट हिंदी में जवाब देता है।" },
  },
];

const WORKS_WITH: [string, string][] = [
  ["Zomato", "var(--ch-zomato)"],
  ["Swiggy", "var(--ch-swiggy)"],
  ["Dine-in", "var(--ch-dine)"],
  ["Your own page", "var(--ch-direct)"],
  ["WhatsApp", "var(--veg)"],
  ["Gmail", "var(--ink-2)"],
  ["UPI", "var(--ink-2)"],
];

export default function Landing() {
  const { t, pick, state } = useApp();
  const [routerOpen, setRouterOpen] = useState(false);
  // Links elsewhere in the app use /?start=1 to open "Where is your restaurant today?" directly.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "1") setRouterOpen(true);
  }, []);
  const reduce = useReducedMotion();
  const hi = state.lang === "hi";

  async function openDemo() {
    await fetch("/api/outlet/demo", { method: "POST" });
    window.location.href = "/app";
  }

  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } };
  const reveal = (i = 0) =>
    reduce ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { delay: i * 0.07, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } };

  const startButton = (tone: "dark" | "light") => (
    <button
      type="button"
      onClick={() => setRouterOpen(true)}
      className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[1.05rem] font-medium transition-transform hover:-translate-y-0.5 ${tone === "dark" ? "bg-haldi text-[#17201c] shadow-[0_14px_34px_-14px_rgba(242,176,53,0.7)]" : "bg-ink text-paper"}`}
    >
      {hi ? "शुरू करें" : "Get started"}
      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );

  const eyebrow = (text: string, tone: "light" | "dark" = "light") => (
    <p className={`text-[0.8rem] font-medium uppercase tracking-[0.14em] ${tone === "dark" ? "text-[#f4efe6]/55" : "text-muted"}`}>{text}</p>
  );

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#0e1511] text-[#f4efe6]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_40%,rgba(242,176,53,0.16),transparent_70%),radial-gradient(40%_50%_at_10%_90%,rgba(178,58,42,0.18),transparent_70%)]" />
        <div aria-hidden className="grain absolute inset-0 -z-10 opacity-[0.07]" />
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <Wordmark className="text-[1.9rem] text-[#f4efe6] [&_.bg-turmeric]:bg-haldi" />
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[0.95rem] text-[#f4efe6]/75 md:flex">
            <a href="#platform" className="hover:text-[#f4efe6]">{hi ? "प्लेटफ़ॉर्म" : "Platform"}</a>
            <a href="#agents" className="hover:text-[#f4efe6]">{hi ? "AI एजेंट" : "AI agents"}</a>
            <a href="#start" className="hover:text-[#f4efe6]">{hi ? "शुरुआत कैसे करें" : "Get set up"}</a>
            <a href="#faq" className="hover:text-[#f4efe6]">{hi ? "सवाल" : "FAQ"}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <a href="/login" className="hidden text-[0.95rem] text-[#f4efe6]/80 hover:text-[#f4efe6] sm:block">
              {hi ? "लॉग इन" : "Log in"}
            </a>
            <button type="button" onClick={() => setRouterOpen(true)} className="hidden rounded-full bg-haldi px-5 py-2.5 text-[0.95rem] font-medium text-[#17201c] transition-colors hover:bg-[#f6c25a] sm:block">
              {hi ? "शुरू करें" : "Get started"}
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-12">
          <div>
            <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-sm text-[#f4efe6]/80 ring-1 ring-white/10">
              <span aria-hidden className="size-1.5 rounded-full bg-haldi" />
              {hi ? "रेस्टोरेंट चलाने के लिए एक ही ऐप" : "The one app to run your restaurant"}
            </motion.p>
            <motion.h1 {...rise(0.08)} className="font-sign mt-6 max-w-[16ch] text-[clamp(2.6rem,5.6vw,4.6rem)] leading-[0.94]">
              {hi ? (
                <>
                  पूरा रेस्टोरेंट, <span className="text-haldi">एक ऐप से।</span>
                </>
              ) : (
                <>
                  Run your whole restaurant <span className="text-haldi">from one app.</span>
                </>
              )}
            </motion.h1>
            <motion.p {...rise(0.2)} className="mt-7 max-w-[50ch] text-[1.2rem] leading-relaxed text-[#f4efe6]/75">
              {hi
                ? "Zomato और Swiggy के ऑर्डर, आपकी टेबल, आपका अपना ऑर्डरिंग पेज, पेआउट, रिव्यू और स्टाफ़, सब एक जगह। AI एजेंट रोज़ का काम करते हैं, आप बस मंज़ूरी देते हैं। हिंदी या अंग्रेज़ी में।"
                : "Zomato and Swiggy orders, your tables, your own ordering page, payouts, reviews and staff, together in one place. AI agents do the busywork and you just approve. In Hindi or English."}
            </motion.p>
            <motion.div {...rise(0.32)} className="mt-9 flex flex-wrap items-center gap-4">
              {startButton("dark")}
              <button type="button" onClick={openDemo} className="group inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-[1.05rem] font-medium text-[#f4efe6] ring-1 ring-white/20 transition-colors hover:bg-white/5">
                <span className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
                  <Play aria-hidden className="size-4 fill-current" />
                </span>
                <span className="text-left leading-tight">
                  {t("landing.demo")}
                  <span className="block text-[0.8rem] font-normal text-[#f4efe6]/60">{hi ? "Rasoi 27, बिना साइन-अप" : "Rasoi 27, no sign-up needed"}</span>
                </span>
              </button>
            </motion.div>
            <motion.ul {...rise(0.44)} className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#f4efe6]/60">
              {(hi ? ["दो मिनट में शुरू", "Zomato और Swiggy के साथ", "कोई नया हार्डवेयर नहीं"] : ["Set up in two minutes", "Works with Zomato and Swiggy", "No new hardware"]).map((x) => (
                <li key={x} className="inline-flex items-center gap-2">
                  <Check aria-hidden className="size-4 text-haldi" />
                  {x}
                </li>
              ))}
            </motion.ul>
          </div>
          <HeroStage />
        </div>
      </section>

      {/* Works with */}
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-8 sm:px-8">
          <p className="text-sm text-muted">{hi ? "उन सबके साथ जो आप पहले से इस्तेमाल करते हैं" : "Works with what you already use"}</p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[1.1rem] font-semibold text-ink-2">
            {WORKS_WITH.map(([name, color]) => (
              <li key={name} className="inline-flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: color }} />
                {hi && name === "Your own page" ? "आपका अपना पेज" : hi && name === "Dine-in" ? "डाइन-इन" : name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
        <motion.div {...reveal()}>
          {eyebrow(hi ? "आज का हाल" : "The way it is today")}
          <h2 className="font-sign mt-3 max-w-[14ch] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1]">{hi ? "रेस्टोरेंट एक काम नहीं, चालीस काम है।" : "A restaurant isn't one job. It's forty."}</h2>
          <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-ink-2">
            {hi
              ? "Zomato और Swiggy ग्राहक लाते हैं। बाक़ी सब आपके ज़िम्मे: टैबलेट, कॉपी, ईमेल, WhatsApp, और स्टाफ़। हर एक अलग जगह। Zest इन्हें एक ऐप में ले आता है, ताकि आप खाने और मेहमानों पर ध्यान दे सकें।"
              : "Zomato and Swiggy bring the customers. Everything else lands on you: tablets, notebooks, inboxes, WhatsApp and staff, each in a different place. Zest brings it into one app, so you can get back to the food and the guests."}
          </p>
        </motion.div>
        <motion.div {...reveal(1)} className="relative rounded-[28px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)] sm:p-8">
          <ul className="flex flex-wrap gap-2.5">
            {TODAY.map((x, i) => (
              <li key={x.en} className="rounded-full bg-sunken px-4 py-2 text-[0.95rem] text-ink-2" style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}>
                {pick(x)}
              </li>
            ))}
          </ul>
          <div className="my-6 flex items-center gap-3 text-muted">
            <span className="h-px flex-1 bg-line" />
            <ArrowDown aria-hidden className="size-5" />
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-curry p-5 text-[#eef2ec]">
            <Wordmark className="text-[1.7rem] text-[#eef2ec] [&_.bg-turmeric]:bg-haldi" />
            <p className="text-[0.95rem] leading-snug text-[#eef2ec]/80">{hi ? "एक ऐप। एक लॉगिन। आपकी पूरी टीम।" : "One app. One login. Your whole team."}</p>
          </div>
        </motion.div>
      </section>

      {/* Platform pillars */}
      <section id="platform" className="scroll-mt-8 bg-surface py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="max-w-3xl">
            {eyebrow(hi ? "प्लेटफ़ॉर्म" : "The platform")}
            <h2 className="font-sign mt-3 text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1]">{hi ? "रेस्टोरेंट को जो कुछ चाहिए, सब एक जगह।" : "Everything your restaurant runs on."}</h2>
            <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-2">
              {hi ? "चार हिस्से, एक ऐप। हर हिस्सा उसी डेटा पर चलता है, इसलिए कुछ दो बार नहीं करना पड़ता।" : "Four parts, one app. Each runs on the same data, so nothing has to be done twice."}
            </p>
          </div>
          <ul className="mt-14 grid gap-5 md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <motion.li key={p.id} {...reveal(i)} className="flex flex-col rounded-[28px] bg-paper p-7 shadow-[0_0_0_1px_var(--line)] sm:p-9">
                <span className="grid size-12 place-items-center rounded-2xl bg-curry text-haldi">
                  <p.icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-6 text-[1.6rem] font-semibold tracking-[-0.02em]">{pick(p.name)}</h3>
                <p className="mt-1 text-lg text-ink-2">{pick(p.line)}</p>
                <ul className="mt-6 space-y-3">
                  {p.points.map((x) => (
                    <li key={x.en} className="flex gap-3 leading-relaxed">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-leaf" />
                      {pick(x)}
                    </li>
                  ))}
                </ul>
                {p.soon && <p className="mt-6 rounded-xl bg-turmeric-soft px-4 py-2.5 text-sm text-ink">{pick(p.soon)}</p>}
                <div className="mt-auto pt-6">
                  {p.id === "direct" ? (
                    <a href="/r/rasoi-27" className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                      {hi ? "सैंपल रेस्टोरेंट का पेज देखें" : "See a sample restaurant page"}
                      <ArrowRight aria-hidden className="size-4" />
                    </a>
                  ) : (
                    <button type="button" onClick={openDemo} className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                      {hi ? "डेमो किचन में देखें" : "See it in the demo kitchen"}
                      <ArrowRight aria-hidden className="size-4" />
                    </button>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product tour */}
      <section id="product" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-24 sm:px-8">
        {eyebrow(hi ? "काम करते हुए देखें" : "See it at work")}
        <h2 className="font-sign mt-3 max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1]">{hi ? "हर स्क्रीन के पीछे एक एजेंट।" : "Behind every screen, an agent at work."}</h2>
        <p className="mb-12 mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-2">{hi ? "एजेंट ड्राफ़्ट तैयार करते हैं, आप हाँ कहते हैं।" : "The agents prepare the work. You say yes."}</p>
        <Showcase />
      </section>

      {/* The brigade */}
      <section id="agents" className="scroll-mt-8 bg-curry text-[#eef2ec]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          {eyebrow(hi ? "AI एजेंट" : "AI agents", "dark")}
          <h2 className="font-sign mt-3 max-w-[16ch] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1] text-haldi">
            {hi ? "आपकी किचन ब्रिगेड, AI वाली।" : "A kitchen brigade that never takes a day off."}
          </h2>
          <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-[#eef2ec]/75">
            {hi
              ? "हर एजेंट का एक काम है, जैसे बड़ी किचन में होता है। Zest हेड शेफ़ है: आपकी बात सुनता है और सही एजेंट को देता है।"
              : "Each agent has one station, the way a big kitchen works. Zest is the head chef: it hears what you need and hands it to the right station."}
          </p>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BRIGADE.map((b, i) => (
              <motion.li key={b.name.en} {...reveal(i % 3)} className="group overflow-hidden rounded-3xl bg-curry-2 ring-1 ring-white/10">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={`/photos/${b.photo}.webp`} alt={b.alt} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-curry-2 via-curry-2/10 to-transparent" />
                  <span className="absolute bottom-4 left-5 grid size-11 place-items-center rounded-full bg-haldi text-ink shadow-lg">
                    <b.icon aria-hidden className="size-5" />
                  </span>
                </div>
                <div className="px-6 pb-7 pt-3">
                  <p className="text-sm text-[#eef2ec]/60">{pick(b.role)}</p>
                  <h3 className="text-[1.3rem] font-semibold">{pick(b.name)}</h3>
                  <p className="mt-2 leading-relaxed text-[#eef2ec]/80">{pick(b.does)}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Get set up in four steps */}
      <section id="start" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {eyebrow(hi ? "शुरुआत" : "Getting started")}
            <h2 className="font-sign mt-3 max-w-[16ch] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1]">{hi ? "चार क़दम में तैयार।" : "Up and running in four steps."}</h2>
          </div>
          {startButton("light")}
        </div>
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.li key={s.title.en} {...reveal(i)} className="relative rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)]">
              <span className="font-sign text-[2.6rem] leading-none text-haldi-deep">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 text-[1.2rem] font-semibold leading-snug">{pick(s.title)}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{pick(s.body)}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        <div className="grid items-center gap-10 rounded-[28px] bg-surface p-8 shadow-[0_0_0_1px_var(--line)] sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <ShieldCheck aria-hidden className="size-9 text-leaf" />
            <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-tight tracking-[-0.02em]">
              {hi ? "आपकी मंज़ूरी के बिना कुछ भी किचन से बाहर नहीं जाता।" : "Nothing leaves the kitchen without your OK."}
            </h2>
            <ul className="mt-5 space-y-2.5 text-[1.05rem] leading-relaxed text-ink-2">
              {[
                { en: "Every change starts as a draft that you approve.", hi: "हर बदलाव पहले ड्राफ़्ट बनता है, आप मंज़ूर करते हैं।" },
                { en: "Hard spend caps on every promo and ad.", hi: "प्रोमो और ऐड पर पक्की ख़र्च सीमा।" },
                { en: "Passwords stay encrypted and are never shown to the AI.", hi: "पासवर्ड एन्क्रिप्टेड रहते हैं और AI को नहीं दिखते।" },
                { en: "Each person sees only what their role needs.", hi: "हर व्यक्ति सिर्फ़ वही देखता है जो उसके काम के लिए ज़रूरी है।" },
                { en: "A record of everything, with undo.", hi: "हर काम का रिकॉर्ड, और वापस लेने का विकल्प।" },
              ].map((x) => (
                <li key={x.en} className="flex gap-3">
                  <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-leaf" />
                  {pick(x)}
                </li>
              ))}
            </ul>
          </div>
          <div className="ticket mx-auto w-full max-w-sm rotate-[-2deg] px-5 py-5">
            <div className="flex items-baseline justify-between text-[0.8rem]">
              <span className="text-muted">{hi ? "मेन्यू एजेंट" : "Menu agent"}</span>
              <span className="font-medium text-turmeric">{t("ticket.needsOk")}</span>
            </div>
            <p className="mt-2 font-medium">{hi ? "चोले भटूरे की क़ीमत ₹199 करें" : "Set chole bhature to ₹199"}</p>
            <p className="mt-1 text-sm text-ink-2">{hi ? "Swiggy पर ₹10 कम है, Zomato से मिलाना है।" : "It's ₹10 cheaper on Swiggy. Match Zomato."}</p>
            <div className="tear my-4" />
            <div className="flex gap-2">
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">{t("ticket.approve")}</span>
              <span className="rounded-full px-4 py-2 text-sm text-ink shadow-[inset_0_0_0_1px_var(--line)]">{t("ticket.edit")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-8 border-t border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
          <div>
            {eyebrow(hi ? "सवाल" : "Questions")}
            <h2 className="font-sign mt-3 max-w-[12ch] text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1]">{hi ? "जो मालिक अक्सर पूछते हैं।" : "What owners ask us."}</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q.en} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.15rem] font-medium">
                  {pick(f.q)}
                  <Plus aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 max-w-[64ch] leading-relaxed text-ink-2">{pick(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Get started, over a table of curries */}
      <section className="relative isolate overflow-hidden text-[#f4efe6]">
        <img src="/photos/cta-curries.webp" alt="" width={1800} height={900} loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(14,21,17,0.94)_25%,rgba(14,21,17,0.6)_60%,rgba(14,21,17,0.35))]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-sign max-w-[12ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95]">{t("landing.title")}</h2>
            <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-[#f4efe6]/75">
              {hi ? "Google से साइन इन करें और दो मिनट में शुरू करें। कोई POS या नया हार्डवेयर नहीं चाहिए।" : "Sign in with Google and start in two minutes. No POS or new hardware needed."}
            </p>
            <button type="button" onClick={openDemo} className="mt-8 inline-flex items-center gap-2 text-[#f4efe6]/80 underline-offset-4 hover:text-[#f4efe6] hover:underline">
              <Play aria-hidden className="size-3.5 fill-current" />
              {t("landing.demo")}
            </button>
          </div>
          <div className="rounded-3xl bg-paper p-6 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] sm:p-8">
            <JourneyRouter />
          </div>
        </div>
      </section>

      {/* Footer, grouped the same way as the platform */}
      <footer className="bg-curry text-[#eef2ec]/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Wordmark className="text-2xl text-[#eef2ec]" />
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed">{hi ? "रेस्टोरेंट चलाने के लिए एक ही ऐप। हिंदी और अंग्रेज़ी में।" : "The one app to run your restaurant. In Hindi and English."}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#eef2ec]">{hi ? "प्लेटफ़ॉर्म" : "Platform"}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {PILLARS.map((p) => (
                <li key={p.id}>
                  <a href="#platform" className="hover:text-[#eef2ec]">
                    {pick(p.name)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-[#eef2ec]">{hi ? "शुरू करें" : "Get started"}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => setRouterOpen(true)} className="hover:text-[#eef2ec]">
                  {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
                </button>
              </li>
              <li>
                <a href="/login" className="hover:text-[#eef2ec]">{hi ? "लॉग इन" : "Log in"}</a>
              </li>
              <li>
                <a href="/login/staff" className="hover:text-[#eef2ec]">{hi ? "स्टाफ़ साइन-इन" : "Staff sign-in"}</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-[#eef2ec]">{hi ? "देखें" : "See it"}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button type="button" onClick={openDemo} className="hover:text-[#eef2ec]">
                  {t("landing.demo")}
                </button>
              </li>
              <li>
                <a href="/r/rasoi-27" className="hover:text-[#eef2ec]">{hi ? "सैंपल रेस्टोरेंट पेज" : "Sample restaurant page"}</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#eef2ec]">{hi ? "सवाल" : "FAQ"}</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}
