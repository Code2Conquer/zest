"use client";

import { useState } from "react";
import { Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";

// The Soundbox you can press: an order is ringing; press the big button to accept and it prints the
// KOT; press again when the food is ready and the rider is called. Push to talk says rajma is
// finished. "Hear it" plays whatever Zest just said.

type Step = { state: SoundboxState; caption: Bi; clip?: string; ticket: boolean };
const STEPS: Record<"ringing" | "accepted" | "ready" | "soldout", Step> = {
  ringing: { state: "ringing", caption: { en: "New order! Two aloo paratha, one rajma chawal. Payment received.", hi: "नया ऑर्डर! दो आलू पराठा, एक राजमा चावल. पैसे मिल गए." }, clip: "new-order", ticket: false },
  accepted: { state: "printing", caption: { en: "Accepted. Zomato rider at 1:05.", hi: "ऑर्डर मंज़ूर. ज़ोमैटो राइडर 1:05 पर." }, clip: "accepted", ticket: true },
  ready: { state: "accepted", caption: { en: "Food ready. The rider is on the way.", hi: "खाना तैयार. राइडर रास्ते में है." }, ticket: true },
  soldout: { state: "speaking", caption: { en: "Rajma is sold out everywhere.", hi: "राजमा अब हर जगह ख़त्म दिखेगा." }, clip: "sold-out", ticket: false },
};

export function SoundboxDemo() {
  const [at, setAt] = useState<keyof typeof STEPS>("ringing");
  const s = STEPS[at];
  return (
    <Soundbox
      state={s.state}
      caption={s.caption}
      clip={s.clip}
      ticket={{ title: "MEENA'S KITCHEN", lines: ["KOT 119", "2 Aloo paratha|120", "1 Rajma chawal|90", "Zomato rider|60"], foot: "Paid ₹270 UPI" }}
      showTicket={s.ticket}
      onPress={() => setAt(at === "ringing" || at === "soldout" ? "accepted" : at === "accepted" ? "ready" : "ringing")}
      onTalk={() => setAt("soldout")}
    />
  );
}
