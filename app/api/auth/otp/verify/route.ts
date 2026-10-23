import { z } from "zod";
import { handler } from "@/lib/server/http";
import { verifyOtp } from "@/lib/server/otp";

/** Checks a sign-in code and starts the session. */
export const POST = handler(async (req) => {
  const { phone, code } = z.object({ phone: z.string().max(20), code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code.") }).parse(await req.json());
  return verifyOtp(phone, code);
});
