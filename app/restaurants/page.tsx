"use client";

import "../landing.css";
import { useState } from "react";
import { BellRing, Hand, Languages, Lock, Plus, Printer } from "lucide-react";
import { MorningSummary, RasoiPhone, RestaurantStage, RestaurantVoice } from "@/components/landing/restaurants";
import { SiteFooter } from "@/components/landing/site-footer";
import { Soon } from "@/components/landing/soon";
import { SiteHeader, type NavLink } from "@/components/landing/site-header";
import { Waitlist } from "@/components/landing/waitlist";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// /restaurants: for restaurants already on Zomato or Swiggy. The Soundbox for every order, their own
// ordering page for regulars, and a morning summary of every app from their email. Source of truth:
// docs/landing-brief.md, section 5. Uses the sample restaurant Rasoi 27.

const NAV: NavLink[] = [
  { href: "#voice", label: { en: "Soundbox", hi: "Soundbox" } },
  { href: "#summary", label: { en: "Morning summary", hi: "सुबह की रिपोर्ट" } },
  { href: "#page", label: { en: "Your page", hi: "आपका पेज" } },
  { href: "#faq", label: { en: "Questions", hi: "सवाल" } },
  { href: "/", label: { en: "For home kitchens", hi: "घर की रसोई के लिए" } },
];

const FAQ: { q: Bi; a: Bi; soon?: boolean }[] = [
  { q: { en: "Do I need to leave Zomato or Swiggy?", hi: "क्या मुझे Zomato या Swiggy छोड़ना होगा?" }, a: { en: "No. Zest works alongside them.", hi: "नहीं। Zest उनके साथ-साथ काम करता है।" } },
  { q: { en: "What does Zest read in my email?", hi: "Zest मेरे ईमेल में क्या पढ़ता है?" }, a: { en: "Only order, payout and rating emails from your food apps.", hi: "सिर्फ़ आपके फ़ूड ऐप के ऑर्डर, पेआउट और रेटिंग वाले ईमेल।" } },
  { q: { en: "When can I get the Soundbox?", hi: "Soundbox कब मिलेगा?" }, a: { en: "Join the waitlist; we're starting with a small group of kitchens.", hi: "वेटलिस्ट में जुड़िए; हम कुछ चुनी हुई रसोइयों से शुरू कर रहे हैं।" } },
  { q: { en: "Who delivers orders from my own page?", hi: "मेरे अपने पेज के ऑर्डर कौन पहुँचाता है?" }, a: { en: "Zomato riders, with live tracking.", hi: "Zomato राइडर, लाइव ट्रैकिंग के साथ।" }, soon: true },
];

const H2 = "lp-display text-[clamp(34px,4vw,58px)] leading-[1.02] [text-wrap:balance]";
const LEAD = "max-w-[38em] text-[18px] leading-relaxed text-[var(--lp-muted)]";


/** A Zomato or Swiggy link goes to sign-up with the listing filled in. */
function joinUrl(raw: string) {
  const link = raw.trim();
  const platform = /swiggy/i.test(link) ? "swiggy" : "zomato";
  const q = new URLSearchParams({ journey: "live", live: platform, ...(/zomato|swiggy/i.test(link) ? { [platform]: link } : {}) });
  return `/join?${q}`;
}

