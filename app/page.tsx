"use client";

import "./landing.css";
import Image from "next/image";
import { useState } from "react";
import { Check, MessageCircle, QrCode } from "lucide-react";
import { DeliveryMap } from "@/components/landing/delivery";
import { WhyOnline } from "@/components/landing/why-online";
import { HeroPhone } from "@/components/landing/hero-phone";
import { SiteFooter } from "@/components/landing/site-footer";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyStart } from "@/components/landing/sticky-start";
import { Waitlist } from "@/components/landing/waitlist";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage, for small food businesses not on Zomato or Swiggy: home kitchens, tiffin services,
// small cloud kitchens, shops and stalls. Source of truth: docs/landing-brief.md. One pitch, top to
// bottom: get online orders, and Zomato (or you) delivers them. The first screen is the headline, one
// button and one phone; then why going online pays, who it's for, how it works, delivery and the
// Soundbox. Every string is in English and Hindi.

const START = "/join?journey=new";

const WHO: { photo: string; title: Bi; text: Bi }[] = [
  { photo: "/photos/team-menu.webp", title: { en: "Home kitchens", hi: "घर की रसोई" }, text: { en: "Lunch for your society, festive boxes at Diwali.", hi: "सोसाइटी के लिए लंच, दिवाली पर त्योहार के डिब्बे।" } },
  { photo: "/photos/dish-curry-naan.webp", title: { en: "Tiffin services", hi: "टिफ़िन सर्विस" }, text: { en: "Weekly plans for offices and students, paid in advance.", hi: "ऑफ़िस और छात्रों के लिए हफ़्ते के प्लान, पहले से पेड।" } },
  { photo: "/photos/dish-pav-bhaji.webp", title: { en: "Stalls and thelas", hi: "स्टॉल और ठेले" }, text: { en: "Pre-orders so the queue stays short, paid by UPI.", hi: "पहले से ऑर्डर, ताकि लाइन छोटी रहे, UPI से भुगतान।" } },
  { photo: "/photos/stage-operate.webp", title: { en: "Small cloud kitchens", hi: "छोटे क्लाउड किचन" }, text: { en: "Your own page, next to Zomato and Swiggy.", hi: "Zomato और Swiggy के साथ, आपका अपना पेज।" } },
];

const H2 = "lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]";

