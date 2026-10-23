"use client";

import "../landing.css";
import { useState } from "react";
import { BellRing, Check, Hand, Mail, PhoneCall, Plus, Printer, X } from "lucide-react";
import { AudienceSwitch } from "@/components/landing/audience-switch";
import { DirectOrderJourney } from "@/components/landing/journey";
import { LostOrders } from "@/components/landing/lost-orders";
import { MorningSummary, RestaurantStage, RestaurantVoice } from "@/components/landing/restaurants";
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

const FAQ: { q: Bi; a: Bi }[] = [
  { q: { en: "Do I need to leave Zomato or Swiggy?", hi: "क्या मुझे Zomato या Swiggy छोड़ना होगा?" }, a: { en: "No. Zest works alongside them. Your listings, ratings and orders there stay exactly as they are.", hi: "नहीं। Zest उनके साथ-साथ काम करता है। वहाँ आपकी लिस्टिंग, रेटिंग और ऑर्डर वैसे ही रहते हैं।" } },
  { q: { en: "Will it change anything on Zomato or Swiggy?", hi: "क्या Zomato या Swiggy पर कुछ बदलेगा?" }, a: { en: "No. Your page only adds the orders that come to you directly: calls, WhatsApp, parties and guests who already know you.", hi: "नहीं। आपका पेज सिर्फ़ वे ऑर्डर जोड़ता है जो सीधे आपके पास आते हैं: कॉल, WhatsApp, पार्टी और वे ग्राहक जो आपको पहले से जानते हैं।" } },
  { q: { en: "Who delivers orders from my page?", hi: "मेरे पेज के ऑर्डर कौन पहुँचाता है?" }, a: { en: "You choose for each order: a Zomato rider, your own staff, or pickup at your counter. The customer gets a tracking link.", hi: "हर ऑर्डर के लिए आप चुनिए: Zomato राइडर, आपका अपना स्टाफ़, या काउंटर से पिकअप। ग्राहक को ट्रैकिंग लिंक मिलता है।" } },
  { q: { en: "What does delivery cost?", hi: "डिलीवरी का ख़र्च कितना है?" }, a: { en: "It depends on the distance. You decide whether the customer pays, you cover it, or it's free above an order amount.", hi: "यह दूरी पर निर्भर है। आप तय कीजिए: ग्राहक दे, आप दें, या एक रक़म से ऊपर के ऑर्डर पर मुफ़्त।" } },
  { q: { en: "Does the Soundbox work with my Zomato and Swiggy orders?", hi: "क्या Soundbox मेरे Zomato और Swiggy ऑर्डर के साथ काम करता है?" }, a: { en: "Yes. It connects to Zomato, Swiggy and your POS, and calls out every order from them and from your page.", hi: "हाँ। यह Zomato, Swiggy और आपके POS से जुड़ता है, और उनका और आपके पेज का हर ऑर्डर बोलकर बताता है।" } },
  { q: { en: "What does Zest read in my email?", hi: "Zest मेरे ईमेल में क्या पढ़ता है?" }, a: { en: "Only order, payout and rating emails from Zomato and Swiggy. It never sends email and never shares it.", hi: "सिर्फ़ Zomato और Swiggy के ऑर्डर, पेआउट और रेटिंग वाले ईमेल। यह कभी ईमेल नहीं भेजता और कभी साझा नहीं करता।" } },
  { q: { en: "What does it cost?", hi: "इसका ख़र्च कितना है?" }, a: { en: "Your page is free to start.", hi: "आपका पेज शुरू करना मुफ़्त है।" } },
];

