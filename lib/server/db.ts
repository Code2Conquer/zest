import "server-only";
import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local SQLite file by default; set DATABASE_URL (and DATABASE_AUTH_TOKEN) to
// point at a hosted libSQL/Turso database in production. ZEST_DATA_DIR moves the
// file, e.g. onto a mounted disk. Serverless hosts only allow writing to /tmp,
// which is wiped between instances, so use DATABASE_URL there.
const dataDir = process.env.ZEST_DATA_DIR ?? (process.env.VERCEL ? "/tmp" : ".data");
const url = process.env.DATABASE_URL ?? `file:${dataDir}/zest.db`;
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  console.warn("DATABASE_URL isn't set: using a temporary database that resets when the server restarts.");
}

const TABLES = `
CREATE TABLE IF NOT EXISTS outlets (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL DEFAULT '', cuisines TEXT NOT NULL DEFAULT '',
  owner_name TEXT NOT NULL DEFAULT '', owner_phone TEXT, lang TEXT NOT NULL DEFAULT 'en', journey TEXT,
  live_platforms TEXT NOT NULL DEFAULT '[]', email TEXT, whatsapp INTEGER NOT NULL DEFAULT 0, ratings TEXT NOT NULL DEFAULT '{}',
  is_demo INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, platform TEXT NOT NULL, method TEXT NOT NULL, secret TEXT,
  public_info TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'connected', status_detail TEXT,
  last_sync_at TEXT, created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS connections_outlet_platform ON connections (outlet_id, platform);
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'thali', veg INTEGER NOT NULL DEFAULT 1, bestseller INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '', rating REAL NOT NULL DEFAULT 0, votes INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT, price TEXT NOT NULL, available TEXT NOT NULL, orders_last7 INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS menu_items_outlet ON menu_items (outlet_id);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, channel TEXT NOT NULL, external_id TEXT NOT NULL,
  items TEXT NOT NULL, amount INTEGER NOT NULL, placed_at TEXT NOT NULL, status TEXT NOT NULL,
  prep_mins INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_outlet_channel_ext ON orders (outlet_id, channel, external_id);
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, platform TEXT NOT NULL, period_label TEXT NOT NULL,
  period_start TEXT NOT NULL, gross INTEGER NOT NULL, commission INTEGER NOT NULL, ads INTEGER NOT NULL DEFAULT 0,
  deductions INTEGER NOT NULL DEFAULT 0, net INTEGER NOT NULL, status TEXT NOT NULL, pay_date TEXT NOT NULL,
  source TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, platform TEXT NOT NULL, external_id TEXT, author TEXT NOT NULL,
  stars INTEGER NOT NULL, text TEXT NOT NULL, posted_at TEXT NOT NULL, draft_reply TEXT, reply TEXT, replied_at TEXT
);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, agent TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '', payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', result TEXT,
  created_at TEXT NOT NULL, decided_at TEXT
);
CREATE INDEX IF NOT EXISTS approvals_outlet_status ON approvals (outlet_id, status);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, channel TEXT NOT NULL DEFAULT 'whatsapp', kind TEXT NOT NULL,
  body TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL, sent_at TEXT
);
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, from_addr TEXT NOT NULL, subject TEXT NOT NULL,
  received_at TEXT NOT NULL, parsed_as TEXT, parsed TEXT
);
CREATE TABLE IF NOT EXISTS mailboxes (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL UNIQUE, provider TEXT NOT NULL, address TEXT NOT NULL,
  secret TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'connected', status_detail TEXT,
  backfill_done INTEGER NOT NULL DEFAULT 0, last_sync_at TEXT, connected_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_messages_outlet ON chat_messages (outlet_id, created_at);
CREATE TABLE IF NOT EXISTS dining_tables (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, label TEXT NOT NULL, seats INTEGER NOT NULL DEFAULT 4,
  zone TEXT NOT NULL DEFAULT 'Indoor', sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS dining_tables_outlet ON dining_tables (outlet_id);
CREATE TABLE IF NOT EXISTS dine_tabs (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, table_id TEXT NOT NULL, party_name TEXT NOT NULL DEFAULT '',
  party_size INTEGER NOT NULL DEFAULT 2, lines TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'open',
  paid_via TEXT, total INTEGER NOT NULL DEFAULT 0, reservation_id TEXT, opened_at TEXT NOT NULL, closed_at TEXT
);
CREATE INDEX IF NOT EXISTS dine_tabs_outlet_status ON dine_tabs (outlet_id, status);
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, phone TEXT,
  party_size INTEGER NOT NULL, at TEXT NOT NULL, quoted_mins INTEGER, status TEXT NOT NULL, table_id TEXT,
  note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS reservations_outlet_at ON reservations (outlet_id, at);
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, platform TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'promo',
  goal TEXT NOT NULL DEFAULT 'new_customers', title TEXT NOT NULL, "window" TEXT NOT NULL DEFAULT '',
  spend_cap INTEGER NOT NULL, spent INTEGER NOT NULL DEFAULT 0, orders INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0, expected_orders INTEGER NOT NULL DEFAULT 0, min_return REAL NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'live', status_detail TEXT, approval_id TEXT, starts_at TEXT NOT NULL, ends_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_outlet ON campaigns (outlet_id, status);
CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT UNIQUE, name TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, brand_id TEXT NOT NULL, role TEXT NOT NULL, outlet_ids TEXT,
  pin_hash TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS memberships_user ON memberships (user_id);
CREATE INDEX IF NOT EXISTS memberships_brand ON memberships (brand_id);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL DEFAULT '{}', run_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, locked_until TEXT,
  dedupe_key TEXT UNIQUE, created_at TEXT NOT NULL, finished_at TEXT
);
CREATE INDEX IF NOT EXISTS jobs_due ON jobs (status, run_at);
CREATE TABLE IF NOT EXISTS outlet_hours (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, weekday INTEGER NOT NULL, opens TEXT NOT NULL, closes TEXT NOT NULL, channel TEXT
);
CREATE INDEX IF NOT EXISTS outlet_hours_outlet ON outlet_hours (outlet_id);
CREATE TABLE IF NOT EXISTS special_hours (
  id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, date TEXT NOT NULL, closed INTEGER NOT NULL DEFAULT 0, opens TEXT, closes TEXT, note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS special_hours_outlet ON special_hours (outlet_id, date);
CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY, brand_id TEXT NOT NULL, phone TEXT NOT NULL, purpose TEXT NOT NULL, granted INTEGER NOT NULL,
  wording TEXT NOT NULL, source TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS consents_lookup ON consents (brand_id, phone, purpose, created_at);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, brand_id TEXT NOT NULL, phone TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', orders INTEGER NOT NULL DEFAULT 0,
  spent INTEGER NOT NULL DEFAULT 0, first_order_at TEXT NOT NULL, last_order_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_brand_phone ON customers (brand_id, phone);
CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, outlet_id TEXT NOT NULL, customer_id TEXT NOT NULL, item_id TEXT NOT NULL, qty INTEGER NOT NULL DEFAULT 1, days TEXT NOT NULL, fulfilment TEXT NOT NULL DEFAULT 'delivery', address TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', starts_on TEXT NOT NULL, ends_on TEXT NOT NULL, amount INTEGER NOT NULL, payment_status TEXT NOT NULL DEFAULT 'unpaid', skips TEXT NOT NULL DEFAULT '[]', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS plans_outlet ON plans (outlet_id);
CREATE TABLE IF NOT EXISTS otp_codes (phone TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (key, window_start));
CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, item_id TEXT, name TEXT NOT NULL, qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL, options TEXT NOT NULL DEFAULT '[]', line_total INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS order_lines_order ON order_lines (order_id);
-- Soundbox waitlist (docs/migrations/0001-soundbox-waitlist.sql)
CREATE TABLE IF NOT EXISTS soundbox_waitlist (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, business TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL,
  type TEXT NOT NULL, page TEXT NOT NULL, section TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS soundbox_waitlist_phone ON soundbox_waitlist (phone);
`;

