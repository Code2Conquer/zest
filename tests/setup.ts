// Runs before each test file: a fresh in-memory database and fixed test secrets.
process.env.DATABASE_URL = ":memory:";
process.env.ZEST_SECRET_KEY ??= Buffer.alloc(32, 7).toString("base64");

const { ready } = await import("@/lib/server/db");
await ready();

export {};
