import { vi } from "vitest";

// Runs before each test file: a fresh in-memory database, fixed test secrets, and an in-memory
// cookie jar in place of next/headers (registered here, before any server module imports it).
process.env.DATABASE_URL = ":memory:";
process.env.ZEST_SECRET_KEY ??= Buffer.alloc(32, 7).toString("base64");
vi.mock("next/headers", () => import("./cookies"));

const { ready } = await import("@/lib/server/db");
await ready();
