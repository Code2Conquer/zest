// Shapes returned by the API. Shared by route handlers and the frontend.

import type { DishKind } from "@/components/dishes";
import type { Lang } from "./i18n";
import type { OrderStatus } from "./orders";
import type { Channel, ConnectMethod, Platform } from "./platforms";

export type ConnectionDTO = {
  platform: Platform;
  method: ConnectMethod | "sandbox";
  status: "connected" | "pending" | "error";
  statusDetail: string | null;
  lastSyncAt: string | null;
  info: Record<string, unknown>;
};

export type OutletDTO = {
  id: string;
  brandId: string | null;
  name: string;
  area: string;
  city: string;
  address: string;
  fssai: string | null;
  gstin: string | null;
  listings: Partial<Record<Platform, string>>;
  listing: Partial<Record<Platform, ListingSummary>>;
  cuisines: string;
  ownerName: string;
  ownerPhone: string | null;
  lang: Lang;
  journey: "new" | "notlive" | "live" | null;
  live: Platform[];
  email: "gmail" | "outlook" | null;
  whatsapp: boolean;
  ratings: Partial<Record<Platform, { value: number; count: number; change: number }>>;
  isDemo: boolean;
  connections: ConnectionDTO[];
  claude: boolean;
};

export type MenuItemDTO = {
  id: string;
  name: string;
  category: string;
  kind: DishKind;
  veg: boolean;
  bestseller: boolean;
  description: string;
  rating: number;
  votes: number;
  photo?: string;
  price: Record<Platform, number>;
  available: Record<Platform, boolean>;
  ordersLast7: number;
};

export type OrderLineDTO = {
  id: string;
  itemId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  options: { group: string; choice: string; priceDelta: number }[];
  lineTotal: number;
};

export type OrderDTO = {
  id: string;
  externalId: string;
  channel: Channel;
  items: string;
  amount: number;
  placedAt: string;
  status: OrderStatus;
  delayed: boolean;
  promisedAt: string | null;
  prepMins: number;
  lines?: OrderLineDTO[];
};

export type PayoutDTO = {
  id: string;
  platform: Platform;
  periodLabel: string;
  gross: number;
  commission: number;
  ads: number;
  deductions: number;
  net: number;
  status: "upcoming" | "credited";
  payDate: string;
  source: string;
};

export type ReviewDTO = {
  id: string;
  platform: Platform;
  author: string;
  stars: number;
  text: string;
  postedAt: string;
  draft: { en: string; hi: string } | null;
  reply: string | null;
  repliedAt: string | null;
};

export type ApprovalStep = { platform?: Platform; what: string; ok: boolean; note?: string; error?: string; reference?: string };

export type ApprovalDTO = {
  id: string;
  agent: string;
  kind: "menu_change" | "review_reply" | "dispute" | "promo" | "listing_application";
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  status: "pending" | "executed" | "failed" | "skipped" | "undone";
  steps: ApprovalStep[];
  createdAt: string;
};

export type TodayDTO = {
  sales: Record<Channel, { amount: number; orders: number }>;
  total: number;
  changePct: number | null;
  nextPayout: PayoutDTO | null;
  openComplaints: number;
  topDishes: { item: MenuItemDTO; orders: number }[];
  approvals: ApprovalDTO[];
};

export type CopilotCard =
  | { type: "approval"; approval: ApprovalDTO }
  | { type: "payout"; payout: PayoutDTO; previous: PayoutDTO | null }
  | { type: "sales"; sales: TodayDTO["sales"]; channels: Channel[] };

export type CopilotReply = {
  agent: "orchestrator" | "finance" | "reviews" | "menu" | "orders" | "growth" | "onboarding";
  text: string;
  cards: CopilotCard[];
  suggestions: string[];
  engine: "claude" | "rules";
};

export type ChatEntry = { id: string; role: "user"; text: string } | { id: string; role: "assistant"; reply: CopilotReply };

export type MailboxDTO = {
  configured: boolean;
  missing: string[];
  deployment: { env: string; commit: string | null };
  senders: string[];
  mailbox: null | {
    provider: "gmail";
    address: string;
    status: "connected" | "syncing" | "error";
    statusDetail: string | null;
    backfillDone: boolean;
    lastSyncAt: string | null;
    counts: Record<"payout" | "report" | "complaint" | "onboarding" | "other", number>;
  };
  recent: { id: string; from: string; subject: string; kind: string | null; receivedAt: string; snippet: string | null; payout: boolean; attachments: { filename: string; read: boolean }[] }[];
};

export type MailSyncResult = { checked: number; added: number; payouts: number; done: boolean; error?: string };

