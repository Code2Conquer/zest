import { z } from "zod";
import { notifyGuest, setReservationStatus } from "@/lib/server/dining";
import { assertWritable, handler } from "@/lib/server/http";

const Body = z.object({ action: z.enum(["notify", "cancel", "no_show", "restore"]) });

/** Tells a guest their table is ready, or cancels / marks a no-show. */
export const PATCH = handler<{ id: string }>(async (req, outlet, { id }) => {
  assertWritable(outlet);
  const { action } = Body.parse(await req.json());
  if (action === "notify") return notifyGuest(outlet.id, id, outlet.name);
  return setReservationStatus(outlet.id, id, action === "cancel" ? "cancelled" : action === "no_show" ? "no_show" : "booked");
});
