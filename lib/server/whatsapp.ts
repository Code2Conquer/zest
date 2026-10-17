import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { notifications, outlets } from "./schema";

/**
 * Sends a WhatsApp message through the Meta Cloud API when WHATSAPP_TOKEN and
 * WHATSAPP_PHONE_NUMBER_ID are set. Messages outside a 24-hour customer window
 * must use a pre-approved template (WHATSAPP_TEMPLATE, one text parameter).
 * Without credentials, messages are kept in the outbox as "queued".
 */
export async function notify(outletId: string, kind: string, body: string, to?: string) {
  const [outlet] = await db.select().from(outlets).where(eq(outlets.id, outletId));
  // Owner updates follow the owner's WhatsApp switch; a message to a guest is sent because staff asked for it.
  if (!outlet || (!to && !outlet.whatsapp)) return null;
  const phone = to ?? outlet.ownerPhone;

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const [row] = await db.insert(notifications).values({ outletId, kind, body, status: "queued" }).returning();

  if (!token || !phoneId || !phone) {
    const why = !phone ? "No phone number on file." : "WhatsApp isn't configured on this server.";
    await db.update(notifications).set({ error: why }).where(eq(notifications.id, row.id));
    return { ...row, error: why };
  }

  const template = process.env.WHATSAPP_TEMPLATE;
  const message = template
    ? { type: "template", template: { name: template, language: { code: outlet.lang === "hi" ? "hi" : "en" }, components: [{ type: "body", parameters: [{ type: "text", text: body }] }] } }
    : { type: "text", text: { body } };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace(/\D/g, ""), ...message }),
    });
    if (!res.ok) throw new Error(`WhatsApp API returned ${res.status}`);
    const [sent] = await db.update(notifications).set({ status: "sent", sentAt: new Date().toISOString() }).where(eq(notifications.id, row.id)).returning();
    return sent;
  } catch (err) {
    const [failed] = await db.update(notifications).set({ status: "failed", error: (err as Error).message }).where(eq(notifications.id, row.id)).returning();
    return failed;
  }
}
