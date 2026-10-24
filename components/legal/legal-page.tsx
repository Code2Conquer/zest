import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Wordmark } from "@/components/bits";

// The shell for Privacy and Terms: plain reading pages. The text is a working draft written from what the
// product actually does; it must be reviewed by a lawyer before launch (docs/next-steps.md).

export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? null;
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null;

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto max-w-2xl px-4 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-5" />
          <Wordmark className="text-[28px]" />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-8 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-2">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="!mt-1 text-sm !text-muted">Last updated {updated}</p>
        {children}
        <h2>Contact</h2>
        <p>
          {SUPPORT_WHATSAPP ? `WhatsApp ${SUPPORT_WHATSAPP}` : null}
          {SUPPORT_WHATSAPP && SUPPORT_EMAIL ? " · " : null}
          {SUPPORT_EMAIL ? SUPPORT_EMAIL : null}
          {!SUPPORT_WHATSAPP && !SUPPORT_EMAIL ? "Write to us from the help option in your Zest dashboard." : null}
        </p>
      </main>
    </div>
  );
}
