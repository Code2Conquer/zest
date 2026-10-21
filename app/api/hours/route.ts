import { z } from "zod";
import { isTime, overlaps } from "@/lib/hours";
import { CHANNELS } from "@/lib/platforms";
import { audit, HttpError } from "@/lib/server/approvals";
import { getHours, setHours } from "@/lib/server/hours";
import { assertWritable, handler, MANAGERS } from "@/lib/server/http";

const Time = z.string().refine(isTime, "Use 24-hour time, like 09:30 or 23:00.");
const Body = z.object({
  weekly: z.array(z.object({ weekday: z.number().int().min(0).max(6), opens: Time, closes: Time, channel: z.enum(CHANNELS as [string, ...string[]]).nullable().optional() })).max(70),
  special: z
    .array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), closed: z.boolean(), opens: Time.optional(), closes: Time.optional(), note: z.string().max(80).optional() }))
    .max(100),
});

export const GET = handler({ staff: true }, async (_req, outlet) => getHours(outlet.id));

/** Replaces the weekly hours and special dates. */
export const PUT = handler({ roles: MANAGERS }, async (req, outlet, _p, session) => {
  assertWritable(outlet);
  const body = Body.parse(await req.json());
  const weekly = body.weekly.map((h) => ({ ...h, channel: (h.channel ?? null) as never }));
  if (overlaps(weekly)) throw new HttpError(400, "Two spans on the same day overlap. Adjust one of them.");
  if (body.special.some((s) => !s.closed && (!s.opens || !s.closes))) throw new HttpError(400, "A special date that isn't closed needs opening and closing times.");
  await setHours(outlet.id, weekly, body.special);
  await audit(outlet.id, session ? `user:${session.user.id}` : "owner", "hours.updated", { spans: weekly.length, special: body.special.length });
  return getHours(outlet.id);
});
