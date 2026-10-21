import { signOut } from "@/lib/server/auth";
import { handler } from "@/lib/server/http";

export const POST = handler({ staff: true }, async () => {
  await signOut();
  return { ok: true };
});
