import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatHistory, runCopilot } from "@/lib/server/copilot";
import { db } from "@/lib/server/db";
import { handler } from "@/lib/server/http";
import { chatMessages } from "@/lib/server/schema";

export const maxDuration = 120;

export const GET = handler(async (_req, outlet) => chatHistory(outlet.id));

const Body = z.object({ message: z.string().trim().min(1).max(2000), lang: z.enum(["en", "hi"]).default("en") });

export const POST = handler(async (req, outlet) => {
  const { message, lang } = Body.parse(await req.json());
  return runCopilot(outlet, message, lang);
});

/** Clears the conversation. */
export const DELETE = handler(async (_req, outlet) => {
  await db.delete(chatMessages).where(eq(chatMessages.outletId, outlet.id));
  return { ok: true };
});
