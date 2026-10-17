import { propose } from "@/lib/server/growth";
import { assertWritable, handler } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";
import { CampaignInput } from "../input";

/** Sends a campaign for the owner's approval. */
export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  return approvalDTO(await propose(outlet, CampaignInput.parse(await req.json())));
});
