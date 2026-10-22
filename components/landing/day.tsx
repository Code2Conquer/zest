"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Check, MessageCircle, QrCode, Search, Star } from "lucide-react";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "One day at Meena's Kitchen": six moments from 9 am to Sunday, each showing which agent acted. On a
// wide screen the Soundbox sticks on the left and speaks each moment's line as it reaches the middle
// of the screen; on a phone the moments swipe sideways under the Soundbox. Each moment's picture plays
// when it becomes the current one.

type Moment = { id: string; time: Bi; agent: Bi; title: Bi; say: Bi; Visual: (p: { on: boolean }) => React.ReactNode };

const AGENT = {
  storefront: { en: "Storefront", hi: "स्टोरफ़्रंट" },
  orders: { en: "Orders and delivery", hi: "ऑर्डर और डिलीवरी" },
  regulars: { en: "Regulars", hi: "पुराने ग्राहक" },
  reviews: { en: "Reviews", hi: "रिव्यू" },
  growth: { en: "Growth", hi: "ग्रोथ" },
};

const MOMENTS: Moment[] = [
  {
    id: "live",
    time: { en: "9:00 am", hi: "सुबह 9:00" },
    agent: AGENT.storefront,
    title: { en: "Her page goes live", hi: "उनका पेज लाइव होता है" },
    say: { en: "Your page is live. Here's a message ready to share in your society groups.", hi: "आपका पेज लाइव है। सोसाइटी ग्रुप में भेजने के लिए मैसेज तैयार है।" },
    Visual: Live,
  },
  {
    id: "lunch",
    time: { en: "12:15 pm", hi: "दोपहर 12:15" },
    agent: AGENT.orders,
    title: { en: "Six lunch orders, one building", hi: "छह लंच ऑर्डर, एक बिल्डिंग" },
    say: { en: "Six lunch orders for Green Park. One rider at 12:45.", hi: "ग्रीन पार्क से लंच के छह ऑर्डर। एक राइडर 12:45 पर।" },
    Visual: Lunch,
  },
  {
    id: "ride",
    time: { en: "12:45 pm", hi: "दोपहर 12:45" },
    agent: AGENT.orders,
    title: { en: "One rider, six doors", hi: "एक राइडर, छह दरवाज़े" },
    say: { en: "Rider has picked up. All six will reach in 15 minutes.", hi: "राइडर ने ऑर्डर उठा लिए। छहों 15 मिनट में पहुँच जाएँगे।" },
    Visual: Ride,
  },
  {
    id: "rahul",
    time: { en: "4:00 pm", hi: "शाम 4:00" },
    agent: AGENT.regulars,
    title: { en: "Rahul's Friday rajma", hi: "राहुल का शुक्रवार वाला राजमा" },
    say: { en: "Rahul orders rajma every Friday. Shall I send him today's menu?", hi: "राहुल हर शुक्रवार राजमा मँगाते हैं। उन्हें आज का मेन्यू भेज दूँ?" },
    Visual: Rahul,
  },
  {
    id: "roti",
    time: { en: "8:30 pm", hi: "रात 8:30" },
    agent: AGENT.reviews,
    title: { en: "A hard roti, put right", hi: "सख़्त रोटी की शिकायत, ठीक की गई" },
    say: { en: "A guest said the roti was hard. I've apologised and offered a free roti next time. OK?", hi: "एक ग्राहक ने कहा रोटी सख़्त थी। मैंने माफ़ी माँगी और अगली बार एक रोटी मुफ़्त देने को कहा है। ठीक है?" },
    Visual: Roti,
  },
  {
    id: "diwali",
    time: { en: "Sunday", hi: "रविवार" },
    agent: AGENT.growth,
    title: { en: "Diwali is coming", hi: "दिवाली आ रही है" },
    say: { en: "Diwali is in 8 days. Shall I launch a sweets box for your regulars and a ₹500 ad nearby?", hi: "दिवाली में 8 दिन बचे हैं। पुराने ग्राहकों के लिए मिठाई का डिब्बा और आस-पास ₹500 का विज्ञापन शुरू करूँ?" },
    Visual: Diwali,
  },
];

