"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BookOpen, ChefHat, IndianRupee, Play, ReceiptText, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { LangToggle, Wordmark } from "@/components/bits";
import { DishStrip } from "@/components/landing/dish-strip";
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

  return (
    <div className="min-h-dvh overflow-x-clip">
      {/* Hero: warm, dark, photographic */}
      <section className="relative isolate overflow-hidden bg-[#0e1511] text-[#f4efe6]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_40%,rgba(242,176,53,0.16),transparent_70%),radial-gradient(40%_50%_at_10%_90%,rgba(178,58,42,0.18),transparent_70%)]" />
        <div aria-hidden className="grain absolute inset-0 -z-10 opacity-[0.07]" />
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <Wordmark className="text-[1.9rem] text-[#f4efe6] [&_.bg-turmeric]:bg-haldi" />
          <nav aria-label="Sections" className="hidden items-center gap-8 text-[0.95rem] text-[#f4efe6]/80 md:flex">
            <a href="#product" className="hover:text-[#f4efe6]">{hi ? "प्रोडक्ट" : "Product"}</a>
            <a href="#own" className="hover:text-[#f4efe6]">{hi ? "अपने ऑर्डर" : "Own orders"}</a>
            <a href="#agents" className="hover:text-[#f4efe6]">{hi ? "एजेंट" : "Agents"}</a>
            <a href="#journey" className="hover:text-[#f4efe6]">{hi ? "कैसे काम करता है" : "How it works"}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button type="button" onClick={() => setRouterOpen(true)} className="hidden rounded-full bg-haldi px-5 py-2.5 text-[0.95rem] font-medium text-[#17201c] transition-colors hover:bg-[#f6c25a] sm:block">
              {hi ? "शुरू करें" : "Get started"}
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-8 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32 lg:pt-14">
          <div>
            <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm text-[#f4efe6]/80 ring-1 ring-white/10">
              <span aria-hidden className="size-1.5 rounded-full bg-haldi" />
              {hi ? "Zomato और Swiggy रेस्टोरेंट पार्टनर्स के लिए" : "For Zomato and Swiggy restaurant partners"}
            </motion.p>
            <motion.h1 {...rise(0.08)} className="font-sign mt-6 max-w-[11ch] text-[clamp(3rem,7.6vw,6rem)] leading-[0.9]">
              {hi ? (
                <>
                  आपकी किचन, <span className="text-haldi">सँभली हुई।</span>
                </>
              ) : (
                <>
                  Your kitchen, <span className="text-haldi">sorted.</span>
                </>
              )}
            </motion.h1>
            <motion.p {...rise(0.2)} className="mt-7 max-w-[46ch] text-[1.2rem] leading-relaxed text-[#f4efe6]/75">
              {hi
                ? "Zest एजेंटों की एक टीम है जो आपका Zomato और Swiggy का काम चलाती है: मेन्यू, ऑर्डर, रिव्यू और पेआउट। हिंदी या अंग्रेज़ी में बात करें, यहाँ या WhatsApp पर।"
                : "Zest is a team of AI agents that runs your Zomato and Swiggy business: menu, orders, reviews and payouts. Talk to it in Hindi or English, here or on WhatsApp."}
            </motion.p>
            <motion.div {...rise(0.32)} className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRouterOpen(true)}
                className="group inline-flex items-center gap-2 rounded-full bg-haldi px-7 py-4 text-[1.05rem] font-semibold text-[#17201c] shadow-[0_18px_40px_-14px_rgba(242,176,53,0.6)] transition-transform hover:-translate-y-0.5"
              >
                {hi ? "अपना रेस्टोरेंट जोड़ें" : "Set up my restaurant"}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={openDemo}
                className="group inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-[1.05rem] font-medium text-[#f4efe6] ring-1 ring-white/20 transition-colors hover:bg-white/[0.06]"
              >
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
              {(hi ? ["हिंदी और अंग्रेज़ी", "WhatsApp पर भी", "कोई नया हार्डवेयर नहीं"] : ["Hindi and English", "Works on WhatsApp", "No new hardware"]).map((x) => (
                <li key={x} className="inline-flex items-center gap-2">
                  <span aria-hidden className="text-haldi">✓</span>
                  {x}
                </li>
              ))}
            </motion.ul>
          </div>
          <HeroStage />
        </div>
      </section>

      {/* Real dishes, priced on both platforms */}
      <section className="pt-16">
        <p className="mx-auto max-w-7xl px-4 text-sm font-medium uppercase tracking-wider text-muted sm:px-8">
          {hi ? "एक मेन्यू, हर प्लेटफ़ॉर्म पर एक जैसा" : "One menu, in sync on every platform"}
        </p>
        <div className="mt-5">
          <DishStrip />
        </div>
      </section>

      {/* Where it works */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-8">
        <p className="text-center text-muted">{hi ? "जहाँ आप पहले से बेचते हैं, वहीं काम करता है" : "Works where you already sell"}</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-10 gap-y-4 text-[1.25rem] font-semibold text-ink-2">
          {[
            ["Zomato", "var(--ch-zomato)"],
            ["Swiggy", "var(--ch-swiggy)"],
            [hi ? "डाइन-इन" : "Dine-in", "var(--ch-dine)"],
            [hi ? "आपकी अपनी साइट" : "Your own site", "var(--ch-direct)"],
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

      {/* All-in-one: the restaurant's own orders, next to the platforms */}
      <section id="own" className="scroll-mt-8 border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-muted">{hi ? "सब कुछ एक ऐप में" : "All in one"}</p>
              <h2 className="font-sign mt-2 max-w-[18ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1]">{hi ? "अपने ऑर्डर, बिना कमीशन।" : "Your own orders, no commission."}</h2>
              <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-ink-2">
                {hi
                  ? "Zomato और Swiggy के साथ-साथ आपकी अपनी ऑर्डरिंग साइट। ग्राहक पिकअप या टेबल से ऑर्डर करते हैं और सीधे आपको UPI से भुगतान करते हैं।"
                  : "Next to Zomato and Swiggy, your own ordering site. Customers order for pickup or from their table and pay you directly by UPI."}
              </p>
            </div>
            <a href="/r/rasoi-27" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper">
              {hi ? "सैंपल साइट से ऑर्डर करके देखें" : "Try ordering from the sample"}
              <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                [ReceiptText, { en: "Your ordering site", hi: "आपकी ऑर्डरिंग साइट" }, { en: "Your menu at your own link and table QR codes. Pay by UPI to you, or at the counter.", hi: "आपके लिंक और टेबल QR पर आपका मेन्यू। UPI से सीधे आपको, या काउंटर पर भुगतान।" }, false],
                [ChefHat, { en: "One live order board", hi: "एक लाइव ऑर्डर बोर्ड" }, { en: "Zomato, Swiggy, dine-in and your own orders appear together within seconds.", hi: "Zomato, Swiggy, डाइन-इन और आपके अपने ऑर्डर, सेकंडों में एक साथ।" }, false],
                [ShieldCheck, { en: "Staff sign-in and roles", hi: "स्टाफ़ साइन-इन और रोल" }, { en: "Owners use Google; kitchen and counter staff use a PIN and see only their screen.", hi: "मालिक Google से; किचन और काउंटर स्टाफ़ PIN से, और सिर्फ़ अपनी स्क्रीन देखते हैं।" }, false],
                [BookOpen, { en: "Hours and holidays", hi: "समय और छुट्टियाँ" }, { en: "Set opening hours once, including late nights and festival closures.", hi: "एक बार समय सेट करें, देर रात और त्योहार की छुट्टी समेत।" }, false],
                [Star, { en: "Your customer list", hi: "आपकी ग्राहक सूची" }, { en: "Every direct order adds the customer, so regulars are yours, not the platform's.", hi: "हर सीधा ऑर्डर ग्राहक को जोड़ता है, ताकि रेगुलर आपके रहें, प्लेटफ़ॉर्म के नहीं।" }, false],
                [TrendingUp, { en: "WhatsApp ordering, loyalty, Google reviews", hi: "WhatsApp ऑर्डर, लॉयल्टी, Google रिव्यू" }, { en: "Next: order on WhatsApp, points for regulars, and more Google reviews.", hi: "आगे: WhatsApp पर ऑर्डर, रेगुलर के लिए पॉइंट, और ज़्यादा Google रिव्यू।" }, true],
              ] as const
            ).map(([Icon, title, body, soon]) => (
              <li key={title.en} className="rounded-2xl bg-paper p-6 shadow-[0_0_0_1px_var(--line)]">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden className="size-6 text-ink-2" />
                  {soon && <span className="rounded-full bg-turmeric-soft px-2.5 py-0.5 text-xs font-medium text-ink">{hi ? "आगे आ रहा है" : "Coming next"}</span>}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{pick(title)}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-2">{pick(body)}</p>
              </li>
            ))}
          </ul>
        </div>
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
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BRIGADE.map((b, i) => (
              <motion.li
                key={b.name.en}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                className="group overflow-hidden rounded-3xl bg-curry-2 ring-1 ring-white/10"
              >
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

      {/* Journey: the plate fills up */}
      <section id="journey" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-24 sm:px-8">
        <h2 className="font-sign max-w-[20ch] text-[clamp(2rem,4.4vw,3.4rem)] leading-[1]">{t("landing.stages")}</h2>
        <ol className="mt-14 grid gap-12 md:grid-cols-3">
          {(
            [
              { n: "01", photo: "stage-new", alt: "Samosas with chutneys on a wooden board", title: "stage.1", sub: "stage.1.sub" },
              { n: "02", photo: "stage-operate", alt: "A chef tossing a flaming pan in a busy kitchen", title: "stage.2", sub: "stage.2.sub" },
              { n: "03", photo: "stage-scale", alt: "A warm, busy restaurant dining room", title: "stage.3", sub: "stage.3.sub" },
            ] as const
          ).map((s, i) => (
            <motion.li
              key={s.n}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-sunken">
                <img src={`/photos/${s.photo}.webp`} alt={s.alt} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="font-sign absolute bottom-4 left-5 text-[3.2rem] leading-none text-white/90">{s.n}</span>
              </div>
              <div className="mt-5">
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

      {/* Get started, over a table of curries */}
      <section className="relative isolate overflow-hidden text-[#f4efe6]">
        <img src="/photos/cta-curries.webp" alt="" width={1800} height={900} loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(14,21,17,0.94)_25%,rgba(14,21,17,0.6)_60%,rgba(14,21,17,0.35))]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-sign max-w-[12ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.95]">{t("landing.title")}</h2>
            <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-[#f4efe6]/75">
              {hi ? "दो मिनट में शुरू करें। कोई POS या नया सिस्टम नहीं चाहिए।" : "Start in two minutes. No POS or new hardware needed."}
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

      <footer className="bg-curry text-[#eef2ec]/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-8">
          <Wordmark className="text-xl text-[#eef2ec]" />
        </div>
      </footer>

      <RouterDialog open={routerOpen} onClose={() => setRouterOpen(false)} />
    </div>
  );
}
