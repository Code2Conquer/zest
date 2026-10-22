"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Check, MessageCircle, Mic, Pause, Play, Star } from "lucide-react";

// "See it work": one order at the sample restaurant, from the guest's first WhatsApp message to the
// review reply, played like a short film in five chapters. It plays only while on screen, can be
// paused, and any chapter can be picked.

const SCENE_MS = 3800;

const CHAPTERS = [
  { t: "8:02 pm", title: "Ananya orders on WhatsApp" },
  { t: "8:02 pm", title: "Zest Soundbox speaks it in the kitchen" },
  { t: "8:03 pm", title: "One press: accepted, ticket printed" },
  { t: "8:24 pm", title: "Food ready: a Zomato rider is on the way" },
  { t: "8:52 pm", title: "Delivered, and her review answered" },
];

export function DemoPlayer() {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0); // restarts the progress bar animation
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const running = playing && visible;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setK((v) => (v + 1) % CHAPTERS.length);
      setTick((v) => v + 1);
    }, SCENE_MS);
    return () => clearTimeout(t);
  }, [running, k, tick]);

  function go(n: number) {
    setK(n);
    setTick((v) => v + 1);
  }

  return (
    <div ref={box} data-ui className="overflow-hidden rounded-[28px] bg-[#0d1813] text-[#e6efe9]">
      <div className="relative grid min-h-[440px] place-items-center px-5 py-10 sm:min-h-[480px]">
        <div key={`${k}-${tick}`} className="lp-swap w-full max-w-[520px]">
          {k === 0 && <SceneChat />}
          {k === 1 && <SceneSpeak />}
          {k === 2 && <SceneTicket />}
          {k === 3 && <SceneRider />}
          {k === 4 && <SceneReview />}
        </div>
        <p className="absolute left-5 top-5 rounded-full bg-[#15281f] px-3 py-1 text-[13px] font-semibold tabular-nums text-[#9fe0bd] sm:left-7 sm:top-6">{CHAPTERS[k].t}</p>
      </div>

      {/* Chapters: a progress bar per scene, like a short film's timeline */}
      <div className="bg-[#0a130f] px-5 py-5 sm:px-7">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pause the demo" : "Play the demo"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--lp-accent)] text-[#121a16] transition-transform active:scale-95"
          >
            {playing ? <Pause aria-hidden size={18} fill="currentColor" /> : <Play aria-hidden size={18} fill="currentColor" />}
          </button>
          <ol className="grid flex-1 grid-cols-5 gap-2">
            {CHAPTERS.map((c, n) => (
              <li key={c.title}>
                <button type="button" onClick={() => go(n)} aria-label={`${c.t}: ${c.title}`} aria-current={n === k ? "step" : undefined} className="block w-full py-2">
                  <span className="block h-1 overflow-hidden rounded-full bg-[#22382e]">
                    {n < k && <span className="block h-full w-full bg-[#7fd1a5]" />}
                    {n === k && <span key={tick} className={`block h-full bg-[var(--lp-accent)] ${running ? "lp-tick" : "w-1/2"}`} style={{ "--lp-tick": `${SCENE_MS}ms` } as React.CSSProperties} />}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <p key={k} className="lp-arrive mt-3 text-[16px] font-medium sm:pl-[60px]">
          {CHAPTERS[k].title}
        </p>
      </div>
    </div>
  );
}

function SceneChat() {
  return (
    <div className="mx-auto max-w-[360px] rounded-[24px] bg-[#e5ddd5] p-4 text-[15px] text-[#121a16]">
      <p className="flex items-center gap-2 pb-1 font-semibold">
        <MessageCircle aria-hidden size={17} className="text-[#1f9d55]" /> Rasoi 27
      </p>
      <p className="lp-arrive ml-auto mt-3 w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2">Hi! 1 dal makhani and 2 garlic naan please</p>
      <p className="lp-arrive mt-2 w-fit max-w-[88%] rounded-xl rounded-tl-sm bg-white px-3 py-2" style={{ animationDelay: "900ms" }}>
        Got it, Ananya: dal makhani ₹249, 2 garlic naan ₹138. ₹387 total, ready in 25 min. Less spicy, like always?
      </p>
      <p className="lp-arrive ml-auto mt-2 w-fit rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2" style={{ animationDelay: "2000ms" }}>
        Yes please, thank you!
      </p>
    </div>
  );
}

function SceneSpeak() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative grid size-[150px] place-items-center rounded-full bg-[#1b201d]">
        <span aria-hidden className="lp-ring absolute inset-6 rounded-full border-2 border-[var(--lp-accent)]" />
        <span aria-hidden className="lp-ring late absolute inset-6 rounded-full border-2 border-[var(--lp-accent)]" />
        <span className="grid size-16 place-items-center rounded-full bg-[#121614] text-[var(--lp-accent)]">
          <Mic aria-hidden size={26} />
        </span>
      </div>
      <p className="max-w-[26ch] text-center text-[20px] font-medium leading-snug">
        <span className="text-[var(--lp-accent)]">Zest: </span>“New WhatsApp order! One dal makhani, two garlic naan. Less spicy.”
      </p>
    </div>
  );
}

function SceneTicket() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex h-[200px] items-end overflow-hidden">
        <div className="lp-print w-[220px] rounded-t-md bg-[#fbfaf6] px-4 pb-5 pt-4 text-[14px] leading-snug text-[#121a16]">
          <p className="font-bold uppercase tracking-wide">Rasoi 27 · KOT #118</p>
          <p className="mt-2">WhatsApp · Ananya R.</p>
          <p className="mt-2 font-semibold">1 dal makhani (less spicy)</p>
          <p className="font-semibold">2 garlic naan</p>
          <p className="mt-2">Ready by 8:28 pm</p>
        </div>
      </div>
      <p className="flex items-center gap-2 rounded-full bg-[#1d3328] px-4 py-2 text-[15px] font-semibold text-[#9fe0bd]">
        <Check aria-hidden size={17} /> Accepted · Ananya got “Cooking now”
      </p>
    </div>
  );
}

