"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { useApp } from "@/lib/state";
import type { Bi } from "@/lib/i18n";

type Status = "pending" | "editing" | "approved" | "skipped";

/**
 * An agent's draft, printed as a kitchen order ticket. Nothing reaches a
 * platform until the owner approves it; approved actions can be undone.
 */
export function Ticket({
  agent,
  title,
  children,
  editable,
  onApproveLabel,
  doneLabel,
  onApprove,
  print = false,
}: {
  agent: Bi;
  title: React.ReactNode;
  children: React.ReactNode | ((editing: boolean) => React.ReactNode);
  editable?: boolean;
  onApproveLabel?: Bi;
  doneLabel?: Bi;
  onApprove?: () => void;
  print?: boolean;
}) {
  const { t, pick } = useApp();
  const [status, setStatus] = useState<Status>("pending");
  const editing = status === "editing";
  const settled = status === "approved" || status === "skipped";

  return (
    <article className={`ticket my-2 ${print ? "print-in" : ""} ${settled ? "opacity-80" : ""}`}>
      <header className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3.5">
        <span className="text-[0.8rem] text-muted">{pick(agent)}</span>
        {status === "pending" || editing ? (
          <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-turmeric">
            <span aria-hidden className="size-1.5 rounded-full bg-turmeric" />
            {t("ticket.needsOk")}
          </span>
        ) : (
          <span className={`text-[0.8rem] font-medium ${status === "approved" ? "text-leaf" : "text-muted"}`}>
            {status === "approved" ? t("ticket.approved") : t("ticket.skipped")}
          </span>
        )}
      </header>
      <div className="px-4 pb-3">
        <div className="mb-1.5 text-[1.02rem] font-medium leading-snug">{title}</div>
        <div className="text-[0.95rem] leading-relaxed text-ink-2">
          {typeof children === "function" ? children(editing) : children}
        </div>
      </div>
      <div className="tear mx-4" />
      <footer className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-3">
        {settled ? (
          <>
            {status === "approved" && doneLabel && (
              <span className="inline-flex items-center gap-1.5 text-sm text-leaf">
                <Check aria-hidden className="size-4" />
                {pick(doneLabel)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setStatus("pending")}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
            >
              <Undo2 aria-hidden className="size-3.5" />
              {t("ticket.undo")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setStatus("approved");
                onApprove?.();
              }}
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              {onApproveLabel ? pick(onApproveLabel) : t("ticket.approve")}
            </button>
            {editable && (
              <button
                type="button"
                onClick={() => setStatus(editing ? "pending" : "editing")}
                aria-pressed={editing}
                className="rounded-full px-4 py-2 text-sm text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:bg-sunken"
              >
                {t("ticket.edit")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatus("skipped")}
              className="rounded-full px-3 py-2 text-sm text-muted hover:text-ink"
            >
              {t("ticket.skip")}
            </button>
          </>
        )}
      </footer>
    </article>
  );
}
