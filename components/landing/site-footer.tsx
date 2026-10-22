"use client";

import { Wordmark } from "@/components/bits";
import { useApp } from "@/lib/state";

// The website's footer, shared by the homepage and /restaurants: the name, the line, nothing else.
// The homepage shows Meena's dish photos, which are CC BY-SA and CC BY, so it carries their credit;
// /restaurants uses Unsplash photos only and needs none.

export function SiteFooter({ credits = true }: { credits?: boolean }) {
  const { pick } = useApp();
  return (
    <footer className="bg-[var(--lp-sunken)] py-12 lg:py-16">
      <div className="lp-wrap">
        <Wordmark className="text-[40px] sm:text-[56px]" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <p className="text-[17px]">{pick({ en: "Online orders, delivered by you or by Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" })}</p>
          <p className="text-[14px] text-[var(--lp-muted)]">© 2026 Zest</p>
        </div>
        {credits && (
          <p className="mt-6 max-w-[60em] text-[12.5px] leading-relaxed text-[var(--lp-muted)]">
            {pick({ en: "Photos of Meena's dishes from Wikimedia Commons: “Amazing Aloo Paratha and Lovely Lassi” by Mahi Tatavarty, “Rajma Chawal by Rama Bhave” by Shreya151994, “Kadhi Chawal from India” by Barthateslisa (CC BY-SA 4.0); “Mithaas sweets box Indian food” by Krista (CC BY 2.0).", hi: "मीना की डिश की फ़ोटो Wikimedia Commons से: Mahi Tatavarty की “Amazing Aloo Paratha and Lovely Lassi”, Shreya151994 की “Rajma Chawal by Rama Bhave”, Barthateslisa की “Kadhi Chawal from India” (CC BY-SA 4.0); Krista की “Mithaas sweets box Indian food” (CC BY 2.0)।" })}
          </p>
        )}
      </div>
    </footer>
  );
}
