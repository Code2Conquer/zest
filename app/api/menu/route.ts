import { handler } from "@/lib/server/http";
import { getMenu } from "@/lib/server/queries";

export const GET = handler(async (_req, outlet) => getMenu(outlet.id));
