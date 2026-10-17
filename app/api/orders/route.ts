import { handler } from "@/lib/server/http";
import { getOrders } from "@/lib/server/queries";

export const GET = handler(async (_req, outlet) => getOrders(outlet.id));
