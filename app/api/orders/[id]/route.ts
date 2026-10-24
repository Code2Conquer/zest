import { z } from "zod";
import { assertWritable, handler } from "@/lib/server/http";
import { advanceOrder } from "@/lib/server/order-actions";
import { orderDTO } from "@/lib/server/queries";

const Body = z.object({ action: z.enum(["accept", "reject", "prepare", "ready", "dispatch", "complete", "paid"]) });

/** Staff move a website, WhatsApp or phone order along, or record that it's paid. */
export const PATCH = handler<{ id: string }>({ roles: ["owner", "manager", "cashier", "kitchen"] }, async (req, outlet, { id }, session) => {
  assertWritable(outlet, { sample: true });
  const { action } = Body.parse(await req.json());
  return orderDTO(await advanceOrder(outlet.id, id, action, session ? `user:${session.user.id}` : "owner"));
});
