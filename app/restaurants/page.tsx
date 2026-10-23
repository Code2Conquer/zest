"use client";

import "../landing.css";
import Image from "next/image";
import { useState } from "react";
import { BellRing, Check, Hand, Mail, MessageSquareReply, PhoneCall, Plus, Printer, Sigma, Wallet, X } from "lucide-react";
import { AudienceSwitch } from "@/components/landing/audience-switch";
import { DirectOrderJourney } from "@/components/landing/journey";
import { MorningSummary, RestaurantStage, RestaurantVoice } from "@/components/landing/restaurants";
import { SiteFooter } from "@/components/landing/site-footer";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyStart } from "@/components/landing/sticky-start";
import { Waitlist } from "@/components/landing/waitlist";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// /restaurants: for restaurants already selling on Zomato or Swiggy. Source of truth:
// docs/landing-brief.md, section 5. One message: keep every app order, and add the orders the apps
// never see (calls, WhatsApp, parties, dine-in guests at home, people searching your name), taken on
// your own page and delivered by Zomato riders. Zest sits alongside the apps; it never asks a
// restaurant to leave them. Uses the sample restaurant Rasoi 27.

const START = "/join?journey=live";

// The orders every restaurant already gets outside the apps: how they go today, and with Zest.
const LOST: { photo: string; who: Bi; today: Bi; zest: Bi }[] = [
  { photo: "/photos/dish-curry-naan.webp", who: { en: "Regulars who call", hi: "फ़ोन करने वाले ग्राहक" }, today: { en: "A slip of paper, lost in the rush", hi: "एक पर्ची, भीड़ में खो गई" }, zest: { en: "Your link, paid by UPI, saved", hi: "आपका लिंक, UPI से भुगतान, सेव" } },
  { photo: "/photos/hero-biryani.webp", who: { en: "Office and party orders", hi: "ऑफ़िस और पार्टी ऑर्डर" }, today: { en: "Long calls and a cash advance", hi: "लंबी कॉल और नकद एडवांस" }, zest: { en: "One link, paid upfront", hi: "एक लिंक, पहले से भुगतान" } },
  { photo: "/photos/team-guests.webp", who: { en: "Dine-in guests, at home", hi: "डाइन-इन मेहमान, घर पर" }, today: { en: "Loved the food, forgot your name", hi: "खाना पसंद आया, नाम भूल गए" }, zest: { en: "A QR on the bill brings them back", hi: "बिल पर QR उन्हें वापस लाता है" } },
  { photo: "/photos/stage-scale.webp", who: { en: "People searching your name", hi: "आपका नाम खोजने वाले" }, today: { en: "Google shows a busy line", hi: "Google पर लाइन व्यस्त" }, zest: { en: "An Order button instead", hi: "उसकी जगह ऑर्डर बटन" } },
];

const ALONGSIDE: { title: Bi; text: Bi }[] = [
  { title: { en: "You stay on Zomato and Swiggy", hi: "आप Zomato और Swiggy पर बने रहते हैं" }, text: { en: "Nothing changes in your listings, ratings or app orders.", hi: "आपकी लिस्टिंग, रेटिंग और ऐप ऑर्डर में कुछ नहीं बदलता।" } },
  { title: { en: "Your menu comes from your listing", hi: "मेन्यू आपकी लिस्टिंग से आता है" }, text: { en: "Paste your link and your dishes, photos and prices come across.", hi: "लिंक डालिए, आपकी डिश, फ़ोटो और दाम अपने-आप आ जाते हैं।" } },
  { title: { en: "The riders you already know", hi: "वही राइडर जिन्हें आप जानते हैं" }, text: { en: "Zomato riders pick up from the same counter as your app orders.", hi: "Zomato राइडर उसी काउंटर से उठाते हैं जहाँ से ऐप के ऑर्डर जाते हैं।" } },
  { title: { en: "One kitchen, one flow", hi: "एक रसोई, एक तरीक़ा" }, text: { en: "Orders from your page sound and print just like app orders.", hi: "आपके पेज के ऑर्डर भी ऐप के ऑर्डर की तरह बोले और छपते हैं।" } },
];

