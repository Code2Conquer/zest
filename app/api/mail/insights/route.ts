import { handler } from "@/lib/server/http";
import { mailInsights } from "@/lib/server/insights";

/** Payouts, complaints and things to act on from the last 30 days of platform mail. */
export const GET = handler(async (_req, outlet) => mailInsights(outlet.id));
