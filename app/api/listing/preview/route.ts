import { z } from "zod";
import { handler } from "@/lib/server/http";
import { fetchZomatoListing } from "@/lib/server/zomato-listing";

const Body = z.object({ url: z.string().trim().min(1).max(300) });

/** Reads a Zomato listing link without saving anything, so the sign-up form can show and fill it. */
export const POST = handler(async (req) => {
  const { url } = Body.parse(await req.json());
  return fetchZomatoListing(url);
});
