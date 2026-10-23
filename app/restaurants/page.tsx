"use client";

import "../landing.css";
import Image from "next/image";
import { useState } from "react";
import { BellRing, Check, Hand, Mail, PhoneCall, Plus, Printer, X } from "lucide-react";
import { HeroPhone } from "@/components/landing/hero-phone";
import { DirectOrderJourney } from "@/components/landing/journey";
import { LostOrders } from "@/components/landing/lost-orders";
import { MorningSummary, RestaurantVoice } from "@/components/landing/restaurants";
import { SiteFooter } from "@/components/landing/site-footer";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyStart } from "@/components/landing/sticky-start";
import { Waitlist } from "@/components/landing/waitlist";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// /restaurants: for restaurants already selling on Zomato or Swiggy. Source of truth:
// docs/landing-brief.md, section 5. One message: keep every Zomato and Swiggy order, and add the orders
// they never see (calls, WhatsApp, parties, dine-in guests at home, people searching your name), taken on
// your own page and delivered by Zomato riders. Zest sits alongside Zomato and Swiggy; it never asks a
// restaurant to leave them. Uses the sample restaurant Rasoi 27.

const START = "/join?journey=live";

const ALONGSIDE: { title: Bi; text: Bi }[] = [
  { title: { en: "You stay on Zomato and Swiggy", hi: "आप Zomato और Swiggy पर बने रहते हैं" }, text: { en: "Nothing changes in your listings, ratings or orders there.", hi: "वहाँ आपकी लिस्टिंग, रेटिंग और ऑर्डर में कुछ नहीं बदलता।" } },
  { title: { en: "Your menu comes from your listing", hi: "मेन्यू आपकी लिस्टिंग से आता है" }, text: { en: "Paste your link and your dishes, photos and prices come across.", hi: "लिंक डालिए, आपकी डिश, फ़ोटो और दाम अपने-आप आ जाते हैं।" } },
  { title: { en: "The riders you already know", hi: "वही राइडर जिन्हें आप जानते हैं" }, text: { en: "Zomato riders pick up from the same counter they always do.", hi: "Zomato राइडर उसी काउंटर से उठाते हैं, जहाँ से हमेशा उठाते हैं।" } },
  { title: { en: "One kitchen, one flow", hi: "एक रसोई, एक तरीक़ा" }, text: { en: "Orders from your page sound and print just like Zomato and Swiggy orders.", hi: "आपके पेज के ऑर्डर भी Zomato और Swiggy के ऑर्डर की तरह बोले और छपते हैं।" } },
];

const PAINS: { icon: typeof Plus; pain: Bi; fix: Bi }[] = [
  { icon: BellRing, pain: { en: "An order sits unseen on a tablet", hi: "टैबलेट पर ऑर्डर बिना देखे पड़ा रहता है" }, fix: { en: "It speaks every order out loud", hi: "यह हर ऑर्डर बोलकर बताता है" } },
  { icon: Hand, pain: { en: "Slow accepts turn into cancellations", hi: "देर से मंज़ूरी, फिर कैंसिलेशन" }, fix: { en: "One press on the top accepts it", hi: "ऊपर एक बार दबाइए, मंज़ूर" } },
  { icon: Printer, pain: { en: "KOTs written by hand", hi: "हाथ से लिखे KOT" }, fix: { en: "The ticket printer prints each one", hi: "टिकट प्रिंटर हर KOT छापता है" } },
  { icon: PhoneCall, pain: { en: "Nobody hears it in the rush", hi: "भीड़ में कोई सुनता नहीं" }, fix: { en: "It gets louder, then calls you", hi: "आवाज़ तेज़ होती है, फिर आपको फ़ोन" } },
];

const H2 = "lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]";

/** A Zomato or Swiggy link goes to sign-up with the listing filled in. */
function joinUrl(raw: string) {
  const link = raw.trim();
  const platform = /swiggy/i.test(link) ? "swiggy" : "zomato";
  const q = new URLSearchParams({ journey: "live", live: platform, ...(/zomato|swiggy/i.test(link) ? { [platform]: link } : {}) });
  return `/join?${q}`;
}

/** Paste your Zomato or Swiggy link, get your page. Used in the hero and the closing band. */
function LinkStart({ id, tone = "light" }: { id?: string; tone?: "light" | "turmeric" }) {
  const { pick } = useApp();
  const [link, setLink] = useState("");
  const inputId = `${id ?? "close"}-link`;
  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = joinUrl(link);
      }}
      className={`flex w-full max-w-[580px] flex-col gap-2 rounded-[28px] p-2 sm:flex-row sm:rounded-full ${tone === "light" ? "bg-[var(--lp-paper)] outline outline-1 -outline-offset-1 outline-[var(--lp-line)]" : "bg-[#fafaf6] text-[#1c1f23]"}`}
    >
      <label htmlFor={inputId} className="sr-only">
        {pick({ en: "Your Zomato or Swiggy link", hi: "आपका Zomato या Swiggy लिंक" })}
      </label>
      <input
        id={inputId}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        inputMode="url"
        placeholder={pick({ en: "Paste your Zomato or Swiggy link", hi: "अपना Zomato या Swiggy लिंक डालिए" })}
        className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[17px] outline-none placeholder:text-[#6f757c]"
      />
      <button type="submit" className={`lp-btn shrink-0 ${tone === "light" ? "haldi" : "!bg-[#1c1f23] !text-[#fafaf6]"}`}>
        {pick({ en: "Get your page free", hi: "अपना पेज मुफ़्त पाइए" })}
      </button>
    </form>
  );
}

