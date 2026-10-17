import { handler } from "@/lib/server/http";
import { getPayouts } from "@/lib/server/queries";

export const GET = handler(async (_req, outlet) => getPayouts(outlet.id));
