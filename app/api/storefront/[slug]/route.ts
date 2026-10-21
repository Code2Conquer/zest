import { handler } from "@/lib/server/http";
import { getStorefront } from "@/lib/server/storefront";

/** The public menu of a restaurant's ordering site. */
export const GET = handler<{ slug: string }>({ staff: true }, async (_req, _outlet, { slug }) => getStorefront(slug));
