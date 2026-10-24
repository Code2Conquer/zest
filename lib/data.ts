// Sample data in the unified model. In production this comes from the
// connectors (email, platform API/MCP/portal, POS) via the data layer.

import type { Bi } from "./i18n";
import type { Channel, Platform } from "./platforms";
import type { DishKind } from "@/components/dishes";

export const OUTLET = {
  name: "Rasoi 27",
  area: "Indiranagar, Bengaluru",
  ownerFirstName: "Aditi",
};

export const SALES_YESTERDAY: Record<"zomato" | "swiggy" | "dine", { amount: number; orders: number }> = {
  zomato: { amount: 18420, orders: 46 },
  swiggy: { amount: 14760, orders: 39 },
  dine: { amount: 9310, orders: 21 },
};

export type Payout = {
  platform: Platform;
  period: string;
  gross: number;
  commission: number;
  ads: number;
  deductions: number;
  net: number;
  status: "upcoming" | "credited";
  date: string;
  dateISO: string;
  source: Bi;
};

export const PAYOUTS: Payout[] = [
  {
    platform: "zomato",
    period: "7 to 13 Oct",
    gross: 112400,
    commission: 24730,
    ads: 6000,
    deductions: 1180,
    net: 80490,
    status: "upcoming",
    date: "Wed, 22 Oct",
    dateISO: "2026-10-22",
    source: { en: "Zomato payout mail, 15 Oct", hi: "Zomato पेआउट मेल, 15 अक्टूबर" },
  },
  {
    platform: "swiggy",
    period: "7 to 13 Oct",
    gross: 96300,
    commission: 22150,
    ads: 4500,
    deductions: 2412,
    net: 67238,
    status: "upcoming",
    date: "Tue, 21 Oct",
    dateISO: "2026-10-21",
    source: { en: "Swiggy statement PDF, 15 Oct", hi: "Swiggy स्टेटमेंट PDF, 15 अक्टूबर" },
  },
  {
    platform: "zomato",
    period: "30 Sep to 6 Oct",
    gross: 104900,
    commission: 23080,
    ads: 6000,
    deductions: 640,
    net: 75180,
    status: "credited",
    date: "Wed, 15 Oct",
    dateISO: "2026-10-15",
    source: { en: "HDFC credit alert, 15 Oct", hi: "HDFC क्रेडिट अलर्ट, 15 अक्टूबर" },
  },
  {
    platform: "swiggy",
    period: "30 Sep to 6 Oct",
    gross: 99800,
    commission: 22950,
    ads: 4500,
    deductions: 610,
    net: 71740,
    status: "credited",
    date: "Tue, 14 Oct",
    dateISO: "2026-10-14",
    source: { en: "HDFC credit alert, 14 Oct", hi: "HDFC क्रेडिट अलर्ट, 14 अक्टूबर" },
  },
];

export const RATINGS: Record<Platform, { value: number; change: number; count: number }> = {
  zomato: { value: 4.2, change: 0.1, count: 1840 },
  swiggy: { value: 4.0, change: -0.1, count: 2210 },
};

export type Order = {
  id: string;
  channel: Channel;
  items: string;
  amount: number;
  placedAt: string;
  status: "preparing" | "ready" | "picked" | "delivered" | "delayed" | "cancelled";
  prepMins: number;
};

export const ORDERS: Order[] = [
  { id: "7841", channel: "zomato", items: "Paneer tikka, 2 butter naan", amount: 486, placedAt: "8:42 pm", status: "preparing", prepMins: 9 },
  { id: "3390", channel: "swiggy", items: "Dal makhani, jeera rice", amount: 342, placedAt: "8:40 pm", status: "delayed", prepMins: 21 },
  { id: "T4", channel: "dine", items: "Thali x3, masala chaas x3", amount: 1170, placedAt: "8:37 pm", status: "preparing", prepMins: 12 },
  { id: "7838", channel: "zomato", items: "Chicken biryani", amount: 389, placedAt: "8:35 pm", status: "ready", prepMins: 14 },
  { id: "3387", channel: "swiggy", items: "Chole bhature x2", amount: 298, placedAt: "8:31 pm", status: "picked", prepMins: 11 },
  { id: "7833", channel: "zomato", items: "Veg thali, gajar halwa", amount: 315, placedAt: "8:22 pm", status: "delivered", prepMins: 13 },
  { id: "3381", channel: "swiggy", items: "Paneer butter masala, 3 roti", amount: 402, placedAt: "8:15 pm", status: "cancelled", prepMins: 0 },
  { id: "7829", channel: "zomato", items: "Dal tadka with rice", amount: 229, placedAt: "8:09 pm", status: "delivered", prepMins: 10 },
];

