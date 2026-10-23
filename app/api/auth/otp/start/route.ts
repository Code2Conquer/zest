import { z } from "zod";
import { clientIp, handler } from "@/lib/server/http";
import { startOtp } from "@/lib/server/otp";

/** Sends a sign-in code to a mobile number. */
export const POST = handler(async (req) => startOtp(z.object({ phone: z.string().max(20) }).parse(await req.json()).phone, clientIp(req)));
