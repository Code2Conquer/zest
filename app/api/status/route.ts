import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/server/claude";
import { client, ready } from "@/lib/server/db";
import { gmailConfigured } from "@/lib/server/gmail";
import { googleSigninConfigured } from "@/lib/server/google-signin";
import { otpSenderConfigured } from "@/lib/server/otp";
import { paymentsConfigured } from "@/lib/server/payments";
import { ridersConfigured } from "@/lib/server/riders";
import { smsConfigured } from "@/lib/server/sms";

export const dynamic = "force-dynamic";

/**
 * What's switched on in this deployment, as yes/no only (never a value), and when the daily run last
 * happened. For the team to check setup without opening Vercel.
 */
export async function GET() {
  await ready();
  const set = (...names: string[]) => names.every((n) => !!process.env[n]);
  const rs = await client().execute("SELECT value, updated_at FROM app_state WHERE key = 'last_cron'");
  const last = rs.rows[0] ? { at: String(rs.rows[0].updated_at), result: JSON.parse(String(rs.rows[0].value)) } : null;
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    database: set("DATABASE_URL") ? "turso" : "temporary",
    dailyRun: { secretSet: set("CRON_SECRET"), lastRun: last },
    login: { codesSent: otpSenderConfigured(), whatsapp: set("WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OTP_TEMPLATE"), sms: smsConfigured("otp"), google: googleSigninConfigured(), last4Fallback: !otpSenderConfigured() && process.env.ZEST_LAST4_OTP !== "off" },
    orderMessages: { whatsapp: set("WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE"), sms: smsConfigured("order") },
    payments: paymentsConfigured(),
    paymentWebhook: set("RAZORPAY_WEBHOOK_SECRET"),
    riders: ridersConfigured(),
    ai: aiProvider(),
    gmail: gmailConfigured(),
    analytics: { posthog: set("NEXT_PUBLIC_POSTHOG_KEY") },
    support: { whatsapp: set("NEXT_PUBLIC_SUPPORT_WHATSAPP"), email: set("NEXT_PUBLIC_SUPPORT_EMAIL") },
    appUrl: set("APP_URL"),
  });
}
