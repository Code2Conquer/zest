"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, MessageCircle, Store } from "lucide-react";
import { Soundbox, type SoundboxState } from "@/components/soundbox/soundbox";
import { MENU } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The pieces of /restaurants: orders from three channels arriving at one Soundbox, the Soundbox you
// can press (including what happens when nobody does), the morning summary on WhatsApp and Rasoi 27's
// own page on a phone.

type Channel = "page" | "zomato" | "swiggy";
const CH: Record<Channel, { name: Bi; icon: typeof Globe }> = {
  page: { name: { en: "Your page", hi: "आपका पेज" }, icon: Globe },
  zomato: { name: { en: "Zomato", hi: "Zomato" }, icon: Store },
  swiggy: { name: { en: "Swiggy", hi: "Swiggy" }, icon: Store },
};
const ARRIVALS: { ch: Channel; items: Bi; say: Bi; clip?: string }[] = [
  { ch: "swiggy", items: { en: "2 paneer tikka", hi: "2 पनीर टिक्का" }, say: { en: "New order on Swiggy. Two paneer tikka.", hi: "स्विगी पर नया ऑर्डर. दो पनीर टिक्का." }, clip: "swiggy" },
  { ch: "page", items: { en: "Dal makhani, 2 garlic naan", hi: "दाल मखनी, 2 गार्लिक नान" }, say: { en: "New order on your page. Dal makhani and two garlic naan.", hi: "आपके पेज पर नया ऑर्डर. दाल मखनी और दो गार्लिक नान." } },
  { ch: "zomato", items: { en: "Chicken biryani", hi: "चिकन बिरयानी" }, say: { en: "New order on Zomato. One chicken biryani.", hi: "ज़ोमैटो पर नया ऑर्डर. एक चिकन बिरयानी." } },
];

