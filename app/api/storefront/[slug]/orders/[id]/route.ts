import { handler } from "@/lib/server/http";
import { orderStatus } from "@/lib/server/storefront";

/** The customer's view of their order, with the private token from when they placed it. */
export const GET = handler<{ slug: string; id: string }>({ staff: true }, async (req, _outlet, { slug, id }) => orderStatus(slug, id, new URL(req.url).searchParams.get("t") ?? ""));
