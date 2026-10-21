import { clientIp, handler } from "@/lib/server/http";
import { placeOrder } from "@/lib/server/storefront";

/** A customer places an order on the restaurant's site. No account; limited per connection. */
export const POST = handler<{ slug: string }>({ staff: true }, async (req, _outlet, { slug }) => placeOrder(slug, await req.json(), clientIp(req)));
