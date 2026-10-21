"use client";

import type { ReactNode } from "react";

// One layout for every screen in the app: the same header, widths and section spacing,
// so pages read as one system.

const WIDTH = { narrow: "max-w-3xl", default: "max-w-5xl", wide: "max-w-6xl" } as const;

export function Page({
  eyebrow,
  title,
  subtitle,
  actions,
  width = "default",
  children,
}: {
  /** Small label above the title, e.g. the sidebar group or today's date. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  width?: keyof typeof WIDTH;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto ${WIDTH[width]} pb-8`}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-5">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[0.8rem] font-medium uppercase tracking-[0.08em] text-muted" suppressHydrationWarning>
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]" suppressHydrationWarning>
            {title}
          </h1>
          {subtitle && <div className="mt-1.5 max-w-[62ch] text-ink-2">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** A titled block within a page. */
export function Section({ title, description, actions, children, className = "" }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-10 first:mt-0 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-0.5 max-w-[62ch] text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
