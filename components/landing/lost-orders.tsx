"use client";

import { Briefcase, Check, PhoneCall, PhoneMissed, QrCode, Search, Star } from "lucide-react";
import { BeforeAfter, card, Slip } from "@/components/landing/before-after";
import { useApp } from "@/lib/state";

// "The orders you already get, and lose": four kinds of order that never reach Zomato or Swiggy, each
// shown as it goes today and then with Zest.

export function LostOrders() {
  return (
    <BeforeAfter
      label={{ en: "Kinds of order", hi: "ऑर्डर के प्रकार" }}
      items={[
        { id: "regulars", icon: PhoneCall, title: { en: "Regulars who call", hi: "फ़ोन करने वाले ग्राहक" }, line: { en: "A slip of paper, lost in the rush", hi: "एक पर्ची, भीड़ में खो गई" }, today: <RegularToday />, zest: <RegularZest /> },
        { id: "party", icon: Briefcase, title: { en: "Office and party orders", hi: "ऑफ़िस और पार्टी ऑर्डर" }, line: { en: "Long calls and a cash advance", hi: "लंबी कॉल और नकद एडवांस" }, today: <PartyToday />, zest: <PartyZest /> },
        { id: "dinein", icon: QrCode, title: { en: "Dine-in guests, at home", hi: "डाइन-इन मेहमान, घर पर" }, line: { en: "Loved the food, forgot your name", hi: "खाना पसंद आया, नाम भूल गए" }, today: <DineToday />, zest: <DineZest /> },
        { id: "search", icon: Search, title: { en: "People searching your name", hi: "आपका नाम खोजने वाले" }, line: { en: "Google shows a busy line", hi: "Google पर लाइन व्यस्त" }, today: <SearchToday />, zest: <SearchZest /> },
      ]}
    />
  );
}

/* ---- the scenes: small pieces of the real world, drawn as interface ---- */

function RegularToday() {
  return (
    <div className="flex flex-col items-center">
      <div data-ui className={`${card} relative z-10 w-[220px] max-sm:hidden`}>
        {["Rahul", "Rahul", "Unknown"].map((n, i) => (
          <p key={i} className="flex items-center gap-2 py-1 text-[13px]">
            <PhoneMissed aria-hidden size={14} className="text-[#c23a22]" />
            <span className="flex-1 font-medium">{n}</span>
            <span className="text-[#6f757c]">8:1{2 + i} pm</span>
          </p>
        ))}
      </div>
      <div className="sm:-mt-3 sm:ml-20">
        <Slip lines={["Rahul - 2 dal makhani", "4 naan, 9 pm??"]} note="sent?" />
      </div>
    </div>
  );
}
function RegularZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "New order · your page", hi: "नया ऑर्डर · आपका पेज" })}</p>
      <p className="mt-1 text-[15px] font-semibold">Rahul · 2 Dal makhani, 4 Naan</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
        <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "Paid ₹734 · UPI", hi: "₹734 मिले · UPI" })}
      </p>
      <p className="mt-2 text-[12.5px] text-[#545a61]">{pick({ en: "Saved as a regular · 14th order", hi: "पुराने ग्राहक में सेव · 14वाँ ऑर्डर" })}</p>
    </div>
  );
}

function PartyToday() {
  return <Slip lines={["Fri office party", "12 biryani? 15?", "advance 2000 cash"]} note="paid?" />;
}
function PartyZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "Party order · Friday, 1 pm", hi: "पार्टी ऑर्डर · शुक्रवार, 1 बजे" })}</p>
      <p className="mt-1 text-[15px] font-semibold">12 × Chicken biryani</p>
      <p className="text-[13px] text-[#545a61]">{pick({ en: "Acme Labs, 4th floor · Priya", hi: "Acme Labs, चौथी मंज़िल · प्रिया" })}</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
        <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "Paid ₹4,188 upfront", hi: "₹4,188 पहले ही मिले" })}
      </p>
    </div>
  );
}

function Bill({ qr }: { qr: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[230px] bg-white px-4 pb-5 pt-4 font-kot text-[12px] leading-[1.5] text-[#1c1f23] [clip-path:polygon(0_0,100%_0,100%_calc(100%-6px),90%_100%,80%_calc(100%-6px),70%_100%,60%_calc(100%-6px),50%_100%,40%_calc(100%-6px),30%_100%,20%_calc(100%-6px),10%_100%,0_calc(100%-6px))]">
      <p className="text-center font-semibold">RASOI 27</p>
      <p className="text-center">Table 6 · 8:42 pm</p>
      <p className="mt-2 flex justify-between"><span>Dal makhani</span><span>249</span></p>
      <p className="flex justify-between"><span>Chicken biryani</span><span>349</span></p>
      <p className="flex justify-between"><span>Garlic naan x4</span><span>276</span></p>
      <p className="mt-1 flex justify-between font-semibold"><span>TOTAL</span><span>874</span></p>
      {qr ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[#fbefd3] p-2 font-sans">
          <QrCode aria-hidden size={34} />
          <span className="text-[11.5px] font-semibold leading-tight">{pick({ en: "Order from home: scan to open our page", hi: "घर से ऑर्डर: हमारा पेज खोलने के लिए स्कैन करें" })}</span>
        </div>
      ) : (
        <p className="mt-3 text-center">Thank you. Visit again!</p>
      )}
    </div>
  );
}
function DineToday() {
  return <Bill qr={false} />;
}
function DineZest() {
  return <Bill qr />;
}

function Result({ zest }: { zest: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`${card} w-[300px]`}>
      <p className="flex items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1.5 text-[13px] text-[#545a61]">
        <Search aria-hidden size={14} /> rasoi 27 indiranagar
      </p>
      <p className="mt-3 text-[16px] font-semibold text-[#1a0dab]">Rasoi 27</p>
      <p className="flex items-center gap-1 text-[12.5px] text-[#545a61]">
        4.3 <Star aria-hidden size={11} className="fill-[#e9a31a] text-[#e9a31a]" /> · North Indian · Open
      </p>
      <div className="mt-3 flex gap-2">
        {zest ? (
          <span className="rounded-full bg-[#e9a31a] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Order online", hi: "ऑनलाइन ऑर्डर" })}</span>
        ) : (
          <span className="rounded-full bg-[#f1f3f4] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Call", hi: "कॉल" })}</span>
        )}
        <span className="rounded-full bg-[#f1f3f4] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Directions", hi: "रास्ता" })}</span>
      </div>
      {!zest && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#c23a22]"><PhoneMissed aria-hidden size={13} /> {pick({ en: "Line busy. Try again later.", hi: "लाइन व्यस्त है। बाद में कोशिश करें।" })}</p>}
    </div>
  );
}
function SearchToday() {
  return <Result zest={false} />;
}
function SearchZest() {
  return <Result zest />;
}
