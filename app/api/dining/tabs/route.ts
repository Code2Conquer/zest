import { z } from "zod";
import { seat } from "@/lib/server/dining";
import { assertWritable, handler } from "@/lib/server/http";

const Body = z.object({
  tableId: z.string().min(1),
  partyName: z.string().trim().max(60).default(""),
  partySize: z.number().int().min(1).max(40),
  reservationId: z.string().optional(),
});

/** Seats a party and opens the table's bill. */
export const POST = handler(async (req, outlet) => {
  assertWritable(outlet);
  return seat(outlet.id, Body.parse(await req.json()));
});
