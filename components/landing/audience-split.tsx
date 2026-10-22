"use client";

import { Check } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Which Zest is for you: home kitchens and small sellers not on the apps, or restaurants already on
// Zomato or Swiggy. Sits right under the hero on both pages; the side you're on is marked, the other
// side is the one that stands out.

const SIDES: { id: "home" | "restaurants"; href: string; who: Bi; title: Bi; text: Bi; cta: Bi }[] = [
  {
    id: "home",
    href: "/",
    who: { en: "Home kitchens, tiffins, thelas, shops and stalls", hi: "घर की रसोई, टिफ़िन, ठेले, दुकान और स्टॉल" },
    title: { en: "Not on Zomato or Swiggy yet?", hi: "अभी Zomato या Swiggy पर नहीं हैं?" },
    text: { en: "Your first online store from a menu photo, UPI payments, delivery by Zomato riders, and agents that do the online work.", hi: "मेन्यू की फ़ोटो से आपकी पहली ऑनलाइन दुकान, UPI पेमेंट, Zomato राइडर से डिलीवरी, और ऑनलाइन काम करने वाले एजेंट।" },
    cta: { en: "Zest for home kitchens", hi: "घर की रसोई के लिए Zest" },
  },
  {
    id: "restaurants",
    href: "/restaurants",
    who: { en: "Restaurants and cloud kitchens on the apps", hi: "ऐप पर मौजूद रेस्टोरेंट और क्लाउड किचन" },
    title: { en: "Already on Zomato or Swiggy?", hi: "पहले से Zomato या Swiggy पर हैं?" },
    text: { en: "Never miss an order with the Soundbox, bring regulars to your own page, and know how every app did by morning.", hi: "Soundbox से कोई ऑर्डर न छूटे, पुराने ग्राहक अपने पेज पर लाइए, और सुबह तक जानिए हर ऐप कैसा चला।" },
    cta: { en: "Zest for restaurants", hi: "रेस्टोरेंट के लिए Zest" },
  },
];

export function AudienceSplit({ current }: { current: "home" | "restaurants" }) {
  const { pick } = useApp();
  return (
    <section aria-label={pick({ en: "Which Zest is for you", hi: "आपके लिए कौन-सा Zest" })} className="lp-wrap pb-8 lg:pb-10">
      <div className="grid overflow-hidden rounded-[28px] md:grid-cols-2">
        {SIDES.map((x) => {
          const here = x.id === current;
          return (
            <div key={x.id} className={`flex flex-col p-5 sm:p-7 ${here ? "bg-[var(--lp-sunken)]" : "bg-[var(--z-turmeric)] text-[#1c1f23]"} ${x.id === "home" ? "md:order-1" : "md:order-2"}`}>
              <p className={`text-[14px] font-semibold ${here ? "text-[var(--lp-muted)]" : ""}`}>{pick(x.who)}</p>
              <h2 className="lp-display mt-2 text-[clamp(28px,3vw,40px)] leading-[1.05]">{pick(x.title)}</h2>
              <p className={`mt-3 max-w-[34em] text-[17px] leading-relaxed ${here ? "text-[var(--lp-muted)]" : ""}`}>{pick(x.text)}</p>
              <div className="mt-6">
                {here ? (
                  <span className="inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold">
                    <Check aria-hidden size={18} className="text-[var(--z-leaf)]" /> {pick({ en: "You're here", hi: "आप यहीं हैं" })}
                  </span>
                ) : (
                  <a href={x.href} className="lp-btn">
                    {pick(x.cta)}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
