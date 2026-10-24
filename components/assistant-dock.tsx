"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Bi } from "@/lib/i18n";
import { isHomeKitchen } from "@/lib/nav";
import { useApp } from "@/lib/state";
import { Copilot } from "./copilot";
import { ZestNudge } from "./zest-nudge";
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
  // Opened from the orb on a phone: voice first. A nudge or a wide screen opens it ready to type.
  const [voice, setVoice] = useState(false);
  // Zest says each screen's line a moment after it opens.
  const [said, setSaid] = useState(false);
  useEffect(() => {
    if (open) return;
    setSaid(false);
    const show = setTimeout(() => setSaid(true), 1200);
    return () => clearTimeout(show);
  }, [path, open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, setOpen]);
  const close = () => {
    setOpen(false);
    setAsk(undefined);
    setVoice(false);
  };

  return (
    <>
      {/* Above the bottom tabs on a phone, in the corner on wide screens */}
      {!open && (
        <div className="fixed bottom-[88px] right-4 z-40 flex items-end gap-2.5 lg:bottom-6 lg:right-6">
          {said && (
            <ZestNudge
              key={`${path}-${lang}`}
              say={pick(line.say)}
              ask={pick(line.ask)}
              onAsk={() => {
                setAsk(pick(line.ask));
                setOpen(true);
              }}
            />
          )}
          <button type="button" onClick={() => { setVoice(!window.matchMedia("(min-width: 1024px)").matches); setOpen(true); }} aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })} className="grid size-14 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95">
            <ZestOrb size={50} />
          </button>
        </div>
      )}

      {open && (
        <div className="za-scrim fixed inset-0 z-50 flex items-end justify-center bg-[#0b0d10]/35 backdrop-blur-[2px] lg:items-stretch lg:justify-end lg:bg-[#0b0d10]/40" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })}
            onClick={(e) => e.stopPropagation()}
            className="zx-panel zx-sheet flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] shadow-[0_-30px_80px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)] lg:h-full lg:w-[460px] lg:rounded-none lg:shadow-[-30px_0_80px_-20px_rgb(0_0_0/0.9),inset_1px_0_0_rgb(255_255_255/0.08)]"
          >
            <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />
            <Copilot onClose={close} ask={ask} voice={voice && !ask} className="bg-transparent" />
          </div>
        </div>
      )}
    </>
  );
}
