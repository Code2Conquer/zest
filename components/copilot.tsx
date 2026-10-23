"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUp, Mic, RotateCcw, X } from "lucide-react";
import { agentName, HOME_STARTER_SUGGESTIONS, STARTER_SUGGESTIONS } from "@/lib/agents";
import { isHomeKitchen } from "@/lib/nav";
import { api, refreshAll, useApi } from "@/lib/api";
import { useApp } from "@/lib/state";
import type { ChatEntry, CopilotReply } from "@/lib/types";
import { CopilotCardView } from "./cards";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
};

export function Copilot({ onClose }: { onClose?: () => void }) {
  const { t, pick, lang, outlet } = useApp();
  const { data: history, setData: setHistory } = useApi<ChatEntry[]>(outlet ? `/api/copilot?o=${outlet.id}` : null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  // The panel can be mounted twice (side panel and mobile sheet), so ids must be unique.
  const inputId = useId();
  const messages = history ?? [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const userEntry: ChatEntry = { id: `u-${Date.now()}`, role: "user", text: message };
    setHistory([...messages, userEntry]);
    setBusy(true);
    try {
      const reply = await api<CopilotReply>("/api/copilot", { method: "POST", json: { message, lang } });
      const id = `a-${Date.now()}`;
      setFresh((s) => new Set(s).add(id));
      setHistory([...messages, userEntry, { id, role: "assistant", reply }]);
      if (reply.cards.length) refreshAll();
    } catch (e) {
      setHistory([...messages, userEntry, { id: `e-${Date.now()}`, role: "assistant", reply: { agent: "orchestrator", text: (e as Error).message, cards: [], suggestions: [], engine: "rules" } }]);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    await api("/api/copilot", { method: "DELETE" }).catch(() => {});
    setHistory([]);
  }

  function listen() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Rec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const last = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = last && last.role === "assistant" && last.reply.suggestions.length ? last.reply.suggestions : (isHomeKitchen(outlet) ? HOME_STARTER_SUGGESTIONS : STARTER_SUGGESTIONS).map((s) => pick(s));

  return (
    <section aria-label={t("nav.copilot")} className="flex h-full min-h-0 flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <h2 className="text-base font-semibold">{t("nav.copilot")}</h2>
          <p className="text-[0.8rem] text-muted">
            {lang === "hi" ? "आपके सभी एजेंट, एक जगह" : "All your agents in one place"}
            {outlet && !outlet.claude && <span> {lang === "hi" ? "(बेसिक मोड)" : "(basic mode)"}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={clear} aria-label={lang === "hi" ? "बातचीत साफ़ करें" : "Clear conversation"} className="rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
              <RotateCcw className="size-4" />
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-sunken hover:text-ink">
              <X className="size-5" />
            </button>
          )}
        </div>
      </header>

      <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4" aria-live="polite">
        <p className="max-w-[46ch] text-[0.98rem] leading-relaxed text-ink-2">{isHomeKitchen(outlet) ? pick({ en: "Good morning. Ask me about your orders, menu or regulars, or pick one of these.", hi: "सुप्रभात। अपने ऑर्डर, मेन्यू या पुराने ग्राहकों के बारे में पूछिए, या इनमें से चुनिए।" }) : t("copilot.hello")}</p>

        {messages.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="my-4 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.98rem] text-paper">
              {m.text}
            </p>
          ) : (
            <AgentMessage key={m.id} reply={m.reply} animate={fresh.has(m.id)} onProgress={() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight })} />
          ),
        )}

        {busy && (
          <p className="my-4 inline-flex items-center gap-2 text-sm text-muted">
            <span className="inline-flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-pulse rounded-full bg-turmeric" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
            {lang === "hi" ? "देख रहा हूँ…" : "Looking into it…"}
          </p>
        )}
      </div>

      <div className="border-t border-line px-4 pb-4 pt-3">
        {suggestions.length > 0 && !busy && (
          <div className="scrollbar-thin -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="shrink-0 rounded-full bg-surface px-3.5 py-1.5 text-sm text-ink-2 shadow-[0_0_0_1px_var(--line)] hover:text-ink hover:shadow-[0_0_0_1px_var(--ink-2)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl bg-surface p-1.5 shadow-[0_0_0_1px_var(--line)] focus-within:shadow-[0_0_0_2px_var(--turmeric)]"
        >
          <label htmlFor={inputId} className="sr-only">
            {t("copilot.placeholder")}
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={t("copilot.placeholder")}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[0.98rem] outline-none focus-visible:outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={listen}
            aria-label={t("copilot.voice")}
            aria-pressed={listening}
            className={`rounded-full p-2.5 ${listening ? "bg-turmeric-soft text-turmeric" : "text-muted hover:bg-sunken hover:text-ink"}`}
          >
            <Mic className="size-5" />
          </button>
          <button type="submit" aria-label={t("copilot.send")} disabled={!input.trim() || busy} className="rounded-full bg-ink p-2.5 text-paper disabled:opacity-30">
            <ArrowUp className="size-5" />
          </button>
        </form>
      </div>
    </section>
  );
}

/** Types a fresh reply out word by word, then prints its cards. History renders instantly. */
function AgentMessage({ reply, animate, onProgress }: { reply: CopilotReply; animate: boolean; onProgress: () => void }) {
  const { pick } = useApp();
  const reduce = useReducedMotion();
  const words = reply.text.split(" ");
  const [shown, setShown] = useState(animate && !reduce ? 0 : words.length);
  const done = shown >= words.length;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setShown((n) => n + 1), 32);
    return () => clearTimeout(id);
  }, [shown, done]);

  useEffect(() => {
    if (animate) onProgress();
  }, [shown, animate, onProgress]);

  return (
    <div className="my-4">
      <p className="mb-1 text-[0.8rem] text-muted">{pick(agentName(reply.agent))}</p>
      <p className="max-w-[52ch] whitespace-pre-line text-[0.98rem] leading-relaxed">
        {words.slice(0, shown).join(" ")}
        {!done && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-turmeric" />}
      </p>
      {done && reply.cards.length > 0 && (
        <div className="mt-3 space-y-3">
          {reply.cards.map((c, i) => (
            <CopilotCardView key={i} card={c} print={animate} />
          ))}
        </div>
      )}
    </div>
  );
}