export function OneDay() {
  const { pick } = useApp();
  const [active, setActive] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const wide = useRef<(HTMLLIElement | null)[]>([]);
  const narrow = useRef<(HTMLLIElement | null)[]>([]);
  const strip = useRef<HTMLOListElement>(null);

  // Which moment is current. Wide screens: the one whose middle is nearest the middle of the screen,
  // checked on scroll (a thin "middle line" can fall between moments and miss a jump). Phones: the
  // card snapped into view in the strip.
  useEffect(() => {
    let frame = 0;
    const nearest = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = -1, dist = Infinity;
      wide.current.forEach((el, k) => {
        if (!el || !el.offsetParent) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) [best, dist] = [k, d];
      });
      if (best >= 0) setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(nearest);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    nearest();
    const b = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(narrow.current.indexOf(e.target as HTMLLIElement));
      },
      { root: strip.current, threshold: 0.6 },
    );
    narrow.current.forEach((el) => el && b.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      b.disconnect();
    };
  }, []);

  // Zest speaks the current moment's line, then goes quiet.
  useEffect(() => {
    setSpeaking(true);
    const t = setTimeout(() => setSpeaking(false), 2600);
    return () => clearTimeout(t);
  }, [active]);

  const m = MOMENTS[active];
  const box = <Soundbox size="sm" state={speaking ? "speaking" : "idle"} caption={m.say} />;

  return (
    <div>
      {/* Wide screens: the Soundbox stays, the day scrolls past it */}
      <div className="hidden gap-16 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <div className="sticky top-[10vh] flex flex-col items-center rounded-[28px] bg-[var(--lp-paper)] px-8 py-10">
            <p className="mb-6 text-[15px] font-semibold text-[var(--lp-muted)]">
              {pick(m.time)} · <span className="text-[var(--lp-ink)]">{pick(m.agent)}</span>
            </p>
            {box}
          </div>
        </div>
        <ol className="space-y-[9vh] py-[12vh]">
          {MOMENTS.map((x, k) => (
            <li key={x.id} ref={(el) => void (wide.current[k] = el)} aria-current={k === active ? "step" : undefined} className={`transition-opacity duration-500 ${k === active ? "opacity-100" : "opacity-40"}`}>
              <MomentHead m={x} />
              <div className="mt-5">
                <x.Visual on={k === active} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Phones and tablets: Soundbox above, the day as a swipe */}
      <div className="lg:hidden">
        <div className="flex justify-center rounded-[28px] bg-[var(--lp-paper)] px-4 py-8">{box}</div>
        <ol ref={strip} tabIndex={0} aria-label={pick({ en: "Moments in Meena's day", hi: "मीना के दिन के पल" })} className="-mx-[var(--lp-m)] mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--lp-m)] pb-3 [scrollbar-width:none]">
          {MOMENTS.map((x, k) => (
            <li key={x.id} ref={(el) => void (narrow.current[k] = el)} className="w-[86%] max-w-[420px] shrink-0 snap-center rounded-[24px] bg-[var(--lp-paper)] p-5">
              <MomentHead m={x} />
              <div className="mt-4">
                <x.Visual on={k === active} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-center text-[14px] text-[var(--lp-muted)]">
          {active + 1} / {MOMENTS.length} · {pick({ en: "swipe for the rest of the day", hi: "बाक़ी दिन देखने के लिए स्वाइप करें" })}
        </p>
      </div>
    </div>
  );
}

function MomentHead({ m }: { m: Moment }) {
  const { pick } = useApp();
  return (
    <div>
      <p className="flex flex-wrap items-center gap-2 text-[15px]">
        <span className="font-semibold tabular-nums">{pick(m.time)}</span>
        <span className="rounded-full bg-[var(--lp-sunken)] px-2.5 py-0.5 text-[13px] font-semibold">{pick(m.agent)}</span>
      </p>
      <h3 className="mt-2 text-[22px] font-semibold leading-snug">{pick(m.title)}</h3>
    </div>
  );
}

/* The moments' pictures. Each plays when `on` becomes true, and shows its finished state otherwise. */

function Live({ on }: { on: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] ${on ? "dy-play" : ""}`}>
      <div className="dy-a rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)]">
        <p className="flex items-center gap-2 text-[14px] text-[var(--lp-muted)]">
          <Search aria-hidden size={15} /> ghar ka khana green park
        </p>
        <p className="mt-2 text-[17px] font-semibold text-[#2a5db0]">Meena&apos;s Kitchen · {pick({ en: "Home kitchen", hi: "घर की रसोई" })}</p>
        <p className="text-[14px] text-[var(--lp-muted)]">{pick({ en: "Delivers in Green Park · Open till 9:30 pm", hi: "ग्रीन पार्क में डिलीवरी · रात 9:30 तक खुला" })}</p>
        <span className="mt-3 inline-flex min-h-9 items-center rounded-full bg-[#2a5db0] px-4 text-[14px] font-semibold text-white">{pick({ en: "Order", hi: "ऑर्डर करें" })}</span>
      </div>
      <div className="dy-b flex items-center gap-3 rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)] sm:flex-col sm:justify-center">
        <QrCode aria-hidden size={56} />
        <p className="text-[13px] font-semibold sm:text-center">{pick({ en: "Counter QR", hi: "काउंटर QR" })}</p>
      </div>
      <p className="dy-c rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-3 text-[14px] text-[#1c1f23] sm:col-span-2">
        {pick({ en: "Hi neighbours! Meena's Kitchen now takes orders online: rajma chawal, aloo paratha and thali, home-made daily. Order here: zest.link/meena", hi: "नमस्ते पड़ोसियों! मीना की रसोई अब ऑनलाइन ऑर्डर लेती है: राजमा चावल, आलू पराठा और थाली, रोज़ घर का बना। यहाँ ऑर्डर करें: zest.link/meena" })}
      </p>
    </div>
  );
}

function Lunch({ on }: { on: boolean }) {
  const { pick } = useApp();
  const flats = ["A-102", "A-305", "B-14", "B-201", "C-7", "C-410"];
  return (
    <div data-ui className={`rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)] ${on ? "dy-play" : ""}`}>
      <ul className="grid grid-cols-3 gap-2 text-[13px]">
        {flats.map((f, k) => (
          <li key={f} className="dy-drop rounded-xl bg-[var(--lp-sunken)] px-2.5 py-2" style={{ animationDelay: `${k * 120}ms` }}>
            <p className="font-semibold">{f}</p>
            <p className="text-[var(--lp-muted)]">{k % 2 ? "Thali" : "Rajma chawal"}</p>
          </li>
        ))}
      </ul>
      <p className="dy-c mt-3 flex items-center gap-2 rounded-xl bg-[var(--lp-accent-soft)] px-3 py-2.5 text-[14px] font-semibold">
        <Bike aria-hidden size={16} /> {pick({ en: "One delivery · Green Park · rider at 12:45", hi: "एक डिलीवरी · ग्रीन पार्क · राइडर 12:45 पर" })}
      </p>
    </div>
  );
}

function Ride({ on }: { on: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)] ${on ? "dy-play" : ""}`}>
      <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label={pick({ en: "A rider's route through Green Park, stopping at six doors", hi: "ग्रीन पार्क में राइडर का रास्ता, छह दरवाज़ों पर रुकते हुए" })}>
        {[[20, 20], [120, 20], [220, 20], [20, 90], [120, 90], [220, 90]].map(([x, y], k) => (
          <rect key={k} x={x} y={y} width="80" height="44" rx="8" fill="var(--lp-sunken)" />
        ))}
        <path d="M 10 75 H 110 V 140 H 210 V 75 H 310" fill="none" stroke="var(--lp-line)" strokeWidth="4" strokeLinecap="round" />
        {[[60, 75], [110, 110], [160, 140], [210, 110], [260, 75], [300, 75]].map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r="5" fill="var(--z-leaf)" className="dy-door" style={{ animationDelay: `${600 + k * 380}ms` }} />
        ))}
        <circle r="9" cx="0" cy="0" fill="var(--lp-accent)" stroke="#1c1f23" strokeWidth="2" className="dy-rider" />
      </svg>
      <p className="mt-2 text-[14px] text-[var(--lp-muted)]">{pick({ en: "Each guest got a tracking link.", hi: "हर ग्राहक को ट्रैकिंग लिंक मिला।" })}</p>
    </div>
  );
}