const PAINS: { icon: typeof Plus; pain: Bi; fix: Bi }[] = [
  { icon: BellRing, pain: { en: "An order sits unseen on a tablet", hi: "टैबलेट पर ऑर्डर बिना देखे पड़ा रहता है" }, fix: { en: "It speaks every order out loud", hi: "यह हर ऑर्डर बोलकर बताता है" } },
  { icon: Hand, pain: { en: "Slow accepts turn into cancellations", hi: "देर से मंज़ूरी, फिर कैंसिलेशन" }, fix: { en: "One press on the top accepts it", hi: "ऊपर एक बार दबाइए, मंज़ूर" } },
  { icon: Printer, pain: { en: "KOTs written by hand", hi: "हाथ से लिखे KOT" }, fix: { en: "The ticket printer prints each one", hi: "टिकट प्रिंटर हर KOT छापता है" } },
  { icon: PhoneCall, pain: { en: "Nobody hears it in the rush", hi: "भीड़ में कोई सुनता नहीं" }, fix: { en: "It gets louder, then calls you", hi: "आवाज़ तेज़ होती है, फिर आपको फ़ोन" } },
];

const SUMMARY: { icon: typeof Plus; title: Bi; text: Bi }[] = [
  { icon: Sigma, title: { en: "Every app, one total", hi: "हर ऐप, एक जोड़" }, text: { en: "No more opening three dashboards.", hi: "तीन डैशबोर्ड खोलने की ज़रूरत नहीं।" } },
  { icon: Wallet, title: { en: "Payouts, before they land", hi: "पेआउट, आने से पहले" }, text: { en: "What is coming, from which app, and when.", hi: "कितना, किस ऐप से, और कब।" } },
  { icon: MessageSquareReply, title: { en: "Bad reviews, handled", hi: "ख़राब रिव्यू, संभले हुए" }, text: { en: "A reply in your voice. One tap to post.", hi: "आपकी भाषा में जवाब। एक टैप में पोस्ट।" } },
];

