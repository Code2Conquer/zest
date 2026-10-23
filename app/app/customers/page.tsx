"use client";

import { Page } from "@/components/page";
import { rupees } from "@/components/cards";
import { useApi } from "@/lib/api";
import { isHomeKitchen, NAV_GROUPS, navItem } from "@/lib/nav";
import { useApp } from "@/lib/state";

type Customer = { id: string; name: string; phone: string; orders: number; spent: number; firstOrderAt: string; lastOrderAt: string };

/** People who ordered from the restaurant's own site: the start of a customer list the restaurant owns. */
export default function Customers() {
  const { lang, pick, outlet } = useApp();
  const hi = lang === "hi";
  const { data, error } = useApi<Customer[]>(outlet ? `/api/customers?o=${outlet.id}` : null);
  const date = (iso: string) => new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  const regulars = (data ?? []).filter((c) => c.orders >= 3).length;

  return (
    <Page
      eyebrow={pick(NAV_GROUPS[2].label!)}
      title={pick(navItem("/app/customers").label)}
      subtitle={
        isHomeKitchen(outlet)
          ? hi ? "आपके पेज, WhatsApp और फ़ोन से ऑर्डर करने वाले लोग, सबसे हाल के पहले।" : "Everyone who's ordered from your page, WhatsApp or phone, most recent first."
          : hi ? "जिन्होंने आपकी साइट से सीधे ऑर्डर किया। Zomato और Swiggy ग्राहकों के नंबर नहीं दिखाते।" : "People who ordered straight from your site. Zomato and Swiggy don't share their customers' numbers."
      }
    >
      {error && <p className="rounded-lg bg-chilli-soft px-3 py-2 text-sm text-chilli">{error}</p>}
      {data && (
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <dt className="text-sm text-muted">{hi ? "ग्राहक" : "Customers"}</dt>
            <dd className="text-2xl font-semibold">{data.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{hi ? "रेगुलर (3+ ऑर्डर)" : "Regulars (3+ orders)"}</dt>
            <dd className="text-2xl font-semibold">{regulars}</dd>
          </div>
        </dl>
      )}
      {data && data.length === 0 && (
        <p className="mt-6 rounded-xl bg-sunken px-4 py-6 text-center text-muted">
          {hi ? "अभी कोई नहीं। सेटिंग्स में अपनी ऑर्डरिंग साइट चालू करें और उसका QR शेयर करें।" : "No one yet. Switch on your ordering site in Settings and share its QR code."}
        </p>
      )}
      {data && data.length > 0 && (
        <table className="mt-6 w-full text-left text-[0.95rem]">
          <thead className="text-sm text-muted">
            <tr className="border-b border-line">
              <th className="py-2 font-normal">{hi ? "नाम" : "Name"}</th>
              <th className="py-2 font-normal">{hi ? "फ़ोन" : "Phone"}</th>
              <th className="py-2 text-right font-normal">{hi ? "ऑर्डर" : "Orders"}</th>
              <th className="hidden py-2 text-right font-normal sm:table-cell">{hi ? "कुल ख़र्च" : "Spent"}</th>
              <th className="hidden py-2 text-right font-normal sm:table-cell">{hi ? "पिछला ऑर्डर" : "Last order"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-2.5 font-medium">{c.name}</td>
                <td className="py-2.5 font-mono text-sm text-ink-2">{c.phone}</td>
                <td className="py-2.5 text-right">{c.orders}</td>
                <td className="hidden py-2.5 text-right sm:table-cell">{rupees(c.spent)}</td>
                <td className="hidden py-2.5 text-right text-ink-2 sm:table-cell">{date(c.lastOrderAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  );
}