/** Hero: an order chip arrives from one of three channels, and the Soundbox says it in one voice. */
export function RestaurantStage() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"arrive" | "speak" | "rest">("rest");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setVisible(false);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = [setTimeout(() => setPhase("arrive"), 300), setTimeout(() => setPhase("speak"), 1200), setTimeout(() => setPhase("rest"), 4600), setTimeout(() => setN((v) => v + 1), 8600)];
    return () => t.forEach(clearTimeout);
  }, [n, visible]);

  const now = ARRIVALS[n % ARRIVALS.length];
  return (
    <div ref={box} className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_auto]">
      <ul className="order-2 grid gap-3 sm:order-1">
        {(["page", "zomato", "swiggy"] as Channel[]).map((c) => {
          const on = now.ch === c && phase !== "rest";
          const Icon = CH[c].icon;
          return (
            <li key={c} className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors duration-500 ${on ? "bg-[var(--lp-paper)] outline outline-2 -outline-offset-2 outline-[var(--z-turmeric)]" : "bg-[var(--lp-paper)] outline outline-1 -outline-offset-1 outline-[var(--lp-line)]"}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${on ? "bg-[var(--z-turmeric)] text-[#1c1f23]" : "bg-[var(--lp-sunken)]"}`}>
                <Icon aria-hidden size={18} />
              </span>
              <div className="min-w-0 text-[15px]">
                <p className="font-semibold">{pick(CH[c].name)}</p>
                <p key={`${c}-${n}`} className={`text-[var(--lp-muted)] ${on ? "hs-chip" : ""}`}>
                  {on ? pick(now.items) : pick({ en: "Waiting for orders", hi: "ऑर्डर का इंतज़ार" })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="order-1 flex justify-center sm:order-2">
        <Soundbox size="sm" state={phase === "arrive" ? "ringing" : phase === "speak" ? "speaking" : "idle"} caption={phase === "rest" && n === 0 ? undefined : now.say} clip={now.clip} />
      </div>
    </div>
  );
}

/** The Soundbox you can press: a Swiggy order rings; if nobody accepts, it gets louder. */
export function RestaurantVoice() {
  const [state, setState] = useState<SoundboxState>("ringing");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (state !== "ringing") return;
    timer.current = setTimeout(() => setState("escalating"), 6000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state]);
  const caption: Bi =
    state === "escalating"
      ? { en: "Order waiting! Please accept the Swiggy order.", hi: "ऑर्डर इंतज़ार में है! स्विगी वाला ऑर्डर मंज़ूर कीजिए." }
      : state === "printing" || state === "accepted"
        ? { en: "Accepted. Ticket printed.", hi: "ऑर्डर मंज़ूर. टिकट छप गया." }
        : { en: "New order on Swiggy. Two paneer tikka.", hi: "स्विगी पर नया ऑर्डर. दो पनीर टिक्का." };
  return (
    <Soundbox
      state={state}
      caption={caption}
      clip={state === "escalating" ? "missed" : state === "ringing" ? "swiggy" : undefined}
      ticket={{ title: "RASOI 27", lines: ["KOT 204 · Swiggy", "2 Paneer tikka|578"], foot: "Swiggy order #3390" }}
      showTicket={state === "printing" || state === "accepted"}
      onPress={() => setState(state === "ringing" || state === "escalating" ? "printing" : state === "printing" ? "accepted" : "ringing")}
    />
  );
}

/** The WhatsApp message Zest sends every morning, built from the food apps' emails. */
export function MorningSummary() {
  const { pick } = useApp();
  return (
    <div data-ui className="mx-auto w-full max-w-[400px] rounded-[30px] bg-[#1c1f23] p-[7px]">
      <div className="overflow-hidden rounded-[24px] bg-[#e9e3dc] text-[#1c1f23]">
        <p className="flex items-center gap-2 bg-[#1f6b3a] px-4 py-3 text-[15px] font-semibold text-white">
          <MessageCircle aria-hidden size={16} /> Zest
        </p>
        <div className="space-y-2 p-3.5">
          <div className="rounded-xl rounded-tl-sm bg-white p-3.5 text-[14.5px] leading-relaxed">
            <p className="font-semibold">{pick({ en: "Good morning, Aditi. Yesterday at Rasoi 27:", hi: "सुप्रभात अदिति। कल Rasoi 27 में:" })}</p>
            <table className="mt-2 w-full text-[14px]">
              <tbody>
                {[
                  ["Zomato", "₹1,419", "4"],
                  ["Swiggy", "₹1,039", "3"],
                  [pick({ en: "Your page", hi: "आपका पेज" }), "₹289", "1"],
                ].map(([k, amt, n]) => (
                  <tr key={k}>
                    <td className="py-0.5">{k}</td>
                    <td className="py-0.5 text-right tabular-nums">{amt}</td>
                    <td className="py-0.5 pl-3 text-right tabular-nums text-[#545a61]">
                      {n} {pick({ en: "orders", hi: "ऑर्डर" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2">{pick({ en: "Payouts coming: Swiggy ₹67,238 on Tuesday, Zomato ₹80,490 on Wednesday.", hi: "आने वाले पेआउट: स्विगी ₹67,238 मंगलवार, ज़ोमैटो ₹80,490 बुधवार।" })}</p>
            <p className="mt-1">{pick({ en: "Ratings: Zomato 4.2 (up 0.1), Swiggy 4.0 (down 0.1).", hi: "रेटिंग: ज़ोमैटो 4.2 (0.1 ऊपर), स्विगी 4.0 (0.1 नीचे)।" })}</p>
          </div>
          <div className="rounded-xl rounded-tl-sm bg-white p-3.5 text-[14.5px] leading-relaxed">
            <p className="font-semibold">{pick({ en: "One review needs a reply:", hi: "एक रिव्यू का जवाब देना है:" })}</p>
            <p className="mt-1">{pick({ en: "Karthik, 2 stars on Swiggy: “Dal was cold by the time it reached.” A reply is drafted. Shall I post it?", hi: "कार्तिक, स्विगी पर 2 स्टार: “दाल पहुँचते-पहुँचते ठंडी हो गई।” जवाब तैयार है। पोस्ट कर दूँ?" })}</p>
          </div>
          <p className="ml-auto w-fit rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[14.5px]">{pick({ en: "Yes, post it", hi: "हाँ, पोस्ट करो" })}</p>
        </div>
      </div>
    </div>
  );
}

/** Rasoi 27's own ordering page, drawn on a phone with its real menu. */
export function RasoiPhone() {
  const items = ["m1", "m3", "m2"].map((id) => MENU.find((m) => m.id === id)!);
  return (
    <div data-ui className="mx-auto w-[248px] shrink-0 rounded-[32px] bg-[#1c1f23] p-[7px]">
      <div className="overflow-hidden rounded-[26px] bg-[#fafaf6] text-[#1c1f23]">
        <div className="relative h-[110px]">
          <img src="/photos/menu-paneer-tikka.webp" alt="" className="size-full object-cover" loading="lazy" />
          <span aria-hidden className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1f23]" />
        </div>
        <div className="px-3.5 pt-3">
          <p className="text-[17px] font-bold leading-tight">Rasoi 27</p>
          <p className="text-[12px] text-[#545a61]">North Indian · Biryani · Indiranagar</p>
        </div>
        <ul className="space-y-1 p-2.5">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 rounded-xl bg-white p-1.5">
              <img src={m.photo} alt="" className="size-11 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold leading-tight">{m.name}</p>
                <p className="text-[12px]">₹{m.price.zomato}</p>
              </div>
              <span className="rounded-md border border-[#2f7a4c] px-1.5 py-0.5 text-[10.5px] font-bold text-[#2f7a4c]">ADD</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
