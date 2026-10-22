"use client";

import "./landing.css";
import { useState } from "react";
import { Check, IndianRupee, Languages, MessageCircle, Plus, Share2, ShoppingBag, UserRound, UtensilsCrossed } from "lucide-react";
import { AudienceSwitch } from "@/components/landing/audience-switch";
import { DeliveryMap } from "@/components/landing/delivery";
import { HeroSequence } from "@/components/landing/hero-sequence";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyStart } from "@/components/landing/sticky-start";
import { Waitlist } from "@/components/landing/waitlist";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage, for small food businesses not on Zomato or Swiggy: home kitchens, tiffin services,
// small cloud kitchens, shops and stalls. Source of truth: docs/landing-brief.md. One message, top to
// bottom: get online orders, and deliver them yourself or with Zomato. Every string is in English and
// Hindi; the hero is the page's one orchestrated moment.

const START = "/join?journey=new";

const STEPS: { icon: typeof Plus; title: Bi; text: Bi }[] = [
  { icon: UtensilsCrossed, title: { en: "Add your menu", hi: "अपना मेन्यू डालिए" }, text: { en: "Send a photo of your menu, or type your dishes and prices.", hi: "अपने मेन्यू की फ़ोटो भेजिए, या डिश और दाम लिख दीजिए।" } },
  { icon: Share2, title: { en: "Share your link", hi: "अपना लिंक भेजिए" }, text: { en: "Send it to your society and WhatsApp groups, and put the QR on your counter.", hi: "उसे अपनी सोसाइटी और WhatsApp ग्रुप में भेजिए, और QR काउंटर पर लगाइए।" } },
  { icon: ShoppingBag, title: { en: "Get orders, get paid", hi: "ऑर्डर पाइए, पैसा पाइए" }, text: { en: "Orders arrive on WhatsApp. Customers pay by UPI, straight to your bank.", hi: "ऑर्डर WhatsApp पर आते हैं। ग्राहक UPI से पैसा देते हैं, सीधे आपके बैंक में।" } },
];

const WHY: { icon: typeof Plus; title: Bi; text: Bi }[] = [
  { icon: UserRound, title: { en: "Your customers stay yours", hi: "ग्राहक आपके ही रहते हैं" }, text: { en: "Every order comes with a name and number, so you can reach them again.", hi: "हर ऑर्डर के साथ नाम और नंबर आता है, ताकि आप उनसे फिर जुड़ सकें।" } },
  { icon: IndianRupee, title: { en: "Money straight to you", hi: "पैसा सीधे आपको" }, text: { en: "Customers pay by UPI into your own account.", hi: "ग्राहक UPI से आपके अपने खाते में पैसा देते हैं।" } },
  { icon: MessageCircle, title: { en: "No app to learn", hi: "कोई ऐप नहीं सीखना" }, text: { en: "Run it from WhatsApp, on the phone you already have.", hi: "जो फ़ोन आपके पास है, उसी पर WhatsApp से चलाइए।" } },
  { icon: Languages, title: { en: "Hindi or English", hi: "हिंदी या अंग्रेज़ी" }, text: { en: "Write in Hinglish and Zest answers in kind.", hi: "हिंग्लिश में लिखिए, Zest उसी में जवाब देगा।" } },
];

const FAQ: { q: Bi; a: Bi }[] = [
  { q: { en: "Do I need to be on Zomato or Swiggy?", hi: "क्या मुझे Zomato या Swiggy पर होना ज़रूरी है?" }, a: { en: "No. Zest gives you your own ordering page. Zomato riders only deliver, when you want them to.", hi: "नहीं। Zest आपको अपना ऑर्डर पेज देता है। Zomato राइडर सिर्फ़ डिलीवरी करते हैं, जब आप चाहें।" } },
  { q: { en: "Who delivers?", hi: "डिलीवरी कौन करता है?" }, a: { en: "You choose for each order: the customer picks up, your own helper delivers, or a Zomato rider takes it with live tracking.", hi: "हर ऑर्डर के लिए आप चुनिए: ग्राहक ख़ुद ले जाए, आपका हेल्पर पहुँचाए, या Zomato राइडर लाइव ट्रैकिंग के साथ ले जाए।" } },
  { q: { en: "Who pays for delivery?", hi: "डिलीवरी का पैसा कौन देता है?" }, a: { en: "Delivery is priced by distance. You decide: the customer pays, you offer free delivery above an amount, or pickup only.", hi: "डिलीवरी का दाम दूरी से तय होता है। आप तय कीजिए: ग्राहक दे, एक रक़म से ऊपर आप मुफ़्त डिलीवरी दें, या सिर्फ़ पिकअप।" } },
  { q: { en: "How do I get paid?", hi: "मुझे पैसा कैसे मिलेगा?" }, a: { en: "Customers pay by UPI, straight to your account.", hi: "ग्राहक UPI से पैसा देते हैं, सीधे आपके खाते में।" } },
  { q: { en: "What does it cost?", hi: "इसका ख़र्च कितना है?" }, a: { en: "Free to start.", hi: "शुरुआत मुफ़्त है।" } },
  { q: { en: "Does it work for a thela or a small stall?", hi: "क्या यह ठेले या छोटे स्टॉल के लिए भी है?" }, a: { en: "Yes. A phone with WhatsApp and a UPI ID is enough.", hi: "हाँ। WhatsApp वाला फ़ोन और UPI ID काफ़ी है।" } },
];

