"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Check, IndianRupee, MapPin, Printer, ShoppingBag, Store, UserRound } from "lucide-react";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "How a direct order reaches your customer": one order from Rasoi 27's own page, played step by step.
// The steps advance by themselves while the section is on screen, with a bar filling under the current
// one; tapping a step (or a delivery choice) takes over and stops the autoplay. Each step has its own
// small scene on the right. With reduced motion nothing advances or moves; every step is still a tap away.

type Way = "rider" | "staff" | "pickup";
const STEP_MS = 3800;

const STEPS: { icon: typeof Check; title: Bi; text: Bi }[] = [
  { icon: ShoppingBag, title: { en: "They order on your page", hi: "वे आपके पेज पर ऑर्डर करते हैं" }, text: { en: "A regular taps your link, picks the usual and checks out.", hi: "पुराना ग्राहक आपका लिंक खोलता है, अपनी पसंद चुनता है और ऑर्डर करता है।" } },
  { icon: IndianRupee, title: { en: "Paid by UPI, straight to you", hi: "UPI से भुगतान, सीधे आपको" }, text: { en: "The money is in your bank before the food is on the stove.", hi: "खाना चूल्हे पर चढ़ने से पहले पैसा आपके बैंक में।" } },
  { icon: Printer, title: { en: "The Soundbox calls it, the KOT prints", hi: "Soundbox बोलता है, KOT छपता है" }, text: { en: "Your kitchen hears it just like a Zomato or Swiggy order.", hi: "रसोई इसे Zomato या Swiggy के ऑर्डर की तरह ही सुनती है।" } },
  { icon: Bike, title: { en: "A Zomato rider picks it up", hi: "Zomato राइडर उठाता है" }, text: { en: "Booked as the food gets ready. Or send your own staff, or keep it for pickup.", hi: "खाना तैयार होते ही बुक। या अपना स्टाफ़ भेजिए, या पिकअप रखिए।" } },
  { icon: MapPin, title: { en: "Tracked to the door", hi: "दरवाज़े तक ट्रैक" }, text: { en: "The customer follows it live and gets a WhatsApp when it arrives.", hi: "ग्राहक लाइव देखता है और पहुँचने पर WhatsApp पाता है।" } },
];

const WAYS: { id: Way; icon: typeof Check; name: Bi; line: Bi }[] = [
  { id: "rider", icon: Bike, name: { en: "Zomato rider", hi: "Zomato राइडर" }, line: { en: "Ravi, at your counter in 4 min", hi: "रवि, 4 मिनट में काउंटर पर" } },
  { id: "staff", icon: UserRound, name: { en: "Your staff", hi: "आपका स्टाफ़" }, line: { en: "Arjun takes it, tracking link sent", hi: "अर्जुन ले जा रहा है, ट्रैकिंग लिंक भेजा" } },
  { id: "pickup", icon: Store, name: { en: "Pickup", hi: "पिकअप" }, line: { en: "Ready at 8:40, customer told", hi: "8:40 पर तैयार, ग्राहक को बताया" } },
];

