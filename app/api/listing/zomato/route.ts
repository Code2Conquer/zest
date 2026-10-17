import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { applyZomatoListing } from "@/lib/server/listing-sync";
import { outletDTO } from "@/lib/server/queries";
import { fetchZomatoListing } from "@/lib/server/zomato-listing";

const Body = z.object({ url: z.string().trim().max(300).optional() });

/** Reads the restaurant's Zomato page (the saved link, or a new one) and saves what it says. */
export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  if (outlet.isDemo) throw new HttpError(403, "Start your own restaurant to read a Zomato listing. The sample restaurant is shared.");
  const { url } = Body.parse(await req.json().catch(() => ({})));
  const link = url || outlet.listings.zomato;
  if (!link) throw new HttpError(400, "Add your Zomato link first.");
  const { outlet: row, imported } = await applyZomatoListing(outlet, await fetchZomatoListing(link));
  return { outlet: await outletDTO(row), imported };
});
