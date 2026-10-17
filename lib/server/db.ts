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
`;

// Columns added after the first release. Each runs once; "duplicate column" means it's already there.
const COLUMNS = [
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
];
const INDEXES = "CREATE UNIQUE INDEX IF NOT EXISTS emails_outlet_external ON emails (outlet_id, external_id);";

async function migrate(c: Client) {
  for (const sql of COLUMNS) {
    try {
      await c.execute(sql);
    } catch (err) {
      if (!/duplicate column/i.test((err as Error).message)) throw err;
    }
  }
  await c.execute(INDEXES);
}

type Db = LibSQLDatabase<typeof schema>;

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { zestClient?: Client; zestDb?: Db; zestReady?: Promise<void> };

function client(): Client {
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
      const { seedDemo } = await import("./seed");
      await seedDemo();
    })().catch((err) => {
      globalForDb.zestReady = undefined;
      throw err;
    });
  }
  return globalForDb.zestReady;
}

export { schema };
