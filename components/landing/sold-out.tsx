"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Globe, MessageCircle, Search } from "lucide-react";
import { Soundbox } from "@/components/soundbox/soundbox";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// "Sold out? Just say it": push to talk on the Soundbox and rajma goes off the seller's page,
// WhatsApp menu, Google and Instagram, one after another. Say it's back and it's back. Plays once on
// its own when it comes into view; after that it waits for a press.

const CHANNELS: { id: string; icon: typeof Globe; name: Bi }[] = [
  { id: "page", icon: Globe, name: { en: "Your page", hi: "आपका पेज" } },
  { id: "whatsapp", icon: MessageCircle, name: { en: "WhatsApp menu", hi: "WhatsApp मेन्यू" } },
  { id: "google", icon: Search, name: { en: "Google", hi: "Google" } },
  { id: "instagram", icon: Camera, name: { en: "Instagram", hi: "Instagram" } },
];

export function SoldOut() {
  const { pick } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState(false);
  const [talking, setTalking] = useState(false);
  const [said, setSaid] = useState<Bi | null>(null);

  function say(next: boolean) {
    setTalking(true);
    setTimeout(() => {
      setTalking(false);
      setSaid(next ? { en: "Rajma is sold out everywhere.", hi: "राजमा अब हर जगह ख़त्म दिखेगा." } : { en: "Rajma is back on your menu.", hi: "राजमा फिर से मेन्यू में है." });
      setOff(next);
    }, 1000);
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOff(true);
      setSaid({ en: "Rajma is sold out everywhere.", hi: "राजमा अब हर जगह ख़त्म दिखेगा." });
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTimeout(() => say(true), 700);
      },
      { threshold: 0.5 },
    );
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="grid items-center gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
      <div className="flex flex-col items-center">
        <Soundbox size="sm" state={talking ? "speaking" : "idle"} caption={talking ? { en: "Listening…", hi: "सुन रहा है…" } : said ?? { en: "Press the side button and say a dish is finished.", hi: "साइड बटन दबाइए और बोलिए कौन-सी डिश ख़त्म हुई।" }} clip={said && off ? "sold-out" : undefined} onTalk={() => say(!off)} />
        <p className="mt-2 text-[14px] text-[var(--lp-muted)]">{pick({ en: "“Rajma khatam”", hi: "“राजमा ख़त्म”" })}</p>
      </div>
      <ul className="rounded-[24px] bg-[var(--lp-paper)] px-5 py-2 outline outline-1 -outline-offset-1 outline-[var(--lp-line)]">
        {CHANNELS.map((c, k) => (
          <li key={c.id} className="flex items-center gap-4 py-4">
            <c.icon aria-hidden size={20} className="shrink-0 text-[var(--lp-muted)]" />
            <p className="min-w-0 flex-1 text-[17px] font-semibold">{pick(c.name)}</p>
            <p className={`text-right text-[15px] font-medium transition-colors duration-300 ${off ? "text-[var(--lp-bad)]" : "text-[var(--lp-good)]"}`} style={{ transitionDelay: `${k * 220}ms` }}>
              {off ? pick({ en: "Rajma chawal: sold out", hi: "राजमा चावल: ख़त्म" }) : pick({ en: "Rajma chawal: on", hi: "राजमा चावल: उपलब्ध" })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
