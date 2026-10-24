"use client";

import "./landing.css";
import Image from "next/image";
import { Bike, Camera, Check, IndianRupee } from "lucide-react";
import { DeliveryMap } from "@/components/landing/delivery";
import { Estimator } from "@/components/landing/estimator";
import { HeroPhone } from "@/components/landing/hero-phone";
import { HeroPhoto } from "@/components/landing/hero-photo";
import { Promises } from "@/components/landing/promises";
import { SiteFooter } from "@/components/landing/site-footer";
import { siteFonts } from "@/components/landing/site-fonts";
import { SiteHeader } from "@/components/landing/site-header";
import { ZestAssistant } from "@/components/landing/zest-assistant";
import { WhyOnline } from "@/components/landing/why-online";
import { PhotoStrip } from "@/components/landing/photo-strip";
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

// Section titles: compact on a phone (ixigo-sized), full display size from laptops up.
const H2 = "lp-display text-[26px] leading-[1.1] lg:text-[clamp(30px,3.6vw,52px)] lg:leading-[1.04] [text-wrap:balance]";
const LEAD = "max-w-[36em] text-[16px] leading-relaxed text-[var(--lp-muted)] lg:text-[18px]";

export default function Home() {
  const { pick } = useApp();

  return (
    <div className={`lp min-h-dvh overflow-x-clip ${siteFonts}`}>
      <SiteHeader current="home" start={{ href: START, label: { en: "Get started", hi: "शुरू करें" } }} />

      {/* First screen: what your kitchen could earn */}
      <section aria-labelledby="hero-h" className="lp-wrap flex items-center pb-8 pt-5 lg:min-h-[min(820px,calc(100svh-76px))] lg:pb-12 lg:pt-0">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-6 sm:gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <h1 id="hero-h" className="lp-display hero-in text-[30px] leading-[1.06] [text-wrap:balance] sm:min-h-0 sm:text-[52px] xl:text-[60px]">
              {pick({ en: "Your kitchen could earn", hi: "आपकी रसोई कमा सकती है" })}
            </h1>
            <div className="mt-3">
              <Estimator
                presets={[{ id: "home", label: { en: "Home kitchen", hi: "घर की रसोई" }, orders: 15, avg: 150 }]}
                orders={[5, 100]}
                per={{ en: "a month on Zest", hi: "हर महीने, Zest पर" }}
                ordersLabel={{ en: "Orders a day", hi: "रोज़ के ऑर्डर" }}
              />
            </div>
            <div id="hero-start" className="hero-in d2 mt-6 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href={START} className="lp-btn haldi min-h-12 px-8 text-[17px] max-sm:w-full sm:min-h-14 sm:text-[18px]">
                {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
              </a>
            </div>
          </div>
          <HeroPhoto
            photo="/photos/in/home-vada-pav.jpg"
            ratio="736 / 781"
            alt={pick({ en: "Vada pav with fried green chillies and red chutney on a steel plate", hi: "स्टील की प्लेट पर तली हरी मिर्च और लाल चटनी के साथ वड़ा पाव" })}
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
        title={{ en: "You cook. We handle the rest.", hi: "आप पकाइए। बाक़ी हम संभालेंगे।" }}
        items={[
          { icon: Camera, title: { en: "Live in minutes", hi: "मिनटों में लाइव" }, text: { en: "Send a photo of your menu and your page is ready in minutes. Help is a WhatsApp away.", hi: "मेन्यू की फ़ोटो भेजिए, कुछ ही मिनट में पेज तैयार। मदद बस एक WhatsApp दूर।" } },
          { icon: IndianRupee, title: { en: "Your money, your bank", hi: "आपका पैसा, आपका बैंक" }, text: { en: "Free to start. You set your prices, and customers pay you by UPI, straight to your bank.", hi: "शुरुआत मुफ़्त। दाम आप तय करें, ग्राहक UPI से सीधे आपके बैंक में भुगतान करें।" } },
          { icon: Bike, title: { en: "Delivery? Sorted.", hi: "डिलीवरी? हो गई।" }, text: { en: "Zomato riders pick up from your door and deliver up to 7 km. Or send your own helper.", hi: "Zomato राइडर आपके दरवाज़े से उठाकर 7 किमी तक पहुँचाते हैं। या अपना हेल्पर भेजिए।" } },
        ]}
      />

      {/* Why go online: the business case, with the one figure we can stand behind */}
      <section id="why" aria-labelledby="why-h" className="scroll-mt-4 py-10 lg:py-20">
        <div className="lp-wrap">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
            <div>
              <h2 id="why-h" className={`rv ${H2}`}>
                {pick({ en: "From one building to the whole city.", hi: "एक बिल्डिंग से पूरे शहर तक।" })}
              </h2>
              <p className={`rv d1 mt-4 ${LEAD}`}>
                {pick({ en: "What changes when your kitchen takes orders online. Tap a reason to see it.", hi: "रसोई ऑनलाइन ऑर्डर लेने लगे तो क्या बदलता है। देखने के लिए कोई वजह चुनिए।" })}
              </p>
            </div>
            {/* The one figure, in the section's own two type styles (headline and lead), set beside the headline. */}
            <figure className="rv d2 border-[var(--z-turmeric)] max-lg:border-l-2 max-lg:pl-4 lg:border-l lg:border-white/10 lg:pl-12">
              <p className={`${H2} text-[var(--z-turmeric)] max-lg:text-[22px]`}>{pick({ en: "Nearly 2× sales", hi: "लगभग 2× बिक्री" })}</p>
              <figcaption className={`mt-1 lg:mt-4 ${LEAD}`}>{pick({ en: "Small food sellers who went online almost doubled what they sell.", hi: "ऑनलाइन आए छोटे खाना बेचने वालों की बिक्री लगभग दोगुनी हो गई।" })}</figcaption>
            </figure>
          </div>
          <div className="rv mt-10">
            <WhyOnline />
          </div>
        </div>
      </section>

      <PhotoStrip
        line={{ en: "Dosa at 8. Thali at 1. Chaat at 6.", hi: "8 बजे डोसा। 1 बजे थाली। 6 बजे चाट।" }}
        sub={{ en: "A day on your own page: orders from breakfast to dinner, each one paid before you cook.", hi: "आपके अपने पेज पर एक दिन: नाश्ते से डिनर तक ऑर्डर, हर एक पकाने से पहले पेड।" }}
        orders={[
          { photo: "/photos/wall/w07.webp", when: { en: "Today · 8:10 am", hi: "आज · सुबह 8:10" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "2 masala dosa", hi: "2 मसाला डोसा" }, detail: { en: "Extra chutney · Flat 302", hi: "एक्स्ट्रा चटनी · फ़्लैट 302" }, delivery: "own", deliveryNote: { en: "Helper · 400 m", hi: "हेल्पर · 400 मी" }, amount: 180, method: "UPI" },
          { photo: "/photos/wall/w27.webp", when: { en: "Today · 10:30 am", hi: "आज · सुबह 10:30" }, source: { en: "WhatsApp", hi: "WhatsApp" }, dish: { en: "Lunch tiffin", hi: "लंच टिफ़िन" }, detail: { en: "4 roti, dal, sabzi · weekly plan", hi: "4 रोटी, दाल, सब्ज़ी · हफ़्ते का प्लान" }, delivery: "rider", deliveryNote: { en: "2.2 km", hi: "2.2 किमी" }, amount: 120, method: "UPI" },
          { photo: "/photos/wall/w03.webp", when: { en: "Today · 1:05 pm", hi: "आज · दोपहर 1:05" }, source: { en: "WhatsApp", hi: "WhatsApp" }, dish: { en: "3 veg thali", hi: "3 वेज थाली" }, detail: { en: "Less spicy · Sharma ji, B-14", hi: "कम मिर्च · शर्मा जी, B-14" }, delivery: "own", deliveryNote: { en: "Helper · 250 m", hi: "हेल्पर · 250 मी" }, amount: 360, method: "UPI" },
          { photo: "/photos/wall/w25.webp", when: { en: "Today · 4:30 pm", hi: "आज · शाम 4:30" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "20 samosa", hi: "20 समोसे" }, detail: { en: "Office tea · green chutney", hi: "ऑफ़िस की चाय · हरी चटनी" }, delivery: "rider", deliveryNote: { en: "3.1 km", hi: "3.1 किमी" }, amount: 400, method: "UPI" },
          { photo: "/photos/wall/w14.webp", when: { en: "Today · 5:45 pm", hi: "आज · शाम 5:45" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "2 pav bhaji", hi: "2 पाव भाजी" }, detail: { en: "Extra butter · Rohan", hi: "एक्स्ट्रा मक्खन · रोहन" }, delivery: "rider", deliveryNote: { en: "1.8 km", hi: "1.8 किमी" }, amount: 180, method: "UPI" },
          { photo: "/photos/wall/w20.webp", when: { en: "Today · 6:20 pm", hi: "आज · शाम 6:20" }, source: { en: "Phone call", hi: "फ़ोन कॉल" }, dish: { en: "Chana chaat", hi: "चना चाट" }, detail: { en: "No onion · Priya", hi: "प्याज़ नहीं · प्रिया" }, delivery: "pickup", deliveryNote: { en: "Same lane", hi: "उसी गली" }, amount: 70, method: "UPI" },
          { photo: "/photos/wall/w23.webp", when: { en: "Sat · 8:40 pm", hi: "शनि · रात 8:40" }, source: { en: "Your page", hi: "आपका पेज" }, dish: { en: "1 kg gulab jamun", hi: "1 किलो गुलाब जामुन" }, detail: { en: "Birthday · Kapoor family", hi: "जन्मदिन · कपूर परिवार" }, delivery: "rider", deliveryNote: { en: "4.0 km", hi: "4.0 किमी" }, amount: 450, method: "UPI" },
        ]}
      />

      {/* You're covered: delivery and money, the parts sellers worry about */}
      <section id="covered" aria-labelledby="covered-h" className="scroll-mt-4 bg-[var(--lp-sunken)] py-10 lg:py-24">
        <div className="lp-wrap">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="rv relative aspect-[16/10] overflow-hidden rounded-[28px] lg:aspect-[4/5]">
              <Image src="/photos/in/rider-zomato.webp" alt={pick({ en: "A Zomato rider on a motorbike in city traffic", hi: "शहर के ट्रैफ़िक में बाइक पर Zomato राइडर" })} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <div>
              <h2 id="covered-h" className={`rv max-w-[18ch] ${H2}`}>
                {pick({ en: "Cook with peace of mind.", hi: "बेफ़िक्र होकर पकाइए।" })}
              </h2>
              <ul className="rv d1 mt-6 grid grid-cols-2 gap-x-4 gap-y-5 lg:mt-10 lg:gap-x-10 lg:gap-y-8">
                {COVERED.map((c) => (
                  <li key={c.title.en} className="flex flex-col gap-1.5 lg:flex-row lg:gap-3">
                    <Check aria-hidden size={22} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--z-turmeric)]" />
                    <div>
                      <h3 className="text-[16px] font-semibold leading-snug lg:text-[18px]">{pick(c.title)}</h3>
                      <p className="mt-1 text-[14px] leading-snug text-[var(--lp-muted)] lg:text-[16px] lg:leading-relaxed">{pick(c.text)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rv d2 mt-10 lg:mt-16">
            <DeliveryMap />
          </div>
        </div>
      </section>

      {/* How your kitchen looks on Zest: the page, search, and the Soundbox */}
      <section id="looks" aria-labelledby="looks-h" className="scroll-mt-4 py-10 lg:py-20">
        <div className="lp-wrap">
          <h2 id="looks-h" className={`rv ${H2}`}>
            {pick({ en: "Looks good enough to order.", hi: "देखते ही ऑर्डर करने का मन करे।" })}
          </h2>
          <ul className="lp-swipe mt-8 lg:mt-10 lg:grid lg:grid-cols-3 lg:gap-5">
            <Showcase
              className="rv"
              title={{ en: "One photo in. A full menu out.", hi: "एक फ़ोटो दीजिए, पूरा मेन्यू पाइए।" }}
              text={{ en: "Your dishes, prices and photos, laid out the way customers like to order.", hi: "आपकी डिश, दाम और फ़ोटो, वैसे जैसे ग्राहक ऑर्डर करना पसंद करते हैं।" }}
            >
              <div className="h-[190px] origin-top scale-[0.42] lg:h-[300px] lg:scale-[0.62]">
                <HeroPhone
                  cover="/photos/in/thali.webp"
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
              title={{ en: "Found on Google. Shared on WhatsApp.", hi: "Google पर मिलिए, WhatsApp पर छाइए।" }}
              text={{ en: "On Google, in your society's WhatsApp groups, and as a QR on your counter.", hi: "Google पर, सोसाइटी के WhatsApp ग्रुप में, और काउंटर पर QR के रूप में।" }}
            >
              <SharePreview />
            </Showcase>
            <Showcase
              className="rv d2"
              title={{ en: "Orders you can hear", hi: "ऑर्डर जो सुनाई दें" }}
              text={{ en: "The Zest Soundbox speaks each order out loud on your counter.", hi: "Zest Soundbox हर ऑर्डर काउंटर पर बोलकर बताता है।" }}
              dark
            >
              <Soundbox size="xs" state="speaking" bare className="lg:hidden" />
              <Soundbox size="md" state="speaking" bare className="max-lg:hidden" />
            </Showcase>
          </ul>
        </div>
      </section>

      {/* Closing call to action */}
      <section id="final-start" aria-labelledby="start-h" className="bg-[var(--z-turmeric)] py-16 text-[#1c1f23] lg:py-20">
        <div className="lp-wrap flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="start-h" className={H2}>
              {pick({ en: "Your first order is a tap away.", hi: "पहला ऑर्डर, बस एक टैप दूर।" })}
            </h2>
            <p className="mt-3 text-[18px]">{pick({ en: "Free to start. Set up in a few minutes.", hi: "शुरुआत मुफ़्त। कुछ ही मिनट में तैयार।" })}</p>
          </div>
          <a href={START} className="lp-btn shrink-0 !bg-[#1c1f23] !text-[#fafaf6] max-sm:w-full">
            {pick({ en: "Get started free", hi: "मुफ़्त शुरू करें" })}
          </a>
        </div>
      </section>

      <SiteFooter />

      <ZestAssistant audience="home" />
    </div>
  );
}

/** One of the three product pictures: a screen of it, then what it does for you. */
/** Meena's link as it lands in a society WhatsApp group: the chat bubble with its preview card. */
function SharePreview() {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[280px] rounded-2xl bg-[#0b141a] p-3 text-[#e9edef]">
      <p className="text-[12px] font-semibold text-[#8696a0]">{pick({ en: "Green Park Residents · 214", hi: "ग्रीन पार्क रेज़िडेंट्स · 214" })}</p>
      <div className="mt-2 w-[240px] rounded-lg rounded-tl-none bg-[#005c4b] p-1.5">
        <div className="overflow-hidden rounded-md bg-[#025144]">
          <Image src="/photos/in/thali.webp" alt="" width={240} height={110} className="h-[96px] w-full object-cover" />
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-semibold">{pick({ en: "Meena's Kitchen · Order online", hi: "मीना की रसोई · ऑनलाइन ऑर्डर" })}</p>
            <p className="text-[11.5px] text-[#a8c5bd]">zest.link/meenas-kitchen</p>
          </div>
        </div>
        <p className="px-1 pb-0.5 pt-1.5 text-[13px]">{pick({ en: "Lunch menu is up, order by 11! 🍛", hi: "लंच मेन्यू तैयार है, 11 बजे तक ऑर्डर करें! 🍛" })}</p>
      </div>
    </div>
  );
}

function Showcase({ title, text, dark, className = "", children }: { title: Bi; text: Bi; dark?: boolean; className?: string; children: React.ReactNode }) {
  const { pick } = useApp();
  return (
    <li className={`flex flex-col overflow-hidden rounded-[28px] bg-[var(--lp-paper)] max-lg:w-[78%] max-lg:max-w-[340px] ${className}`}>
      <div className={`grid h-[200px] place-items-center overflow-hidden px-6 pt-5 lg:h-[340px] lg:pt-8 ${dark ? "bg-[#15181b]" : "bg-[var(--lp-sunken)]"}`}>{children}</div>
      <div className="px-5 pb-6 pt-5 lg:px-6 lg:pb-7 lg:pt-6">
        <h3 className="text-[20px] font-semibold leading-snug lg:text-[22px]">{pick(title)}</h3>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--lp-muted)]">{pick(text)}</p>
      </div>
    </li>
  );
}
