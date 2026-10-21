import { z } from "zod";
import { audit } from "@/lib/server/approvals";
import { handler, OWNER } from "@/lib/server/http";
import { addStaff, listStaff } from "@/lib/server/staff";

export const GET = handler({ roles: OWNER }, async (_req, outlet) => ({ staffCode: outlet.staffCode, staff: outlet.brandId ? await listStaff(outlet.brandId) : [] }));

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.enum(["manager", "kitchen", "cashier", "rider"]),
  outletIds: z.array(z.string()).nullable().default(null),
  pin: z.string().trim(),
});

export const POST = handler({ roles: OWNER }, async (req, outlet, _p, session) => {
  const input = Body.parse(await req.json());
  const m = await addStaff(outlet.brandId!, input);
  await audit(outlet.id, `user:${session!.user.id}`, "staff.added", { membershipId: m.id, role: m.role });
  return { id: m.id };
});
