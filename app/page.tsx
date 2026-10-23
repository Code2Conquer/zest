"use client";

import "./landing.css";
import { Bike, Camera, Check, IndianRupee } from "lucide-react";
import { DeliveryMap } from "@/components/landing/delivery";
import { Estimator } from "@/components/landing/estimator";
import { HeroPhone } from "@/components/landing/hero-phone";
import { HeroPhoto } from "@/components/landing/hero-photo";
import { Promises } from "@/components/landing/promises";
import { SiteFooter } from "@/components/landing/site-footer";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyStart } from "@/components/landing/sticky-start";
import { ZestAssistant } from "@/components/landing/zest-assistant";
import { ReachZest, WhyOnline } from "@/components/landing/why-online";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The homepage, for small food businesses not on Zomato or Swiggy: home kitchens, tiffin services,
// stalls and small cloud kitchens. Source of truth: docs/landing-brief.md. Laid out after Airbnb's
// hosting page, which solved the same problem for homes: what your kitchen could earn (a live estimate),
// three plain promises, why going online pays, how you're covered, how your kitchen looks on Zest,
// and Zest, the assistant, to ask anything. Every string is in English and Hindi, addressed to "you".

const START = "/join?journey=new";

const COVERED: { title: Bi; text: Bi }[] = [
  { title: { en: "Paid before you cook", hi: "पकाने से पहले भुगतान" }, text: { en: "Customers pay by UPI when they order, straight to your bank.", hi: "ग्राहक ऑर्डर करते ही UPI से भुगतान करते हैं, सीधे आपके बैंक में।" } },
  { title: { en: "Tracked to the door", hi: "दरवाज़े तक ट्रैक" }, text: { en: "Zomato riders pick up from you, and you and the customer follow them live.", hi: "Zomato राइडर आपसे उठाते हैं, आप और ग्राहक दोनों लाइव देखते हैं।" } },
  { title: { en: "Real people ordering", hi: "असली लोग ऑर्डर करते हैं" }, text: { en: "Every order comes with a name, a phone number and an address.", hi: "हर ऑर्डर के साथ नाम, फ़ोन नंबर और पता आता है।" } },
  { title: { en: "Help on WhatsApp", hi: "WhatsApp पर मदद" }, text: { en: "A person to ask, every day, in Hindi or English.", hi: "हर दिन, हिंदी या अंग्रेज़ी में, पूछने के लिए एक इंसान।" } },
];

const H2 = "lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]";