const H2 = "lp-display text-[clamp(30px,3.4vw,48px)] leading-[1.04] [text-wrap:balance]";
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
      <SiteHeader start={{ href: START, label: { en: "Get started free", hi: "मुफ़्त शुरू करें" } }} />

      {/* Hero: keep Zomato and Swiggy, add the orders they never see */}
      <section aria-labelledby="hero-h" className="lp-wrap pb-6 pt-2 sm:pb-12 lg:pb-16 lg:pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div>
            <AudienceSwitch current="restaurants" />
            <h1 id="hero-h" className="lp-display mt-6 text-[40px] leading-[1.02] [text-wrap:balance] sm:mt-8 sm:text-[60px] xl:text-[72px]">
              {pick({ en: "Orders Zomato and Swiggy never see.", hi: "वे ऑर्डर जो Zomato और Swiggy तक नहीं पहुँचते।" })}
            </h1>
            <p className={`mt-5 ${LEAD}`}>
              {pick({
                en: "Phone, WhatsApp and party orders, taken on your own page, paid by UPI and delivered by Zomato riders. Your Zomato and Swiggy listings stay just as they are.",
                hi: "फ़ोन, WhatsApp और पार्टी के ऑर्डर, आपके अपने पेज पर, UPI से भुगतान और Zomato राइडर से डिलीवरी। Zomato और Swiggy पर आपकी लिस्टिंग वैसी ही रहती है।",
              })}
            </p>
            <div className="mt-7">
              <LinkStart id="hero-start" />
            </div>
            <p className="mt-3 px-2 text-[15px] text-[var(--lp-muted)]">
              {pick({ en: "Your page is ready in a minute, with your menu and photos.", hi: "एक मिनट में आपका पेज तैयार, आपके मेन्यू और फ़ोटो के साथ।" })}{" "}
              <a href="/r/rasoi-27" className="lp-link font-medium text-[var(--lp-ink)]">
                {pick({ en: "See a sample", hi: "सैंपल देखिए" })}
              </a>
            </p>
          </div>
          <RestaurantStage />
        </div>
      </section>

      {/* Why: the orders a restaurant already gets outside Zomato and Swiggy, and loses */}
      <section id="orders" aria-labelledby="orders-h" className="scroll-mt-4 py-12 lg:py-14">
        <div className="lp-wrap">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-12">
            <h2 id="orders-h" className={`max-w-[20ch] ${H2}`}>
              {pick({ en: "The orders you already get, and lose.", hi: "जो ऑर्डर आपको पहले से मिलते हैं, और छूट जाते हैं।" })}
            </h2>
            <p className={LEAD}>
              {pick({ en: "Calls, WhatsApps and party orders never reach Zomato or Swiggy. Today they get lost in the rush.", hi: "कॉल, WhatsApp और पार्टी के ऑर्डर Zomato या Swiggy तक नहीं पहुँचते। आज वे भीड़ में खो जाते हैं।" })}
            </p>
          </div>
          <div className="mt-8">
            <LostOrders />
          </div>
        </div>
      </section>

      {/* How a direct order is delivered, played step by step */}
      <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-12 lg:py-16">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`max-w-[22ch] ${H2}`}>
            {pick({ en: "How a direct order reaches your customer.", hi: "सीधा ऑर्डर आपके ग्राहक तक कैसे पहुँचता है।" })}
          </h2>
          <div className="mt-8">
            <DirectOrderJourney />
          </div>
        </div>
      </section>

      {/* Alongside Zomato and Swiggy, never instead */}
      <section aria-labelledby="alongside-h" className="bg-[#15181b] py-12 text-[#f1f1ec] lg:py-16">
        <div className="lp-wrap">
          <h2 id="alongside-h" className={`max-w-[20ch] ${H2}`}>
            {pick({ en: "Built to sit alongside Zomato and Swiggy.", hi: "Zomato और Swiggy के साथ-साथ चलने के लिए बना।" })}
          </h2>
          <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {ALONGSIDE.map((a) => (
              <li key={a.title.en}>
                <Check aria-hidden size={22} strokeWidth={3} className="text-[var(--z-turmeric)]" />
                <h3 className="mt-3 text-[18px] font-semibold leading-snug">{pick(a.title)}</h3>
                <p className="mt-1.5 text-[16px] leading-relaxed text-[#b4b9be]">{pick(a.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The Soundbox: the problem in a busy kitchen, and the one box that solves it */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 py-12 lg:py-16">
        <div className="lp-wrap grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <h2 id="soundbox-h" className={H2}>
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
      <section id="summary" aria-labelledby="summary-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-12 lg:py-14">
        <div className="lp-wrap">
          <MorningSummary
            intro={
              <>
                <h2 id="summary-h" className={H2}>
                  {pick({ en: "Know your numbers before you open the shutter.", hi: "शटर खुलने से पहले अपना हिसाब जानिए।" })}
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

      {/* Questions */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-4 py-12 lg:py-16">
        <div className="lp-wrap grid gap-8 lg:grid-cols-12 lg:gap-10">
          <h2 id="faq-h" className={`lg:col-span-4 ${H2}`}>
            {pick({ en: "Questions restaurants ask", hi: "रेस्टोरेंट क्या पूछते हैं" })}
          </h2>
          <div className="grid gap-3 lg:col-span-8">
            {FAQ.map((f) => (
              <details key={f.q.en} className="group rounded-2xl bg-[var(--lp-paper)] px-5 sm:px-6">
                <summary className="flex min-h-[60px] items-center justify-between gap-4 py-4 text-[17px] font-semibold sm:text-[18px]">
                  <span>{pick(f.q)}</span>
                  <Plus aria-hidden size={22} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[60ch] pb-5 text-[16px] leading-relaxed text-[var(--lp-muted)] sm:text-[17px]">{pick(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section id="final-start" aria-labelledby="start-h" className="bg-[var(--z-turmeric)] py-14 text-[#1c1f23] lg:py-20">
        <div className="lp-wrap grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
          <h2 id="start-h" className={H2}>
            {pick({ en: "Keep Zomato and Swiggy. Add your own orders.", hi: "Zomato और Swiggy रखिए। अपने ऑर्डर भी जोड़िए।" })}
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
