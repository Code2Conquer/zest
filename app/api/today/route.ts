import { handler } from "@/lib/server/http";
import { getToday } from "@/lib/server/queries";

export const GET = handler(async (_req, outlet) => getToday(outlet));
