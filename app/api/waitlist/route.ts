import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { HttpError } from "@/lib/server/approvals";
import { db } from "@/lib/server/db";
import { clientIp, handler } from "@/lib/server/http";
import { checkRate } from "@/lib/server/rate-limit";
import { soundboxWaitlist, WAITLIST_TYPES } from "@/lib/server/schema";

// The Soundbox waitlist: anyone can join from the website. Errors name the field and say what to fix.

const Body = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  business: z.string().trim().min(1, "Enter your business name").max(120),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      try {
        return normalizePhone(v);
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a 10-digit mobile number" });
        return z.NEVER;
      }
    }),
  city: z.string().trim().min(1, "Enter your city").max(60),
  type: z.enum(WAITLIST_TYPES, { error: "Choose what kind of business you run" }),
  page: z.enum(["/", "/restaurants"]).default("/"),
  section: z.string().trim().max(40).default(""),
});

export const POST = handler(async (req) => {
  if (!(await checkRate(`waitlist:${clientIp(req)}`, 10, 3600))) throw new HttpError(429, "Too many sign-ups from this connection. Try again in an hour.");
  const v = Body.parse(await req.json());
  // Joining twice with the same number is fine: the first sign-up stands.
  await db.insert(soundboxWaitlist).values(v).onConflictDoNothing({ target: soundboxWaitlist.phone });
  return { ok: true };
});
