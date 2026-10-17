"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { BookOpen, Check, IndianRupee, MessageCircle, ReceiptText, Star } from "lucide-react";
import { ChannelTag, Stars } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

const SCENE_MS = 7000;

type SceneId = "menu" | "orders" | "reviews" | "money" | "whatsapp";

const SCENES: { id: SceneId; icon: typeof Star; title: Bi; body: Bi }[] = [
  {
    id: "menu",
    icon: BookOpen,
    title: { en: "Menu", hi: "मेन्यू" },
    body: { en: "Edit your menu the way customers see it. One change reaches every platform.", hi: "मेन्यू वैसे ही बदलें जैसे ग्राहक देखते हैं। एक बदलाव, हर प्लेटफ़ॉर्म पर।" },
  },
  {
    id: "orders",
    icon: ReceiptText,
    title: { en: "Orders", hi: "ऑर्डर" },
    body: { en: "Every Zomato, Swiggy and dine-in ticket on one rail, with late ones flagged before the customer notices.", hi: "Zomato, Swiggy और डाइन-इन के सारे टिकट एक जगह, और देर वाले ग्राहक से पहले पकड़े जाते हैं।" },
  },
  {
    id: "reviews",
    icon: Star,
    title: { en: "Reviews", hi: "रिव्यू" },
    body: { en: "Replies drafted in your voice within minutes. You approve, Zest posts.", hi: "मिनटों में आपके अंदाज़ में जवाब। आप मंज़ूर करें, Zest पोस्ट करेगा।" },
  },
  {
    id: "money",
    icon: IndianRupee,
    title: { en: "Payouts", hi: "पेआउट" },
    body: { en: "Every rupee between your sales and your bank, explained, with wrong deductions caught.", hi: "बिक्री से बैंक तक हर रुपये का हिसाब, और ग़लत कटौती पकड़ी जाती है।" },
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    title: { en: "WhatsApp", hi: "WhatsApp" },
    body: { en: "A morning summary, payout alerts and a weekly leaderboard. Reply to ask anything.", hi: "सुबह का सारांश, पेआउट अलर्ट और हर हफ़्ते लीडरबोर्ड। जवाब देकर कुछ भी पूछें।" },
  },
];

/** Advances a step counter while the scene is mounted. */
function useSteps(count: number, every: number) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? count : 0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s < count ? s + 1 : s)), every);
    return () => clearInterval(id);
  }, [count, every, reduce]);
  return step;
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-surface shadow-[0_0_0_1px_var(--line),0_40px_80px_-40px_rgba(30,40,30,0.45)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted">Rasoi 27, Indiranagar</span>
      </div>
      <div className="relative h-[420px] overflow-hidden p-5">{children}</div>
    </div>
  );
}