export type MailInsightsDTO = {
  days: number;
  since: string;
  mails: { total: number; byKind: Record<"payout" | "report" | "complaint" | "onboarding" | "other", number>; byPlatform: Record<Platform, number> };
  platforms: { platform: Platform; payouts: number; gross: number; commission: number; ads: number; deductions: number; net: number; upcoming: number }[];
  unreadPayouts: number;
  complaints: { id: string; subject: string; receivedAt: string; platform: Platform | null }[];
  actions: { id: string; subject: string; receivedAt: string; platform: Platform | null }[];
  highlights: { tone: "good" | "warn" | "info"; text: { en: string; hi: string } }[];
};

/** What a restaurant's public Zomato or Swiggy page says about it. */
export type PlatformListing = {
  platform: Platform;
  resId: string;
  url: string;
  name: string;
  cuisines: string[];
  rating: { delivery: { value: number; count: number } | null; dining: { value: number; count: number } | null };
  address: string;
  locality: string;
  area: string;
  city: string;
  pincode: string | null;
  location: { lat: number; lng: number } | null;
  phone: string | null;
  hours: string[];
  costForTwo: number | null;
  highlights: string[];
  status: "open" | "temporarily_closed" | "closed";
  deliveryOnly: boolean;
  /** Set for a Swiggy Dineout (table booking) page, which has no dish list. */
  dineout?: boolean;
  /** Dish names the page calls popular, when it has no full menu. */
  popularDishes?: string[];
  fssai: string | null;
  photos: string[];
  menu: { name: string; category: string; price: number; description: string; veg: boolean; photo: string | null; available: boolean; bestseller: boolean }[];
  fetchedAt: string;
};

export type ListingSummary = Omit<PlatformListing, "menu"> & { menuCount: number };

export type TabLineDTO = { itemId: string | null; name: string; price: number; qty: number; veg: boolean };
export type TabDTO = { id: string; tableId: string; partyName: string; partySize: number; lines: TabLineDTO[]; status: "open" | "billed" | "closed" | "cancelled"; total: number; openedAt: string };
export type ReservationDTO = {
  id: string;
  kind: "booking" | "waitlist";
  name: string;
  phone: string | null;
  partySize: number;
  at: string;
  quotedMins: number | null;
  status: "booked" | "waiting" | "notified" | "seated" | "cancelled" | "no_show";
  tableId: string | null;
  note: string;
};
export type DiningDTO = {
  tables: {
    id: string;
    label: string;
    seats: number;
    zone: string;
    status: "free" | "seated" | "billing" | "reserved";
    tab: TabDTO | null;
    booking: ReservationDTO | null;
  }[];
  bookings: ReservationDTO[];
  waitlist: ReservationDTO[];
  stats: { covers: number; sales: number; bills: number; avgMins: number | null; openTables: number; seatedGuests: number };
  menu: { id: string; name: string; category: string; price: number; veg: boolean; photo: string | null; available: boolean }[];
};

export type CampaignDTO = {
  id: string;
  platform: Platform;
  kind: "promo" | "ad";
  goal: string;
  title: string;
  window: string;
  spendCap: number;
  spent: number;
  orders: number;
  revenue: number;
  expectedOrders: number;
  minReturn: number;
  status: "live" | "paused" | "ended";
  statusDetail: string | null;
  startsAt: string;
  endsAt: string | null;
};

export type GrowthGoal = "new_customers" | "slow_hours" | "bigger_orders" | "dish" | "festival";
export type CampaignInput = {
  platform: Platform;
  goal: GrowthGoal;
  offer: "percent" | "flat" | "freebie" | "ads";
  value: number; // percent, or rupees off, or rupee cost of the free item; for ads, unused
  upTo: number; // max discount for percent offers
  minOrder: number;
  budget: number;
  days: number;
  window: string; // e.g. "3 to 6 pm, Mon to Thu" or "All day"
  dish?: string;
};
export type EstimateDTO = {
  basis: { ordersPerDay: number; avgOrder: number; days: number; fromHistory: boolean };
  extraOrders: number;
  redeemedOrders: number;
  spend: number;
  revenue: number;
  returnOnSpend: number;
  daysCovered: number;
  offerText: string;
  notes: { en: string; hi: string }[];
};
export type SuggestionDTO = { id: string; title: { en: string; hi: string }; why: { en: string; hi: string }; input: CampaignInput };
export type GrowthDTO = {
  campaigns: CampaignDTO[];
  summary: { spent: number; revenue: number; orders: number; live: number };
  suggestions: SuggestionDTO[];
  limit: number;
};
