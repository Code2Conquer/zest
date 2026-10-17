import { z } from "zod";
import { createApproval } from "@/lib/server/approvals";
import { assertWritable, handler } from "@/lib/server/http";
import { approvalDTO } from "@/lib/server/queries";

const Body = z.object({ platforms: z.array(z.enum(["zomato", "swiggy"])).min(1) });

export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  const { platforms } = Body.parse(await req.json());
  const names = platforms.map((p) => (p === "zomato" ? "Zomato" : "Swiggy")).join(" and ");
  return approvalDTO(
    await createApproval(outlet.id, {
      agent: "onboarding",
      kind: "listing_application",
      title: `Apply for listing on ${names}`,
      summary: "Documents are checked and the menu is ready.",
      payload: { platforms },
    }),
  );
});
