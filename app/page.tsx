"use client";

import "./landing.css";
import { BellRing, Bike, Hand, Languages, Mic, Plus, Printer } from "lucide-react";
import { OneDay } from "@/components/landing/day";
import { DeliveryMap } from "@/components/landing/delivery";
import { AgentFlow } from "@/components/landing/flow";
import { GetFound } from "@/components/landing/found";
import { HeroSequence } from "@/components/landing/hero-sequence";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SoldOut } from "@/components/landing/sold-out";
import { SoundboxDemo } from "@/components/landing/soundbox-demo";
import { Waitlist } from "@/components/landing/waitlist";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage, for small food businesses not on Zomato or Swiggy: home kitchens, tiffin services,
// small cloud kitchens, shops and stalls. Source of truth: docs/landing-brief.md. Every string is in
// English and Hindi; each section has one orchestrated moment and nothing else moves on its own.

const AGENT_LIST: { name: Bi; does: Bi }[] = [
  { name: { en: "Storefront", hi: "स्टोरफ़्रंट" }, does: { en: "Your website from a menu photo, set up for Google search, WhatsApp ordering, UPI payments, your Google listing, the counter QR", hi: "मेन्यू की फ़ोटो से आपकी वेबसाइट, Google सर्च के लिए तैयार, WhatsApp ऑर्डर, UPI पेमेंट, आपकी Google लिस्टिंग, काउंटर QR" } },
  { name: { en: "Orders and delivery", hi: "ऑर्डर और डिलीवरी" }, does: { en: "Accepts, prints the KOT, picks pickup, your own helper or a Zomato rider, tracks to the door", hi: "ऑर्डर मंज़ूर करता है, KOT छापता है, पिकअप, आपका अपना हेल्पर या Zomato राइडर चुनता है, दरवाज़े तक ट्रैक करता है" } },
  { name: { en: "Regulars", hi: "पुराने ग्राहक" }, does: { en: "Remembers every guest and their usual, welcome offers for new guests, reminders that bring regulars back", hi: "हर ग्राहक और उनकी पसंद याद रखता है, नए ग्राहकों के लिए स्वागत ऑफ़र, पुराने ग्राहकों को वापस लाने वाले रिमाइंडर" } },
  { name: { en: "Reviews", hi: "रिव्यू" }, does: { en: "Asks every guest how it was, answers complaints in your voice, spots repeat problems", hi: "हर ग्राहक से पूछता है कैसा लगा, आपकी भाषा में शिकायतों का जवाब देता है, बार-बार की परेशानी पकड़ता है" } },
  { name: { en: "Growth", hi: "ग्रोथ" }, does: { en: "Shows up in AI answers, Instagram posts and ads on Instagram and Facebook within your budget, spots what people nearby search for, suggests new combos, lunch boxes and festive hampers", hi: "AI जवाबों में दिखता है, Instagram पोस्ट और आपके बजट में Instagram व Facebook विज्ञापन, आस-पास लोग क्या खोजते हैं यह देखता है, नए कॉम्बो, लंच बॉक्स और त्योहार के डिब्बे सुझाता है" } },
];


const FEATURES: { icon: typeof Mic; text: Bi }[] = [
  { icon: Languages, text: { en: "Speaks every order", hi: "हर ऑर्डर बोलकर बताता है" } },
  { icon: Hand, text: { en: "One big button, works with floury hands", hi: "एक बड़ा बटन, आटे वाले हाथों से भी चलता है" } },
  { icon: Printer, text: { en: "Prints the ticket", hi: "किचन टिकट छापता है" } },
  { icon: Bike, text: { en: "“Food ready” calls the rider", hi: "“खाना तैयार” दबाते ही राइडर बुलाता है" } },
  { icon: Mic, text: { en: "Push to talk: say a dish is finished, it's off your menu", hi: "बोलकर बताइए: डिश ख़त्म कहिए, मेन्यू से हट जाएगी" } },
  { icon: BellRing, text: { en: "Never misses an order: gets louder, then calls your phone", hi: "कोई ऑर्डर नहीं छूटता: आवाज़ तेज़ करता है, फिर आपको फ़ोन करता है" } },
];

