import { z } from "zod";
import { approve, skip, undo } from "@/lib/server/approvals";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";

const Body = z.object({ action: z.enum(["approve", "skip", "undo"]) });

/** The owner's decision on a draft. Approving runs it through the platform connectors. */
export const POST = handler<{ id: string }>({ roles: MANAGERS }, async (req, outlet, { id }, session) => {
  assertWritable(outlet);
  const { action } = Body.parse(await req.json());
  const actor = session ? `user:${session.user.id}` : "owner";
  const row = action === "approve" ? await approve(outlet, id, actor) : action === "skip" ? await skip(outlet, id, actor) : await undo(outlet, id, actor);
  return approvalDTO(row);
});