function MenuScene() {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const step = useSteps(4, 1100);
  const off = step >= 2;
  const rows: { name: string; photo: string; price: number; veg: boolean; best?: boolean; paneer?: boolean }[] = [
    { name: "Paneer tikka", photo: "hero-sizzler", price: 289, veg: true, best: true, paneer: true },
    { name: "Paneer butter masala", photo: "dish-butter-chicken", price: 309, veg: true, paneer: true },
    { name: "Masala dosa", photo: "dish-dosa", price: 149, veg: true, best: true },
  ];
  return (
    <Frame title={hi ? "मेन्यू" : "Menu"}>
      <AnimatePresence>
        {step >= 1 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-5 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-chilli-soft px-3.5 py-1.5 text-sm font-medium text-chilli shadow-sm"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-chilli" />
            {hi ? "स्टॉक अलर्ट: पनीर 0 kg" : "Stock alert: paneer at 0 kg"}
          </motion.p>
        )}
      </AnimatePresence>
      <ul className="mt-12 divide-y divide-line">
        {rows.map((r) => {
          const out = off && r.paneer;
          return (
            <li key={r.name} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`food-mark ${r.veg ? "text-veg" : "nonveg text-nonveg"}`} />
                  {r.best && <span className="rounded bg-haldi/25 px-1.5 py-0.5 text-[0.7rem] font-medium text-masala">{hi ? "बेस्टसेलर" : "Bestseller"}</span>}
                </span>
                <p className="mt-1 font-medium">{r.name}</p>
                <p className="text-sm text-ink-2">₹{r.price}</p>
              </div>
              <div className="relative">
                <motion.div animate={{ filter: out ? "grayscale(1)" : "grayscale(0)", opacity: out ? 0.55 : 1 }} transition={{ duration: 0.5 }}>
                  <img src={`/photos/${r.photo}.webp`} alt="" width={160} height={120} loading="lazy" decoding="async" className="h-[64px] w-[84px] rounded-xl object-cover shadow-[0_8px_16px_-10px_rgba(0,0,0,0.5)]" />
                </motion.div>
                <motion.span
                  layout
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-[0.7rem] font-semibold shadow ${out ? "bg-sunken text-muted" : "bg-surface text-veg"}`}
                >
                  {out ? (hi ? "आउट ऑफ़ स्टॉक" : "Out of stock") : hi ? "स्टॉक में" : "In stock"}
                </motion.span>
              </div>
            </li>
          );
        })}
      </ul>
      <AnimatePresence>
        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-5 bottom-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-leaf-soft px-4 py-2.5 text-sm text-leaf">
            <Check aria-hidden className="size-4" />
            {hi ? "2 डिश रोकी गईं" : "2 dishes paused"}
            <span className="inline-flex items-center gap-1">
              <ChannelTag channel="zomato" /> <Check aria-hidden className="size-3.5" />
            </span>
            <span className="inline-flex items-center gap-1">
              <ChannelTag channel="swiggy" /> <Check aria-hidden className="size-3.5" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

function OrdersScene() {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const step = useSteps(5, 900);
  const tickets = [
    { id: "7841", ch: "zomato" as const, items: "Paneer tikka, 2 butter naan", min: 9 },
    { id: "3390", ch: "swiggy" as const, items: "Dal makhani, jeera rice", min: 21, late: true },
    { id: "T4", ch: "dine" as const, items: "Thali x3, chaas x3", min: 12 },
    { id: "7838", ch: "zomato" as const, items: "Chicken biryani", min: 14 },
  ];
  return (
    <Frame title={hi ? "ऑर्डर" : "Orders"}>
      <div className="h-2 rounded-full bg-sunken" aria-hidden />
      <div className="-mt-1 grid grid-cols-2 gap-3">
        {tickets.slice(0, Math.min(step, 4)).map((t) => {
          const late = t.late && step >= 4;
          return (
            <motion.article
              key={t.id}
              initial={{ y: -40, opacity: 0, rotate: -2 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`ticket px-3.5 pb-3 pt-4 ${late ? "shadow-[0_0_0_2px_var(--chilli)]" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <ChannelTag channel={t.ch} />
                <span className="text-xs text-muted">#{t.id}</span>
              </div>
              <p className="mt-2 text-[0.92rem] font-medium leading-snug">{t.items}</p>
              <p className={`mt-2 text-sm ${late ? "font-medium text-chilli" : "text-ink-2"}`}>
                {late ? (hi ? `${t.min} मिनट, देर हो रही है` : `${t.min} min, running late`) : hi ? `${t.min} मिनट` : `${t.min} min`}
              </p>
            </motion.article>
          );
        })}
      </div>
      <AnimatePresence>
        {step >= 5 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-5 bottom-4 rounded-xl bg-turmeric-soft px-4 py-3 text-sm">
            <span className="font-medium">{hi ? "ऑर्डर एजेंट" : "Orders agent"}: </span>
            {hi ? "#3390 को सबसे पहले बनाने को कहा, राइडर और ग्राहक को 6 मिनट देरी बताई।" : "Moved #3390 to the front of the line and told the rider and customer it's 6 minutes late."}
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

function ReviewsScene() {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const reply = hi
    ? "कार्तिक जी, माफ़ कीजिए दाल ठंडी पहुँची। आज से दाल सील कंटेनर में जाएगी और अगले ऑर्डर पर ₹75 की छूट जोड़ दी है।"
    : "Karthik, sorry the dal reached you cold. From today it goes out in sealed containers, and we've added ₹75 off your next order.";
  const reduce = useReducedMotion();
  const [chars, setChars] = useState(reduce ? reply.length : 0);
  useEffect(() => {
    if (reduce) return;
    setChars(0);
    let typing: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      typing = setInterval(() => setChars((c) => (c < reply.length ? c + 2 : c)), 28);
    }, 900);
    return () => {
      clearTimeout(start);
      if (typing) clearInterval(typing);
    };
  }, [reply, reduce]);
  const done = chars >= reply.length;
  return (
    <Frame title={hi ? "रिव्यू" : "Reviews"}>
      <div className="rounded-xl bg-paper p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">Karthik R.</span>
          <Stars n={2} />
          <ChannelTag channel="swiggy" />
        </div>
        <q className="mt-2 block text-ink-2">Dal was cold by the time it reached and the rice was less than usual.</q>
      </div>
      <p className="mb-1.5 mt-5 text-sm text-muted">{hi ? "Zest का ड्राफ़्ट, आपके अंदाज़ में" : "Zest's draft, in your voice"}</p>
      <p className="min-h-[96px] border-l-2 border-turmeric pl-3 leading-relaxed">
        {reply.slice(0, chars)}
        {!done && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-ink" />}
      </p>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ scale: 1.6, opacity: 0, rotate: -14 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.5 }}
            className="absolute bottom-8 right-8 rounded-lg border-[3px] border-leaf px-4 py-1.5 text-lg font-bold uppercase tracking-wide text-leaf"
          >
            {hi ? "पोस्ट हुआ" : "Posted"}
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

function MoneyScene() {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const step = useSteps(6, 750);
  const gross = 96300;
  const lines = [
    { label: hi ? "बिक्री" : "Sales", amount: 96300, color: "var(--ch-swiggy)" },
    { label: hi ? "कमीशन" : "Commission", amount: -22150, color: "var(--muted)" },
    { label: hi ? "ऐड" : "Ads", amount: -4500, color: "var(--muted)" },
    { label: hi ? "कटौती" : "Deductions", amount: -2412, color: "var(--chilli)", flag: true },
    { label: hi ? "आपको मिलेगा" : "You receive", amount: 67238, color: "var(--leaf)" },
  ];
  return (
    <Frame title={hi ? "पेआउट" : "Payouts"}>
      <div className="flex items-baseline justify-between">
        <ChannelTag channel="swiggy" />
        <span className="text-sm text-muted">7 to 13 Oct</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {lines.map((l, i) => (
          <li key={l.label}>
            <div className="flex justify-between text-sm">
              <span className={l.flag && step >= 5 ? "font-medium text-chilli" : "text-ink-2"}>{l.label}</span>
              <span className="font-medium">
                {l.amount < 0 ? "−" : ""}₹{Math.abs(l.amount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-sunken">
              <motion.div
                className="h-full rounded-full"
                style={{ background: l.color }}
                initial={{ width: 0 }}
                animate={{ width: step > i ? `${(Math.abs(l.amount) / gross) * 100}%` : 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {step >= 6 && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
            animate={{ clipPath: "inset(0 0 -10px 0)", opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="ticket absolute inset-x-5 bottom-4 px-4 py-3"
          >
            <p className="text-[0.78rem] text-muted">{hi ? "पैसे वाला एजेंट" : "Money agent"}</p>
            <p className="font-medium">{hi ? "₹412 का डिस्प्यूट तैयार" : "₹412 dispute ready to send"}</p>
            <p className="text-sm text-ink-2">{hi ? "ऑर्डर #3381 ग्राहक ने खाना बनते समय कैंसल किया था।" : "Order #3381 was cancelled by the customer while it was cooking."}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Frame>
  );
}

function WhatsAppScene() {
  const { state } = useApp();
  const hi = state.lang === "hi";
  const step = useSteps(4, 1200);
  const msgs: { from: "zest" | "owner"; text: string }[] = [
    {
      from: "zest",
      text: hi
        ? "सुप्रभात अदिति! कल की बिक्री ₹42,490, पिछले गुरुवार से 9% ज़्यादा। 2 रिव्यू जवाब का इंतज़ार कर रहे हैं।"
        : "Good morning Aditi! Yesterday you sold ₹42,490, up 9% on last Thursday. 2 reviews are waiting for a reply.",
    },
    { from: "owner", text: "Payout kab aayega?" },
    {
      from: "zest",
      text: hi ? "Swiggy ₹67,238 मंगलवार को, Zomato ₹80,490 बुधवार को।" : "Swiggy ₹67,238 on Tuesday, Zomato ₹80,490 on Wednesday.",
    },
    { from: "owner", text: hi ? "बढ़िया 👍" : "Great, thanks" },
  ];
  return (
    <Frame title="WhatsApp">
      <div className="mx-auto h-full max-w-[300px] rounded-[28px] bg-curry p-3">
        <div className="flex h-full flex-col justify-end gap-2 rounded-[20px] bg-[#efe9dd] p-3">
          {msgs.slice(0, step).map((m, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-[0.88rem] leading-snug shadow-sm ${m.from === "owner" ? "ml-auto rounded-br-sm bg-[#d4efc4] text-[#132018]" : "rounded-bl-sm bg-white text-[#132018]"}`}
            >
              {m.text}
            </motion.p>
          ))}
        </div>
      </div>
    </Frame>
  );
}

const SCENE_COMPONENT: Record<SceneId, () => React.ReactElement> = {
  menu: MenuScene,
  orders: OrdersScene,
  reviews: ReviewsScene,
  money: MoneyScene,
  whatsapp: WhatsAppScene,
};

export function Showcase() {
  const { pick } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || !inView || reduce) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(id);
  }, [active, auto, inView, reduce]);

  const Scene = SCENE_COMPONENT[SCENES[active].id];

  return (
    <div ref={ref} className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <ul role="tablist" aria-label="Product tour" className="space-y-1">
        {SCENES.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setActive(i);
                  setAuto(false);
                }}
                className={`relative w-full overflow-hidden rounded-2xl px-5 py-4 text-left transition-colors ${on ? "bg-surface shadow-[0_0_0_1px_var(--line)]" : "hover:bg-sunken"}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid size-9 place-items-center rounded-full transition-colors ${on ? "bg-haldi text-ink" : "bg-sunken text-ink-2"}`}>
                    <s.icon aria-hidden className="size-[18px]" />
                  </span>
                  <span className="text-[1.15rem] font-medium">{pick(s.title)}</span>
                </span>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                      <span className="block pl-12 pt-2 leading-relaxed text-ink-2">{pick(s.body)}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                {on && auto && inView && !reduce && (
                  <motion.span
                    key={`bar-${active}`}
                    aria-hidden
                    className="absolute bottom-0 left-0 h-[3px] bg-haldi"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div role="tabpanel" aria-label={pick(SCENES[active].title)}>
        <AnimatePresence mode="wait">
          <motion.div key={SCENES[active].id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <Scene />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
