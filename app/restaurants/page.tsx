"use client";

import "../landing.css";
import { useState } from "react";
import { BellRing, Hand, Handshake, IndianRupee, Link2, Mail, PhoneCall, Plus, Printer, X } from "lucide-react";
import { Estimator } from "@/components/landing/estimator";
import { HeroPhoto } from "@/components/landing/hero-photo";
import { Promises } from "@/components/landing/promises";
import { ZestAssistant } from "@/components/landing/zest-assistant";
import { DirectOrderJourney } from "@/components/landing/journey";
import { LostOrders } from "@/components/landing/lost-orders";
import { MorningSummary, RestaurantVoice } from "@/components/landing/restaurants";
import { SiteFooter } from "@/components/landing/site-footer";
import { PhotoStrip } from "@/components/landing/photo-strip";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
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

// Section titles: compact on a phone (ixigo-sized), full display size from laptops up.
const H2 = "lp-display text-[26px] leading-[1.1] lg:text-[clamp(30px,3.6vw,52px)] lg:leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[16px] leading-relaxed text-[var(--lp-muted)] lg:text-[18px]";

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
      <SiteHeader current="restaurants" start={{ href: START, label: { en: "Get started", hi: "शुरू करें" } }} />

      {/* First screen: what your own page could add */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-8 pt-5 lg:min-h-[min(820px,calc(100svh-76px))] lg:pb-12 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-6 sm:gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[30px] leading-[1.06] [text-wrap:balance] sm:text-[52px] xl:text-[60px]">
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
            <div id="hero-start" className="hero-in d2 mt-6 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={START} className="lp-btn haldi min-h-12 px-8 text-[17px] max-sm:w-full sm:min-h-14 sm:text-[18px]">
                {pick({ en: "Get your page free", hi: "अपना पेज मुफ़्त पाइए" })}
              </a>
            </div>
          </div>
          <HeroPhoto
            photo="/photos/in/restaurant-table.jpg"
            ratio="736 / 895"
            alt={pick({ en: "A restaurant spread: fried rice and noodles with veg balls, chilli chicken, gravy, crispy noodles, soup and a cold drink", hi: "रेस्टोरेंट की थाली: फ़्राइड राइस, नूडल्स, चिली चिकन, क्रिस्पी नूडल्स और सूप" })}
            order={{
              photo: "",
              when: { en: "Just now · 12:40 pm", hi: "अभी · दोपहर 12:40" },
              source: { en: "Your page", hi: "आपका पेज" },
              dish: { en: "Chinese combo for 12", hi: "12 लोगों का चाइनीज़ कॉम्बो" },
              detail: { en: "Office party · fried rice, chilli chicken", hi: "ऑफ़िस पार्टी · फ़्राइड राइस, चिली चिकन" },
              delivery: "rider",
              deliveryNote: { en: "3.8 km", hi: "3.8 किमी" },
              amount: 4188,
              method: "UPI",
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
      <section id="orders" aria-labelledby="orders-h" className="scroll-mt-4 py-10 lg:py-20">
        <div className="lp-wrap">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-12">
            <h2 id="orders-h" className={`rv max-w-[20ch] ${H2}`}>
              {pick({ en: "Orders slip through. Not anymore.", hi: "ऑर्डर छूटते थे। अब नहीं।" })}
            </h2>
            <p className={`rv d1 ${LEAD}`}>
              {pick({ en: "Calls, WhatsApps and party orders never reach Zomato or Swiggy. Today they get lost in the rush.", hi: "कॉल, WhatsApp और पार्टी के ऑर्डर Zomato या Swiggy तक नहीं पहुँचते। आज वे भीड़ में खो जाते हैं।" })}
            </p>
          </div>
          <div className="rv d2 mt-6 lg:mt-10">
            <LostOrders />
          </div>
        </div>
      </section>

      {/* How a direct order is delivered, played step by step */}
      <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-10 lg:py-20">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`rv max-w-[22ch] ${H2}`}>
            {pick({ en: "From your page to their plate.", hi: "आपके पेज से उनकी थाली तक।" })}
          </h2>
          <div className="rv d1 mt-6 lg:mt-10">
            <DirectOrderJourney />
          </div>
        </div>
      </section>

      <PhotoStrip
        line={{ en: "The orders Zomato and Swiggy never see.", hi: "वो ऑर्डर जो Zomato और Swiggy तक कभी नहीं पहुँचते।" }}
        sub={{ en: "Office lunches, party trays, a regular's usual. Now they come through your page, paid and on the list.", hi: "ऑफ़िस लंच, पार्टी ट्रे, किसी पुराने ग्राहक का रोज़ का ऑर्डर। अब ये आपके पेज से आते हैं, पेड और लिस्ट में।" }}
        orders={[
          { photo: "/photos/wall/w05.webp", when: { en: "Today · 12:30 pm", hi: "आज · दोपहर 12:30" }, source: { en: "Phone call", hi: "फ़ोन कॉल" }, dish: { en: "12 chicken curry, 24 naan", hi: "12 चिकन करी, 24 नान" }, detail: { en: "Office lunch · Infosys Gate 2", hi: "ऑफ़िस लंच · इन्फ़ोसिस गेट 2" }, delivery: "rider", deliveryNote: { en: "4.2 km", hi: "4.2 किमी" }, amount: 4560, method: "UPI" },
          { photo: "/photos/wall/w29.webp", when: { en: "Today · 8:05 pm", hi: "आज · रात 8:05" }, source: { en: "WhatsApp", hi: "WhatsApp" }, dish: { en: "2 dal makhani, 4 naan", hi: "2 दाल मखनी, 4 नान" }, detail: { en: "Rahul’s usual · 14th order", hi: "राहुल का रोज़ का · 14वाँ ऑर्डर" }, delivery: "rider", deliveryNote: { en: "2.1 km", hi: "2.1 किमी" }, amount: 734, method: "UPI" },
          { photo: "/photos/wall/w06.webp", when: { en: "Sat · 7:00 pm", hi: "शनि · शाम 7:00" }, source: { en: "Phone call", hi: "फ़ोन कॉल" }, dish: { en: "3 kg tandoori chicken", hi: "3 किलो तंदूरी चिकन" }, detail: { en: "Party tray · advance paid", hi: "पार्टी ट्रे · एडवांस मिला" }, delivery: "pickup", deliveryNote: { en: "Counter, 6:45 pm", hi: "काउंटर, शाम 6:45" }, amount: 3900, method: "UPI" },
          { photo: "/photos/wall/w30.webp", when: { en: "Today · 9:15 am", hi: "आज · सुबह 9:15" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "6 poori bhaji", hi: "6 पूरी भाजी" }, detail: { en: "Breakfast · extra pickle", hi: "नाश्ता · एक्स्ट्रा अचार" }, delivery: "pickup", deliveryNote: { en: "Counter", hi: "काउंटर" }, amount: 540, method: "UPI" },
          { photo: "/photos/wall/w26.webp", when: { en: "Sun · 9:30 pm", hi: "रवि · रात 9:30" }, source: { en: "Table QR", hi: "टेबल QR" }, dish: { en: "2 paneer butter masala", hi: "2 पनीर बटर मसाला" }, detail: { en: "With jeera rice · table 4", hi: "जीरा राइस के साथ · टेबल 4" }, delivery: "rider", deliveryNote: { en: "Home, 3.4 km", hi: "घर, 3.4 किमी" }, amount: 860, method: "Card" },
          { photo: "/photos/wall/w01.webp", when: { en: "Today · 1:40 pm", hi: "आज · दोपहर 1:40" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "8 curry and rice", hi: "8 करी चावल" }, detail: { en: "Hostel group · Block C", hi: "हॉस्टल ग्रुप · ब्लॉक C" }, delivery: "rider", deliveryNote: { en: "2.6 km", hi: "2.6 किमी" }, amount: 1520, method: "UPI" },
        ]}
      />

      {/* The Soundbox: the problem in a busy kitchen, and the one box that solves it */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 py-10 lg:py-20">
        {/* Phones: the heading, then the box itself, then the list. Wide screens: text left, box right. */}
        <div className="lp-wrap grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16 lg:gap-y-8">
          <div className="lg:col-start-1 lg:row-start-1">
            <h2 id="soundbox-h" className={`rv ${H2}`}>
              {pick({ en: "Three tablets. One rush. No missed orders.", hi: "तीन टैबलेट। एक भीड़। कोई ऑर्डर नहीं छूटता।" })}
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "The Zest Soundbox sits on your counter and calls out every order from Zomato, Swiggy and your page, in Hindi or English.",
                hi: "Zest Soundbox आपके काउंटर पर रहता है और Zomato, Swiggy और आपके पेज का हर ऑर्डर हिंदी या अंग्रेज़ी में बोलकर बताता है।",
              })}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-[28px] bg-[var(--lp-sunken)] px-4 py-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:py-8">
            <RestaurantVoice />
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <ul className="grid gap-2">
              {PAINS.map((p) => (
                <li key={p.pain.en} className="grid gap-0.5 rounded-2xl bg-[var(--lp-sunken)] px-4 py-3 sm:grid-cols-2 sm:gap-6 sm:px-5 sm:py-3.5">
                  <p className="flex items-start gap-2.5 text-[14px] text-[var(--lp-muted)] sm:text-[16px]">
                    <X aria-hidden size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[var(--lp-bad)]" />
                    {pick(p.pain)}
                  </p>
                  <p className="flex items-start gap-2.5 text-[15px] font-semibold sm:text-[16px]">
                    <p.icon aria-hidden size={18} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                    {pick(p.fix)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 lg:mt-8">
              {asking ? (
                <Waitlist page="/restaurants" section="restaurants-soundbox" defaultType="restaurant" />
              ) : (
                <button id="waitlist" type="button" onClick={() => setAsking(true)} className="lp-btn haldi scroll-mt-6">
                  {pick({ en: "Ask for a Soundbox", hi: "Soundbox मँगवाइए" })}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Morning summary, played on the owner's phone */}
      <section id="summary" aria-labelledby="summary-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-10 lg:py-20">
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
      <section id="final-start" aria-labelledby="start-h" className="bg-[var(--z-turmeric)] py-10 text-[#1c1f23] lg:py-20">
        <div className="lp-wrap grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
          <h2 id="start-h" className={H2}>
            {pick({ en: "Keep Zomato and Swiggy. Add your own.", hi: "Zomato और Swiggy रखिए। अपने ऑर्डर जोड़िए।" })}
          </h2>
          <LinkStart tone="turmeric" />
        </div>
      </section>

      <SiteFooter />

      <ZestAssistant audience="restaurants" />
    </div>
  );
}
