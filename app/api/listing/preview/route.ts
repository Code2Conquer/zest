import { z } from "zod";
import { handler } from "@/lib/server/http";
import { fetchListing } from "@/lib/server/listing-sync";
import { relay } from "@/lib/server/scrape";

const Body = z.object({ url: z.string().trim().min(1).max(300) });

/** Reads a Zomato or Swiggy listing link without saving anything, so the sign-up form can show and fill it. */
export const POST = handler(async (req) => {
  const { url } = Body.parse(await req.json());
  return fetchListing(url);
});

/** Whether listing reads go through a scraping relay, and which service. Never the key. */
export const GET = handler(async () => {
  let host: string | null = null;
  try {
    host = relay ? new URL(relay.replace("{url}", "x")).hostname : null;
  } catch {
    host = "unreadable";
  }
  return { relay: !!relay, host };
});
