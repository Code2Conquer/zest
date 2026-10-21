import { removeTable } from "@/lib/server/dining";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";

export const DELETE = handler<{ id: string }>({ roles: MANAGERS }, async (_req, outlet, { id }) => {
  assertWritable(outlet);
  return removeTable(outlet.id, id);
});
