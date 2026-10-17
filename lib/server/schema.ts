import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { ConnectMethod, Platform } from "../platforms";
import type { ListingSummary } from "../types";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

export const outlets = sqliteTable("outlets", {
  id: text("id").primaryKey().$defaultFn(id),
  name: text("name").notNull(),
  area: text("area").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  cuisines: text("cuisines").notNull().default(""),
  ownerName: text("owner_name").notNull().default(""),
  ownerPhone: text("owner_phone"),
  lang: text("lang", { enum: ["en", "hi"] }).notNull().default("en"),
  journey: text("journey", { enum: ["new", "notlive", "live"] }),
  livePlatforms: text("live_platforms", { mode: "json" }).$type<Platform[]>().notNull().default([]),
  email: text("email", { enum: ["gmail", "outlook"] }),
  whatsapp: integer("whatsapp", { mode: "boolean" }).notNull().default(false),
  // Optional at sign-up: FSSAI licence number and GSTIN as the owner typed them.
  fssai: text("fssai"),
  gstin: text("gstin"),
  // The owner's own listing links, e.g. https://www.zomato.com/ncr/yummy-milkshake-ip-extension-new-delhi
  listings: text("listings", { mode: "json" }).$type<Partial<Record<Platform, string>>>().notNull().default({}),
  // What the public listing pages said when last read (menu excluded; it goes to menu_items).
  listingData: text("listing_data", { mode: "json" }).$type<{ zomato?: ListingSummary }>().notNull().default({}),
  ratings: text("ratings", { mode: "json" }).$type<Partial<Record<Platform, { value: number; count: number; change: number }>>>().notNull().default({}),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const connections = sqliteTable(
  "connections",
  {
    id: text("id").primaryKey().$defaultFn(id),
    outletId: text("outlet_id").notNull(),
    platform: text("platform", { enum: ["zomato", "swiggy"] }).notNull(),
    method: text("method", { enum: ["api", "mcp", "portal", "sandbox"] }).$type<ConnectMethod | "sandbox">().notNull(),
    // AES-256-GCM ciphertext of the credentials JSON. Never sent to the client or the model.
    secret: text("secret"),
    // Non-secret details safe to show: masked phone, server URL, tool list.
    publicInfo: text("public_info", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    status: text("status", { enum: ["connected", "pending", "error"] }).notNull().default("connected"),
    statusDetail: text("status_detail"),
    lastSyncAt: text("last_sync_at"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("connections_outlet_platform").on(t.outletId, t.platform)],
);

export const menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  kind: text("kind").notNull().default("thali"),
  veg: integer("veg", { mode: "boolean" }).notNull().default(true),
  bestseller: integer("bestseller", { mode: "boolean" }).notNull().default(false),
  description: text("description").notNull().default(""),
  rating: real("rating").notNull().default(0),
  votes: integer("votes").notNull().default(0),
  photoUrl: text("photo_url"),
  price: text("price", { mode: "json" }).$type<Record<Platform, number>>().notNull(),
  available: text("available", { mode: "json" }).$type<Record<Platform, boolean>>().notNull(),
  ordersLast7: integer("orders_last7").notNull().default(0),
  sort: integer("sort").notNull().default(0),
  updatedAt: text("updated_at").notNull().$defaultFn(now),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(id),
    outletId: text("outlet_id").notNull(),
    channel: text("channel", { enum: ["zomato", "swiggy", "dine"] }).notNull(),
    externalId: text("external_id").notNull(),
    items: text("items").notNull(),
    amount: integer("amount").notNull(),
    placedAt: text("placed_at").notNull(),
    status: text("status", { enum: ["preparing", "ready", "picked", "delivered", "delayed", "cancelled"] }).notNull(),
    prepMins: integer("prep_mins").notNull().default(0),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("orders_outlet_channel_ext").on(t.outletId, t.channel, t.externalId)],
);

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  platform: text("platform", { enum: ["zomato", "swiggy"] }).notNull(),
  periodLabel: text("period_label").notNull(),
  periodStart: text("period_start").notNull(),
  gross: integer("gross").notNull(),
  commission: integer("commission").notNull(),
  ads: integer("ads").notNull().default(0),
  deductions: integer("deductions").notNull().default(0),
  net: integer("net").notNull(),
  status: text("status", { enum: ["upcoming", "credited"] }).notNull(),
  payDate: text("pay_date").notNull(),
  source: text("source").notNull(),
  // Set when the payout was read from an email, so disconnecting the mailbox removes it too.
  emailId: text("email_id"),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  platform: text("platform", { enum: ["zomato", "swiggy"] }).notNull(),
  externalId: text("external_id"),
  author: text("author").notNull(),
  stars: integer("stars").notNull(),
  text: text("text").notNull(),
  postedAt: text("posted_at").notNull(),
  draftReply: text("draft_reply", { mode: "json" }).$type<{ en: string; hi: string } | null>(),
  reply: text("reply"),
  repliedAt: text("replied_at"),
});