export default function Home() {
  const { pick } = useApp();
  const [joining, setJoining] = useState(false);

  return (
    <div className={`lp min-h-dvh overflow-x-clip ${siteFonts}`}>
      <SiteHeader current="home" start={{ href: START, label: { en: "Start free", hi: "मुफ़्त शुरू करें" } }} />

      {/* First screen: one pitch, one button, one phone */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-14 pt-6 lg:min-h-[min(780px,calc(100svh-76px))] lg:pb-12 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[38px] leading-[1.02] sm:text-[64px] xl:text-[80px]">
              {pick({ en: "Online orders.", hi: "ऑनलाइन ऑर्डर।" })}
              <br />
              {pick({ en: "Zomato delivers.", hi: "Zomato पहुँचाए।" })}
            </h1>
            <p className={`hero-in d1 mt-6 ${LEAD} sm:text-[19px]`}>
              {pick({
                en: "Your own ordering page for your home kitchen, tiffin or stall. Customers pay you by UPI, and a Zomato rider or your own helper delivers.",
                hi: "आपकी घर की रसोई, टिफ़िन या ठेले का अपना ऑर्डर पेज। ग्राहक UPI से आपको पैसा देते हैं, और Zomato राइडर या आपका अपना हेल्पर पहुँचाता है।",
              })}
            </p>
            <div id="hero-start" className="hero-in d2 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={START} className="lp-btn haldi min-h-14 px-8 text-[18px] max-sm:w-full">
                {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
              </a>
              <a href="/r/meenas-kitchen" className="lp-link text-[16px] font-medium text-[var(--lp-muted)] hover:text-[var(--lp-ink)]">
                {pick({ en: "See a sample page", hi: "सैंपल पेज देखें" })}
              </a>
            </div>
            <p className="hero-in d2 mt-7 text-[15px] text-[var(--lp-muted)]">{pick({ en: "Free to start · UPI straight to your bank · Zomato riders on tap", hi: "शुरुआत मुफ़्त · UPI सीधे बैंक में · Zomato राइडर हमेशा तैयार" })}</p>
          </div>
          <HeroPhone
            name={{ en: "Meena's Kitchen", hi: "मीना की रसोई" }}
            meta={{ en: "Home kitchen · Green Park · Pure veg", hi: "घर की रसोई · ग्रीन पार्क · शुद्ध शाकाहारी" }}
            dishes={[
              { name: { en: "Veg thali", hi: "वेज थाली" }, price: 120, photo: "/photos/dish-thali.webp" },
              { name: { en: "Pav bhaji", hi: "पाव भाजी" }, price: 90, photo: "/photos/dish-pav-bhaji.webp" },
              { name: { en: "Samosa, two pieces", hi: "समोसा, दो पीस" }, price: 30, photo: "/photos/dish-samosa.webp" },
            ]}
            order={{
              from: { en: "New order · Flat 302", hi: "नया ऑर्डर · फ़्लैट 302" },
              items: { en: "2 veg thali, 1 pav bhaji", hi: "2 वेज थाली, 1 पाव भाजी" },
              paid: { en: "Paid ₹330 · UPI", hi: "₹330 मिले · UPI" },
              rider: { en: "Zomato rider · 1:05", hi: "Zomato राइडर · 1:05" },
            }}
          />
        </div>
      </section>

      {/* Why go online: the business case, with the one figure we can stand behind */}
      <section id="why" aria-labelledby="why-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-16 lg:py-20">
        <div className="lp-wrap">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-12">
            <div>
              <h2 id="why-h" className={`rv ${H2}`}>
                {pick({ en: "Cook for more than your WhatsApp group.", hi: "अपने WhatsApp ग्रुप से आगे भी खाना बेचिए।" })}
              </h2>
              <p className={`rv d1 mt-4 ${LEAD}`}>
                {pick({ en: "What changes when your kitchen takes orders online. Tap a reason to see it.", hi: "रसोई ऑनलाइन ऑर्डर लेने लगे तो क्या बदलता है। देखने के लिए कोई वजह चुनिए।" })}
              </p>
            </div>
            <figure className="rv d2 rounded-[24px] bg-[var(--lp-paper)] p-6">
              <p className="lp-display text-[56px] leading-none text-[var(--z-turmeric)] sm:text-[64px]">+97.6%</p>
              <figcaption>
                <p className="mt-3 text-[17px] font-semibold leading-snug">{pick({ en: "Sales growth for the smallest restaurants after they went online.", hi: "ऑनलाइन आने के बाद सबसे छोटे रेस्टोरेंट की बिक्री में बढ़त।" })}</p>
                <p className="mt-2 text-[13px] leading-snug text-[var(--lp-muted)]">{pick({ en: "Every restaurant in South Korea, 2020 card data. Kim & Lee, Hitotsubashi Journal of Economics, 2024.", hi: "दक्षिण कोरिया के सभी रेस्टोरेंट, 2020 का कार्ड डेटा। Kim और Lee, Hitotsubashi Journal of Economics, 2024।" })}</p>
              </figcaption>
            </figure>
          </div>
          <div className="rv mt-10">
            <WhyOnline />
          </div>
        </div>
      </section>

      {/* Who it's for: four kinds of kitchen, each with its own reason */}
      <section aria-labelledby="who-h" className="py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="who-h" className={`rv ${H2}`}>
            {pick({ en: "From a home kitchen to a thela.", hi: "घर की रसोई से ठेले तक।" })}
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
            {WHO.map((w, k) => (
              <li key={w.title.en} className={`rv ${k % 2 ? "d1" : ""}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px]">
                  <Image src={w.photo} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                </div>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug sm:text-[20px]">{pick(w.title)}</h3>
                <p className="mt-1 text-[15px] leading-snug text-[var(--lp-muted)] sm:text-[16px]">{pick(w.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works: three steps, each shown */}
      <section id="how" aria-labelledby="how-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="how-h" className={`rv ${H2}`}>
            {pick({ en: "Your first online order, in three steps.", hi: "तीन क़दम में आपका पहला ऑनलाइन ऑर्डर।" })}
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            <Step
              className="rv"
              title={{ en: "Send a photo of your menu", hi: "मेन्यू की फ़ोटो भेजिए" }}
              text={{ en: "Zest reads every dish and price. You check it.", hi: "Zest हर डिश और दाम पढ़ लेता है। आप जाँच लीजिए।" }}
            >
              <div data-ui className="note-paper w-[190px] rotate-[-4deg] px-4 pb-4 pt-5 text-[#24348a]">
                <div className="font-hand text-[16px] leading-[23px]">
                  <p className="font-bold">{pick({ en: "Meena's Kitchen", hi: "मीना की रसोई" })}</p>
                  <p>{pick({ en: "Veg thali - 120", hi: "वेज थाली - 120" })}</p>
                  <p>{pick({ en: "Pav bhaji - 90", hi: "पाव भाजी - 90" })}</p>
                  <p>{pick({ en: "Samosa - 30", hi: "समोसा - 30" })}</p>
                </div>
              </div>
            </Step>
            <Step
              className="rv d1"
              title={{ en: "Share your link", hi: "अपना लिंक भेजिए" }}
              text={{ en: "In your society and WhatsApp groups, and as a QR on your counter.", hi: "सोसाइटी और WhatsApp ग्रुप में, और काउंटर पर QR के रूप में।" }}
            >
              <div data-ui className="flex items-end gap-3">
                <div className="w-[170px] rounded-xl rounded-tr-none bg-[#d9fdd3] p-2.5 text-[12.5px] leading-snug text-[#111b21]">
                  <p className="text-[11px] font-semibold text-[#1f6b3a]">Green Park Residents</p>
                  <p className="mt-0.5">{pick({ en: "Order today's lunch from Meena's Kitchen: zest.link/meena", hi: "मीना की रसोई से आज का खाना ऑर्डर कीजिए: zest.link/meena" })}</p>
                </div>
                <span className="grid size-16 place-items-center rounded-xl bg-white text-[#1c1f23]">
                  <QrCode aria-hidden size={44} />
                </span>
              </div>
            </Step>
            <Step
              className="rv d2"
              title={{ en: "Get orders, get paid", hi: "ऑर्डर पाइए, पैसा पाइए" }}
              text={{ en: "Orders arrive on WhatsApp. The money comes straight to your bank.", hi: "ऑर्डर WhatsApp पर आते हैं। पैसा सीधे आपके बैंक में।" }}
            >
              <div data-ui className="w-[210px] rounded-2xl bg-white p-3.5 text-[#1c1f23]">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1f6b3a]">
                  <MessageCircle aria-hidden size={13} /> {pick({ en: "New order · B-14", hi: "नया ऑर्डर · B-14" })}
                </p>
                <p className="mt-1 text-[14px] font-semibold">{pick({ en: "2 veg thali", hi: "2 वेज थाली" })}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
                  <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "₹240 in your bank", hi: "₹240 आपके बैंक में" })}
                </p>
              </div>
            </Step>
          </ol>
        </div>
      </section>

      {/* Delivery, your way: the part only Zest can offer */}
      <section id="delivery" aria-labelledby="delivery-h" className="scroll-mt-4 py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="delivery-h" className={`rv max-w-[18ch] ${H2}`}>
            {pick({ en: "Deliver it yourself, or let Zomato do it.", hi: "ख़ुद पहुँचाइए, या Zomato से पहुँचवाइए।" })}
          </h2>
          <p className={`rv d1 mt-4 ${LEAD}`}>
            {pick({
              en: "For every order, you choose. The customer picks it up, your own helper takes it, or a Zomato rider delivers it with live tracking.",
              hi: "हर ऑर्डर पर आप चुनिए। ग्राहक ख़ुद ले जाए, आपका अपना हेल्पर ले जाए, या Zomato राइडर लाइव ट्रैकिंग के साथ पहुँचाए।",
            })}
          </p>
          <div className="rv d2 mt-10">
            <DeliveryMap />
          </div>
        </div>
      </section>

      {/* The Soundbox: one band, the request form behind a button */}
      <section id="soundbox" aria-labelledby="soundbox-h" className="scroll-mt-4 bg-[#15181b] py-16 text-[#f1f1ec] lg:py-20">
        <div className="lp-wrap grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <h2 id="soundbox-h" className={`rv ${H2}`}>
              {pick({ en: "Hear every order, without touching your phone.", hi: "हर ऑर्डर सुनिए, फ़ोन छुए बिना।" })}
            </h2>
            <p className="rv d1 mt-4 max-w-[34em] text-[17px] leading-relaxed text-[#b4b9be] sm:text-[18px]">
              {pick({
                en: "The Zest Soundbox sits on your counter and speaks each order in Hindi or English. Press the top to accept, even with floury hands.",
                hi: "Zest Soundbox आपके काउंटर पर रहता है और हर ऑर्डर हिंदी या अंग्रेज़ी में बोलकर बताता है। मंज़ूर करने के लिए ऊपर दबाइए, आटे वाले हाथों से भी।",
              })}
            </p>
            <div className="rv d2 mt-7">
              {joining ? (
                <Waitlist page="/" section="soundbox" tone="dark" />
              ) : (
                <button id="waitlist" type="button" onClick={() => setJoining(true)} className="lp-btn haldi scroll-mt-6">
                  {pick({ en: "Ask for a Soundbox", hi: "Soundbox मँगवाइए" })}
                </button>
              )}
            </div>
          </div>
          <div className="rv order-first flex justify-center lg:order-none">
            <Soundbox size="lg" state="speaking" bare className="max-sm:scale-90" />
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section id="final-start" aria-labelledby="start-h" className="bg-[var(--z-turmeric)] py-16 text-[#1c1f23] lg:py-20">
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

/** One of the three steps: a small picture of the step, then what happens. */
function Step({ title, text, className = "", children }: { title: Bi; text: Bi; className?: string; children: React.ReactNode }) {
  const { pick } = useApp();
  return (
    <li className={`flex flex-col overflow-hidden rounded-[28px] bg-[var(--lp-paper)] ${className}`}>
      <div className="grid h-[200px] place-items-center px-6">{children}</div>
      <div className="px-6 pb-7">
        <h3 className="text-[21px] font-semibold leading-snug">{pick(title)}</h3>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(text)}</p>
      </div>
    </li>
  );
}
