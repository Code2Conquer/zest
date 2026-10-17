import { NextResponse } from "next/server";
import { z } from "zod";
import { handler } from "@/lib/server/http";
import { ingestEmail } from "@/lib/server/ingest";

// Reading with Claude can take tens of seconds; fits the Vercel Hobby limit.
export const maxDuration = 60;

const Body = z.object({ from: z.string().min(3), subject: z.string(), text: z.string().max(200_000), receivedAt: z.string().optional() });

/**
 * Inbound mail for the current outlet: Gmail/Outlook push handlers, a mail
 * forwarding rule, or a manual paste. Protected by INGEST_SECRET when set.
 */
export const POST = handler(async (req, outlet) => {
  const secret = process.env.INGEST_SECRET;
  if (secret && req.headers.get("x-ingest-secret") !== secret) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  return ingestEmail(outlet.id, Body.parse(await req.json()));
});