const H2 = "lp-display text-[clamp(30px,3.4vw,48px)] leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]";

export default function Home() {
  const { pick } = useApp();
  const [joining, setJoining] = useState(false);

  return (
    <div className="lp min-h-dvh overflow-x-clip">
      <SiteHeader start={{ href: START, label: { en: "Start free", hi: "मुफ़्त शुरू करें" } }} />

      {/* Hero: who it's for, the one promise, one action, and the order travelling from menu to Soundbox */}
      <section aria-labelledby="hero-h" className="lp-wrap pb-4 pt-2 sm:pb-12 lg:pb-16 lg:pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-12">
          <div>
            <AudienceSwitch current="home" />
            <h1 id="hero-h" className="lp-display mt-6 max-w-[15ch] text-[40px] leading-[1.02] [text-wrap:balance] sm:mt-8 sm:text-[60px] xl:max-w-[17ch] xl:text-[60px]">
              {pick({ en: "Get online orders. Deliver them yourself, or with Zomato.", hi: "ऑनलाइन ऑर्डर पाइए। ख़ुद पहुँचाइए, या Zomato से।" })}
            </h1>
            <p className={`mt-5 ${LEAD}`}>
              {pick({
                en: "Your own ordering page for your home kitchen, tiffin service or stall. Customers order on WhatsApp and pay you by UPI.",
                hi: "आपकी घर की रसोई, टिफ़िन सर्विस या ठेले का अपना ऑर्डर पेज। ग्राहक WhatsApp पर ऑर्डर करते हैं और UPI से पैसा देते हैं।",
              })}
            </p>
            <div id="hero-start" className="mt-7 flex flex-wrap gap-3">
              <a href={START} className="lp-btn haldi max-sm:w-full">
                {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
              </a>
              <a href="/r/meenas-kitchen" className="lp-ghost max-sm:w-full max-sm:justify-center">
                {pick({ en: "See a sample page", hi: "सैंपल पेज देखें" })}
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-medium">
              {[
                { en: "Free to start", hi: "शुरुआत मुफ़्त" },
                { en: "UPI straight to your bank", hi: "UPI सीधे आपके बैंक में" },
                { en: "No app to learn", hi: "कोई ऐप नहीं सीखना" },
              ].map((t) => (
                <li key={t.en} className="flex items-center gap-1.5">
                  <Check aria-hidden size={16} strokeWidth={3} className="text-[var(--lp-good)]" />
                  {pick(t)}
                </li>
              ))}
            </ul>
          </div>
          <HeroSequence />
        </div>
      </section>

      {/* How it works: three steps, nothing else */}
      <section id="how" aria-labelledby="how-h" className="scroll-mt-4 py-12 lg:py-16">
        <div className="lp-wrap">
          <h2 id="how-h" className={H2}>
            {pick({ en: "Your first online order, in three steps.", hi: "तीन क़दम में आपका पहला ऑनलाइन ऑर्डर।" })}
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
            {STEPS.map((s, k) => (
              <li key={s.title.en} className="border-t-2 border-[var(--lp-ink)] pt-5">
                <div className="flex items-center justify-between">
                  <span className="lp-display text-[44px] leading-none text-[var(--lp-accent)]">{k + 1}</span>
                  <s.icon aria-hidden size={26} className="text-[var(--lp-muted)]" />
                </div>
                <h3 className="mt-4 text-[21px] font-semibold leading-snug">{pick(s.title)}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(s.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Delivery, your way: the part only Zest can offer */}
      <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-12 lg:py-16">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`max-w-[18ch] ${H2}`}>
            {pick({ en: "Deliver it yourself, or let Zomato do it.", hi: "ख़ुद पहुँचाइए, या Zomato से पहुँचवाइए।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>
            {pick({
              en: "For every order, you choose. The customer picks it up, your own helper takes it, or a Zomato rider delivers it with live tracking.",
              hi: "हर ऑर्डर पर आप चुनिए। ग्राहक ख़ुद ले जाए, आपका अपना हेल्पर ले जाए, या Zomato राइडर लाइव ट्रैकिंग के साथ पहुँचाए।",
            })}
          </p>
          <div className="mt-8">
            <DeliveryMap />
          </div>
          <p className="mt-6 text-[15px] text-[var(--lp-muted)]">
            {pick({ en: "Delivery is priced by distance. You choose who pays: the customer, you, or free above an order amount.", hi: "डिलीवरी का दाम दूरी से तय होता है। कौन देगा, आप चुनिए: ग्राहक, आप, या एक रक़म से ऊपर के ऑर्डर पर मुफ़्त।" })}
          </p>
        </div>
      </section>

      {/* Why Zest: four plain reasons */}
      <section aria-labelledby="why-h" className="py-12 lg:py-16">
        <div className="lp-wrap">
          <h2 id="why-h" className={H2}>
            {pick({ en: "Made for kitchens that are busy cooking.", hi: "उन रसोइयों के लिए, जो खाना बनाने में व्यस्त हैं।" })}
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <li key={w.title.en} className="flex gap-4 lg:block">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--lp-accent-soft)]">
                  <w.icon aria-hidden size={20} />
                </span>
                <div>
                  <h3 className="text-[18px] font-semibold leading-snug lg:mt-4">{pick(w.title)}</h3>
                  <p className="mt-1 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(w.text)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The Soundbox: one band, the request form behind a button */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 bg-[#15181b] py-12 text-[#f1f1ec] lg:py-16">
        <div className="lp-wrap grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <p className="text-[15px] font-semibold text-[var(--z-turmeric)]">Zest Soundbox</p>
            <h2 id="soundbox-h" className={`mt-2 ${H2}`}>
              {pick({ en: "Hear every order, without touching your phone.", hi: "हर ऑर्डर सुनिए, फ़ोन छुए बिना।" })}
            </h2>
            <p className="mt-4 max-w-[34em] text-[17px] leading-relaxed text-[#b4b9be] sm:text-[18px]">
              {pick({
                en: "A small box on your counter that speaks each order in Hindi or English. Press the top to accept, even with floury hands.",
                hi: "काउंटर पर रखा एक छोटा डिब्बा, जो हर ऑर्डर हिंदी या अंग्रेज़ी में बोलकर बताता है। मंज़ूर करने के लिए ऊपर दबाइए, आटे वाले हाथों से भी।",
              })}
            </p>
            <div className="mt-7">
              {joining ? (
                <Waitlist page="/" section="soundbox" tone="dark" />
              ) : (
                <button id="waitlist" type="button" onClick={() => setJoining(true)} className="lp-btn haldi scroll-mt-6">
                  {pick({ en: "Ask for a Soundbox", hi: "Soundbox मँगवाइए" })}
                </button>
              )}
            </div>
          </div>
          <div className="order-first flex justify-center lg:order-none">
            <Soundbox size="sm" state="idle" bare />
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-4 py-12 lg:py-16">
        <div className="lp-wrap grid gap-8 lg:grid-cols-12 lg:gap-10">
          <h2 id="faq-h" className={`lg:col-span-4 ${H2}`}>
            {pick({ en: "Questions sellers ask", hi: "विक्रेता क्या पूछते हैं" })}
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
        <div className="lp-wrap flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="start-h" className={H2}>
              {pick({ en: "Start taking online orders today.", hi: "आज से ऑनलाइन ऑर्डर लेना शुरू कीजिए।" })}
            </h2>
            <p className="mt-3 text-[17px] sm:text-[18px]">{pick({ en: "Free to start. Set up in a few minutes.", hi: "शुरुआत मुफ़्त। कुछ ही मिनट में तैयार।" })}</p>
          </div>
          <a href={START} className="lp-btn shrink-0 !bg-[#1c1f23] !text-[#fafaf6] max-sm:w-full">
            {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
          </a>
        </div>
      </section>

      <SiteFooter />

      <StickyStart
        href={START}
        label={{ en: "Start free", hi: "मुफ़्त शुरू करें" }}
        note={{ en: "Online orders, delivered by you or Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" }}
        watch="hero-start"
        hideAt="final-start"
      />
    </div>
  );
}
