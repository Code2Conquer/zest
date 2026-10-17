import { NextResponse } from "next/server";
import { orchestrate, replyLang, type CopilotRequest } from "@/lib/agents";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CopilotRequest>;
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  }
  const req: CopilotRequest = {
    message: body.message,
    lang: body.lang === "hi" ? "hi" : "en",
    live: Array.isArray(body.live) ? body.live.filter((p) => p === "zomato" || p === "swiggy") : [],
  };
  return NextResponse.json({ reply: orchestrate(req), lang: replyLang(req) });
}