const REGULARS: { name: Bi; usual: Bi; last: Bi; next: Bi }[] = [
  { name: { en: "Rahul", hi: "राहुल" }, usual: { en: "Rajma chawal, every Friday", hi: "राजमा चावल, हर शुक्रवार" }, last: { en: "Last order 7 days ago", hi: "पिछला ऑर्डर 7 दिन पहले" }, next: { en: "Reminder ready for Friday", hi: "शुक्रवार का रिमाइंडर तैयार" } },
  { name: { en: "Priya", hi: "प्रिया" }, usual: { en: "Thali with an extra roti", hi: "थाली, एक रोटी ज़्यादा" }, last: { en: "Last order yesterday", hi: "पिछला ऑर्डर कल" }, next: { en: "Free roti owed from last week", hi: "पिछले हफ़्ते की एक रोटी बाक़ी" } },
  { name: { en: "Mr Sharma, Flat 302", hi: "शर्मा जी, फ़्लैट 302" }, usual: { en: "Aloo paratha, less spicy", hi: "आलू पराठा, कम मिर्च" }, last: { en: "Last order 3 days ago", hi: "पिछला ऑर्डर 3 दिन पहले" }, next: { en: "Told when aloo paratha is on", hi: "आलू पराठा बनने पर बताया जाएगा" } },
];

const FAQ: { q: Bi; a: Bi; soon?: boolean }[] = [
  { q: { en: "Do I need to be on Zomato or Swiggy?", hi: "क्या मुझे Zomato या Swiggy पर होना ज़रूरी है?" }, a: { en: "No. Zest gives you your own page and WhatsApp ordering. Zomato riders only deliver.", hi: "नहीं। Zest आपको अपना पेज और WhatsApp ऑर्डर देता है। Zomato राइडर सिर्फ़ डिलीवरी करते हैं।" } },
  { q: { en: "Who delivers?", hi: "डिलीवरी कौन करता है?" }, a: { en: "You choose for each order: pickup, your own helper, or a Zomato rider with live tracking.", hi: "हर ऑर्डर के लिए आप चुनिए: पिकअप, आपका अपना हेल्पर, या लाइव ट्रैकिंग के साथ Zomato राइडर।" } },
  { q: { en: "Who pays for delivery?", hi: "डिलीवरी का पैसा कौन देता है?" }, a: { en: "You decide: the guest pays, you offer free delivery above an amount, or pickup only.", hi: "आप तय कीजिए: ग्राहक दे, एक रक़म से ऊपर आप मुफ़्त डिलीवरी दें, या सिर्फ़ पिकअप।" } },
  { q: { en: "How do I get paid?", hi: "मुझे पैसा कैसे मिलेगा?" }, a: { en: "Guests pay by UPI, straight to your account.", hi: "ग्राहक UPI से पैसा देते हैं, सीधे आपके खाते में।" } },
  { q: { en: "Do I need an FSSAI registration?", hi: "क्या FSSAI रजिस्ट्रेशन ज़रूरी है?" }, a: { en: "For delivery, yes. Zest helps you apply.", hi: "डिलीवरी के लिए, हाँ। Zest आवेदन में मदद करता है।" }, soon: true },
  { q: { en: "What does it cost?", hi: "इसका ख़र्च कितना है?" }, a: { en: "Free to start.", hi: "शुरुआत मुफ़्त है।" } },
  { q: { en: "Will people find me on Google?", hi: "क्या लोग मुझे Google पर ढूँढ पाएँगे?" }, a: { en: "Yes. Zest builds your website for search and sets up your Google listing. Home kitchens can show their delivery area without showing their address.", hi: "हाँ। Zest आपकी वेबसाइट सर्च के लिए बनाता है और Google लिस्टिंग तैयार करता है। घर की रसोई अपना पता दिखाए बिना डिलीवरी का इलाक़ा दिखा सकती है।" } },
  { q: { en: "Do I need a smartphone?", hi: "क्या स्मार्टफ़ोन चाहिए?" }, a: { en: "A phone with WhatsApp is enough to start. The Soundbox lets you run orders without touching it.", hi: "शुरू करने के लिए WhatsApp वाला फ़ोन काफ़ी है। Soundbox से आप फ़ोन छुए बिना ऑर्डर चला सकते हैं।" } },
  { q: { en: "Which languages?", hi: "कौन-सी भाषाएँ?" }, a: { en: "Hindi and English today, more Indian languages soon. Write in Hinglish and Zest answers in kind.", hi: "अभी हिंदी और अंग्रेज़ी, जल्द और भारतीय भाषाएँ। हिंग्लिश में लिखिए, Zest उसी में जवाब देगा।" } },
];