export default function Restaurants() {
  const { pick } = useApp();
  const [asking, setAsking] = useState(false);

  return (
    <div className={`lp min-h-dvh overflow-x-clip ${siteFonts}`}>
      <SiteHeader current="restaurants" start={{ href: START, label: { en: "Get started free", hi: "मुफ़्त शुरू करें" } }} />

      {/* First screen: one pitch, one action, one phone */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-14 pt-6 lg:min-h-[calc(100svh-76px)] lg:pb-16 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[36px] leading-[1.03] [text-wrap:balance] sm:text-[60px] xl:text-[72px]">
              {pick({ en: "Orders Zomato and Swiggy never see.", hi: "वे ऑर्डर जो Zomato और Swiggy तक नहीं पहुँचते।" })}
            </h1>
            <p className={`hero-in d1 mt-6 ${LEAD} sm:text-[19px]`}>
              {pick({
                en: "Phone, WhatsApp and party orders on your own page, paid by UPI and delivered by Zomato riders. Your listings stay just as they are.",
                hi: "फ़ोन, WhatsApp और पार्टी के ऑर्डर आपके अपने पेज पर, UPI से भुगतान और Zomato राइडर से डिलीवरी। आपकी लिस्टिंग वैसी ही रहती है।",
              })}
            </p>
            <div className="hero-in d2 mt-8">
              <LinkStart id="hero-start" />
              <p className="mt-4 px-2 text-[15px] text-[var(--lp-muted)]">
                {pick({ en: "Ready in a minute, with your menu and photos.", hi: "एक मिनट में तैयार, आपके मेन्यू और फ़ोटो के साथ।" })}{" "}
                <a href="/r/rasoi-27" className="lp-link font-medium text-[var(--lp-ink)]">
                  {pick({ en: "See a sample", hi: "सैंपल देखिए" })}
                </a>
              </p>
            </div>
          </div>
          <HeroPhone
            name={{ en: "Rasoi 27", hi: "Rasoi 27" }}
            meta={{ en: "North Indian · Biryani · Indiranagar", hi: "नॉर्थ इंडियन · बिरयानी · इंदिरानगर" }}
            cover="/photos/hero-sizzler.webp"
            dishes={[
              { name: { en: "Chicken biryani", hi: "चिकन बिरयानी" }, price: 349, photo: "/photos/dish-biryani.webp" },
              { name: { en: "Butter chicken", hi: "बटर चिकन" }, price: 329, photo: "/photos/dish-butter-chicken.webp" },
              { name: { en: "Tandoori chicken", hi: "तंदूरी चिकन" }, price: 379, photo: "/photos/dish-tandoori.webp" },
            ]}
            order={{
              from: { en: "New order · your page", hi: "नया ऑर्डर · आपका पेज" },
              items: { en: "Office party: 12 chicken biryani", hi: "ऑफ़िस पार्टी: 12 चिकन बिरयानी" },
              paid: { en: "Paid ₹4,188 · UPI", hi: "₹4,188 मिले · UPI" },
              rider: { en: "Zomato rider · 1:40", hi: "Zomato राइडर · 1:40" },
            }}
          />
        </div>
      </section>

      {/* Why: the orders a restaurant already gets outside Zomato and Swiggy, and loses */}
      <section id="orders" aria-labelledby="orders-h" className="scroll-mt-4 py-16 lg:py-20">
        <div className="lp-wrap">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-12">
            <h2 id="orders-h" className={`rv max-w-[20ch] ${H2}`}>
              {pick({ en: "The orders you already get, and lose.", hi: "जो ऑर्डर आपको पहले से मिलते हैं, और छूट जाते हैं।" })}
            </h2>
            <p className={`rv d1 ${LEAD}`}>
              {pick({ en: "Calls, WhatsApps and party orders never reach Zomato or Swiggy. Today they get lost in the rush.", hi: "कॉल, WhatsApp और पार्टी के ऑर्डर Zomato या Swiggy तक नहीं पहुँचते। आज वे भीड़ में खो जाते हैं।" })}
            </p>
          </div>
          <div className="rv d2 mt-10">
            <LostOrders />
          </div>
        </div>
      </section>

      {/* How a direct order is delivered, played step by step */}
      <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`rv max-w-[22ch] ${H2}`}>
            {pick({ en: "How a direct order reaches your customer.", hi: "सीधा ऑर्डर आपके ग्राहक तक कैसे पहुँचता है।" })}
          </h2>
          <div className="rv d1 mt-10">
            <DirectOrderJourney />
          </div>
        </div>
      </section>

      {/* Alongside Zomato and Swiggy, never instead: a kitchen at the pass, and four promises */}
      <section aria-labelledby="alongside-h" className="bg-[#15181b] py-16 text-[#f1f1ec] lg:py-20">
        <div className="lp-wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="rv relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image src="/photos/team-pass.webp" alt={pick({ en: "Plates going out from a restaurant kitchen", hi: "रेस्टोरेंट की रसोई से निकलती प्लेटें" })} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 id="alongside-h" className={`rv ${H2}`}>
              {pick({ en: "Built to sit alongside Zomato and Swiggy.", hi: "Zomato और Swiggy के साथ-साथ चलने के लिए बना।" })}
            </h2>
            <ul className="rv d1 mt-8 space-y-6">
              {ALONGSIDE.map((a) => (
                <li key={a.title.en} className="flex gap-4">
                  <Check aria-hidden size={22} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                  <div>
                    <h3 className="text-[18px] font-semibold leading-snug">{pick(a.title)}</h3>
                    <p className="mt-1 text-[16px] leading-relaxed text-[#b4b9be]">{pick(a.text)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The Soundbox: the problem in a busy kitchen, and the one box that solves it */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 py-16 lg:py-20">
        <div className="lp-wrap grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <h2 id="soundbox-h" className={`rv ${H2}`}>
              {pick({ en: "Three tablets. One rush. No missed orders.", hi: "तीन टैबलेट। एक भीड़। कोई ऑर्डर नहीं छूटता।" })}
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "The Zest Soundbox sits on your counter and calls out every order from Zomato, Swiggy and your page, in Hindi or English.",
                hi: "Zest Soundbox आपके काउंटर पर रहता है और Zomato, Swiggy और आपके पेज का हर ऑर्डर हिंदी या अंग्रेज़ी में बोलकर बताता है।",
              })}
            </p>
            <ul className="mt-8 grid gap-2">
              {PAINS.map((p) => (
                <li key={p.pain.en} className="grid gap-1 rounded-2xl bg-[var(--lp-sunken)] px-4 py-3.5 sm:grid-cols-2 sm:gap-6 sm:px-5">
                  <p className="flex items-start gap-2.5 text-[16px] text-[var(--lp-muted)]">
                    <X aria-hidden size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[var(--lp-bad)]" />
                    {pick(p.pain)}
                  </p>
                  <p className="flex items-start gap-2.5 text-[16px] font-semibold">
                    <p.icon aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                    {pick(p.fix)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {asking ? (
                <Waitlist page="/restaurants" section="restaurants-soundbox" defaultType="restaurant" />
              ) : (
                <button id="waitlist" type="button" onClick={() => setAsking(true)} className="lp-btn haldi scroll-mt-6">
                  {pick({ en: "Ask for a Soundbox", hi: "Soundbox मँगवाइए" })}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center rounded-[28px] bg-[var(--lp-sunken)] px-4 py-8 lg:sticky lg:top-6">
            <RestaurantVoice />
            <p className="mt-2 text-center text-[14px] text-[var(--lp-muted)]">{pick({ en: "Press the top of the box to accept.", hi: "मंज़ूर करने के लिए डिब्बे के ऊपर दबाइए।" })}</p>
          </div>
        </div>
      </section>

      {/* Morning summary, played on the owner's phone */}
      <section id="summary" aria-labelledby="summary-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-16 lg:py-20">
        <div className="lp-wrap">
          <MorningSummary
            intro={
              <>
                <h2 id="summary-h" className={H2}>
                  {pick({ en: "Your numbers, before the shutter opens.", hi: "शटर खुलने से पहले, आपका हिसाब।" })}
                </h2>
                <p className={`mt-4 ${LEAD}`}>{pick({ en: "One WhatsApp at 7:30 every morning, built from your Zomato and Swiggy emails.", hi: "हर सुबह 7:30 बजे एक WhatsApp, आपके Zomato और Swiggy ईमेल से बना।" })}</p>
              </>
            }
            cta={
              <a href={START} className="lp-btn haldi">
                <Mail aria-hidden size={18} />
                {pick({ en: "Connect your email", hi: "अपना ईमेल जोड़िए" })}
              </a>
            }
          />
        </div>
      </section>

      {/* Closing call to action */}
      <section id="final-start" aria-labelledby="start-h" className="bg-[var(--z-turmeric)] py-14 text-[#1c1f23] lg:py-20">
        <div className="lp-wrap grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
          <h2 id="start-h" className={H2}>
            {pick({ en: "Keep Zomato and Swiggy. Add your own.", hi: "Zomato और Swiggy रखिए। अपने ऑर्डर जोड़िए।" })}
          </h2>
          <LinkStart tone="turmeric" />
        </div>
      </section>

      <SiteFooter />

      <StickyStart
        href={START}
        label={{ en: "Get started", hi: "शुरू करें" }}
        note={{ en: "More orders, on top of Zomato and Swiggy.", hi: "Zomato और Swiggy के ऊपर, और ऑर्डर।" }}
        watch="hero-start"
        hideAt="final-start"
      />
    </div>
  );
}
