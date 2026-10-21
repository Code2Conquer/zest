import { z } from "zod";
import { cancelTab, setBilled, setLine, settle } from "@/lib/server/dining";
import { assertWritable, FLOOR, handler } from "@/lib/server/http";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("line"), itemId: z.string().min(1), qty: z.number().int().min(0).max(99) }),
  z.object({ action: z.literal("bill") }),
  z.object({ action: z.literal("reopen") }),
  z.object({ action: z.literal("settle"), paidVia: z.enum(["cash", "upi", "card"]) }),
  z.object({ action: z.literal("clear") }),
]);

/** Changes a table's bill: dishes, print, reopen, settle or clear. */
export const PATCH = handler<{ id: string }>({ roles: FLOOR }, async (req, outlet, { id }) => {
  assertWritable(outlet);
  const body = Body.parse(await req.json());
  if (body.action === "line") return setLine(outlet.id, id, body.itemId, body.qty);
  if (body.action === "bill") return setBilled(outlet.id, id, true);
  if (body.action === "reopen") return setBilled(outlet.id, id, false);
  if (body.action === "settle") return settle(outlet.id, id, body.paidVia);
  return cancelTab(outlet.id, id);
});
