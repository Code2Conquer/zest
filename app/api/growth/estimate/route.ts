import { estimate } from "@/lib/server/growth";
import { handler } from "@/lib/server/http";
import { CampaignInput } from "../input";

/** What a campaign would likely bring, from this outlet's own orders. */
export const POST = handler(async (req, outlet) => estimate(outlet.id, CampaignInput.parse(await req.json())));
