import { ensureTables, getDining } from "@/lib/server/dining";
import { handler } from "@/lib/server/http";
import { refreshDemoDining } from "@/lib/server/seed";

/** Tables, open bills, today's bookings and waitlist, and today's dine-in numbers. */
export const GET = handler(async (_req, outlet) => {
  // A restaurant opening Dining for the first time gets a starter floor plan to edit.
  if (outlet.isDemo) await refreshDemoDining(outlet.id);
  else await ensureTables(outlet.id);
  return getDining(outlet.id);
});
