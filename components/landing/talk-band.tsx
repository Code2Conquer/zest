"use client";

import Image from "next/image";
import { useState } from "react";
import { Waitlist } from "@/components/landing/waitlist";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "Curious about selling online? Let's talk", after Airbnb's free call with a hosting specialist: a
// photo, two sentences and a call-me-back form behind one button.

export function TalkBand({ page, title, text, photo, defaultType }: { page: "/" | "/restaurants"; title: Bi; text: Bi; photo: string; defaultType?: string }) {
  const { pick } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <section id="talk" aria-labelledby="talk-h" className="scroll-mt-4 py-16 lg:py-20">
      <div className="lp-wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="rv relative aspect-[4/3] overflow-hidden rounded-[28px]">
          <Image src={photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 id="talk-h" className="rv lp-display text-[clamp(30px,3.6vw,52px)] leading-[1.04] [text-wrap:balance]">
            {pick(title)}
          </h2>
          <p className="rv d1 mt-4 max-w-[34em] text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]">{pick(text)}</p>
          <div className="rv d2 mt-7">
            {open ? (
              <Waitlist
                page={page}
                section="talk"
                defaultType={defaultType}
                cta={{ en: "Call me back", hi: "मुझे कॉल कीजिए" }}
                done={{ en: "Thanks. Someone from Zest will call you on WhatsApp within a day.", hi: "धन्यवाद। Zest से कोई एक दिन के अंदर आपको WhatsApp पर कॉल करेगा।" }}
              />
            ) : (
              <button type="button" onClick={() => setOpen(true)} className="lp-btn haldi">
                {pick({ en: "Let's talk", hi: "बात करते हैं" })}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
