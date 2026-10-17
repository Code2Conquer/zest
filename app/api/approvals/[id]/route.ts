import { z } from "zod";
import { approve, skip, undo } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";

const Body = z.object({ action: z.enum(["approve", "skip", "undo"]) });

/** The owner's decision on a draft. Approving runs it through the platform connectors. */
export const POST = handler<{ id: string }>(async (req, outlet, { id }) => {
  assertWritable(outlet);
  const { action } = Body.parse(await req.json());
  const row = action === "approve" ? await approve(outlet, id) : action === "skip" ? await skip(outlet, id) : await undo(outlet, id);
  return approvalDTO(row);
});