const FAQ: { q: Bi; a: Bi }[] = [
  { q: { en: "Do I need to leave Zomato or Swiggy?", hi: "क्या मुझे Zomato या Swiggy छोड़ना होगा?" }, a: { en: "No. Zest works alongside them. Your listings, ratings and app orders stay exactly as they are.", hi: "नहीं। Zest उनके साथ-साथ काम करता है। आपकी लिस्टिंग, रेटिंग और ऐप ऑर्डर वैसे ही रहते हैं।" } },
  { q: { en: "Will it change anything on the apps?", hi: "क्या ऐप पर कुछ बदलेगा?" }, a: { en: "No. Your page only adds the orders that come to you directly: calls, WhatsApp, parties and guests who already know you.", hi: "नहीं। आपका पेज सिर्फ़ वे ऑर्डर जोड़ता है जो सीधे आपके पास आते हैं: कॉल, WhatsApp, पार्टी और वे ग्राहक जो आपको पहले से जानते हैं।" } },
  { q: { en: "Who delivers orders from my page?", hi: "मेरे पेज के ऑर्डर कौन पहुँचाता है?" }, a: { en: "You choose for each order: a Zomato rider, your own staff, or pickup at your counter. The customer gets a tracking link.", hi: "हर ऑर्डर के लिए आप चुनिए: Zomato राइडर, आपका अपना स्टाफ़, या काउंटर से पिकअप। ग्राहक को ट्रैकिंग लिंक मिलता है।" } },
  { q: { en: "What does delivery cost?", hi: "डिलीवरी का ख़र्च कितना है?" }, a: { en: "It depends on the distance. You decide whether the customer pays, you cover it, or it's free above an order amount.", hi: "यह दूरी पर निर्भर है। आप तय कीजिए: ग्राहक दे, आप दें, या एक रक़म से ऊपर के ऑर्डर पर मुफ़्त।" } },
  { q: { en: "Does the Soundbox work with my Zomato and Swiggy orders?", hi: "क्या Soundbox मेरे Zomato और Swiggy ऑर्डर के साथ काम करता है?" }, a: { en: "Yes. It connects to your apps and your POS, and calls out every order from Zomato, Swiggy and your page.", hi: "हाँ। यह आपके ऐप और POS से जुड़ता है, और Zomato, Swiggy और आपके पेज का हर ऑर्डर बोलकर बताता है।" } },
  { q: { en: "What does Zest read in my email?", hi: "Zest मेरे ईमेल में क्या पढ़ता है?" }, a: { en: "Only order, payout and rating emails from your food apps. It never sends email and never shares it.", hi: "सिर्फ़ आपके फ़ूड ऐप के ऑर्डर, पेआउट और रेटिंग वाले ईमेल। यह कभी ईमेल नहीं भेजता और कभी साझा नहीं करता।" } },
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

      {/* Hero: keep the apps, add the orders they never see */}
      <section aria-labelledby="hero-h" className="lp-wrap pb-6 pt-2 sm:pb-12 lg:pb-16 lg:pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div>
            <AudienceSwitch current="restaurants" />
            <h1 id="hero-h" className="lp-display mt-6 text-[40px] leading-[1.02] [text-wrap:balance] sm:mt-8 sm:text-[60px] xl:text-[72px]">
              {pick({ en: "More orders, beyond the apps.", hi: "ऐप के अलावा, और ऑर्डर।" })}
            </h1>
            <p className={`mt-5 ${LEAD}`}>
              {pick({
                en: "Stay on Zomato and Swiggy. Take the phone, WhatsApp and party orders they never see on your own page, paid by UPI and delivered by Zomato riders.",
                hi: "Zomato और Swiggy पर बने रहिए। जो फ़ोन, WhatsApp और पार्टी के ऑर्डर वहाँ तक नहीं पहुँचते, उन्हें अपने पेज पर लीजिए, UPI से भुगतान और Zomato राइडर से डिलीवरी।",
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

      {/* Why: the orders a restaurant already gets outside the apps, and loses */}
      <section id="orders" aria-labelledby="orders-h" className="scroll-mt-4 py-12 lg:py-14">
        <div className="lp-wrap">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-12">
            <h2 id="orders-h" className={`max-w-[20ch] ${H2}`}>
              {pick({ en: "The orders you already get, and lose.", hi: "जो ऑर्डर आपको पहले से मिलते हैं, और छूट जाते हैं।" })}
            </h2>
            <p className={LEAD}>
              {pick({ en: "Calls, WhatsApps and party orders never reach the apps. Today they get lost in the rush.", hi: "कॉल, WhatsApp और पार्टी के ऑर्डर ऐप तक नहीं पहुँचते। आज वे भीड़ में खो जाते हैं।" })}
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LOST.map((x) => (
              <li key={x.who.en} className="flex gap-3 overflow-hidden rounded-[20px] bg-[var(--lp-sunken)] p-3 lg:flex-col lg:p-0">
                <Image src={x.photo} alt="" width={480} height={240} sizes="(min-width: 1024px) 25vw, 96px" className="size-24 shrink-0 rounded-[14px] object-cover lg:h-28 lg:w-full lg:rounded-none" />
                <div className="min-w-0 py-0.5 lg:px-4 lg:pb-4 lg:pt-1">
                  <h3 className="text-[17px] font-semibold leading-snug">{pick(x.who)}</h3>
                  <p className="mt-1.5 flex gap-2 text-[14.5px] leading-snug text-[var(--lp-muted)]">
                    <X aria-hidden size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[var(--lp-bad)]" />
                    {pick(x.today)}
                  </p>
                  <p className="mt-1 flex gap-2 text-[14.5px] font-semibold leading-snug">
                    <Check aria-hidden size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--lp-good)]" />
                    {pick(x.zest)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
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

      {/* Alongside the apps, never instead */}
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

      {/* Morning summary */}
      <section id="summary" aria-labelledby="summary-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-12 lg:py-14">
        <div className="lp-wrap grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div>
            <h2 id="summary-h" className={H2}>
              {pick({ en: "Know your numbers before you open the shutter.", hi: "शटर खुलने से पहले अपना हिसाब जानिए।" })}
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "One WhatsApp at 7:30 every morning: yesterday's sales from Zomato, Swiggy and your page, the payouts on their way, and the reviews that need you.",
                hi: "हर सुबह 7:30 बजे एक WhatsApp: Zomato, Swiggy और आपके पेज से कल की बिक्री, आने वाले पेआउट, और वे रिव्यू जिन्हें आपकी ज़रूरत है।",
              })}
            </p>
            <ul className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-6">
              {SUMMARY.map((x) => (
                <li key={x.title.en}>
                  <x.icon aria-hidden size={22} className="text-[var(--z-turmeric)]" />
                  <h3 className="mt-2 text-[17px] font-semibold leading-snug">{pick(x.title)}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-[var(--lp-muted)]">{pick(x.text)}</p>
                </li>
              ))}
            </ul>
            <a href={START} className="lp-btn haldi mt-8">
              <Mail aria-hidden size={18} />
              {pick({ en: "Connect your email", hi: "अपना ईमेल जोड़िए" })}
            </a>
          </div>
          <MorningSummary />
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
            {pick({ en: "Keep the apps. Add your own orders.", hi: "ऐप वैसे ही रखिए। अपने ऑर्डर भी जोड़िए।" })}
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
