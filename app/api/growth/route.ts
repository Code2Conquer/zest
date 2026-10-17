import { getGrowth } from "@/lib/server/growth";
import { handler } from "@/lib/server/http";
import { refreshDemoGrowth } from "@/lib/server/seed";

/** Campaigns with their results, totals, and suggestions for what to run next. */
export const GET = handler(async (_req, outlet) => {
  if (outlet.isDemo) await refreshDemoGrowth(outlet.id);
  return getGrowth(outlet);
});
