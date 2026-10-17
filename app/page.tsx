"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, ChefHat, IndianRupee, ReceiptText, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { LangToggle, Wordmark } from "@/components/bits";
import { Dish } from "@/components/dishes";
import { LiveKitchen } from "@/components/landing/live-kitchen";
import { JourneyRouter, RouterDialog } from "@/components/landing/router";
import { Showcase } from "@/components/landing/showcase";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

const BRIGADE: { icon: typeof Star; role: Bi; name: Bi; does: Bi }[] = [
  {
    icon: ChefHat,
    role: { en: "Head chef", hi: "हेड शेफ़" },
    name: { en: "Zest", hi: "Zest" },
    does: { en: "Takes your message, decides who handles it, and checks the work before it reaches you.", hi: "आपका मैसेज लेता है, तय करता है कौन संभालेगा, और काम आप तक पहुँचने से पहले जाँचता है।" },
  },
  {
    icon: BookOpen,
    role: { en: "Menu", hi: "मेन्यू" },
    name: { en: "Menu agent", hi: "मेन्यू एजेंट" },
    does: { en: "Keeps prices, photos and stock in sync on every platform. Pauses dishes the moment you run out.", hi: "हर प्लेटफ़ॉर्म पर क़ीमत, फ़ोटो और स्टॉक एक जैसा रखता है। सामान ख़त्म होते ही डिश रोक देता है।" },
  },
  {
    icon: ReceiptText,
    role: { en: "Pass", hi: "पास" },
    name: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
    does: { en: "Watches every ticket, flags late ones, and tells riders and customers before they ask.", hi: "हर टिकट पर नज़र, देर वाले पकड़ता है, और राइडर व ग्राहक को पूछने से पहले बताता है।" },
  },
  {
    icon: Star,
    role: { en: "Front of house", hi: "फ़्रंट ऑफ़ हाउस" },
    name: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
    does: { en: "Replies to every review and complaint in your voice, and spots patterns like cold dal on Fridays.", hi: "हर रिव्यू और शिकायत का आपके अंदाज़ में जवाब, और पैटर्न पकड़ता है, जैसे शुक्रवार को ठंडी दाल।" },
  },
  {
    icon: IndianRupee,
    role: { en: "Galla", hi: "गल्ला" },
    name: { en: "Money agent", hi: "पैसे वाला एजेंट" },
    does: { en: "Matches payouts to orders and your bank, explains every deduction, and disputes the wrong ones.", hi: "पेआउट को ऑर्डर और बैंक से मिलाता है, हर कटौती समझाता है, और ग़लत वाली पर डिस्प्यूट करता है।" },
  },
  {
    icon: TrendingUp,
    role: { en: "Growth", hi: "ग्रोथ" },
    name: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
    does: { en: "Plans promos and ads with a spend cap, then stops them on its own if they aren't paying off.", hi: "ख़र्च सीमा के साथ प्रोमो और ऐड प्लान करता है, और फ़ायदा न हो तो अपने-आप रोक देता है।" },
  },
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

  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } };

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Hero, on haldi */}
      <section className="relative bg-haldi text-ink">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <Wordmark className="text-[1.9rem] [&_.bg-turmeric]:bg-chilli" />
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[0.95rem] md:flex">
            <a href="#product" className="hover:underline hover:underline-offset-4">{hi ? "प्रोडक्ट" : "Product"}</a>
            <a href="#agents" className="hover:underline hover:underline-offset-4">{hi ? "एजेंट" : "Agents"}</a>
            <a href="#journey" className="hover:underline hover:underline-offset-4">{hi ? "कैसे काम करता है" : "How it works"}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button type="button" onClick={() => setRouterOpen(true)} className="hidden rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper sm:block">
              {hi ? "शुरू करें" : "Get started"}
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-16 pt-6 sm:px-8 lg:grid-cols-[1fr_1fr] lg:pb-24 lg:pt-10">
          <div>
            <motion.h1 {...rise(0.05)} className="font-sign max-w-[11ch] text-[clamp(2.9rem,7.4vw,5.6rem)] leading-[0.92]">
              {hi ? "आपकी किचन, सँभली हुई।" : "Your kitchen, sorted."}
            </motion.h1>
            <motion.p {...rise(0.18)} className="mt-6 max-w-[46ch] text-[1.2rem] leading-relaxed text-ink/80">
              {hi
                ? "Zest एजेंटों की एक टीम है जो आपका Zomato और Swiggy का काम चलाती है: मेन्यू, ऑर्डर, रिव्यू और पेआउट। हिंदी या अंग्रेज़ी में बात करें, यहाँ या WhatsApp पर।"
                : "Zest is a team of AI agents that runs your Zomato and Swiggy business: menu, orders, reviews and payouts. Talk to it in Hindi or English, here or on WhatsApp."}
            </motion.p>
            <motion.div {...rise(0.3)} className="mt-9 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setRouterOpen(true)} className="rounded-full bg-ink px-7 py-3.5 text-[1.05rem] font-medium text-paper shadow-[0_12px_30px_-12px_rgba(20,30,20,0.6)] transition-transform hover:-translate-y-0.5">
                {hi ? "शुरू करें" : "Get started"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/outlet/demo", { method: "POST" });
                  window.location.href = "/app";
                }}
                className="rounded-full px-6 py-3.5 text-[1.05rem] font-medium shadow-[inset_0_0_0_1.5px_var(--ink)] transition-colors hover:bg-ink hover:text-paper"
              >
                {t("landing.demo")}
              </button>
            </motion.div>
          </div>
          <LiveKitchen />
        </div>

        {/* Scalloped edge, like a banana-leaf border */}
        <svg aria-hidden viewBox="0 0 1440 28" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px block h-6 w-full text-paper">
          <path fill="currentColor" d="M0 28 V14 Q30 0 60 14 T120 14 T180 14 T240 14 T300 14 T360 14 T420 14 T480 14 T540 14 T600 14 T660 14 T720 14 T780 14 T840 14 T900 14 T960 14 T1020 14 T1080 14 T1140 14 T1200 14 T1260 14 T1320 14 T1380 14 T1440 14 V28z" />
        </svg>
      </section>

      {/* Where it works */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-8">
        <p className="text-center text-muted">{hi ? "जहाँ आप पहले से बेचते हैं, वहीं काम करता है" : "Works where you already sell"}</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-10 gap-y-4 text-[1.25rem] font-semibold text-ink-2">
          {[
            ["Zomato", "var(--ch-zomato)"],
            ["Swiggy", "var(--ch-swiggy)"],
            [hi ? "डाइन-इन" : "Dine-in", "var(--ch-dine)"],
            ["WhatsApp", "var(--veg)"],
            ["Gmail", "var(--ink-2)"],
            ["Petpooja", "var(--ink-2)"],
          ].map(([name, color]) => (
            <li key={name} className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: color }} />
              {name}
            </li>
          ))}
        </ul>
      </section>

      {/* Product showcase */}
      <section id="product" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-24 sm:px-8">
        <h2 className="font-sign max-w-[18ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1]">
          {hi ? "रेस्टोरेंट का सारा काम, एक जगह।" : "Everything your restaurant runs on, in one place."}
        </h2>
        <p className="mb-12 mt-4 max-w-[56ch] text-lg leading-relaxed text-ink-2">
          {hi ? "हर स्क्रीन पर एक एजेंट काम कर रहा है। आप बस मंज़ूरी देते हैं।" : "Behind every screen there's an agent doing the work. You just say yes."}
        </p>
        <Showcase />
      </section>

      {/* The brigade */}
      <section id="agents" className="scroll-mt-8 bg-curry text-[#eef2ec]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="font-sign max-w-[16ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1] text-haldi">
                {hi ? "आपकी किचन ब्रिगेड, AI वाली।" : "A kitchen brigade that never takes a day off."}
              </h2>
              <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-[#eef2ec]/75">
                {hi
                  ? "हर एजेंट का एक काम है, जैसे बड़ी किचन में होता है। Zest हेड शेफ़ है: आपकी बात सुनता है और सही एजेंट को देता है।"
                  : "Each agent has one station, the way a big kitchen works. Zest is the head chef: it hears what you need and hands it to the right station."}
              </p>
            </div>
            <Dish kind="biryani" size={170} steam className="hidden lg:block" />
          </div>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {BRIGADE.map((b, i) => (
              <li key={b.name.en} className={`bg-curry p-7 ${i === 0 ? "bg-curry-2" : ""}`}>
                <span className="grid size-11 place-items-center rounded-full bg-haldi text-ink">
                  <b.icon aria-hidden className="size-5" />
                </span>
                <p className="mt-5 text-sm text-[#eef2ec]/60">{pick(b.role)}</p>
                <h3 className="text-[1.3rem] font-semibold">{pick(b.name)}</h3>
                <p className="mt-2 leading-relaxed text-[#eef2ec]/80">{pick(b.does)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Journey: the plate fills up */}
      <section id="journey" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-24 sm:px-8">
        <h2 className="font-sign max-w-[20ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1]">{t("landing.stages")}</h2>
        <ol className="mt-14 grid gap-12 md:grid-cols-3">
          {(
            [
              { n: "1", dish: "butter-naan", title: "stage.1", sub: "stage.1.sub" },
              { n: "2", dish: "dal-makhani", title: "stage.2", sub: "stage.2.sub" },
              { n: "3", dish: "thali", title: "stage.3", sub: "stage.3.sub" },
            ] as const
          ).map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="flex h-[150px] items-end">
                <Dish kind={s.dish} size={96 + i * 24} />
              </div>
              <div className="mt-6 border-t-2 border-ink pt-4">
                <span className="text-sm text-muted">{s.n}</span>
                <h3 className="mt-1 text-[1.35rem] font-semibold">{t(s.title)}</h3>
                <p className="mt-2 max-w-[38ch] leading-relaxed text-ink-2">{t(s.sub)}</p>
              </div>
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
              <li>{hi ? "हर बदलाव पहले ड्राफ़्ट बनता है, आप मंज़ूर करते हैं।" : "Every change starts as a draft that you approve."}</li>
              <li>{hi ? "प्रोमो और ऐड पर पक्की ख़र्च सीमा।" : "Hard spend caps on every promo and ad."}</li>
              <li>{hi ? "पासवर्ड एन्क्रिप्टेड रहते हैं और AI को नहीं दिखते।" : "Passwords stay encrypted and are never shown to the AI."}</li>
              <li>{hi ? "हर काम का रिकॉर्ड, और वापस लेने का विकल्प।" : "A record of everything, with undo."}</li>
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

      {/* Get started, on haldi */}
      <section className="bg-haldi text-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-sign max-w-[12ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95]">{t("landing.title")}</h2>
            <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-ink/80">
              {hi ? "दो मिनट में शुरू करें। कोई POS या नया सिस्टम नहीं चाहिए।" : "Start in two minutes. No POS or new hardware needed."}
            </p>
          </div>
          <JourneyRouter tone="haldi" />
        </div>
      </section>

      <footer className="bg-curry text-[#eef2ec]/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-8">
          <Wordmark className="text-xl text-[#eef2ec]" />
          <span>{hi ? "Zomato, Swiggy और डाइन-इन के साथ काम करता है। किसी एक प्लेटफ़ॉर्म से जुड़ा नहीं।" : "Works with Zomato, Swiggy and dine-in. Not tied to any one platform."}</span>
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}
