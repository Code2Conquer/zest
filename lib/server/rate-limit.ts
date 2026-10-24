import "server-only";
import { client } from "./db";

const windowStart = (windowSec: number) => {
  const now = Math.floor(Date.now() / 1000);
  return now - (now % windowSec);
};

/** Counts one hit against `key` in the current fixed window. True while the count is within `limit`. */
export async function checkRate(key: string, limit: number, windowSec: number): Promise<boolean> {
  const rs = await client().execute({
    sql: "INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1 RETURNING count",
    args: [key, windowStart(windowSec)],
  });
  return Number(rs.rows[0].count) <= limit;
}

/** Takes back one hit, e.g. when an attempt counted up front turns out to be legitimate. */
export async function refundRate(key: string, windowSec: number): Promise<void> {
  await client().execute({ sql: "UPDATE rate_limits SET count = MAX(count - 1, 0) WHERE key = ? AND window_start = ?", args: [key, windowStart(windowSec)] });
}
