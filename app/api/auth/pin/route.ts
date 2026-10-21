import { z } from "zod";
import { handler } from "@/lib/server/http";
import { pinSignIn } from "@/lib/server/staff";

const Body = z.object({ code: z.string().trim().min(4).max(12), pin: z.string().trim() });

/** Staff sign-in on the restaurant's device: restaurant code and 4-digit PIN. */
export const POST = handler(async (req) => {
  const { code, pin } = Body.parse(await req.json());
  const s = await pinSignIn(code, pin);
  return { name: s.user.name, role: s.membership.role, outlet: s.outlet.name };
});
