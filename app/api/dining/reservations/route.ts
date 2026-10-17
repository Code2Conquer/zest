import { z } from "zod";
import { addReservation } from "@/lib/server/dining";
import { assertWritable, handler } from "@/lib/server/http";

const Body = z.object({
  kind: z.enum(["booking", "waitlist"]),
  name: z.string().trim().min(1, "Enter the guest's name").max(60),
  phone: z.string().trim().regex(/^\+?[\d\s-]{10,15}$/, "Enter a valid phone number").nullable().default(null),
  partySize: z.number().int().min(1).max(40),
  at: z.string().datetime().optional(),
  quotedMins: z.number().int().min(0).max(180).optional(),
  tableId: z.string().nullable().optional(),
  note: z.string().trim().max(200).optional(),
});

export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  return addReservation(outlet.id, Body.parse(await req.json()));
});