export function DirectOrderJourney() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const [way, setWay] = useState<Way>("rider");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setAuto(false);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, auto, inView]);

  const go = (k: number) => {
    setAuto(false);
    setStep(k);
  };
  const playing = auto && inView;

  return (
    <div ref={box} className="grid overflow-hidden rounded-[28px] bg-[#15181b] text-[#f1f1ec] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The steps: a list on wide screens, a row of icons on a phone */}
      <div className="p-5 sm:p-8">
        <ol className="flex items-center justify-between gap-1 lg:hidden">
          {STEPS.map((s, k) => (
            <li key={s.title.en} className="flex flex-1 items-center gap-1 last:flex-none">
              <StepDot k={k} step={step} icon={s.icon} label={pick(s.title)} onClick={() => go(k)} />
              {k < STEPS.length - 1 && (
                <span aria-hidden className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-[#2e3338]">
                  <span className={`absolute inset-y-0 left-0 bg-[var(--z-turmeric)] ${k < step ? "w-full" : "w-0"}`} />
                </span>
              )}
            </li>
          ))}
        </ol>
        <ol className="hidden space-y-1 lg:block">
          {STEPS.map((s, k) => {
            const on = k === step;
            return (
              <li key={s.title.en}>
                <button type="button" onClick={() => go(k)} aria-current={on ? "step" : undefined} className={`flex w-full gap-4 rounded-2xl p-3.5 text-left transition-colors ${on ? "bg-[#22262b]" : "hover:bg-[#1c1f23]"}`}>
                  <StepIcon k={k} step={step} icon={s.icon} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[17px] font-semibold leading-snug ${on ? "" : "text-[#9aa0a6]"}`}>{pick(s.title)}</span>
                    {on && <span className="mt-1 block text-[15px] leading-snug text-[#b4b9be]">{pick(s.text)}</span>}
                    {on && (
                      <span aria-hidden className="mt-3 block h-1 overflow-hidden rounded-full bg-[#2e3338]">
                        <span key={`${step}-${playing}`} className={`block h-full rounded-full bg-[var(--z-turmeric)] ${playing ? "jr-fill" : "w-full"}`} style={{ animationDuration: `${STEP_MS}ms` }} />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The scene for the current step */}
      <div className="flex flex-col bg-[#1c1f23] p-5 sm:p-8">
        <div key={step} className="jr-in flex h-[300px] items-center justify-center sm:h-[320px]">
          {step === 0 && <OrderScene />}
          {step === 1 && <PaidScene />}
          {step === 2 && <KitchenScene />}
          {step === 3 && <RideScene way={way} />}
          {step === 4 && <TrackScene way={way} />}
        </div>
        {step === 3 && (
          <div role="radiogroup" aria-label={pick({ en: "Who delivers", hi: "डिलीवरी कौन करे" })} className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-[#15181b] p-1.5">
            {WAYS.map((w) => (
              <button key={w.id} type="button" role="radio" aria-checked={way === w.id} onClick={() => { setAuto(false); setWay(w.id); }} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[13.5px] font-semibold transition-colors sm:text-[14.5px] ${way === w.id ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "text-[#b4b9be] hover:text-white"}`}>
                <w.icon aria-hidden size={16} className="shrink-0" />
                {pick(w.name)}
              </button>
            ))}
          </div>
        )}
        {/* the caption, on a phone (the list carries it on wide screens) */}
        <div className="mt-4 lg:hidden">
          <p className="text-[17px] font-semibold leading-snug">{pick(STEPS[step].title)}</p>
          <p className="mt-1 text-[15px] leading-snug text-[#b4b9be]">{step === 3 ? pick(WAYS.find((w) => w.id === way)!.line) : pick(STEPS[step].text)}</p>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ k, step, icon: Icon }: { k: number; step: number; icon: typeof Check }) {
  const done = k < step, on = k === step;
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : done ? "bg-[#2f7a4c] text-white" : "bg-[#2e3338] text-[#9aa0a6]"}`}>
      {done ? <Check aria-hidden size={18} strokeWidth={3} /> : <Icon aria-hidden size={18} />}
    </span>
  );
}

function StepDot({ k, step, icon, label, onClick }: { k: number; step: number; icon: typeof Check; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-current={k === step ? "step" : undefined} className="shrink-0">
      <StepIcon k={k} step={step} icon={icon} />
    </button>
  );
}

/* ---- the scenes ---- */

function OrderScene() {
  const { pick } = useApp();
  return (
    <div data-ui className="w-[250px] rounded-[22px] bg-[#fafaf6] p-4 text-[#1c1f23]">
      <p className="text-[15px] font-bold">Rasoi 27</p>
      <p className="text-[12px] text-[#545a61]">{pick({ en: "Your cart · Rahul", hi: "आपका कार्ट · राहुल" })}</p>
      <ul className="mt-3 space-y-2 text-[13.5px]">
        {[
          ["2 × Butter chicken", "₹658"],
          ["4 × Garlic naan", "₹276"],
        ].map(([n, p], k) => (
          <li key={n} className="jr-pop flex justify-between" style={{ animationDelay: `${200 + k * 250}ms` }}>
            <span>{n}</span>
            <span className="tabular-nums">{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-dashed border-[#d9dee3] pt-2 text-[14px] font-bold">{/* taste-skill-ignore: a receipt's dashed rule */}
        <span>{pick({ en: "Total", hi: "कुल" })}</span>
        <span className="tabular-nums">₹934</span>
      </p>
      <span className="jr-press mt-3 flex min-h-10 items-center justify-center rounded-full bg-[#1c1f23] text-[13.5px] font-semibold text-white">{pick({ en: "Place order · ₹934", hi: "ऑर्डर करें · ₹934" })}</span>
    </div>
  );
}

function PaidScene() {
  const { pick } = useApp();
  return (
    <div className="flex flex-col items-center text-center">
      <span className="jr-pop grid size-20 place-items-center rounded-full bg-[#2f7a4c]">
        <Check aria-hidden size={40} strokeWidth={3} />
      </span>
      <p className="jr-pop mt-5 text-[32px] font-bold tabular-nums" style={{ animationDelay: "200ms" }}>₹934</p>
      <p className="jr-pop mt-1 text-[15px] text-[#b4b9be]" style={{ animationDelay: "350ms" }}>{pick({ en: "Received by UPI · HDFC Bank ••4821", hi: "UPI से मिले · HDFC बैंक ••4821" })}</p>
      <p className="jr-pop mt-3 rounded-full bg-[#2e3338] px-3 py-1 text-[13px]" style={{ animationDelay: "500ms" }}>{pick({ en: "Order #2041 · Rahul", hi: "ऑर्डर #2041 · राहुल" })}</p>
    </div>
  );
}

function KitchenScene() {
  return (
    <div className="scale-[0.92] sm:scale-100">
      <Soundbox size="xs" bare state="printing" ticket={{ title: "RASOI 27", lines: ["KOT 2041 · Your page", "2 Butter chicken|658", "4 Garlic naan|276"], foot: "Paid ₹934 UPI" }} showTicket />
    </div>
  );
}

// A small night-mode map: the restaurant, the customer, and how the order travels between them.
const ROUTE = "M 60 150 L 150 150 L 150 80 L 270 80 L 270 50 L 330 50";
function RideScene({ way }: { way: Way }) {
  const { pick } = useApp();
  const [still, setStill] = useState(false);
  useEffect(() => setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const w = WAYS.find((x) => x.id === way)!;
  return (
    <div className="w-full max-w-[420px]">
      <svg viewBox="0 0 390 200" className="w-full" role="img" aria-label={pick({ en: "Map: the order travelling from Rasoi 27 to the customer", hi: "नक्शा: Rasoi 27 से ग्राहक तक जाता ऑर्डर" })}>
        <rect width="390" height="200" rx="18" fill="#22262b" />
        {[40, 110, 170].map((y) => (
          <rect key={y} x="0" y={y} width="390" height="7" fill="#2b3036" />
        ))}
        {[100, 200, 300].map((x) => (
          <rect key={x} x={x} y="0" width="7" height="200" fill="#2b3036" />
        ))}
        <rect x="215" y="120" width="70" height="40" rx="8" fill="#23382c" />
        {/* the customer, under the rider so the rider is seen arriving */}
        <circle cx="330" cy="50" r="14" fill={way === "pickup" ? "#3a3f45" : "#2f7a4c"} />
        <circle cx="330" cy="50" r="5" fill="#fafaf6" />
        {way !== "pickup" && (
          <>
            <path d={ROUTE} fill="none" stroke="#e9a31a" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path key={way} d={ROUTE} pathLength={1} className="jr-route" fill="none" stroke="#e9a31a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <g key={`m-${way}`} transform={still ? "translate(330 50)" : undefined}>
              {!still && <animateMotion dur="2.8s" begin="0.2s" fill="freeze" path={ROUTE} calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />}
              <circle r="11" fill="#e9a31a" />
              <circle r="4" fill="#1c1f23" />
            </g>
          </>
        )}
        {/* the restaurant */}
        <circle cx="60" cy="150" r="16" fill="#fafaf6" />
        <text x="60" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1c1f23">R</text>
      </svg>
      <p className="mt-3 hidden text-center text-[15px] text-[#b4b9be] lg:block">{pick(w.line)}</p>
    </div>
  );
}

function TrackScene({ way }: { way: Way }) {
  const { pick } = useApp();
  const stages: Bi[] = [
    { en: "Placed", hi: "ऑर्डर" },
    { en: "Cooking", hi: "पक रहा" },
    way === "pickup" ? { en: "Ready", hi: "तैयार" } : { en: "On the way", hi: "रास्ते में" },
    way === "pickup" ? { en: "Collected", hi: "ले लिया" } : { en: "Delivered", hi: "पहुँचा" },
  ];
  const msg: Bi =
    way === "pickup"
      ? { en: "Your order from Rasoi 27 is ready at the counter.", hi: "Rasoi 27 पर आपका ऑर्डर काउंटर पर तैयार है।" }
      : { en: "Delivered. Enjoy your meal from Rasoi 27!", hi: "पहुँच गया। Rasoi 27 के खाने का आनंद लीजिए!" };
  return (
    <div data-ui className="w-[270px] rounded-[22px] bg-[#efeae2] p-3 text-[#111b21]">
      <div className="jr-pop rounded-xl rounded-tl-none bg-white px-3 py-2 text-[13.5px] leading-snug">
        <p className="text-[11.5px] font-semibold text-[#1f6b3a]">Rasoi 27</p>
        <p className="mt-0.5">{pick(way === "pickup" ? { en: "Your order will be ready at 8:40.", hi: "आपका ऑर्डर 8:40 पर तैयार होगा।" } : { en: "Ravi is on the way. Track it live: zest.link/t/2041", hi: "रवि रास्ते में है। लाइव ट्रैक: zest.link/t/2041" })}</p>
      </div>
      <div className="mt-3 rounded-xl bg-white p-3">
        <div className="flex items-center gap-1.5">
          {stages.map((s, k) => (
            <span key={s.en} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e5e5]">
              <span className="jr-stage block h-full rounded-full bg-[#2f7a4c]" style={{ animationDelay: `${300 + k * 550}ms` }} />
            </span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-4 text-[10.5px] text-[#54656f]">
          {stages.map((s) => (
            <span key={s.en}>{pick(s)}</span>
          ))}
        </div>
      </div>
      <div className="jr-pop mt-3 rounded-xl rounded-tl-none bg-white px-3 py-2 text-[13.5px] leading-snug" style={{ animationDelay: "2500ms" }}>
        <p className="text-[11.5px] font-semibold text-[#1f6b3a]">Rasoi 27</p>
        <p className="mt-0.5">{pick(msg)}</p>
      </div>
    </div>
  );
}
