import { handler } from "@/lib/server/http";
import { getReviews } from "@/lib/server/queries";

export const GET = handler(async (_req, outlet) => getReviews(outlet.id));
