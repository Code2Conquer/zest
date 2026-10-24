import { handler } from "@/lib/server/http";
import { confirmPayment } from "@/lib/server/storefront";

/** The payment checkout reports success; the gateway's signature is checked before the order counts as paid. */
export const POST = handler<{ slug: string; id: string }>({ staff: true }, async (req, _outlet, { slug, id }) => confirmPayment(slug, id, await req.json()));
