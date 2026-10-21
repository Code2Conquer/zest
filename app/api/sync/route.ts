import { handler, MANAGERS } from "@/lib/server/http";
import { syncOutlet } from "@/lib/server/sync";

/** Pull now. Call from a scheduler every few minutes for platforms without webhooks. */
export const POST = handler({ roles: MANAGERS }, async (_req, outlet) => ({ results: await syncOutlet(outlet.id) }));
