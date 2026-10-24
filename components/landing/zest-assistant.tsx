"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import { ZestNudge } from "@/components/zest-nudge";
import { ZestOrb } from "@/components/zest-orb";
import { api } from "@/lib/api";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Zest, the assistant on the website: an orb in the corner that speaks up beside itself about whatever
// section is on screen (a line, its words arriving one by one); tapping the line asks its question,
// tapping the orb opens Zest. The conversation
// opens in an overlay with suggested questions. Type, or speak (Hindi or English, by the browser's own
// speech recognition); answers spoken back when you spoke. Nothing is remembered after the tab closes.

type Turn = { role: "user" | "assistant"; text: string };

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function ZestAssistant({ audience }: { audience: "home" | "restaurants" }) {
  const { pick, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [hello, setHello] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const canListen = typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  useEffect(() => {
    const t = setTimeout(() => setHello(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setTimeout(() => input.current?.focus(), 50);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = /[ऀ-ॿ]/.test(text) ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(u);
  }

  async function send(text: string, spoken = false) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    const next: Turn[] = [...turns, { role: "user", text: q }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    try {
      const { reply } = await api<{ reply: string }>("/api/assistant", { method: "POST", json: { history: next } });
      setTurns([...next, { role: "assistant", text: reply }]);
      if (spoken || voice) speak(reply);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    if (listening) return rec.current?.stop();
    const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const R = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!R) return;
    const r = new R();
    r.lang = lang === "hi" ? "hi-IN" : "en-IN";
    r.interimResults = true;
    r.continuous = false;
    let said = "";
    r.onresult = (e) => {
      said = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ");
      setDraft(said);
    };
    r.onend = () => {
      setListening(false);
      if (said.trim()) {
        setVoice(true);
        void send(said, true);
      }
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    window.speechSynthesis?.cancel();
    setListening(true);
    r.start();
  }

  // What Zest says beside its orb, by the section on screen: a line, and the question tapping it asks.
  const LINES: Record<string, { say: Bi; ask: Bi }> =
    audience === "home"
      ? {
          top: { say: { en: "Move the slider. I'll explain the maths.", hi: "स्लाइडर खिसकाइए। हिसाब मैं समझाऊँगा।" }, ask: { en: "How is this estimate worked out?", hi: "यह अंदाज़ा कैसे निकाला गया?" } },
          why: { say: { en: "Want to know how far Zomato riders can take your food?", hi: "जानना है Zomato राइडर आपका खाना कितनी दूर ले जा सकते हैं?" }, ask: { en: "How does delivery work?", hi: "डिलीवरी कैसे होती है?" } },
          covered: { say: { en: "Money lands in your bank before you cook. Ask me how.", hi: "पकाने से पहले पैसा आपके बैंक में। पूछिए कैसे।" }, ask: { en: "How do I get paid?", hi: "मुझे पैसा कैसे मिलेगा?" } },
          looks: { say: { en: "Send me a photo of your menu. I'll do the rest.", hi: "मेन्यू की फ़ोटो भेजिए। बाक़ी मैं कर दूँगा।" }, ask: { en: "How do I add my menu?", hi: "मैं अपना मेन्यू कैसे जोड़ूँ?" } },
        }
      : {
          top: { say: { en: "You keep Zomato and Swiggy. Ask me how this fits.", hi: "Zomato और Swiggy बने रहेंगे। पूछिए यह कैसे जुड़ता है।" }, ask: { en: "Do I have to leave Zomato or Swiggy?", hi: "क्या Zomato या Swiggy छोड़ना होगा?" } },
          orders: { say: { en: "Lost a party order to a busy phone? I can catch those.", hi: "भीड़ में फ़ोन पर पार्टी ऑर्डर छूटा? मैं पकड़ लूँगा।" }, ask: { en: "How do I take phone and WhatsApp orders?", hi: "फ़ोन और WhatsApp ऑर्डर कैसे लूँ?" } },
          delivery: { say: { en: "Who carries orders from your page? Ask me.", hi: "आपके पेज के ऑर्डर कौन पहुँचाता है? पूछिए।" }, ask: { en: "Who delivers orders from my page?", hi: "मेरे पेज के ऑर्डर कौन पहुँचाता है?" } },
          soundbox: { say: { en: "Want to know what the Soundbox says, and when?", hi: "जानना है Soundbox क्या और कब बोलता है?" }, ask: { en: "What does the Soundbox do?", hi: "Soundbox क्या करता है?" } },
          summary: { say: { en: "Your 7:30 summary comes from your emails. Curious?", hi: "सुबह 7:30 की रिपोर्ट आपके ईमेल से बनती है। जानना है?" }, ask: { en: "What's in the morning summary?", hi: "सुबह की रिपोर्ट में क्या आता है?" } },
        };
  // The same questions, offered inside Zest when it opens.
  const SUGGEST: Bi[] = Object.values(LINES).map((l) => l.ask);
  // The section on screen, watched as the page scrolls.
  const [where, setWhere] = useState("top");
  useEffect(() => {
    const ids = Object.keys(LINES).filter((k) => k !== "top");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setWhere(e.target.id);
        if (window.scrollY < 300) setWhere("top");
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);
  // Zest says each section's line once per visit, a moment after the section arrives.
  const [said, setSaid] = useState<string | null>(null);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!hello || open || heard.has(where)) return;
    setSaid(null);
    const show = setTimeout(() => {
      setSaid(where);
      setHeard((h) => new Set(h).add(where));
    }, 700);
    return () => clearTimeout(show);
  }, [where, hello, open, heard]);
  // On a phone Zest is a round button (a FAB) that slides away while the page scrolls and comes back
  // once it rests. It steps aside for the closing call to action everywhere.
  const [moving, setMoving] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    let rest: ReturnType<typeof setTimeout> | undefined;
    const on = () => {
      const e = document.getElementById("final-start");
      setAtEnd(!!e && e.getBoundingClientRect().top < window.innerHeight - 40);
      setMoving(true);
      clearTimeout(rest);
      rest = setTimeout(() => setMoving(false), 500);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      clearTimeout(rest);
    };
  }, []);
  const line = said ? LINES[said] : null;
  // Opening Zest from its orb: on a phone it starts listening straight away (voice first); on a wide
  // screen it opens the side panel ready to type.
  const openZest = () => {
    setOpen(true);
    if (canListen && !window.matchMedia("(min-width: 1024px)").matches && !listening) listen();
  };
  const ask = (q: Bi) => {
    setOpen(true);
    void send(pick(q));
  };

  return (
    <>
      {/* The orb, bottom right, and what Zest says beside it. On a phone it slides away while the page scrolls. */}
      <div className={`fixed bottom-4 right-4 z-50 flex items-end gap-2.5 transition-[opacity,transform] duration-300 sm:bottom-6 sm:right-6 ${atEnd ? "pointer-events-none opacity-0" : moving ? "max-sm:pointer-events-none max-sm:translate-y-6 max-sm:opacity-0" : ""}`}>
        {!open && line && <ZestNudge key={`${said}-${lang}`} say={pick(line.say)} ask={pick(line.ask)} onAsk={() => ask(line.ask)} />}
        {!open && (
          <button
            type="button"
            onClick={openZest}
            aria-label={pick({ en: "Ask Zest", hi: "Zest से पूछिए" })}
            className={`grid size-14 shrink-0 place-items-center rounded-full transition-[transform,opacity] duration-500 hover:scale-105 active:scale-95 ${hello ? "opacity-100" : "pointer-events-none scale-75 opacity-0"}`}
          >
            <ZestOrb size={50} />
          </button>
        )}
      </div>

      {open && (
        <div className="za-scrim fixed inset-0 z-50 flex items-end justify-center bg-[#0b0d10]/60 backdrop-blur-[3px] lg:items-stretch lg:justify-end lg:bg-[#0b0d10]/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pick({ en: "Talk to Zest", hi: "Zest से बात कीजिए" })}
            onClick={(e) => e.stopPropagation()}
            className={/* taste-skill-ignore: floating overlay */ "zx-panel zx-sheet flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] text-[var(--lp-ink)] shadow-[0_-30px_80px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)] lg:h-full lg:w-[440px] lg:rounded-none lg:shadow-[-30px_0_80px_-20px_rgb(0_0_0/0.9),inset_1px_0_0_rgb(255_255_255/0.08)]"}
          >
            {/* Grab handle on the phone sheet */}
            <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />
            <div className="flex items-center gap-3 px-5 pb-3 pt-3 lg:pt-5">
              <ZestOrb size={36} state={busy ? "thinking" : listening ? "listening" : "idle"} />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-tight">Zest</p>
                <p className="text-[13px] text-[var(--lp-muted)]">{busy ? pick({ en: "thinking…", hi: "सोच रहा है…" }) : listening ? pick({ en: "listening…", hi: "सुन रहा है…" }) : pick({ en: "Ask in Hindi or English", hi: "हिंदी या अंग्रेज़ी में पूछिए" })}</p>
              </div>
              <button type="button" onClick={() => setVoice((v) => !v)} aria-pressed={voice} aria-label={voice ? pick({ en: "Stop reading answers aloud", hi: "जवाब बोलना बंद करें" }) : pick({ en: "Read answers aloud", hi: "जवाब बोलकर सुनाएँ" })} className="grid size-10 place-items-center rounded-full text-[var(--lp-muted)] hover:bg-[var(--lp-sunken)] hover:text-[var(--lp-ink)]">
                {voice ? <Volume2 aria-hidden size={19} /> : <VolumeX aria-hidden size={19} />}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label={pick({ en: "Close", hi: "बंद करें" })} className="grid size-10 place-items-center rounded-full text-[var(--lp-muted)] hover:bg-[var(--lp-sunken)] hover:text-[var(--lp-ink)]">
                <X aria-hidden size={20} />
              </button>
            </div>

            <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-live="polite">
              {/* Before the first question: the orb, large. Tap it to speak; it shows when it's listening. */}
              {turns.length === 0 && (
                <div className="flex flex-col items-center pb-2 pt-4 text-center">
                  <button type="button" onClick={canListen ? listen : () => input.current?.focus()} aria-label={listening ? pick({ en: "Stop listening", hi: "सुनना बंद करें" }) : pick({ en: "Speak your question", hi: "बोलकर पूछिए" })} className="rounded-full transition-transform active:scale-95">
                    <ZestOrb size={112} state={busy ? "thinking" : listening ? "listening" : "idle"} />
                  </button>
                  <div aria-hidden className={`zx-wave mt-5 flex h-9 items-center gap-1 transition-opacity ${listening ? "opacity-100" : "opacity-0"}`}>
                    {[14, 26, 36, 22, 32, 18, 28, 12].map((h, i) => (
                      <i key={i} style={{ height: h, animationDelay: `${-i * 0.13}s` }} />
                    ))}
                  </div>
                  <p className="mt-2 text-[17px] font-semibold">
                    {listening ? pick({ en: "Listening…", hi: "सुन रहा हूँ…" }) : canListen ? pick({ en: "Tap and speak", hi: "दबाइए और बोलिए" }) : pick({ en: "Ask me anything", hi: "कुछ भी पूछिए" })}
                  </p>
                  <p className="mt-0.5 text-[14px] text-[var(--lp-muted)]">{pick({ en: "In Hindi or English. Bol kar poochhiye.", hi: "हिंदी या अंग्रेज़ी में। बोलकर पूछिए।" })}</p>
                </div>
              )}
              <p className="w-fit max-w-[88%] rounded-2xl rounded-tl-md bg-white/[0.07] px-4 py-3 text-[15px] leading-relaxed">
                {audience === "home"
                  ? pick({ en: "Hi! I'm Zest. I can tell you how your kitchen can take online orders, get paid by UPI and deliver with Zomato riders. What would you like to know?", hi: "नमस्ते! मैं Zest हूँ। आपकी रसोई ऑनलाइन ऑर्डर कैसे ले, UPI से पैसा कैसे पाए और Zomato राइडर से कैसे पहुँचाए, यह बता सकता हूँ। क्या जानना चाहेंगे?" })
                  : pick({ en: "Hi! I'm Zest. I can tell you how your own page brings in the orders Zomato and Swiggy never see, and how they're delivered. What would you like to know?", hi: "नमस्ते! मैं Zest हूँ। आपका अपना पेज वे ऑर्डर कैसे लाता है जो Zomato और Swiggy तक नहीं पहुँचते, और वे कैसे पहुँचते हैं, यह बता सकता हूँ। क्या जानना चाहेंगे?" })}
              </p>
              {turns.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGEST.map((q) => (
                    <button key={q.en} type="button" onClick={() => send(pick(q))} className="za-chip relative overflow-hidden rounded-full px-4 py-2.5 text-[14px] font-semibold">
                      {pick(q)}
                    </button>
                  ))}
                </div>
              )}
              {turns.map((t, i) =>
                t.role === "user" ? (
                  <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--z-turmeric)] px-4 py-2.5 text-[15px] leading-relaxed text-[#1c1f23]">
                    {t.text}
                  </p>
                ) : (
                  <p key={i} className="hs-chip w-fit max-w-[88%] rounded-2xl rounded-tl-md bg-white/[0.07] px-4 py-3 text-[15px] leading-relaxed">
                    {t.text}
                  </p>
                ),
              )}
              {busy && (
                <p className="lp-typing flex w-fit gap-1.5 rounded-2xl rounded-tl-md bg-white/[0.07] px-4 py-4">
                  <span className="sr-only">{pick({ en: "Zest is typing", hi: "Zest लिख रहा है" })}</span>
                  <i aria-hidden className="size-2 rounded-full bg-[var(--lp-muted)]" />
                  <i aria-hidden className="size-2 rounded-full bg-[var(--lp-muted)]" />
                  <i aria-hidden className="size-2 rounded-full bg-[var(--lp-muted)]" />
                </p>
              )}
              {error && <p className="text-[14px] text-[var(--lp-bad)]">{error}</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
              className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
            >
              {/* One composer, after Airbnb's fields: a quiet edge that turns white while typing, no second ring. */}
              <div className="flex items-end gap-1.5 rounded-[26px] bg-[#0f1114]/85 p-1.5 pl-4 backdrop-blur shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_#f1f1ec]">
              <label htmlFor="za-input" className="sr-only">
                {pick({ en: "Your question", hi: "आपका सवाल" })}
              </label>
              <textarea
                id="za-input"
                ref={input}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                placeholder={listening ? pick({ en: "Listening…", hi: "सुन रहा है…" }) : pick({ en: "Type or tap the mic", hi: "लिखिए या माइक दबाइए" })}
                className={/* taste-skill-ignore: floating overlay */ "max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-snug outline-none placeholder:text-[var(--lp-faint)] focus-visible:!outline-none"}
              />
              {canListen && (
                <button type="button" onClick={listen} aria-pressed={listening} aria-label={listening ? pick({ en: "Stop listening", hi: "सुनना बंद करें" }) : pick({ en: "Speak your question", hi: "बोलकर पूछिए" })} className={`relative grid size-11 shrink-0 place-items-center rounded-full text-[var(--lp-muted)] transition-colors ${listening ? "bg-[var(--lp-bad)] text-white" : "hover:bg-white/[0.07] hover:text-[var(--lp-ink)]"}`}>
                  {listening && <span aria-hidden className="za-pulse absolute inset-0 rounded-full" />}
                  {listening ? <Square aria-hidden size={16} className="fill-current" /> : <Mic aria-hidden size={20} />}
                </button>
              )}
              <button type="submit" disabled={busy || !draft.trim()} aria-label={pick({ en: "Send", hi: "भेजें" })} className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--z-turmeric)] text-[#1c1f23] transition-colors disabled:cursor-not-allowed disabled:bg-[#2a2e33] disabled:text-[#7c828a]">
                {busy ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <ArrowUp aria-hidden size={20} strokeWidth={2.5} />}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
