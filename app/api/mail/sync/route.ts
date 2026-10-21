import { HttpError } from "@/lib/server/approvals";
import { syncMailbox } from "@/lib/server/gmail";
import { handler, OWNER } from "@/lib/server/http";

export const maxDuration = 60;

export const POST = handler({ roles: OWNER }, async (_req, outlet) => {
  const result = await syncMailbox(outlet.id);
  if (result.error === "No mailbox connected.") throw new HttpError(404, "Connect Gmail first.");
  return result;
});
