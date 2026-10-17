import { removeTable } from "@/lib/server/dining";
import { assertWritable, handler } from "@/lib/server/http";

export const DELETE = handler<{ id: string }>(async (_req, outlet, { id }) => {
  assertWritable(outlet);
  return removeTable(outlet.id, id);
});
