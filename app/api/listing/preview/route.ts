import { z } from "zod";
import { HttpError } from "@/lib/server/approvals";
import { clientIp, handler } from "@/lib/server/http";
import { checkRate } from "@/lib/server/rate-limit";
import { fetchListing } from "@/lib/server/listing-sync";
import { relay } from "@/lib/server/scrape";

const Body = z.object({ url: z.string().trim().min(1).max(300) });

/** Reads a Zomato or Swiggy listing link without saving anything, so the sign-up form can show and fill it. */
export const POST = handler(async (req) => {
  // Each read may go through a paid scraping relay; anyone can call this before signing up.
  if (!(await checkRate(`listing:${clientIp(req)}`, 10, 3600))) throw new HttpError(429, "Too many listing reads from this connection. Try again in an hour.");
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
