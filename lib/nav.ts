import { Armchair, BookOpen, Home, IndianRupee, ReceiptText, Settings, Star, TrendingUp, Users, type LucideIcon } from "lucide-react";
import type { Bi } from "./i18n";

// The sidebar, ordered the way an owner's day runs: what's happening now, the customers,
// growing sales, the money, and setup last. Routes are unchanged; only grouping and names.

/** `short` is the label on the phone's bottom tabs, where space is tight. */
export type NavItem = { href: string; label: Bi; hint: Bi; icon: LucideIcon; short?: Bi };
export type NavGroup = { id: string; label: Bi | null; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "today",
    label: null,
    items: [{ href: "/app", label: { en: "Today", hi: "आज" }, hint: { en: "Sales, payouts and what needs your OK", hi: "बिक्री, पेआउट और आपकी मंज़ूरी वाले काम" }, icon: Home }],
  },
  {
    id: "service",
    label: { en: "Run service", hi: "सर्विस चलाएँ" },
    items: [
      { href: "/app/orders", short: { en: "Orders", hi: "ऑर्डर" }, label: { en: "Live orders", hi: "लाइव ऑर्डर" }, hint: { en: "Every platform and dine-in, as they come in", hi: "हर प्लेटफ़ॉर्म और डाइन-इन के ऑर्डर, आते ही" }, icon: ReceiptText },
      { href: "/app/dining", label: { en: "Tables & bookings", hi: "टेबल और बुकिंग" }, hint: { en: "Floor, bills, reservations and the waitlist", hi: "फ़्लोर, बिल, रिज़र्वेशन और वेटलिस्ट" }, icon: Armchair },
      { href: "/app/menu", label: { en: "Menu & stock", hi: "मेन्यू और स्टॉक" }, hint: { en: "Dishes, prices and what's available, everywhere", hi: "डिश, क़ीमत और क्या उपलब्ध है, हर जगह" }, icon: BookOpen },
    ],
  },
  {
    id: "customers",
    label: { en: "Customers", hi: "ग्राहक" },
    items: [
      { href: "/app/reviews", label: { en: "Reviews & complaints", hi: "रिव्यू और शिकायतें" }, hint: { en: "Every platform's reviews, with replies ready", hi: "हर प्लेटफ़ॉर्म के रिव्यू, जवाब तैयार" }, icon: Star },
      { href: "/app/customers", label: { en: "Customer list", hi: "ग्राहक सूची" }, hint: { en: "People who ordered straight from your site", hi: "जिन्होंने आपकी साइट से सीधे ऑर्डर किया" }, icon: Users },
    ],
  },
  {
    id: "grow",
    label: { en: "Grow sales", hi: "बिक्री बढ़ाएँ" },
    items: [
      { href: "/app/growth", label: { en: "Promos & ads", hi: "प्रोमो और ऐड" }, hint: { en: "Offers and ads with a hard spend cap", hi: "ऑफ़र और ऐड, पक्की ख़र्च सीमा के साथ" }, icon: TrendingUp },
    ],
  },
  {
    id: "money",
    label: { en: "Money", hi: "पैसा" },
    items: [
      { href: "/app/money", short: { en: "Money", hi: "पैसा" }, label: { en: "Payouts & fees", hi: "पेआउट और कटौती" }, hint: { en: "What the platforms paid, kept and deducted", hi: "प्लेटफ़ॉर्म ने क्या दिया, रखा और काटा" }, icon: IndianRupee },
    ],
  },
  {
    id: "settings",
    label: null,
    items: [
      { href: "/app/connections", label: { en: "Settings", hi: "सेटिंग्स" }, hint: { en: "Restaurant, hours, staff and connections", hi: "रेस्टोरेंट, समय, स्टाफ़ और कनेक्शन" }, icon: Settings },
    ],
  },
];

/** What a home kitchen, tiffin or stall needs: no tables, no Zomato or Swiggy payouts, reviews or ads. */
const HOME_KITCHEN = new Set(["/app", "/app/orders", "/app/menu", "/app/customers", "/app/connections"]);
export const navGroupsFor = (homeKitchen: boolean): NavGroup[] =>
  homeKitchen ? NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => HOME_KITCHEN.has(i.href)).map((i) => (i.href === "/app/orders" ? { ...i, label: { en: "Orders", hi: "ऑर्डर" }, hint: { en: "Orders from your page and WhatsApp", hi: "आपके पेज और WhatsApp के ऑर्डर" } } : i.href === "/app/connections" ? { ...i, hint: { en: "Your kitchen, hours, delivery and UPI", hi: "आपकी रसोई, समय, डिलीवरी और UPI" } } : i)) })).filter((g) => g.items.length) : NAV_GROUPS;

/** A home kitchen, tiffin or stall: started on Zest, not on Zomato or Swiggy. */
export const isHomeKitchen = (o: { journey: string | null; live: string[] } | null | undefined) => !!o && o.journey === "new" && o.live.length === 0;

export const navItems = (): NavItem[] => NAV_GROUPS.flatMap((g) => g.items);
export const navItem = (href: string) => navItems().find((i) => i.href === href)!;