export type Review = {
  id: string;
  platform: Platform;
  author: string;
  stars: number;
  text: string;
  when: string;
  draft: Bi;
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    platform: "swiggy",
    author: "Karthik R.",
    stars: 2,
    text: "Dal was cold by the time it reached and the rice was less than usual.",
    when: "2 h ago",
    draft: {
      en: "Karthik, sorry the dal reached you cold, that's not how it leaves our kitchen. We've moved dal to sealed containers from today and added a ₹75 credit to your next order.",
      hi: "कार्तिक जी, माफ़ कीजिए दाल ठंडी पहुँची, हमारी किचन से ऐसे नहीं जाती। आज से दाल सील कंटेनर में जाएगी और आपके अगले ऑर्डर पर ₹75 की छूट जोड़ दी है।",
    },
  },
  {
    id: "r2",
    platform: "zomato",
    author: "Meera S.",
    stars: 5,
    text: "Best paneer tikka in Indiranagar. Smoky and soft.",
    when: "5 h ago",
    draft: {
      en: "Thank you, Meera! The tandoor team will be thrilled. Try the malai tikka next time, it's from the same marinade family.",
      hi: "शुक्रिया मीरा जी! तंदूर टीम बहुत ख़ुश होगी। अगली बार मलाई टिक्का ज़रूर आज़माइए।",
    },
  },
  {
    id: "r3",
    platform: "zomato",
    author: "Arjun P.",
    stars: 4,
    text: "Good food, packaging could be better. Gravy leaked a little.",
    when: "Yesterday",
    draft: {
      en: "Thanks Arjun, glad you liked the food. You're right about the leak, we're switching to tamper-proof gravy boxes this week.",
      hi: "धन्यवाद अर्जुन जी, खाना पसंद आया जानकर ख़ुशी हुई। लीक के बारे में आप सही हैं, इस हफ़्ते से टैम्पर-प्रूफ़ ग्रेवी बॉक्स आ रहे हैं।",
    },
  },
];

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  kind: DishKind;
  veg: boolean;
  bestseller?: boolean;
  photo?: string;
  description: string;
  rating: number;
  votes: number;
  price: Record<Platform, number>;
  available: Record<Platform, boolean>;
  ordersLast7: number;
};

