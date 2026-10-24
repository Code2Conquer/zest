"use client";

import { Bike, CalendarCheck, Check, Clock, IndianRupee, Search, Star, Users } from "lucide-react";
import { BeforeAfter, card, Slip } from "@/components/landing/before-after";
import { useApp } from "@/lib/state";

// "Why take your kitchen online": the business case for a home kitchen, tiffin service or stall, as five
// reasons, each shown as it goes today and then with Zest. Order cut-off times and weekly tiffin plans
// are part of the product plan (docs/landing-brief.md, section 9).

export function WhyOnline() {
  return (
    <BeforeAfter
      label={{ en: "Why go online", hi: "ऑनलाइन क्यों" }}
      items={[
        { id: "reach", icon: Users, title: { en: "More people find you", hi: "ज़्यादा लोग ढूँढते हैं" }, line: { en: "Not just your WhatsApp group", hi: "सिर्फ़ आपका WhatsApp ग्रुप नहीं" }, today: <ReachToday />, zest: <ReachZest /> },
        { id: "radius", icon: Bike, title: { en: "Deliver farther", hi: "दूर तक डिलीवरी" }, line: { en: "Up to 7 km with Zomato riders", hi: "Zomato राइडर से 7 किमी तक" }, today: <Radius wide={false} />, zest: <Radius wide /> },
        { id: "paid", icon: IndianRupee, title: { en: "Get paid upfront", hi: "पहले ही भुगतान" }, line: { en: "No more chasing udhaar", hi: "उधार के पीछे भागना ख़त्म" }, today: <PaidToday />, zest: <PaidZest /> },
        { id: "plan", icon: Clock, title: { en: "Cook to the count", hi: "गिनकर पकाइए" }, line: { en: "Orders close at a time you set", hi: "आपके तय समय पर ऑर्डर बंद" }, today: <PlanToday />, zest: <PlanZest /> },
        { id: "regulars", icon: CalendarCheck, title: { en: "Regulars on weekly plans", hi: "हफ़्ते के प्लान पर ग्राहक" }, line: { en: "Tiffins paid for the week", hi: "पूरे हफ़्ते का टिफ़िन, पहले से पेड" }, today: <RegularsToday />, zest: <RegularsZest /> },
      ]}
    />
  );
}

/* ---- the scenes ---- */

function ReachToday() {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[280px] rounded-2xl bg-[#efeae2] p-3 text-[#111b21]">
      <p className="text-[12px] font-semibold text-[#54656f]">Green Park Residents · 42</p>
      <p className="mt-2 w-fit max-w-[90%] rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 text-[13px]">{pick({ en: "Anyone want rajma chawal today? Message me", hi: "आज किसी को राजमा चावल चाहिए? मैसेज कीजिए" })}</p>
      <p className="mt-1.5 text-[11.5px] text-[#54656f]">{pick({ en: "2 replies · seen by 11", hi: "2 जवाब · 11 ने देखा" })}</p>
    </div>
  );
}
export function ReachZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={`${card} w-[300px]`}>
      <p className="flex items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1.5 text-[13px] text-[#545a61]">
        <Search aria-hidden size={14} /> {pick({ en: "home food near me", hi: "घर का खाना पास में" })}
      </p>
      <p className="mt-3 text-[16px] font-semibold text-[#1a0dab]">{pick({ en: "Meena's Kitchen", hi: "मीना की रसोई" })}</p>
      <p className="flex items-center gap-1 text-[12.5px] text-[#545a61]">
        4.8 <Star aria-hidden size={11} className="fill-[#e9a31a] text-[#e9a31a]" /> · {pick({ en: "Home kitchen · Open", hi: "घर की रसोई · खुला" })}
      </p>
      <span className="mt-3 inline-flex rounded-full bg-[#e9a31a] px-3.5 py-1.5 text-[13px] font-semibold text-[#1c1f23]">{pick({ en: "Order online", hi: "ऑनलाइन ऑर्डर" })}</span>
    </div>
  );
}

