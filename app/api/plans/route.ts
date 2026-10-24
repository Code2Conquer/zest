import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { createPlan, listPlans } from "@/lib/server/plans";

export const GET = handler({ roles: MANAGERS }, async (_req, outlet) => listPlans(outlet.id));

/** Starts a regular's weekly tiffin plan. */
export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  assertWritable(outlet);
  return createPlan(outlet, await req.json());
});