function Rahul({ on }: { on: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`grid gap-3 sm:grid-cols-2 ${on ? "dy-play" : ""}`}>
      <div className="dy-a rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)]">
        <p className="text-[17px] font-semibold">Rahul</p>
        <p className="text-[14px] text-[var(--lp-muted)]">{pick({ en: "Rajma chawal, every Friday · 14 orders", hi: "राजमा चावल, हर शुक्रवार · 14 ऑर्डर" })}</p>
        <p className="mt-2 text-[14px]">{pick({ en: "Last order: last Friday", hi: "पिछला ऑर्डर: पिछले शुक्रवार" })}</p>
      </div>
      <div className="dy-c rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-3 text-[14px] text-[#1c1f23]">
        <p className="flex items-center gap-1 text-[12px] font-semibold text-[#1f6b3a]">
          <MessageCircle aria-hidden size={12} /> {pick({ en: "Draft, waiting for your OK", hi: "ड्राफ़्ट, आपकी हाँ का इंतज़ार" })}
        </p>
        <p className="mt-1">{pick({ en: "Rahul ji, rajma chawal is on today's menu. Shall I keep one for you?", hi: "राहुल जी, आज मेन्यू में राजमा चावल है। आपके लिए एक रख दूँ?" })}</p>
      </div>
    </div>
  );
}

