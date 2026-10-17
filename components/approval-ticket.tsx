"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Undo2 } from "lucide-react";
import { agentName } from "@/lib/agents";
import { api, refreshAll } from "@/lib/api";
import { CHANNEL_NAME, type Platform } from "@/lib/platforms";
import { useApp } from "@/lib/state";
import type { ApprovalDTO } from "@/lib/types";
import { ChannelTag } from "./bits";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * An agent's draft, printed as a kitchen order ticket. Approving sends it to
 * the server, which carries it out on each platform and reports back per step.
 */
export function ApprovalTicket({ approval: initial, print = false, onDone }: { approval: ApprovalDTO; print?: boolean; onDone?: (a: ApprovalDTO) => void }) {
  const { t, pick, lang } = useApp();
  const hi = lang === "hi";
  const [a, setA] = useState(initial);
  const [busy, setBusy] = useState<null | "approve" | "skip" | "undo">(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String((initial.payload as { text?: string }).text ?? ""));

  async function act(action: "approve" | "skip" | "undo") {
    setBusy(action);
    setError(null);
    try {
      let target = a;
      // An edited reply becomes a fresh draft, then gets approved.
      if (action === "approve" && a.kind === "review_reply" && editing && text !== (a.payload as { text: string }).text) {
        await api(`/api/approvals/${a.id}`, { method: "POST", json: { action: "skip" } });
        target = await api<ApprovalDTO>(`/api/reviews/${(a.payload as { reviewId: string }).reviewId}/reply`, { method: "POST", json: { text } });
      }
      const next = await api<ApprovalDTO>(`/api/approvals/${target.id}`, { method: "POST", json: { action } });
      setA(next);
      setEditing(false);
      onDone?.(next);
      refreshAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const pending = a.status === "pending";
  const statusLabel: Record<ApprovalDTO["status"], string> = {
    pending: t("ticket.needsOk"),
    executed: hi ? "हो गया" : "Done",
    failed: hi ? "पूरा नहीं हुआ" : "Didn't go through",
    skipped: t("ticket.skipped"),
    undone: hi ? "वापस लिया" : "Undone",
  };
  const statusTone = pending ? "text-turmeric" : a.status === "executed" ? "text-leaf" : a.status === "failed" ? "text-chilli" : "text-muted";
  const approveLabel: Record<ApprovalDTO["kind"], string> = {
    menu_change: hi ? "पब्लिश करें" : "Publish",
    review_reply: hi ? "जवाब पोस्ट करें" : "Post reply",
    dispute: hi ? "डिस्प्यूट भेजें" : "Raise dispute",
    promo: hi ? "प्रोमो शेड्यूल करें" : "Schedule promo",
    listing_application: hi ? "आवेदन भेजें" : "Submit applications",
  };

  return (
    <article className={`ticket my-2 ${print ? "print-in" : ""} ${a.status === "skipped" || a.status === "undone" ? "opacity-75" : ""}`}>
      <header className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3.5">
        <span className="text-[0.8rem] text-muted">{pick(agentName(a.agent))}</span>
        <span className={`inline-flex items-center gap-1.5 text-[0.8rem] font-medium ${statusTone}`}>
          {pending && <span aria-hidden className="size-1.5 rounded-full bg-turmeric" />}
          {statusLabel[a.status]}
        </span>
      </header>

      <div className="px-4 pb-3">
        <h3 className="mb-1.5 text-[1.02rem] font-medium leading-snug">{a.title}</h3>
        <Body a={a} editing={editing} text={text} setText={setText} />
      </div>

      {a.steps.length > 0 && (
        <ul className="mx-4 mb-3 space-y-1 rounded-lg bg-paper px-3 py-2 text-[0.82rem]">
          {a.steps.map((s, i) => (
            <li key={i} className={`flex gap-2 ${s.ok ? "text-ink-2" : "text-chilli"}`}>
              {s.ok ? <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-leaf" /> : <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />}
              <span>
                {s.platform ? `${CHANNEL_NAME[s.platform]}: ` : ""}
                {s.ok ? (s.note ?? s.what) : s.error}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mx-4 mb-3 rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}

      <div className="tear mx-4" />
      <footer className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-3">
        {pending ? (
          <>
            <button type="button" disabled={!!busy} onClick={() => act("approve")} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-60">
              {busy === "approve" && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {approveLabel[a.kind]}
            </button>
            {a.kind === "review_reply" && (
              <button type="button" onClick={() => setEditing((e) => !e)} aria-pressed={editing} className="rounded-full px-4 py-2 text-sm text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken">
                {t("ticket.edit")}
              </button>
            )}
            <button type="button" disabled={!!busy} onClick={() => act("skip")} className="rounded-full px-3 py-2 text-sm text-muted hover:text-ink">
              {t("ticket.skip")}
            </button>
          </>
        ) : (
          (a.status === "skipped" || (a.status === "executed" && a.kind === "menu_change")) && (
            <button type="button" disabled={!!busy} onClick={() => act("undo")} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink">
              {busy === "undo" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Undo2 aria-hidden className="size-3.5" />}
              {t("ticket.undo")}
            </button>
          )
        )}
      </footer>
    </article>
  );
}

function Body({ a, editing, text, setText }: { a: ApprovalDTO; editing: boolean; text: string; setText: (s: string) => void }) {
  const { lang } = useApp();
  const hi = lang === "hi";
  const p = a.payload as Record<string, unknown>;

  if (a.kind === "review_reply") {
    return (
      <>
        <span className="mb-1 block text-[0.8rem] text-muted">{hi ? "आपका जवाब" : "Your reply"}</span>
        {editing && a.status === "pending" ? (
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-md bg-sunken p-2.5 text-[0.95rem] text-ink outline-none focus:ring-2 focus:ring-turmeric" />
        ) : (
          <p className="border-l-2 border-turmeric pl-3 text-[0.95rem] leading-relaxed text-ink-2">{text}</p>
        )}
      </>
    );
  }
  if (a.kind === "promo") {
    return (
      <>
        <span className="mb-2 block">
          <ChannelTag channel={p.platform as Platform} />
        </span>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">{hi ? "कब" : "When"}</dt>
            <dd>{String(p.window)}</dd>
          </div>
          <div>
            <dt className="text-muted">{hi ? "अधिकतम ख़र्च" : "Spend cap"}</dt>
            <dd>{rupees(Number(p.spendCap))}</dd>
          </div>
          <div>
            <dt className="text-muted">{hi ? "अनुमानित नए ऑर्डर" : "Expected new orders"}</dt>
            <dd>~{String(p.expectedOrders)}</dd>
          </div>
        </dl>
      </>
    );
  }
  return a.summary ? <p className="text-[0.95rem] leading-relaxed text-ink-2">{a.summary}</p> : null;
}