/** How far a kitchen's food can travel: walking distance today, a Zomato rider's reach with Zest. */
function Radius({ wide }: { wide: boolean }) {
  const { pick } = useApp();
  const homes = [
    [70, 60], [190, 52], [228, 120], [52, 150], [150, 176], [96, 104], [176, 98], [118, 40], [214, 170], [36, 96], [244, 72], [130, 140],
  ];
  return (
    <svg viewBox="0 0 280 220" className="h-[230px] w-[290px]" role="img" aria-label={wide ? pick({ en: "With Zomato riders: homes up to 7 km away", hi: "Zomato राइडर से: 7 किमी तक के घर" }) : pick({ en: "Today: only homes within walking distance", hi: "आज: सिर्फ़ पैदल दूरी के घर" })}>
      <circle cx="140" cy="110" r="100" fill={wide ? "rgb(233 163 26 / 0.12)" : "none"} stroke={wide ? "#e9a31a" : "#3a3f45"} strokeWidth="1.5" strokeDasharray={wide ? "0" : "4 5"} />
      <circle cx="140" cy="110" r="34" fill={wide ? "none" : "rgb(233 163 26 / 0.14)"} stroke={wide ? "#3a3f45" : "#e9a31a"} strokeWidth="1.5" strokeDasharray={wide ? "4 5" : "0"} />
      {homes.map(([x, y], i) => {
        const near = Math.hypot(x - 140, y - 110) < 34;
        const lit = wide || near;
        return <rect key={i} x={x - 5} y={y - 5} width="10" height="10" rx="2.5" fill={lit ? "#e9a31a" : "#3a3f45"} />;
      })}
      <circle cx="140" cy="110" r="9" fill="#fafaf6" />
      <text x="140" y="214" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={wide ? "#e9a31a" : "#9aa0a6"}>
        {wide ? pick({ en: "Zomato riders · up to 7 km", hi: "Zomato राइडर · 7 किमी तक" }) : pick({ en: "Walking distance · 500 m", hi: "पैदल दूरी · 500 मीटर" })}
      </text>
    </svg>
  );
}

function PaidToday() {
  const { pick } = useApp();
  return <Slip lines={[pick({ en: "Udhaar:", hi: "उधार:" }), "Sharma ji - 240", "Flat 7 - 180", "B-14 - 120 (next wk)"]} note={pick({ en: "paid?", hi: "दिया?" })} />;
}
function PaidZest() {
  const { pick } = useApp();
  return (
    <div className="grid gap-2">
      {[
        ["Flat 302", 240],
        ["Sharma ji", 180],
        ["B-14", 120],
      ].map(([who, amt], k) => (
        <p key={who} data-ui className="jr-pop flex w-[250px] items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-[13px] text-[#1c1f23]" style={{ animationDelay: `${k * 160}ms` }}>
          <span className="grid size-7 place-items-center rounded-full bg-[#2f7a4c] text-white">
            <Check aria-hidden size={14} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">₹{amt} {pick({ en: "received", hi: "मिले" })}</span>
            <span className="block text-[11.5px] text-[#545a61]">UPI · {who}</span>
          </span>
        </p>
      ))}
    </div>
  );
}

function PlanToday() {
  const { pick } = useApp();
  return (
    <>
      <Slip lines={[pick({ en: "lunch today -", hi: "आज लंच -" }), pick({ en: "thali 15? 20?", hi: "थाली 15? 20?" }), pick({ en: "bhaji ??", hi: "भाजी ??" })]} />
    </>
  );
}
function PlanZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "Orders closed at 11:00 am", hi: "ऑर्डर 11:00 बजे बंद" })}</p>
      <p className="mt-1 text-[15px] font-semibold">{pick({ en: "Cook for lunch today", hi: "आज लंच के लिए पकाइए" })}</p>
      <ul className="mt-2 space-y-1 text-[13.5px]">
        {[
          [{ en: "Veg thali", hi: "वेज थाली" }, 24],
          [{ en: "Pav bhaji", hi: "पाव भाजी" }, 9],
          [{ en: "Samosa", hi: "समोसा" }, 30],
        ].map(([d, n]) => (
          <li key={(d as { en: string }).en} className="flex justify-between">
            <span>{pick(d as { en: string; hi: string })}</span>
            <span className="font-semibold tabular-nums">× {n as number}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegularsToday() {
  const { pick } = useApp();
  return <Slip lines={[pick({ en: "Rahul - less spicy", hi: "राहुल - कम मिर्च" }), pick({ en: "Priya - no onion", hi: "प्रिया - प्याज़ नहीं" }), pick({ en: "who paid last wk?", hi: "पिछले हफ़्ते किसने दिया?" })]} />;
}
function RegularsZest() {
  const { pick } = useApp();
  return (
    <div data-ui className={card}>
      <p className="text-[12px] font-semibold text-[#1f6b3a]">{pick({ en: "Weekly tiffin plan", hi: "हफ़्ते का टिफ़िन प्लान" })}</p>
      <p className="mt-1 text-[15px] font-semibold">{pick({ en: "Rahul · Mon to Fri lunch, less spicy", hi: "राहुल · सोम से शुक्र लंच, कम मिर्च" })}</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#2f7a4c] px-2.5 py-0.5 text-[12px] font-semibold text-white">
        <Check aria-hidden size={12} strokeWidth={3} /> {pick({ en: "₹600 paid for the week", hi: "हफ़्ते के ₹600 मिले" })}
      </p>
      <p className="mt-2 text-[12.5px] text-[#545a61]">{pick({ en: "12 regulars on weekly plans", hi: "12 ग्राहक हफ़्ते के प्लान पर" })}</p>
    </div>
  );
}
