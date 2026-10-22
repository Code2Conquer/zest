-- Soundbox waitlist: one row per kitchen that asks to be told when the Zest Soundbox is ready.
-- Runs at startup with the other CREATE TABLE IF NOT EXISTS statements in lib/server/db.ts, so it is
-- safe to run again. A second sign-up from the same number updates nothing (unique phone).
CREATE TABLE IF NOT EXISTS soundbox_waitlist (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  phone TEXT NOT NULL,          -- +91XXXXXXXXXX, the WhatsApp number we reply to
  city TEXT NOT NULL,
  type TEXT NOT NULL,           -- home_kitchen | tiffin | cloud_kitchen | shop | restaurant
  page TEXT NOT NULL,           -- "/" or "/restaurants"
  section TEXT NOT NULL,        -- where on the page the form was: "soundbox", "start", "restaurants-voice"
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS soundbox_waitlist_phone ON soundbox_waitlist (phone);
