import { z } from "zod";
import { addTable } from "@/lib/server/dining";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";

const Body = z.object({ label: z.string().trim().min(1).max(12), seats: z.number().int().min(1).max(30), zone: z.string().trim().min(1).max(30).default("Indoor") });

export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  assertWritable(outlet);
  return addTable(outlet.id, Body.parse(await req.json()));
});