const SOON: Bi = { en: "Coming soon", hi: "जल्द आ रहा है" };
const H2 = "lp-display text-[clamp(34px,4vw,58px)] leading-[1.02] [text-wrap:balance]";
const LEAD = "max-w-[38em] text-[18px] leading-relaxed text-[var(--lp-muted)]";

/** A small "Coming soon" tag beside anything not live yet. */
function Soon() {
  const { pick } = useApp();
  return <span className="ml-2 inline-flex rounded-full bg-[var(--lp-sunken)] px-2 py-0.5 align-middle text-[12.5px] font-semibold text-[var(--lp-muted)]">{pick(SOON)}</span>;
}

export default function Home() {
  const { pick } = useApp();
  const starts = (
    <div className="flex flex-wrap gap-3">
      <a href="/join?journey=new&from=menu-photo" className="lp-btn haldi">
        {pick({ en: "Upload menu photo", hi: "मेन्यू की फ़ोटो भेजें" })}
      </a>
      <a href="#waitlist" className="lp-ghost">
        {pick({ en: "Start on WhatsApp", hi: "WhatsApp पर शुरू करें" })} <Soon />
      </a>
    </div>
  );

  return (
    <div className="lp min-h-dvh overflow-x-clip">
      <SiteHeader start={{ href: "/join?journey=new", label: { en: "Start free", hi: "मुफ़्त शुरू करें" } }} />

      {/* Hero */}
      <section aria-labelledby="hero-h" className="lp-wrap grid grid-cols-[minmax(0,1fr)] items-start gap-12 pb-20 pt-6 lg:pb-28 lg:pt-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-12">
        <div className="xl:pt-6">
          <h1 id="hero-h" className="lp-display text-[40px] leading-[1.02] sm:text-[60px] xl:text-[clamp(56px,5vw,76px)]">
            {pick({ en: "Your kitchen, online in a minute. Zest does the rest.", hi: "आपकी रसोई, एक मिनट में ऑनलाइन। बाक़ी सब Zest करेगा।" })}
          </h1>
          <p className="mt-6 max-w-[36em] text-[18px] leading-relaxed text-[var(--lp-muted)]">
            {pick({
              en: "Send a photo of your menu and your own ordering page is live, with WhatsApp orders, UPI payments and delivery by Zomato riders. Zest's AI agents take orders, bring back your regulars and find new customers. The Zest Soundbox tells you every order out loud.",
              hi: "अपने मेन्यू की फ़ोटो भेजिए और आपका अपना ऑर्डर पेज तैयार, WhatsApp ऑर्डर, UPI पेमेंट और Zomato राइडर से डिलीवरी के साथ। Zest के AI एजेंट ऑर्डर लेते हैं, पुराने ग्राहकों को वापस लाते हैं और नए ग्राहक ढूँढते हैं। Zest Soundbox हर ऑर्डर बोलकर बताता है।",
            })}
          </p>
          <div className="mt-8">{starts}</div>
          <p className="mt-4 text-[16px] font-medium">{pick({ en: "Free to start. No app to learn.", hi: "शुरुआत मुफ़्त। कोई ऐप सीखने की ज़रूरत नहीं।" })}</p>
          <p className="mt-6 text-[16px] text-[var(--lp-muted)]">
            {pick({ en: "Already on Zomato or Swiggy?", hi: "पहले से Zomato या Swiggy पर हैं?" })}{" "}
            <a href="/restaurants" className="lp-link font-medium text-[var(--lp-ink)]">
              {pick({ en: "See Zest for restaurants", hi: "रेस्टोरेंट के लिए Zest देखें" })}
            </a>
          </p>
        </div>
        <HeroSequence />
      </section>

      {/* One day at Meena's Kitchen */}
      <section id="day" aria-labelledby="day-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="day-h" className={H2}>
            {pick({ en: "One day at Meena's Kitchen.", hi: "मीना की रसोई में एक दिन।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>{pick({ en: "Meena cooks. Zest's agents do everything else.", hi: "मीना खाना बनाती हैं। बाक़ी सब Zest के एजेंट करते हैं।" })}</p>
          <div className="mt-12">
            <OneDay />
          </div>
          <p className="mt-10 text-[18px] font-semibold">{pick({ en: "Anything that costs money or goes public waits for your OK.", hi: "जिसमें पैसा लगे या जो सबको दिखे, वह आपकी हाँ के बिना नहीं होता।" })}</p>
        </div>
      </section>

      {/* The agents */}
      <section id="agents" aria-labelledby="agents-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
            <h2 id="agents-h" className={H2}>
              {pick({ en: "Your online team. It never sleeps. You make the calls.", hi: "आपकी ऑनलाइन टीम। कभी नहीं सोती। फ़ैसला आपका।" })}
            </h2>
            <p className={LEAD}>
              {pick({
                en: "Five agents pass each job between them until it's done. They learn from every edit you make: the more you approve, the less you need to.",
                hi: "पाँच एजेंट हर काम आपस में आगे बढ़ाते हैं, जब तक वह पूरा न हो जाए। आप जो भी बदलाव करते हैं, उससे वे सीखते हैं: जितना आप मंज़ूर करेंगे, उतना कम पूछना पड़ेगा।",
              })}
            </p>
          </div>
          <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {AGENT_LIST.map((x) => (
              <div key={x.name.en}>
                <dt className="text-[17px] font-semibold">{pick(x.name)}</dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-[var(--lp-muted)]">{pick(x.does)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12">
            <AgentFlow />
          </div>
        </div>
      </section>

      {/* Get found */}
      <section id="found" aria-labelledby="found-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="found-h" className={H2}>
            {pick({ en: "Be the first name people find nearby.", hi: "आस-पास खोजने वालों को सबसे पहले आपका नाम दिखे।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>
            {pick({
              en: "When someone searches “ghar ka khana near me” or “tiffin service in Green Park”, your kitchen should show up, with an Order button. Zest sets you up everywhere people look, and keeps it up to date.",
              hi: "जब कोई “ghar ka khana near me” या “ग्रीन पार्क में टिफ़िन सर्विस” खोजे, तो आपकी रसोई ऑर्डर बटन के साथ दिखनी चाहिए। लोग जहाँ भी खोजते हैं, Zest आपको वहाँ तैयार करता है और जानकारी ताज़ा रखता है।",
            })}
          </p>
          <div className="mt-12">
            <GetFound />
          </div>
          <p className="mt-10 max-w-[44em] text-[18px] leading-relaxed">
            {pick({ en: "Zest watches what people search for nearby and tells you what to add:", hi: "Zest देखता है कि आस-पास लोग क्या खोज रहे हैं और बताता है क्या जोड़ें:" })}{" "}
            <span className="font-semibold">{pick({ en: "“Many people near you search for Jain thali. Want to add one?”", hi: "“आपके आस-पास बहुत लोग जैन थाली खोजते हैं। एक जोड़ें?”" })}</span>
          </p>
        </div>
      </section>

      {/* The Soundbox */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap">
          <div className="max-w-[46rem]">
            <h2 id="soundbox-h" className={H2}>
              {pick({ en: "Meet the Zest Soundbox.", hi: "मिलिए Zest Soundbox से।" })}
              <Soon />
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "A small box on your counter that speaks every order out loud, in Hindi or English. Press the big button to accept and it prints the kitchen ticket. Press again when the food is ready and the rider is on the way. No phone in your hand while you cook.",
                hi: "काउंटर पर रखा एक छोटा डिब्बा, जो हर ऑर्डर हिंदी या अंग्रेज़ी में बोलकर बताता है। बड़ा बटन दबाइए, ऑर्डर मंज़ूर और किचन टिकट छप जाता है। खाना तैयार होने पर फिर दबाइए, राइडर रास्ते में। खाना बनाते समय हाथ में फ़ोन नहीं।",
              })}
            </p>
          </div>
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12">
            <ul className="hidden space-y-10 text-right lg:block">
              {FEATURES.slice(0, 3).map((f) => (
                <li key={f.text.en} className="flex items-start justify-end gap-3 text-[18px] font-medium leading-snug">
                  {pick(f.text)}
                  <f.icon aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center">
              <SoundboxDemo />
              <p className="mt-4 max-w-[30ch] text-center text-[14px] text-[var(--lp-muted)]">{pick({ en: "Press the big button, or the side button to talk.", hi: "बड़ा बटन दबाइए, या बोलने के लिए साइड वाला बटन।" })}</p>
            </div>
            <ul className="hidden space-y-10 lg:block">
              {FEATURES.slice(3).map((f) => (
                <li key={f.text.en} className="flex items-start gap-3 text-[18px] font-medium leading-snug">
                  <f.icon aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                  {pick(f.text)}
                </li>
              ))}
            </ul>
            <ul className="grid gap-4 sm:grid-cols-2 lg:hidden">
              {FEATURES.map((f) => (
                <li key={f.text.en} className="flex items-start gap-3 text-[17px] font-medium leading-snug">
                  <f.icon aria-hidden size={20} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                  {pick(f.text)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-16 grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <p className="lp-display text-[clamp(26px,2.8vw,40px)] leading-[1.1] [text-wrap:balance]">
              {pick({ en: "You trust a soundbox with your payments. Now trust one with your orders.", hi: "पेमेंट के लिए आप साउंडबॉक्स पर भरोसा करते हैं। अब ऑर्डर के लिए भी कीजिए।" })}
            </p>
            <div>
              <p className="mb-4 text-[17px] font-semibold">{pick({ en: "Join the Soundbox waitlist", hi: "Soundbox वेटलिस्ट में जुड़ें" })}</p>
              <Waitlist page="/" section="soundbox" />
            </div>
          </div>
        </div>
      </section>

      {/* Delivery, your way */}
      <section aria-labelledby="delivery-h" className="bg-[var(--lp-sunken)] py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`max-w-[22ch] ${H2}`}>
            {pick({ en: "Pickup, your helper or a Zomato rider. Zest picks the best way.", hi: "पिकअप, आपका हेल्पर या Zomato राइडर। सबसे अच्छा तरीक़ा Zest चुनता है।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>
            {pick({
              en: "Nearby guests can pick up. Short trips can go with your own helper, with a tracking link for the guest. Everything else goes with Zomato riders, and lunch orders from one building travel together.",
              hi: "पास के ग्राहक ख़ुद ले जा सकते हैं। छोटी दूरी आपका अपना हेल्पर जा सकता है, ग्राहक को ट्रैकिंग लिंक के साथ। बाक़ी सब Zomato राइडर ले जाते हैं, और एक बिल्डिंग के लंच ऑर्डर साथ जाते हैं।",
            })}
          </p>
          <div className="mt-12">
            <DeliveryMap />
          </div>
        </div>
      </section>

      {/* Sold out? Just say it */}
      <section aria-labelledby="soldout-h" className="py-20 lg:py-28">
        <div className="lp-wrap">
          <h2 id="soldout-h" className={H2}>
            {pick({ en: "Sold out? Just say it.", hi: "ख़त्म हो गया? बस बोल दीजिए।" })}
          </h2>
          <p className={`mt-4 ${LEAD}`}>
            {pick({
              en: "Tell Zest a dish is finished and it's off your page, WhatsApp menu, Google and Instagram in seconds. Say it's back, and it's back.",
              hi: "Zest को बताइए कि कोई डिश ख़त्म हो गई, और वह सेकंडों में आपके पेज, WhatsApp मेन्यू, Google और Instagram से हट जाएगी। वापस आ गई कहिए, तो वापस आ जाएगी।",
            })}
          </p>
          <div className="mt-12">
            <SoldOut />
          </div>
        </div>
      </section>

      {/* Your regulars */}
      <section aria-labelledby="regulars-h" className="bg-[var(--lp-sunken)] py-20 lg:py-28">
        <div className="lp-wrap grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <h2 id="regulars-h" className={H2}>
              {pick({ en: "Know your regulars. Bring them back.", hi: "अपने पुराने ग्राहकों को जानिए। उन्हें वापस लाइए।" })}
            </h2>
            <p className={`mt-4 ${LEAD}`}>
              {pick({
                en: "Every order comes with your guest's name, number and favourite dishes, and they stay yours. Zest reminds them when their usual is on the menu, and welcomes new guests with an offer you choose.",
                hi: "हर ऑर्डर के साथ ग्राहक का नाम, नंबर और पसंदीदा डिश आती है, और ये आपके ही रहते हैं। जब उनकी पसंद की डिश मेन्यू में हो, Zest उन्हें याद दिलाता है, और नए ग्राहकों का स्वागत आपके चुने ऑफ़र से करता है।",
              })}
            </p>
          </div>
          <ul className="grid gap-3">
            {REGULARS.map((r) => (
              <li key={r.name.en} className="flex items-center gap-4 rounded-[20px] bg-[var(--lp-paper)] p-4 sm:p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--lp-accent-soft)] text-[18px] font-semibold">{pick(r.name)[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold">{pick(r.name)}</p>
                  <p className="text-[15px]">{pick(r.usual)}</p>
                  <p className="text-[14px] text-[var(--lp-muted)]">
                    {pick(r.last)} · {pick(r.next)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Start in a minute */}
      <section aria-labelledby="start-h" className="bg-[var(--z-ink)] py-20 text-[#f1f1ec] lg:py-28">
        <div className="lp-wrap grid items-end gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
          <div>
            <h2 id="start-h" className={H2}>
              {pick({ en: "Start in a minute.", hi: "एक मिनट में शुरू कीजिए।" })}
            </h2>
            <ol className="mt-10 space-y-6">
              {[
                { en: "Send a photo of your menu, on the website or on WhatsApp.", hi: "अपने मेन्यू की फ़ोटो भेजिए, वेबसाइट पर या WhatsApp पर।" },
                { en: "Your page goes live. Share it in your groups and put the QR on your counter.", hi: "आपका पेज लाइव। उसे अपने ग्रुप में भेजिए और QR काउंटर पर लगाइए।" },
                { en: "Orders start coming in. Join the Soundbox waitlist to hear every one.", hi: "ऑर्डर आने लगते हैं। हर ऑर्डर सुनने के लिए Soundbox वेटलिस्ट में जुड़िए।" },
              ].map((t, k) => (
                <li key={t.en} className="flex gap-4 text-[20px] leading-snug">
                  <span className="lp-display grid size-10 shrink-0 place-items-center rounded-full bg-[var(--z-turmeric)] text-[20px] text-[#1c1f23]">{k + 1}</span>
                  <span className="pt-1.5">{pick(t)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:pb-2">
            <div className="flex flex-wrap gap-3">
              <a href="/join?journey=new&from=menu-photo" className="lp-btn haldi">
                {pick({ en: "Upload menu photo", hi: "मेन्यू की फ़ोटो भेजें" })}
              </a>
              <a href="#waitlist" className="lp-ghost on-dark">
                {pick({ en: "Start on WhatsApp", hi: "WhatsApp पर शुरू करें" })} <Soon />
              </a>
            </div>
            <p className="mt-4 text-[16px] text-[#b4b9be]">{pick({ en: "Free to start. No app to learn.", hi: "शुरुआत मुफ़्त। कोई ऐप सीखने की ज़रूरत नहीं।" })}</p>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-4 py-20 lg:py-28">
        <div className="lp-wrap grid gap-10 lg:grid-cols-12">
          <h2 id="faq-h" className={`lg:col-span-4 ${H2}`}>
            {pick({ en: "Questions sellers ask", hi: "विक्रेता क्या पूछते हैं" })}
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
