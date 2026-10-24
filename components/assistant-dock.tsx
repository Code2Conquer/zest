"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { Bi } from "@/lib/i18n";
import { isHomeKitchen } from "@/lib/nav";
import { useApp } from "@/lib/state";
import { Copilot } from "./copilot";
import { ZestOrb } from "./zest-orb";

// Zest in the dashboard, the same as on the website: an orb in the corner that speaks up beside itself
// about the screen you're on (tap the line to ask it), and a panel that opens over the dimmed page.

type Line = { say: Bi; ask: Bi };
const HOME: Record<string, Line> = {
  "/app": { say: { en: "Want to know what to cook more of this week?", hi: "जानना है इस हफ़्ते क्या ज़्यादा बनाएँ?" }, ask: { en: "What should I cook more of this week?", hi: "इस हफ़्ते क्या ज़्यादा बनाऊँ?" } },
  "/app/orders": { say: { en: "Two orders are waiting. Want a quick summary?", hi: "दो ऑर्डर इंतज़ार में हैं। छोटा सार चाहिए?" }, ask: { en: "Summarise today's orders", hi: "आज के ऑर्डर का सार बताइए" } },
  "/app/menu": { say: { en: "Rajma finished? I can switch it off for today.", hi: "राजमा ख़त्म? मैं आज के लिए बंद कर दूँ।" }, ask: { en: "Rajma is finished, turn it off for today", hi: "राजमा ख़त्म है, आज के लिए बंद कर दीजिए" } },
  "/app/customers": { say: { en: "Some regulars haven't ordered in a while. Shall I check?", hi: "कुछ पुराने ग्राहकों ने कुछ दिनों से ऑर्डर नहीं किया। देखूँ?" }, ask: { en: "Which regulars haven't ordered lately?", hi: "किन पुराने ग्राहकों ने हाल में ऑर्डर नहीं किया?" } },
};
const RESTAURANT: Record<string, Line> = {
  "/app": { say: { en: "Yesterday at a glance? I've read your emails.", hi: "कल का हाल एक नज़र में? आपके ईमेल पढ़ लिए हैं।" }, ask: { en: "How did we do yesterday?", hi: "कल कैसा रहा?" } },
  "/app/orders": { say: { en: "One order is running late. Want me to look?", hi: "एक ऑर्डर देर से चल रहा है। देखूँ?" }, ask: { en: "Which orders are running late?", hi: "कौन-से ऑर्डर देर से चल रहे हैं?" } },
  "/app/menu": { say: { en: "Out of something? Tell me and I'll update every menu.", hi: "कुछ ख़त्म हुआ? बताइए, मैं हर मेन्यू बदल दूँगा।" }, ask: { en: "Paneer is finished, turn it off everywhere", hi: "पनीर ख़त्म है, हर जगह बंद कर दीजिए" } },
  "/app/reviews": { say: { en: "A low rating needs a reply. I've drafted one.", hi: "एक कम रेटिंग का जवाब देना है। मैंने लिख रखा है।" }, ask: { en: "Show me the reviews that need a reply", hi: "जिन रिव्यू का जवाब देना है, दिखाइए" } },
  "/app/money": { say: { en: "Want to know when Swiggy pays this week?", hi: "जानना है इस हफ़्ते Swiggy कब भुगतान करेगा?" }, ask: { en: "When is my next payout?", hi: "मेरा अगला भुगतान कब है?" } },
};

export function AssistantDock({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { pick, outlet, lang } = useApp();
  const path = usePathname();
  const lines = isHomeKitchen(outlet) ? HOME : RESTAURANT;
  const line = lines[path] ?? lines["/app"];
  const [ask, setAsk] = useState<string | undefined>();
  // The line shows a moment after a screen opens, for a few seconds; it can be waved away for the visit.
  const [said, setSaid] = useState(false);
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    if (open || quiet) return;
    setSaid(false);
    const show = setTimeout(() => setSaid(true), 1200);
    const hide = setTimeout(() => setSaid(false), 10000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [path, open, quiet]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, setOpen]);
  const close = () => {
    setOpen(false);
    setAsk(undefined);
  };

  return (
    <>
      {/* Above the bottom tabs on a phone, in the corner on wide screens */}
      {!open && (
        <div className="fixed bottom-[88px] right-4 z-40 flex items-end gap-2.5 lg:bottom-6 lg:right-6">
          {said && (
            <div key={`${path}-${lang}`} className="zb relative mb-1 flex max-w-[min(300px,calc(100vw-96px))] items-start gap-1 rounded-[20px] rounded-br-md p-1 pl-3.5">
              <span aria-hidden className="zb-edge pointer-events-none absolute inset-x-4 bottom-0 h-px" />
              <button
                type="button"
                onClick={() => {
                  setAsk(pick(line.ask));
                  setOpen(true);
                }}
                className="py-2 text-left text-[14px] font-medium leading-snug text-ink"
              >
                <span className="sr-only">{pick(line.ask)}</span>
                <span aria-hidden>
                  {pick(line.say)
                    .split(" ")
                    .map((w, i) => (
                      <span key={i} className="zb-word" style={{ animationDelay: `${120 + i * 55}ms` }}>
                        {w}&nbsp;
                      </span>
                    ))}
                </span>
              </button>
              <button type="button" onClick={() => setQuiet(true)} aria-label={pick({ en: "Hide", hi: "छिपाएँ" })} className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-ink">
                <X aria-hidden size={14} />
              </button>
            </div>
          )}
          <button type="button" onClick={() => setOpen(true)} aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })} className="grid size-14 shrink-0 place-items-center rounded-full bg-[#121417]/90 shadow-[0_16px_36px_-12px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.09)] transition-transform hover:scale-105 active:scale-95">
            <ZestOrb size={36} />
          </button>
        </div>
      )}

      {open && (
        <div className="za-scrim fixed inset-0 z-50 flex items-end justify-center bg-[#0b0d10]/60 backdrop-blur-[3px] sm:justify-end sm:p-6" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })}
            onClick={(e) => e.stopPropagation()}
            className="za-in flex h-[86dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:h-[680px] sm:max-h-[calc(100dvh-48px)] sm:w-[440px] sm:rounded-[28px]"
          >
            <Copilot onClose={close} ask={ask} />
          </div>
        </div>
      )}
    </>
  );
}
