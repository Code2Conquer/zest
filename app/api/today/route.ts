import { handler } from "@/lib/server/http";
import { getToday } from "@/lib/server/queries";
import { DEMO_OUTLET_ID, MEENA_OUTLET_ID, refreshMeenaDay, refreshRestaurantDay } from "@/lib/server/seed";

export const GET = handler(async (_req, outlet) => {
  if (outlet.id === MEENA_OUTLET_ID) await refreshMeenaDay();
  if (outlet.id === DEMO_OUTLET_ID) await refreshRestaurantDay();
  return getToday(outlet);
});