export type ApprovalKind = "menu_change" | "review_reply" | "dispute" | "promo" | "listing_application";
export type ApprovalStatus = "pending" | "executed" | "failed" | "skipped" | "undone";

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  agent: text("agent").notNull(),
  kind: text("kind").$type<ApprovalKind>().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  status: text("status").$type<ApprovalStatus>().notNull().default("pending"),
  result: text("result", { mode: "json" }).$type<Record<string, unknown> | null>(),
  createdAt: text("created_at").notNull().$defaultFn(now),
  decidedAt: text("decided_at"),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: text("detail", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  channel: text("channel", { enum: ["whatsapp"] }).notNull().default("whatsapp"),
  kind: text("kind").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["queued", "sent", "failed"] }).notNull(),
  error: text("error"),
  createdAt: text("created_at").notNull().$defaultFn(now),
  sentAt: text("sent_at"),
});

export type MailKind = "payout" | "report" | "complaint" | "onboarding" | "other";

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  fromAddr: text("from_addr").notNull(),
  subject: text("subject").notNull(),
  receivedAt: text("received_at").notNull().$defaultFn(now),
  parsedAs: text("parsed_as"),
  parsed: text("parsed", { mode: "json" }).$type<Record<string, unknown> | null>(),
  // Where it came from: "paste" or "gmail", and the provider's message id for de-duplication.
  origin: text("origin").notNull().default("paste"),
  externalId: text("external_id"),
  kind: text("kind").$type<MailKind>(),
  snippet: text("snippet"),
  attachments: text("attachments", { mode: "json" }).$type<{ filename: string; mimeType: string; read: boolean }[]>(),
});

/** A connected inbox. One per outlet for now. */
export const mailboxes = sqliteTable("mailboxes", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull().unique(),
  provider: text("provider", { enum: ["gmail"] }).notNull(),
  address: text("address").notNull(),
  // Encrypted { refreshToken, accessToken, expiresAt }. Never sent to the client or the model.
  secret: text("secret").notNull(),
  status: text("status", { enum: ["connected", "syncing", "error"] }).notNull().default("connected"),
  statusDetail: text("status_detail"),
  backfillDone: integer("backfill_done", { mode: "boolean" }).notNull().default(false),
  lastSyncAt: text("last_sync_at"),
  connectedAt: text("connected_at").notNull().$defaultFn(now),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(id),
  outletId: text("outlet_id").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  // Owner text, or the assistant's reply (text, agent, cards) as shown in the UI.
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export type Outlet = typeof outlets.$inferSelect;
export type Connection = typeof connections.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type PayoutRow = typeof payouts.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type ApprovalRow = typeof approvals.$inferSelect;
export type Mailbox = typeof mailboxes.$inferSelect;
export type EmailRow = typeof emails.$inferSelect;