export default function Home() {
  const { pick } = useApp();

  return (
    <div className={`lp min-h-dvh overflow-x-clip ${siteFonts}`}>
      <SiteHeader current="home" start={{ href: START, label: { en: "Get started", hi: "शुरू करें" } }} />

      {/* First screen: what your kitchen could earn */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-14 pt-6 lg:min-h-[min(820px,calc(100svh-76px))] lg:pb-12 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[36px] leading-[1.04] [text-wrap:balance] sm:text-[52px] xl:text-[60px]">
              {pick({ en: "Your kitchen could earn", hi: "आपकी रसोई कमा सकती है" })}
            </h1>
            <div className="mt-3">
              <Estimator
                presets={[
                  { id: "home", label: { en: "Home kitchen", hi: "घर की रसोई" }, orders: 15, avg: 150 },
                  { id: "tiffin", label: { en: "Tiffin service", hi: "टिफ़िन सर्विस" }, orders: 30, avg: 110 },
                  { id: "stall", label: { en: "Stall or thela", hi: "स्टॉल या ठेला" }, orders: 60, avg: 60 },
                ]}
                orders={[5, 120]}
                avg={[40, 600, 10]}
                per={{ en: "a month on Zest", hi: "हर महीने, Zest पर" }}
                ordersLabel={{ en: "Orders a day", hi: "रोज़ के ऑर्डर" }}
                avgLabel={{ en: "Average order", hi: "औसत ऑर्डर" }}
              />
            </div>
            <div id="hero-start" className="hero-in d2 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={START} className="lp-btn haldi min-h-14 px-8 text-[18px] max-sm:w-full">
                {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
              </a>
              <a href="/r/meenas-kitchen" className="lp-link text-[16px] font-medium text-[var(--lp-muted)] hover:text-[var(--lp-ink)]">
                {pick({ en: "See a sample page", hi: "सैंपल पेज देखें" })}
              </a>
            </div>
          </div>
          <HeroPhoto
            photo="/photos/team-menu.webp"
            ratio="4 / 3"
            alt={pick({ en: "A home-cooked thali on a banana leaf", hi: "केले के पत्ते पर घर की थाली" })}
            order={{
              from: { en: "New order · Flat 302", hi: "नया ऑर्डर · फ़्लैट 302" },
              items: { en: "2 veg thali, 1 pav bhaji", hi: "2 वेज थाली, 1 पाव भाजी" },
              paid: { en: "Paid ₹330 · UPI", hi: "₹330 मिले · UPI" },
              rider: { en: "Zomato rider · 1:05", hi: "Zomato राइडर · 1:05" },
            }}
          />
        </div>
      </section>

      {/* Three plain promises */}
      <Promises
        title={{ en: "Selling online, without the hard parts.", hi: "ऑनलाइन बेचना, बिना झंझट।" }}
        items={[
          { icon: Camera, title: { en: "It's easy", hi: "आसान है" }, text: { en: "Send a photo of your menu and your page is ready in minutes. Help is a WhatsApp away.", hi: "मेन्यू की फ़ोटो भेजिए, कुछ ही मिनट में पेज तैयार। मदद बस एक WhatsApp दूर।" } },
          { icon: IndianRupee, title: { en: "It's worth it", hi: "फ़ायदेमंद है" }, text: { en: "Free to start. You set your prices, and customers pay you by UPI, straight to your bank.", hi: "शुरुआत मुफ़्त। दाम आप तय करें, ग्राहक UPI से सीधे आपके बैंक में भुगतान करें।" } },
          { icon: Bike, title: { en: "Delivery is handled", hi: "डिलीवरी की चिंता नहीं" }, text: { en: "Zomato riders pick up from your door and deliver up to 7 km. Or send your own helper.", hi: "Zomato राइडर आपके दरवाज़े से उठाकर 7 किमी तक पहुँचाते हैं। या अपना हेल्पर भेजिए।" } },
        ]}
      />

      {/* Why go online: the business case, with the one figure we can stand behind */}
      <section id="why" aria-labelledby="why-h" className="scroll-mt-4 py-16 lg:py-20">
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
              </figcaption>
            </figure>
          </div>
          <div className="rv mt-10">
            <WhyOnline />
          </div>
        </div>
      </section>

      {/* You're covered: delivery and money, the parts sellers worry about */}
      <section id="covered" aria-labelledby="covered-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="covered-h" className={`rv max-w-[20ch] ${H2}`}>
            {pick({ en: "When you sell on Zest, you're covered.", hi: "Zest पर बेचें, तो आप सुरक्षित हैं।" })}
          </h2>
          <ul className="rv d1 mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {COVERED.map((c) => (
              <li key={c.title.en} className="flex gap-3">
                <Check aria-hidden size={22} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                <div>
                  <h3 className="text-[18px] font-semibold leading-snug">{pick(c.title)}</h3>
                  <p className="mt-1 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(c.text)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="rv d2 mt-12">
            <DeliveryMap />
          </div>
        </div>
      </section>

      {/* How your kitchen looks on Zest: the page, search, and the Soundbox */}
      <section id="looks" aria-labelledby="looks-h" className="scroll-mt-4 py-16 lg:py-20">
        <div className="lp-wrap">
          <h2 id="looks-h" className={`rv ${H2}`}>
            {pick({ en: "Your kitchen looks great on Zest.", hi: "Zest पर आपकी रसोई शानदार दिखती है।" })}
          </h2>
          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            <Showcase
              className="rv"
              title={{ en: "A beautiful page, from one photo", hi: "एक फ़ोटो से, एक सुंदर पेज" }}
              text={{ en: "Your dishes, prices and photos, laid out the way customers like to order.", hi: "आपकी डिश, दाम और फ़ोटो, वैसे जैसे ग्राहक ऑर्डर करना पसंद करते हैं।" }}
            >
              <div className="h-[300px] origin-top scale-[0.62]">
                <HeroPhone
                  cover="/photos/team-menu.webp"
                  name={{ en: "Meena's Kitchen", hi: "मीना की रसोई" }}
                  meta={{ en: "Home kitchen · Green Park · Pure veg", hi: "घर की रसोई · ग्रीन पार्क · शुद्ध शाकाहारी" }}
                  dishes={[
                    { name: { en: "Veg thali", hi: "वेज थाली" }, price: 120, photo: "/photos/dish-thali.webp" },
                    { name: { en: "Pav bhaji", hi: "पाव भाजी" }, price: 90, photo: "/photos/dish-pav-bhaji.webp" },
                    { name: { en: "Samosa, two pieces", hi: "समोसा, दो पीस" }, price: 30, photo: "/photos/dish-samosa.webp" },
                  ]}
                />
              </div>
            </Showcase>
            <Showcase
              className="rv d1"
              title={{ en: "Show up where people look", hi: "वहाँ दिखिए जहाँ लोग ढूँढते हैं" }}
              text={{ en: "On Google, in your society's WhatsApp groups, and as a QR on your counter.", hi: "Google पर, सोसाइटी के WhatsApp ग्रुप में, और काउंटर पर QR के रूप में।" }}
            >
              <ReachZest />
            </Showcase>
            <Showcase
              className="rv d2"
              title={{ en: "Hear every order", hi: "हर ऑर्डर सुनिए" }}
              text={{ en: "The Zest Soundbox speaks each order on your counter. Press the top to accept.", hi: "Zest Soundbox हर ऑर्डर काउंटर पर बोलकर बताता है। मंज़ूर करने के लिए ऊपर दबाइए।" }}
              dark
            >
              <Soundbox size="md" state="speaking" bare />
            </Showcase>
          </ul>
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
        label={{ en: "Get started", hi: "शुरू करें" }}
        note={{ en: "Online orders, delivered by you or Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" }}
        watch="hero-start"
        hideAt="final-start"
      />
      <ZestAssistant audience="home" />
    </div>
  );
}

/** One of the three product pictures: a screen of it, then what it does for you. */
function Showcase({ title, text, dark, className = "", children }: { title: Bi; text: Bi; dark?: boolean; className?: string; children: React.ReactNode }) {
  const { pick } = useApp();
  return (
    <li className={`flex flex-col overflow-hidden rounded-[28px] bg-[var(--lp-paper)] ${className}`}>
      <div className={`grid h-[340px] place-items-center overflow-hidden px-6 pt-8 ${dark ? "bg-[#15181b]" : "bg-[var(--lp-sunken)]"}`}>{children}</div>
      <div className="px-6 pb-7 pt-6">
        <h3 className="text-[21px] font-semibold leading-snug">{pick(title)}</h3>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(text)}</p>
      </div>
    </li>
  );
}
