import { z } from "zod";
import { setCampaignStatus } from "@/lib/server/growth";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";

const Body = z.object({ action: z.enum(["pause", "resume", "end"]) });

export const PATCH = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }) => {
  assertWritable(outlet);
  return setCampaignStatus(outlet.id, id, Body.parse(await req.json()).action);
});