// Columns added after the first release. Each runs once; "duplicate column" means it's already there.
const COLUMNS = [
  "ALTER TABLE menu_items ADD COLUMN daily_limit INTEGER",
  "ALTER TABLE outlets ADD COLUMN cutoffs TEXT NOT NULL DEFAULT '{}'",
  "ALTER TABLE orders ADD COLUMN pg_order_id TEXT",
  "ALTER TABLE orders ADD COLUMN pg_payment_id TEXT",
  "ALTER TABLE orders ADD COLUMN refund_status TEXT",
  "ALTER TABLE orders ADD COLUMN rider TEXT",
  "ALTER TABLE orders ADD COLUMN plan_id TEXT",
  "ALTER TABLE customers ADD COLUMN note TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE emails ADD COLUMN origin TEXT NOT NULL DEFAULT 'paste'",
  "ALTER TABLE emails ADD COLUMN external_id TEXT",
  "ALTER TABLE emails ADD COLUMN kind TEXT",
  "ALTER TABLE emails ADD COLUMN snippet TEXT",
  "ALTER TABLE emails ADD COLUMN attachments TEXT",
  "ALTER TABLE payouts ADD COLUMN email_id TEXT",
  "ALTER TABLE outlets ADD COLUMN city TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE outlets ADD COLUMN address TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE outlets ADD COLUMN fssai TEXT",
  "ALTER TABLE outlets ADD COLUMN gstin TEXT",
  "ALTER TABLE outlets ADD COLUMN listings TEXT NOT NULL DEFAULT '{}'",
  "ALTER TABLE outlets ADD COLUMN listing_data TEXT NOT NULL DEFAULT '{}'",
  "ALTER TABLE orders ADD COLUMN delayed INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN promised_at TEXT",
  "ALTER TABLE outlets ADD COLUMN brand_id TEXT",
  "ALTER TABLE outlets ADD COLUMN staff_code TEXT",
  "ALTER TABLE approvals ADD COLUMN decided_by TEXT",
  "ALTER TABLE outlets ADD COLUMN slug TEXT",
  "ALTER TABLE outlets ADD COLUMN upi_id TEXT",
  "ALTER TABLE outlets ADD COLUMN ordering INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE orders ADD COLUMN customer_id TEXT",
  "ALTER TABLE orders ADD COLUMN fulfilment TEXT",
  "ALTER TABLE orders ADD COLUMN table_label TEXT",
  "ALTER TABLE orders ADD COLUMN payment_status TEXT",
  "ALTER TABLE orders ADD COLUMN payment_method TEXT",
  "ALTER TABLE orders ADD COLUMN note TEXT",
  "ALTER TABLE orders ADD COLUMN public_token TEXT",
  "ALTER TABLE outlets ADD COLUMN delivery TEXT",
  "ALTER TABLE outlets ADD COLUMN lat REAL",
  "ALTER TABLE outlets ADD COLUMN lng REAL",
  "ALTER TABLE orders ADD COLUMN delivery_address TEXT",
  "ALTER TABLE orders ADD COLUMN delivery_by TEXT",
  "ALTER TABLE orders ADD COLUMN delivery_fee INTEGER",
  "ALTER TABLE orders ADD COLUMN delivery_km REAL",
  "ALTER TABLE outlets ADD COLUMN pan TEXT",
];