export default function Restaurants() {
  const { pick } = useApp();
  const [link, setLink] = useState("");

  return (
    <div className="lp min-h-dvh overflow-x-clip">
      <SiteHeader nav={NAV} start={{ href: "/join?journey=live", label: { en: "Get started free", hi: "मुफ़्त शुरू करें" } }} />

      {/* Hero */}
      <section aria-labelledby="hero-h" className="lp-wrap pb-20 pt-6 lg:pb-28 lg:pt-12">
        <h1 id="hero-h" className="lp-display max-w-[17ch] text-[40px] leading-[1.02] [text-wrap:balance] sm:text-[60px] lg:max-w-none lg:text-[clamp(56px,5.2vw,80px)]">
          {pick({ en: "Never miss an order. Know every app by morning.", hi: "कोई ऑर्डर न छूटे। सुबह तक हर ऐप का हाल जानिए।" })}
        </h1>
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
          <div>
            <p className="max-w-[36em] text-[18px] leading-relaxed text-[var(--lp-muted)]">
              {pick({
                en: "For restaurants on Zomato and Swiggy. The Zest Soundbox speaks every order in your kitchen. Your own ordering page brings regulars to you, delivered by Zomato riders. And every morning, Zest tells you how each app did.",
                hi: "Zomato और Swiggy वाले रेस्टोरेंट के लिए। Zest Soundbox आपकी रसोई में हर ऑर्डर बोलकर बताता है। आपका अपना ऑर्डर पेज पुराने ग्राहकों को सीधे आप तक लाता है, Zomato राइडर डिलीवरी करते हैं। और हर सुबह Zest बताता है कि कौन-सा ऐप कैसा चला।",
              })}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = joinUrl(link);
              }}
              className="mt-8 flex w-full max-w-[580px] flex-col gap-2 rounded-[28px] bg-[var(--lp-paper)] p-2 outline outline-1 -outline-offset-1 outline-[var(--lp-line)] sm:flex-row sm:rounded-full"
            >
              <label htmlFor="r-link" className="sr-only">
                {pick({ en: "Your Zomato or Swiggy link", hi: "आपका Zomato या Swiggy लिंक" })}
              </label>
              <input
                id="r-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                inputMode="url"
                placeholder={pick({ en: "Your Zomato or Swiggy link", hi: "आपका Zomato या Swiggy लिंक" })}
                className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[17px] outline-none placeholder:text-[var(--lp-faint)]"
              />
              <button type="submit" className="lp-btn haldi shrink-0">
                {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
              </button>
            </form>
            <p className="mt-4 px-2 text-[16px]">
              <a href="#waitlist" className="lp-link font-medium">
                {pick({ en: "Join the Soundbox waitlist", hi: "Soundbox वेटलिस्ट में जुड़ें" })}
              </a>
            </p>
          </div>
          <div>
            <RestaurantStage />
            <p className="mt-4 text-center text-[14px] text-[var(--lp-muted)] sm:text-right">
              {pick({ en: "Announcing Zomato and Swiggy orders needs order access from those apps.", hi: "Zomato और Swiggy ऑर्डर बोलने के लिए उन ऐप से ऑर्डर की पहुँच चाहिए।" })}
              <Soon />
            </p>
          </div>
        </div>
      </section>

      {/* One voice for every order */}
      <section id="voice" aria-labelledby="voice-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="voice-h" className={H2}>
            {pick({ en: "One voice for every order.", hi: "हर ऑर्डर के लिए एक आवाज़।" })}
            <Soon />
          </h2>
          <p className={`mt-4 ${LEAD}`}>
            {pick({
              en: "Your page, Zomato and Swiggy, all spoken by one box on your counter. Let this one ring and see what happens.",
              hi: "आपका पेज, Zomato और Swiggy, सब काउंटर पर रखा एक डिब्बा बोलकर बताता है। इसे बजने दीजिए और देखिए क्या होता है।",
            })}
          </p>
          <div className="mt-12 grid items-start gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
            <div className="flex flex-col items-center">
              <RestaurantVoice />
            </div>
            <div>
              <ul className="grid gap-5 sm:grid-cols-2">
                {[
                  { icon: Languages, t: { en: "Speaks every order", hi: "हर ऑर्डर बोलकर बताता है" } },
                  { icon: Hand, t: { en: "One button to accept", hi: "मंज़ूर करने के लिए एक बटन" } },
                  { icon: Printer, t: { en: "Prints the KOT", hi: "KOT छापता है" } },
                  { icon: BellRing, t: { en: "Gets louder if an order is missed, then calls you", hi: "ऑर्डर छूटे तो आवाज़ तेज़, फिर आपको फ़ोन" } },
                ].map((f) => (
                  <li key={f.t.en} className="flex items-start gap-3 text-[18px] font-medium leading-snug">
                    <f.icon aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                    {pick(f.t)}
                  </li>
                ))}
              </ul>
              <p className="mb-4 mt-10 text-[17px] font-semibold">{pick({ en: "Join the Soundbox waitlist", hi: "Soundbox वेटलिस्ट में जुड़ें" })}</p>
              <Waitlist page="/restaurants" section="restaurants-voice" defaultType="restaurant" />
            </div>
          </div>
        </div>
      </section>

      {/* Morning summary */}
      <section id="summary" aria-labelledby="summary-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="summary-h" className={H2}>
              {pick({ en: "Know how every app did, before you open them.", hi: "ऐप खोलने से पहले जानिए हर ऐप कैसा चला।" })}
              <Soon />
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "Connect your email once. Zest reads the order, payout and rating emails from Zomato and Swiggy and sends you one summary every morning, on WhatsApp and out loud on the Soundbox.",
                hi: "एक बार अपना ईमेल जोड़िए। Zest, Zomato और Swiggy के ऑर्डर, पेआउट और रेटिंग वाले ईमेल पढ़ता है और हर सुबह एक रिपोर्ट भेजता है, WhatsApp पर और Soundbox पर बोलकर।",
              })}
            </p>
            <div className="mt-8 flex gap-3 rounded-[20px] bg-[var(--lp-paper)] p-5 outline outline-2 -outline-offset-2 outline-[var(--z-leaf)]">
              <Lock aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--z-leaf)]" />
              <p className="text-[17px] font-medium leading-relaxed">
                {pick({
                  en: "Zest only reads emails from your food apps. It never sends email, never shares it, and you can disconnect anytime.",
                  hi: "Zest सिर्फ़ आपके फ़ूड ऐप के ईमेल पढ़ता है। वह कभी ईमेल नहीं भेजता, कभी किसी से साझा नहीं करता, और आप कभी भी कनेक्शन हटा सकते हैं।",
                })}
              </p>
            </div>
          </div>
          <MorningSummary />
        </div>
      </section>

      {/* A page for your regulars */}
      <section id="page" aria-labelledby="page-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-20 lg:py-28">
        <div className="lp-wrap grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <div>
            <h2 id="page-h" className={H2}>
              {pick({ en: "Your regulars can order from you directly.", hi: "आपके पुराने ग्राहक सीधे आपसे ऑर्डर कर सकते हैं।" })}
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "Paste your Zomato or Swiggy link and your own ordering page is ready, with your menu, photos and prices. Zomato riders deliver, and the guest stays yours.",
                hi: "अपना Zomato या Swiggy लिंक डालिए और आपका अपना ऑर्डर पेज तैयार, आपके मेन्यू, फ़ोटो और क़ीमतों के साथ। Zomato राइडर डिलीवरी करते हैं, और ग्राहक आपका रहता है।",
              })}
            </p>
            <p className="mt-4 text-[15px] text-[var(--lp-muted)]">
              {pick({ en: "Your page is live today; delivery by Zomato riders is", hi: "आपका पेज आज से चालू है; Zomato राइडर से डिलीवरी" })}
              <Soon />
            </p>
            <p className="mt-6 text-[17px]">
              <a href="/r/rasoi-27" className="lp-link font-semibold">
                {pick({ en: "See Rasoi 27's page", hi: "Rasoi 27 का पेज देखिए" })}
              </a>
            </p>
          </div>
          <RasoiPhone />
        </div>
      </section>

      {/* Questions */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap grid gap-10 lg:grid-cols-12">
          <h2 id="faq-h" className={`lg:col-span-4 ${H2}`}>
            {pick({ en: "Questions restaurants ask", hi: "रेस्टोरेंट क्या पूछते हैं" })}
          </h2>
          <div className="grid gap-3 lg:col-span-8">
            {FAQ.map((f) => (
              <details key={f.q.en} className="group rounded-2xl bg-[var(--lp-paper)] px-6">
                <summary className="flex min-h-[64px] items-center justify-between gap-6 py-4 text-[18px] font-semibold">
                  <span>
                    {pick(f.q)}
                    {f.soon && <Soon />}
                  </span>
                  <Plus aria-hidden size={22} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[60ch] pb-6 text-[17px] leading-relaxed text-[var(--lp-muted)]">{pick(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
