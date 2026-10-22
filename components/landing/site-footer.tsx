"use client";

import { Wordmark } from "@/components/bits";
import type { Bi } from "@/lib/i18n";
import { useApp } from "@/lib/state";

// The website's footer, shared by the homepage and /restaurants, with the credits for Meena's photos.

export function SiteFooter() {
  const { pick } = useApp();
  return (
    <footer className="bg-[var(--lp-sunken)] py-14">
      <div className="lp-wrap">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Wordmark className="text-[34px]" />
            <p className="mt-3 text-[17px]">{pick({ en: "Online orders, delivered by you or by Zomato.", hi: "ऑनलाइन ऑर्डर, आप पहुँचाएँ या Zomato।" })}</p>
          </div>
          <nav aria-label={pick({ en: "Footer", hi: "फ़ुटर" })}>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[16px]">
              {[
                ["/join?journey=new", { en: "Start free", hi: "मुफ़्त शुरू करें" }],
                ["#waitlist", { en: "Join the Soundbox waitlist", hi: "Soundbox वेटलिस्ट" }],
                ["/restaurants", { en: "Zest for restaurants", hi: "रेस्टोरेंट के लिए Zest" }],
                ["/r/meenas-kitchen", { en: "Sample seller", hi: "सैंपल विक्रेता" }],
                ["/login", { en: "Log in", hi: "लॉग इन" }],
                ["/login/staff", { en: "Staff sign-in", hi: "स्टाफ़ साइन-इन" }],
              ].map(([href, label]) => (
                <li key={href as string}>
                  <a href={href as string} className="hover:underline hover:underline-offset-4">
                    {pick(label as Bi)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-10 text-[14px] text-[var(--lp-muted)]">© 2026 Zest</p>
        <p className="mt-2 max-w-[60em] text-[13px] leading-relaxed text-[var(--lp-muted)]">
          {pick({ en: "Photos of Meena's dishes from Wikimedia Commons: “Amazing Aloo Paratha and Lovely Lassi” by Mahi Tatavarty, “Rajma Chawal by Rama Bhave” by Shreya151994, “Kadhi Chawal from India” by Barthateslisa (CC BY-SA 4.0); “Mithaas sweets box Indian food” by Krista (CC BY 2.0).", hi: "मीना की डिश की फ़ोटो Wikimedia Commons से: Mahi Tatavarty की “Amazing Aloo Paratha and Lovely Lassi”, Shreya151994 की “Rajma Chawal by Rama Bhave”, Barthateslisa की “Kadhi Chawal from India” (CC BY-SA 4.0); Krista की “Mithaas sweets box Indian food” (CC BY 2.0)।" })}
        </p>
      </div>
    </footer>
  );
}