function Roti({ on }: { on: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`space-y-3 ${on ? "dy-play" : ""}`}>
      <div className="dy-a rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)]">
        <p className="flex items-center gap-1 text-[14px] font-semibold">
          Priya <Star aria-hidden size={13} fill="currentColor" strokeWidth={0} className="text-[var(--lp-bad)]" /> 2
        </p>
        <p className="mt-1 text-[15px]">“{pick({ en: "Food was good but the roti was hard.", hi: "खाना अच्छा था पर रोटी सख़्त थी।" })}”</p>
      </div>
      <div className="dy-c rounded-2xl bg-[var(--lp-accent-soft)] p-4 text-[15px]">
        <p className="text-[13px] font-semibold text-[var(--lp-muted)]">{pick({ en: "Zest's reply, in your voice", hi: "Zest का जवाब, आपकी भाषा में" })}</p>
        <p className="mt-1">{pick({ en: "Sorry Priya, that's not how we want our rotis to reach you. Your next roti is on us.", hi: "माफ़ कीजिए प्रिया, हम नहीं चाहते कि रोटी ऐसे पहुँचे। अगली बार एक रोटी हमारी तरफ़ से।" })}</p>
        <span className="dy-tap mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--z-leaf)] px-4 text-[14px] font-semibold text-white">
          <Check aria-hidden size={15} /> {pick({ en: "Approved", hi: "मंज़ूर" })}
        </span>
      </div>
    </div>
  );
}

function Diwali({ on }: { on: boolean }) {
  const { pick } = useApp();
  return (
    <div data-ui className={`grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] ${on ? "dy-play" : ""}`}>
      <img src="/photos/meena/sweets-box-sm.jpg" alt={pick({ en: "A box of homemade sweets", hi: "घर की बनी मिठाई का डिब्बा" })} className="dy-a h-32 w-full rounded-2xl object-cover sm:w-36" loading="lazy" />
      <div className="dy-c rounded-2xl bg-[var(--lp-paper)] p-4 outline outline-1 -outline-offset-1 outline-[var(--lp-line)]">
        <p className="text-[16px] font-semibold">{pick({ en: "Diwali sweets box · ₹450", hi: "दिवाली मिठाई का डिब्बा · ₹450" })}</p>
        <p className="text-[14px] text-[var(--lp-muted)]">{pick({ en: "For 38 regulars, plus a ₹500 Instagram ad within 3 km", hi: "38 पुराने ग्राहकों के लिए, और 3 किमी में ₹500 का Instagram विज्ञापन" })}</p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--lp-ink)] px-4 text-[14px] font-semibold text-[var(--lp-on-ink)]">{pick({ en: "Approve", hi: "मंज़ूर करें" })}</span>
          <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--lp-sunken)] px-4 text-[14px] font-semibold">{pick({ en: "Edit", hi: "बदलें" })}</span>
        </div>
      </div>
    </div>
  );
}