// Data fixes that move stored rows to a newer model. Each is safe to run again.
const DATA_FIXES = [
  // Order lifecycle widened: "delayed" became a flag, "picked" and "delivered" were renamed.
  "UPDATE orders SET status = 'preparing', delayed = 1 WHERE status = 'delayed'",
  "UPDATE orders SET status = 'out_for_delivery' WHERE status = 'picked'",
  "UPDATE orders SET status = 'completed' WHERE status = 'delivered'",
  // Several servers starting at once could each add the sample restaurant's default hours.
  "DELETE FROM outlet_hours WHERE rowid NOT IN (SELECT MIN(rowid) FROM outlet_hours GROUP BY outlet_id, weekday, opens, closes, ifnull(channel, ''))",
];

// Constraints that can only be added once the data fixes above have cleaned up.
const LATE_INDEXES = ["CREATE UNIQUE INDEX IF NOT EXISTS outlet_hours_unique ON outlet_hours (outlet_id, weekday, opens, closes, ifnull(channel, ''))"];
const INDEXES = [
  "CREATE UNIQUE INDEX IF NOT EXISTS emails_outlet_external ON emails (outlet_id, external_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS outlets_staff_code ON outlets (staff_code)",
  // Live order updates read "changed since" every couple of seconds.
  "CREATE INDEX IF NOT EXISTS orders_outlet_updated ON orders (outlet_id, updated_at, id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS outlets_slug ON outlets (slug)",
];

export async function migrate(c: Client) {
  for (const sql of COLUMNS) {
    try {
      await c.execute(sql);
    } catch (err) {
      if (!/duplicate column/i.test((err as Error).message)) throw err;
    }
  }
  for (const sql of INDEXES) await c.execute(sql);
  for (const sql of DATA_FIXES) await c.execute(sql);
  for (const sql of LATE_INDEXES) await c.execute(sql);
}

type Db = LibSQLDatabase<typeof schema>;

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { zestClient?: Client; zestDb?: Db; zestReady?: Promise<void> };

/** The underlying libSQL client, for raw statements in migrations and tests. */
export function client(): Client {
  if (!globalForDb.zestClient) {
    if (url.startsWith("file:")) mkdirSync(dataDir, { recursive: true });
    globalForDb.zestClient = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return globalForDb.zestClient;
}

export const db: Db = globalForDb.zestDb ?? (globalForDb.zestDb = drizzle(client(), { schema }));

/** Creates tables and seeds the demo restaurant on first use. Await before any query. */
export function ready(): Promise<void> {
  if (!globalForDb.zestReady) {
    globalForDb.zestReady = (async () => {
      await client().executeMultiple(TABLES);
      await migrate(client());
      const { seedDemo, seedMeena } = await import("./seed");
      await seedDemo();
      await seedMeena();
      const { ensureBrands } = await import("./brands");
      await ensureBrands();
      const { ensureStaffCodes } = await import("./staff");
      await ensureStaffCodes();
      const { ensureSlugs } = await import("./storefront");
      await ensureSlugs();
    })().catch((err) => {
      globalForDb.zestReady = undefined;
      throw err;
    });
  }
  return globalForDb.zestReady;
}

export { schema };
