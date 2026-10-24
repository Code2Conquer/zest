import { handler } from "@/lib/server/http";
import { ordersFromPlans } from "@/lib/server/plans";
import { getOrders } from "@/lib/server/queries";
import { DEMO_OUTLET_ID, MEENA_OUTLET_ID, refreshMeenaDay, refreshRestaurantDay } from "@/lib/server/seed";

export const GET = handler({ staff: true }, async (_req, outlet) => {
  if (outlet.id === MEENA_OUTLET_ID) await refreshMeenaDay();
  if (outlet.id === DEMO_OUTLET_ID) await refreshRestaurantDay();
  // Today's tiffins, in case the morning run hasn't happened yet.
  await ordersFromPlans(outlet.id);
  return getOrders(outlet.id);
});
