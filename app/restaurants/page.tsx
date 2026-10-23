"use client";

import "../landing.css";
import { useState } from "react";
import { BellRing, Check, Hand, Handshake, IndianRupee, Link2, Mail, PhoneCall, Plus, Printer, X } from "lucide-react";
import { Estimator } from "@/components/landing/estimator";
import { HeroPhoto } from "@/components/landing/hero-photo";
import { Promises } from "@/components/landing/promises";
import { ZestAssistant } from "@/components/landing/zest-assistant";
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

const PAINS: { icon: typeof Plus; pain: Bi; fix: Bi }[] = [
  { icon: BellRing, pain: { en: "An order sits unseen on a tablet", hi: "टैबलेट पर ऑर्डर बिना देखे पड़ा रहता है" }, fix: { en: "It speaks every order out loud", hi: "यह हर ऑर्डर बोलकर बताता है" } },
  { icon: Hand, pain: { en: "Slow accepts turn into cancellations", hi: "देर से मंज़ूरी, फिर कैंसिलेशन" }, fix: { en: "One press on the top accepts it", hi: "ऊपर एक बार दबाइए, मंज़ूर" } },
  { icon: Printer, pain: { en: "KOTs written by hand", hi: "हाथ से लिखे KOT" }, fix: { en: "The ticket printer prints each one", hi: "टिकट प्रिंटर हर KOT छापता है" } },
  { icon: PhoneCall, pain: { en: "Nobody hears it in the rush", hi: "भीड़ में कोई सुनता नहीं" }, fix: { en: "It gets louder, then calls you", hi: "आवाज़ तेज़ होती है, फिर आपको फ़ोन" } },
];

const H2 = "lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[18px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]";

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
        className="min-h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[18px] outline-none placeholder:text-[#6f757c]"
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

      {/* First screen: what your own page could add */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-14 pt-6 lg:min-h-[min(820px,calc(100svh-76px))] lg:pb-12 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[36px] leading-[1.04] [text-wrap:balance] sm:text-[52px] xl:text-[60px]">
              {pick({ en: "Your restaurant could earn", hi: "आपका रेस्टोरेंट कमा सकता है" })}
            </h1>
            <div className="mt-3">
              <Estimator
                presets={[{ id: "restaurant", label: { en: "Restaurant", hi: "रेस्टोरेंट" }, orders: 10, avg: 300 }]}
                orders={[2, 60]}
                per={{ en: "more a month, from your own page", hi: "हर महीने और, आपके अपने पेज से" }}
                ordersLabel={{ en: "Direct orders a day", hi: "रोज़ के सीधे ऑर्डर" }}
              />
            </div>
            <div id="hero-start" className="hero-in d2 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={START} className="lp-btn haldi min-h-14 px-8 text-[18px] max-sm:w-full">
                {pick({ en: "Get your page free", hi: "अपना पेज मुफ़्त पाइए" })}
              </a>
            </div>
          </div>
          <HeroPhoto
            photo="/photos/in/restaurant-cook.webp"
            ratio="4 / 5"
            alt={pick({ en: "A cook at the kadhai over a live flame in a restaurant kitchen", hi: "रेस्टोरेंट की रसोई में तेज़ आँच पर कड़ाही चलाता रसोइया" })}
            order={{
              from: { en: "New order · your page", hi: "नया ऑर्डर · आपका पेज" },
              items: { en: "Office party: 12 chicken biryani", hi: "ऑफ़िस पार्टी: 12 चिकन बिरयानी" },
              paid: { en: "Paid ₹4,188 · UPI", hi: "₹4,188 मिले · UPI" },
              rider: { en: "Zomato rider · 1:40", hi: "Zomato राइडर · 1:40" },
            }}
          />
        </div>
      </section>

      {/* Three plain promises */}
      <Promises
        title={{ en: "Your regulars. Your page. Your orders.", hi: "आपके ग्राहक। आपका पेज। आपके ऑर्डर।" }}
        items={[
          { icon: Link2, title: { en: "One link, done", hi: "एक लिंक, बस" }, text: { en: "Paste your Zomato or Swiggy link. Your page, menu and photos are ready in a minute.", hi: "अपना Zomato या Swiggy लिंक डालिए। पेज, मेन्यू और फ़ोटो एक मिनट में तैयार।" } },
          { icon: IndianRupee, title: { en: "Every rupee, yours", hi: "हर रुपया, आपका" }, text: { en: "Free to start. Customers pay you by UPI, and they stay your customers.", hi: "शुरुआत मुफ़्त। ग्राहक UPI से आपको भुगतान करते हैं, और आपके ग्राहक बने रहते हैं।" } },
          { icon: Handshake, title: { en: "Zomato and Swiggy stay", hi: "Zomato और Swiggy बने रहें" }, text: { en: "Nothing changes on Zomato or Swiggy. Zomato riders deliver your own orders too.", hi: "Zomato या Swiggy पर कुछ नहीं बदलता। आपके अपने ऑर्डर भी Zomato राइडर पहुँचाते हैं।" } },
        ]}
      />

      {/* Why: the orders a restaurant already gets outside Zomato and Swiggy, and loses */}
      <section id="orders" aria-labelledby="orders-h" className="scroll-mt-4 py-16 lg:py-20">
        <div className="lp-wrap">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-12">
            <h2 id="orders-h" className={`rv max-w-[20ch] ${H2}`}>
              {pick({ en: "Orders slip through. Not anymore.", hi: "ऑर्डर छूटते थे। अब नहीं।" })}
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
            {pick({ en: "From your page to their plate.", hi: "आपके पेज से उनकी थाली तक।" })}
          </h2>
          <div className="rv d1 mt-10">
            <DirectOrderJourney />
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
                  {pick({ en: "Yesterday's sales, on WhatsApp by 7:30.", hi: "कल की बिक्री, सुबह 7:30 तक WhatsApp पर।" })}
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
      <ZestAssistant audience="restaurants" />
    </div>
  );
}
