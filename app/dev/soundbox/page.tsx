"use client";

import "../../landing.css";
import { LangToggle } from "@/components/bits";
import { Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";

// Development only: every Soundbox state side by side, for screenshots. Deleted before merge.

const ticket = { title: "MEENA'S KITCHEN · KOT 118", lines: ["2 x Aloo paratha", "1 x Rajma chawal", "Flat 302, Green Park"], foot: "Paid ₹270 · UPI" };
const STATES: { state: SoundboxState; caption: { en: string; hi: string }; clip?: string; ticket?: boolean }[] = [
  { state: "idle", caption: { en: "Waiting for the next order.", hi: "अगले ऑर्डर का इंतज़ार है।" } },
  { state: "ringing", caption: { en: "New order!", hi: "नया ऑर्डर!" } },
  { state: "speaking", caption: { en: "New order! Two aloo paratha, one rajma chawal. Payment received.", hi: "नया ऑर्डर! दो आलू पराठा, एक राजमा चावल. पैसे मिल गए." }, clip: "new-order" },
  { state: "printing", caption: { en: "Printing the ticket.", hi: "टिकट छप रहा है।" }, ticket: true },
  { state: "accepted", caption: { en: "Accepted. Zomato rider at 1:05.", hi: "ऑर्डर मंज़ूर. ज़ोमैटो राइडर 1:05 पर।" }, clip: "accepted", ticket: true },
  { state: "escalating", caption: { en: "Order waiting! Please accept the order from Green Park.", hi: "ऑर्डर इंतज़ार में है! ग्रीन पार्क वाला ऑर्डर मंज़ूर कीजिए।" }, clip: "missed" },
];

export default function SoundboxGallery() {
  return (
    <main className="lp min-h-dvh p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="lp-display text-[32px]">Zest Soundbox: states</h1>
        <LangToggle />
      </div>
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {STATES.map((s) => (
          <section key={s.state} className="flex flex-col items-center">
            <p className="mb-6 text-[15px] font-semibold text-[var(--lp-muted)]">{s.state}</p>
            <Soundbox state={s.state} caption={s.caption} clip={s.clip} ticket={s.ticket ? ticket : null} showTicket={s.ticket} onPress={() => {}} onTalk={() => {}} />
          </section>
        ))}
        <section className="flex flex-col items-center">
          <p className="mb-6 text-[15px] font-semibold text-[var(--lp-muted)]">sm</p>
          <Soundbox state="speaking" size="sm" caption={STATES[2].caption} />
        </section>
      </div>
    </main>
  );
}
