import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatHistory, runCopilot } from "@/lib/server/copilot";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/approvals";
import { clientIp, handler, MANAGERS } from "@/lib/server/http";
import { checkRate } from "@/lib/server/rate-limit";
import { chatMessages } from "@/lib/server/schema";

// Fits the Vercel Hobby limit; a copilot turn with several tool calls can take a while.
export const maxDuration = 60;

export const GET = handler(async (_req, outlet) => chatHistory(outlet.id));

const Body = z.object({ message: z.string().trim().min(1).max(2000), lang: z.enum(["en", "hi"]).default("en") });

const PER_MINUTE = 20;

export const POST = handler({ roles: MANAGERS }, async (req, outlet) => {
  // The sample restaurant is shared by every visitor, so its limit is per address instead.
  const key = outlet.isDemo ? `copilot:demo:${clientIp(req)}` : `copilot:${outlet.id}`;
  if (!(await checkRate(key, PER_MINUTE, 60))) throw new HttpError(429, "That's a lot of messages in a minute. Give it a moment. / एक मिनट में बहुत सारे मैसेज। थोड़ी देर बाद भेजें।");
  const { message, lang } = Body.parse(await req.json());
  return runCopilot(outlet, message, lang);
});

/** Clears the conversation. */
export const DELETE = handler({ roles: MANAGERS }, async (_req, outlet) => {
  await db.delete(chatMessages).where(eq(chatMessages.outletId, outlet.id));
  return { ok: true };
});