export const MENU: MenuItem[] = [
  { id: "m1", photo: "/photos/menu-paneer-tikka.webp", name: "Paneer tikka", category: "Starters", kind: "paneer-tikka", veg: true, bestseller: true, description: "Cottage cheese marinated overnight in hung curd and Kashmiri chilli, charred in the tandoor with onion and capsicum. Served with mint chutney.", rating: 4.4, votes: 612, price: { zomato: 289, swiggy: 289 }, available: { zomato: true, swiggy: true }, ordersLast7: 142 },
  { id: "m7", photo: "/photos/menu-malai-tikka.webp", name: "Malai tikka", category: "Starters", kind: "paneer-tikka", veg: true, description: "Soft paneer in a cream, cashew and green cardamom marinade, finished on charcoal.", rating: 4.1, votes: 188, price: { zomato: 309, swiggy: 309 }, available: { zomato: true, swiggy: true }, ordersLast7: 41 },
  { id: "m3", photo: "/photos/menu-dal-makhani.webp", name: "Dal makhani", category: "Main course", kind: "dal-makhani", veg: true, bestseller: true, description: "Black urad and rajma slow-cooked for 12 hours, finished with white butter and cream.", rating: 4.5, votes: 904, price: { zomato: 249, swiggy: 249 }, available: { zomato: true, swiggy: true }, ordersLast7: 121 },
  { id: "m5", photo: "/photos/menu-chole-bhature.webp", name: "Chole bhature", category: "Main course", kind: "chole-bhature", veg: true, description: "Spiced Pindi chole with two fluffy bhature, pickled onions and achaar.", rating: 4.2, votes: 377, price: { zomato: 199, swiggy: 189 }, available: { zomato: true, swiggy: true }, ordersLast7: 77 },
  { id: "m8", photo: "/photos/menu-dal-tadka.webp", name: "Dal tadka with rice", category: "Main course", kind: "rajma-chawal", veg: true, description: "", rating: 4.0, votes: 143, price: { zomato: 229, swiggy: 229 }, available: { zomato: true, swiggy: true }, ordersLast7: 58 },
  { id: "m2", photo: "/photos/menu-chicken-biryani.webp", name: "Chicken biryani", category: "Biryani", kind: "biryani", veg: false, bestseller: true, description: "Long-grain basmati layered with bone-in chicken, saffron, fried onions and mint, sealed and cooked dum style.", rating: 4.3, votes: 1240, price: { zomato: 349, swiggy: 359 }, available: { zomato: true, swiggy: true }, ordersLast7: 188 },
  { id: "m9", photo: "/photos/menu-veg-biryani.webp", name: "Veg dum biryani", category: "Biryani", kind: "biryani", veg: true, description: "Seasonal vegetables and paneer layered with saffron rice, served with burani raita.", rating: 3.9, votes: 211, price: { zomato: 279, swiggy: 279 }, available: { zomato: true, swiggy: true }, ordersLast7: 36 },
  { id: "m4", photo: "/photos/menu-thali.webp", name: "Veg thali", category: "Thalis", kind: "thali", veg: true, bestseller: true, description: "Dal, seasonal sabzi, paneer of the day, raita, jeera rice, two rotis and a sweet.", rating: 4.3, votes: 530, price: { zomato: 279, swiggy: 279 }, available: { zomato: true, swiggy: false }, ordersLast7: 96 },
  { id: "m10", photo: "/photos/menu-naan.webp", name: "Butter naan", category: "Breads", kind: "butter-naan", veg: true, description: "Tandoor-baked naan brushed with salted butter.", rating: 4.2, votes: 702, price: { zomato: 59, swiggy: 59 }, available: { zomato: true, swiggy: true }, ordersLast7: 214 },
  { id: "m11", photo: "/photos/menu-garlic-naan.webp", name: "Garlic naan", category: "Breads", kind: "butter-naan", veg: true, description: "Naan topped with chopped garlic and coriander.", rating: 4.1, votes: 356, price: { zomato: 69, swiggy: 69 }, available: { zomato: true, swiggy: true }, ordersLast7: 133 },
  { id: "m6", photo: "/photos/menu-gajar-halwa.webp", name: "Gajar halwa", category: "Desserts", kind: "gulab-jamun", veg: true, description: "Red carrots slow-cooked in milk with ghee, khoya and cardamom, topped with almonds. Served warm.", rating: 4.6, votes: 488, price: { zomato: 99, swiggy: 99 }, available: { zomato: true, swiggy: true }, ordersLast7: 64 },
];

export function rupees(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

/** The sample seller for the homepage: a home kitchen not on Zomato or Swiggy, selling on its own page. */
export const MEENA = {
  name: "Meena's Kitchen",
  area: "Green Park, New Delhi",
  city: "New Delhi",
  ownerFirstName: "Meena",
};

type SellerDish = { name: string; category: string; kind: DishKind; price: number; photo: string; thumb: string; description: string; bestseller?: boolean };

/** Meena's menu: home-style veg, lunch and breakfast, with a festive sweets box. Photos credited in public/photos/meena/credits.json. */
export const MEENA_MENU: SellerDish[] = [
  { name: "Rajma chawal", category: "Lunch", kind: "rajma-chawal", price: 90, photo: "/photos/meena/rajma-chawal.jpg", thumb: "/photos/meena/rajma-chawal-sm.jpg", description: "Slow-cooked Punjabi rajma with steamed rice, the way it's made at home on Sundays.", bestseller: true },
  { name: "Kadhi chawal", category: "Lunch", kind: "rajma-chawal", price: 90, photo: "/photos/meena/kadhi-chawal.jpg", thumb: "/photos/meena/kadhi-chawal-sm.jpg", description: "Besan kadhi with soft pakoras, tempered with ghee and red chilli, over rice." },
  { name: "Thali", category: "Lunch", kind: "thali", price: 120, photo: "/photos/menu-thali.webp", thumb: "/photos/meena/thali-sm.jpg", description: "Dal, seasonal sabzi, rice, three rotis, salad and pickle.", bestseller: true },
  { name: "Aloo paratha", category: "Breakfast", kind: "butter-naan", price: 60, photo: "/photos/meena/aloo-paratha.jpg", thumb: "/photos/meena/aloo-paratha-sm.jpg", description: "Two whole-wheat parathas stuffed with spiced potato, with butter, curd and pickle.", bestseller: true },
  { name: "Diwali sweets box", category: "Festive", kind: "gulab-jamun", price: 450, photo: "/photos/meena/sweets-box.jpg", thumb: "/photos/meena/sweets-box-sm.jpg", description: "Half a kilo of homemade barfi, cham cham and kaju katli. Order a day ahead." },
];
