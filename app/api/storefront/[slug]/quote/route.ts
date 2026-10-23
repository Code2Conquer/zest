import { handler } from "@/lib/server/http";
import { deliveryQuote } from "@/lib/server/storefront";

/** What delivery to the customer's location costs, before they place the order. */
export const POST = handler<{ slug: string }>({ staff: true }, async (req, _outlet, { slug }) => deliveryQuote(slug, await req.json()));
