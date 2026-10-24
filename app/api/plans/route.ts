import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { createPlan, listPlans } from "@/lib/server/plans";
import { MEENA_OUTLET_ID, refreshMeenaDay } from "@/lib/server/seed";

export const GET = handler({ roles: MANAGERS }, async (_req, outlet) => {
  if (outlet.id === MEENA_OUTLET_ID) await refreshMeenaDay();
  return listPlans(outlet.id);
});

/** Starts a regular's weekly tiffin plan. */
export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  assertWritable(outlet);
  return createPlan(outlet, await req.json());
});
