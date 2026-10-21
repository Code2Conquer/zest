import { handler, MANAGERS } from "@/lib/server/http";
import { getToday } from "@/lib/server/queries";
import { notify } from "@/lib/server/whatsapp";

/** The 8 am WhatsApp summary. Call from a scheduler once a day per outlet. */
export const POST = handler({ roles: MANAGERS }, async (_req, outlet) => {
  const t = await getToday(outlet);
  const name = outlet.ownerName || "there";
  const lines = outlet.lang === "hi"
    ? [`सुप्रभात ${name}! कल की बिक्री ₹${t.total.toLocaleString("en-IN")}${t.changePct !== null ? ` (${t.changePct >= 0 ? "+" : ""}${t.changePct}%)` : ""}।`]
    : [`Good morning ${name}! Yesterday you sold ₹${t.total.toLocaleString("en-IN")}${t.changePct !== null ? ` (${t.changePct >= 0 ? "+" : ""}${t.changePct}% on last week)` : ""}.`];
  if (t.nextPayout) lines.push(outlet.lang === "hi" ? `अगला पेआउट ₹${t.nextPayout.net.toLocaleString("en-IN")}, ${t.nextPayout.payDate}।` : `Next payout ₹${t.nextPayout.net.toLocaleString("en-IN")} on ${t.nextPayout.payDate}.`);
  if (t.approvals.length) lines.push(outlet.lang === "hi" ? `${t.approvals.length} चीज़ें आपकी मंज़ूरी का इंतज़ार कर रही हैं।` : `${t.approvals.length} things are waiting for your OK.`);
  const sent = await notify(outlet.id, "daily_summary", lines.join(" "));
  return sent ?? { skipped: "WhatsApp updates are off for this outlet." };
});
