import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { applyListing, fetchListing } from "@/lib/server/listing-sync";
import { outletDTO } from "@/lib/server/queries";

const Platform = z.enum(["zomato", "swiggy"]);
const Body = z.object({ url: z.string().trim().max(300).optional() });

/** Reads the restaurant's Zomato or Swiggy page (the saved link, or a new one) and saves what it says. */
export const POST = handler<{ platform: string }>(async (req, outlet, params) => {
  assertWritable(outlet);
  const platform = Platform.parse(params.platform);
  if (outlet.isDemo) throw new HttpError(403, "Start your own restaurant to read a listing. The sample restaurant is shared.");
  const { url } = Body.parse(await req.json().catch(() => ({})));
  const link = url || outlet.listings[platform];
  if (!link) throw new HttpError(400, `Add your ${platform === "zomato" ? "Zomato" : "Swiggy"} link first.`);
  const listing = await fetchListing(link);
  if (listing.platform !== platform) throw new HttpError(400, `That isn't a ${platform === "zomato" ? "Zomato" : "Swiggy"} link.`);
  const { outlet: row, imported, matched } = await applyListing(outlet, listing);
  return { outlet: await outletDTO(row), imported, matched };
});
