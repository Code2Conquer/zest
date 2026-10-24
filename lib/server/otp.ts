import "server-only";
import { createHash, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { normalizePhone } from "../phone";
import { HttpError } from "./approvals";
import { signInByPhone } from "./auth";
import { db } from "./db";
import { sendSms, smsConfigured } from "./sms";
import { checkRate } from "./rate-limit";
import { otpCodes } from "./schema";

/** Codes are shown on screen instead of sent, on local and preview servers only (never on Vercel production). */
export const devSigninAllowed = () => process.env.VERCEL_ENV !== "production" && (process.env.NODE_ENV !== "production" || process.env.ZEST_DEV_SIGNIN === "1");

// Sign-in by mobile number: a 6-digit code, valid for 10 minutes, five tries. Sent on WhatsApp through
// Meta's authentication template (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_OTP_TEMPLATE). In
// local development, with no sender, the code comes back in the response so the flow can be tried.

const TTL_MS = 10 * 60 * 1000;
const hash = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}:${process.env.ZEST_SECRET_KEY ?? "dev"}`).digest("hex");

/** Codes go out on WhatsApp (an authentication template) and/or SMS (MSG91), whichever is set up. */
const whatsappOtp = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_OTP_TEMPLATE);
export const otpSenderConfigured = () => whatsappOtp() || smsConfigured("otp");
export const phoneSigninAvailable = () => otpSenderConfigured() || devSigninAllowed();

function parsePhone(raw: string) {
  try {
    return normalizePhone(raw);
  } catch {
    throw new HttpError(400, "Enter a 10-digit mobile number.");
  }
}

async function sendOnWhatsApp(phone: string, code: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_OTP_TEMPLATE,
        language: { code: "en" },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
  });
  return res.ok;
}

/** WhatsApp first; SMS when WhatsApp isn't set up or doesn't take it. */
async function sendCode(phone: string, code: string) {
  const sent = (whatsappOtp() && (await sendOnWhatsApp(phone, code).catch(() => false))) || (await sendSms(phone, "otp", { otp: code }));
  if (!sent) throw new HttpError(502, "Couldn't send the code. Try again in a minute.");
}

/** Sends a code to this number. */
export async function startOtp(raw: string, ip: string) {
  const phone = parsePhone(raw);
  if (!(await checkRate(`otp:ip:${ip}`, 10, 3600)) || !(await checkRate(`otp:phone:${phone}`, 5, 3600))) throw new HttpError(429, "Too many codes asked for. Try again in an hour.");
  const live = otpSenderConfigured();
  if (!live && !devSigninAllowed()) throw new HttpError(503, "Mobile sign-in isn't set up on this server yet.");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const row = { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + TTL_MS).toISOString(), attempts: 0 };
  await db.insert(otpCodes).values(row).onConflictDoUpdate({ target: otpCodes.phone, set: row });
  if (live) await sendCode(phone, code);
  return { sent: true, phone, ...(live ? {} : { devCode: code }) };
}

/** Checks the code and signs the person in. */
export async function verifyOtp(raw: string, code: string) {
  const phone = parsePhone(raw);
  const [row] = await db.select().from(otpCodes).where(eq(otpCodes.phone, phone));
  if (!row || new Date(row.expiresAt).getTime() < Date.now()) throw new HttpError(400, "That code has expired. Ask for a new one.");
  if (row.attempts >= 5) throw new HttpError(429, "Too many wrong codes. Ask for a new one.");
  if (row.codeHash !== hash(phone, code.trim())) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.phone, phone));
    throw new HttpError(400, "That code isn't right. Check it and try again.");
  }
  await db.delete(otpCodes).where(eq(otpCodes.phone, phone));
  const session = await signInByPhone(phone);
  return { signedIn: true, hasRestaurant: !!session };
}
