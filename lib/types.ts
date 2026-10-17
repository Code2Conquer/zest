// Shapes returned by the API. Shared by route handlers and the frontend.

import type { DishKind } from "@/components/dishes";
import type { Lang } from "./i18n";
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
  name: string;
  area: string;
  city: string;
  address: string;
  fssai: string | null;
  gstin: string | null;
  listings: Partial<Record<Platform, string>>;
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

export type OrderDTO = {
  id: string;
  externalId: string;
  channel: Channel;
  items: string;
  amount: number;
  placedAt: string;
  status: "preparing" | "ready" | "picked" | "delivered" | "delayed" | "cancelled";
  prepMins: number;
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
