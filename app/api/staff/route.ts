import { z } from "zod";
import { audit } from "@/lib/server/approvals";
import { handler, OWNER } from "@/lib/server/http";
import { addManagerByEmail, addStaff, listStaff } from "@/lib/server/staff";

export const GET = handler({ roles: OWNER }, async (_req, outlet) => ({ staffCode: outlet.staffCode, staff: outlet.brandId ? await listStaff(outlet.brandId) : [] }));

const Outlets = z.array(z.string()).min(1, "Pick at least one outlet, or leave it empty for all.").nullable().default(null);
const Body = z.union([
  // A manager who signs in with Google.
  z.object({ name: z.string().trim().min(1).max(80), role: z.literal("manager"), email: z.string().trim().min(3).max(200), outletIds: Outlets }),
  // Anyone who signs in on the restaurant's device with a PIN.
  z.object({ name: z.string().trim().min(1).max(80), role: z.enum(["manager", "kitchen", "cashier", "rider"]), outletIds: Outlets, pin: z.string().trim() }),
]);

export const POST = handler({ roles: OWNER }, async (req, outlet, _p, session) => {
  const input = Body.parse(await req.json());
  const m = "email" in input ? await addManagerByEmail(outlet.brandId!, input) : await addStaff(outlet.brandId!, input);
  await audit(outlet.id, `user:${session!.user.id}`, "staff.added", { membershipId: m.id, role: m.role });
  return { id: m.id };
});
