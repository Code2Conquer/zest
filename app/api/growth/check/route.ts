import { checkCampaigns } from "@/lib/server/growth";
import { assertWritable, handler } from "@/lib/server/http";

/** Runs the automatic pause and end checks now, instead of waiting for the daily sync. */
export const POST = handler(async (_req, outlet) => {
  assertWritable(outlet);
  return { changed: await checkCampaigns(outlet.id) };
});
