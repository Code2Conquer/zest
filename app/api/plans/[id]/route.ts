import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { changePlan } from "@/lib/server/plans";

/** Skips or restores a day, marks the week paid, or stops the plan. */
export const PATCH = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }) => {
  assertWritable(outlet, { sample: true });
  return changePlan(outlet.id, id, await req.json());
});
