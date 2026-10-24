import "server-only";

// SMS through MSG91 (DLT-registered templates, as Indian SMS requires), the fallback when WhatsApp can't
// reach a number. Configure MSG91_AUTH_KEY plus one template ID per message kind:
//   MSG91_OTP_TEMPLATE   variables: otp
//   MSG91_ORDER_TEMPLATE variables: shop, update, link
// Without them, sendSms returns false and nothing is sent.

export type SmsKind = "otp" | "order";
const TEMPLATE: Record<SmsKind, string | undefined> = { otp: process.env.MSG91_OTP_TEMPLATE, order: process.env.MSG91_ORDER_TEMPLATE };

export const smsConfigured = (kind: SmsKind) => !!(process.env.MSG91_AUTH_KEY && TEMPLATE[kind]);

/** Sends one templated SMS. Returns whether MSG91 accepted it. */
export async function sendSms(phone: string, kind: SmsKind, vars: Record<string, string>): Promise<boolean> {
  if (!smsConfigured(kind)) return false;
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ template_id: TEMPLATE[kind], short_url: "0", recipients: [{ mobiles: phone.replace(/\D/g, ""), ...vars }] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
