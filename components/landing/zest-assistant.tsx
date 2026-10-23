"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import { ZestLogo } from "@/components/bits";
import { api } from "@/lib/api";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// Zest, the assistant on the website: a mark in the corner that breathes, says hello once, and opens a
// conversation in an overlay. Type, or hold the mic and speak (Hindi or English, by the browser's own
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

/** Zest's mark, with a breathing ring: slow at rest, quicker while it listens or thinks. */
export function ZestMark({ size = 56, speaking = false }: { size?: number; speaking?: boolean }) {
  return (
    <span className={`zm relative inline-grid shrink-0 place-items-center rounded-full ${speaking ? "is-speaking" : ""}`} style={{ width: size, height: size }} aria-hidden>
      <span className="zm-ring absolute inset-0 rounded-full" />
      <ZestLogo className="relative size-full" />
    </span>
  );
}

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

  // Say hello once, a few seconds in, unless the visitor has already opened it.
  useEffect(() => {
    const t = setTimeout(() => setHello(true), 4500);
    const off = setTimeout(() => setHello(false), 14000);
    return () => {
      clearTimeout(t);
      clearTimeout(off);
    };
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    setHello(false);
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

  const SUGGEST: Bi[] =
    audience === "home"
      ? [
          { en: "How does delivery work?", hi: "डिलीवरी कैसे होती है?" },
          { en: "What does it cost?", hi: "इसका ख़र्च कितना है?" },
          { en: "Do I need FSSAI?", hi: "क्या FSSAI ज़रूरी है?" },
        ]
      : [
          { en: "Do I have to leave Zomato or Swiggy?", hi: "क्या Zomato या Swiggy छोड़ना होगा?" },
          { en: "Who delivers orders from my page?", hi: "मेरे पेज के ऑर्डर कौन पहुँचाता है?" },
          { en: "What does the Soundbox do?", hi: "Soundbox क्या करता है?" },
        ];

  return (
    <>
      {/* The mark, bottom right; on a phone it sits at the end of the sticky start bar */}
      <div className="fixed bottom-[max(14px,env(safe-area-inset-bottom))] right-3 z-50 flex items-end gap-3 sm:bottom-6 sm:right-6">
        {hello && !open && (
          <button type="button" onClick={() => setOpen(true)} className={/* taste-skill-ignore: floating overlay */ "hs-chip mb-1 hidden max-w-[240px] sm:block rounded-2xl rounded-br-md bg-[var(--lp-paper)] px-4 py-3 text-left text-[14.5px] leading-snug text-[var(--lp-ink)] shadow-[0_18px_40px_-16px_rgb(0_0_0/0.6)]"}>
            {pick({ en: "Hi, I'm Zest. Ask me anything about selling online.", hi: "नमस्ते, मैं Zest हूँ। ऑनलाइन बेचने के बारे में कुछ भी पूछिए।" })}
          </button>
        )}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? pick({ en: "Close Zest", hi: "Zest बंद करें" }) : pick({ en: "Ask Zest", hi: "Zest से पूछिए" })} aria-expanded={open} className="rounded-full transition-transform hover:scale-105 active:scale-95">
          <span className="sm:hidden"><ZestMark size={50} speaking={busy || listening} /></span>
          <span className="hidden sm:inline"><ZestMark size={60} speaking={busy || listening} /></span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-end sm:justify-end sm:bg-transparent sm:p-6" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pick({ en: "Talk to Zest", hi: "Zest से बात कीजिए" })}
            onClick={(e) => e.stopPropagation()}
            className={/* taste-skill-ignore: floating overlay */ "za-in flex h-[86dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[var(--lp-paper)] text-[var(--lp-ink)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] sm:mb-20 sm:h-[620px] sm:max-h-[calc(100dvh-120px)] sm:w-[400px] sm:rounded-[28px]"}
          >
            <div className="flex items-center gap-3 px-5 pb-3 pt-5">
              <ZestMark size={40} speaking={busy || listening} />
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

            <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-5 pb-4" aria-live="polite">
              <p className="w-fit max-w-[88%] rounded-2xl rounded-tl-md bg-[var(--lp-sunken)] px-4 py-3 text-[15.5px] leading-relaxed">
                {audience === "home"
                  ? pick({ en: "Hi! I'm Zest. I can tell you how your kitchen can take online orders, get paid by UPI and deliver with Zomato riders. What would you like to know?", hi: "नमस्ते! मैं Zest हूँ। आपकी रसोई ऑनलाइन ऑर्डर कैसे ले, UPI से पैसा कैसे पाए और Zomato राइडर से कैसे पहुँचाए, यह बता सकता हूँ। क्या जानना चाहेंगे?" })
                  : pick({ en: "Hi! I'm Zest. I can tell you how your own page brings in the orders Zomato and Swiggy never see, and how they're delivered. What would you like to know?", hi: "नमस्ते! मैं Zest हूँ। आपका अपना पेज वे ऑर्डर कैसे लाता है जो Zomato और Swiggy तक नहीं पहुँचते, और वे कैसे पहुँचते हैं, यह बता सकता हूँ। क्या जानना चाहेंगे?" })}
              </p>
              {turns.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGEST.map((q) => (
                    <button key={q.en} type="button" onClick={() => send(pick(q))} className="rounded-full bg-[var(--lp-sunken)] px-3.5 py-2 text-[14px] font-medium hover:bg-[var(--lp-line)]">
                      {pick(q)}
                    </button>
                  ))}
                </div>
              )}
              {turns.map((t, i) =>
                t.role === "user" ? (
                  <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--z-turmeric)] px-4 py-2.5 text-[15.5px] leading-relaxed text-[#1c1f23]">
                    {t.text}
                  </p>
                ) : (
                  <p key={i} className="hs-chip w-fit max-w-[88%] rounded-2xl rounded-tl-md bg-[var(--lp-sunken)] px-4 py-3 text-[15.5px] leading-relaxed">
                    {t.text}
                  </p>
                ),
              )}
              {busy && (
                <p className="lp-typing flex w-fit gap-1.5 rounded-2xl rounded-tl-md bg-[var(--lp-sunken)] px-4 py-4">
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
              className="flex items-end gap-2 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2"
            >
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
                className={/* taste-skill-ignore: floating overlay */ "max-h-32 min-h-12 flex-1 resize-none rounded-[22px] bg-[var(--lp-sunken)] px-4 py-3 text-[16px] leading-snug outline-none placeholder:text-[var(--lp-faint)] focus:shadow-[inset_0_0_0_2px_var(--z-turmeric)]"}
              />
              {canListen && (
                <button type="button" onClick={listen} aria-pressed={listening} aria-label={listening ? pick({ en: "Stop listening", hi: "सुनना बंद करें" }) : pick({ en: "Speak your question", hi: "बोलकर पूछिए" })} className={`relative grid size-12 shrink-0 place-items-center rounded-full transition-colors ${listening ? "bg-[var(--lp-bad)] text-white" : "bg-[var(--lp-sunken)] hover:bg-[var(--lp-line)]"}`}>
                  {listening && <span aria-hidden className="za-pulse absolute inset-0 rounded-full" />}
                  {listening ? <Square aria-hidden size={16} className="fill-current" /> : <Mic aria-hidden size={20} />}
                </button>
              )}
              <button type="submit" disabled={busy || !draft.trim()} aria-label={pick({ en: "Send", hi: "भेजें" })} className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--z-turmeric)] text-[#1c1f23] disabled:opacity-40">
                {busy ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <ArrowUp aria-hidden size={20} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