function SceneRider() {
  return (
    <div className="mx-auto max-w-[420px] rounded-[24px] bg-[#132a20] p-5">
      <p className="flex items-center justify-between text-[15px] font-semibold">
        <span className="flex items-center gap-2">
          <Bike aria-hidden size={18} className="text-[var(--lp-accent)]" /> Zomato rider · Ravi
        </span>
        <span className="text-[#9fe0bd]">4 min away</span>
      </p>
      <div className="relative mt-6 h-2 rounded-full bg-[#22382e]">
        <span className="lp-bar-go absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[var(--lp-accent)]" />
      </div>
      <div className="mt-3 flex justify-between text-[13px] text-[#8fa89a]">
        <span>Rasoi 27</span>
        <span>Ananya, 2.1 km</span>
      </div>
      <p className="mt-5 rounded-xl bg-[#0d1813] p-3 text-[14px] text-[#c8d8ce]">Ananya is tracking it live. If Ravi runs late, you hear it first.</p>
    </div>
  );
}

function SceneReview() {
  return (
    <div className="mx-auto max-w-[420px] space-y-3">
      <div className="rounded-[20px] bg-[#132a20] p-4">
        <p className="flex items-center gap-1 text-[15px] font-semibold">
          Ananya R.
          {Array.from({ length: 5 }, (_, n) => (
            <Star key={n} aria-hidden size={14} fill="currentColor" strokeWidth={0} className="text-[var(--lp-accent)]" />
          ))}
        </p>
        <p className="mt-1 text-[15px] text-[#c8d8ce]">“Hot, quick, and they remembered less spicy. Best dal in Indiranagar.”</p>
      </div>
      <div className="lp-arrive rounded-[20px] border border-[#3f6b58] p-4" style={{ animationDelay: "1100ms" }}>
        <p className="text-[13px] font-semibold text-[#9fe0bd]">Reply, approved by you</p>
        <p className="mt-1 text-[15px]">“Thank you, Ananya! The tandoor team says see you Friday.”</p>
      </div>
    </div>
  );
}
