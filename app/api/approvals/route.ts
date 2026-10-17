import { z } from "zod";
import { createApproval, listApprovals } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";

const Status = z.enum(["pending", "executed", "failed", "skipped", "undone"]).optional();

export const GET = handler(async (req, outlet) => {
  const status = Status.parse(new URL(req.url).searchParams.get("status") ?? undefined);
  return (await listApprovals(outlet.id, status)).map(approvalDTO);
});

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("dispute"), title: z.string(), summary: z.string().default(""), payload: z.object({ platform: z.enum(["zomato", "swiggy"]), orderId: z.string(), amount: z.number().positive(), reason: z.string().min(5) }) }),
  z.object({ kind: z.literal("promo"), title: z.string(), summary: z.string().default(""), payload: z.object({ platform: z.enum(["zomato", "swiggy"]), offer: z.string(), window: z.string(), spendCap: z.number().positive(), expectedOrders: z.number().int().min(0) }) }),
]);

export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  const body = Body.parse(await req.json());
  return approvalDTO(await createApproval(outlet.id, { agent: body.kind === "dispute" ? "finance" : "growth", ...body }));
});
