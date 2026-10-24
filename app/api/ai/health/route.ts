import { NextResponse } from "next/server";
import { aiProvider, MODEL } from "@/lib/server/claude";
import { ready } from "@/lib/server/db";
import { clientIp } from "@/lib/server/http";
import { openBase, openChat, openModel, openVisionModel } from "@/lib/server/open-llm";
import { checkRate } from "@/lib/server/rate-limit";

// A 64×64 red PNG (vision models want at least 32 pixels a side).
const RED_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAb0lEQVR4nO3PAQkAAAyEwO9feoshgnABdLep8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3IPanc8OLDQitxAAAAAElFTkSuQmCC";

/**
 * Is the AI working? Names the provider, endpoint host and models (never the key), and makes one tiny call.
 * Limited to a few checks an hour per connection, so it can't be used to spend the AI quota.
 */
export async function GET(req: Request) {
  await ready();
  if (!(await checkRate(`ai-health:${process.env.VERCEL_GIT_COMMIT_SHA ?? "local"}:${clientIp(req)}`, 5, 3600))) return NextResponse.json({ error: "Checked too often. Try again later." }, { status: 429 });
  const provider = aiProvider();
  if (provider !== "open") return NextResponse.json({ provider, model: provider === "claude" ? MODEL : null });
  const info = { provider, host: new URL(openBase()).host, model: openModel(), visionModel: openVisionModel() };
  try {
    const msg = await openChat({ messages: [{ role: "user", content: "Reply with the single word: ok" }], max_tokens: 50 });
    // And a photo: a small red square, which the vision model should name.
    const vision = await openChat({ model: openVisionModel(), max_tokens: 50, messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: RED_PNG } }, { type: "text", text: "What colour is this image? One word." }] }] }).then(
      (m) => ({ ok: true, reply: m.content }),
      (e: Error) => ({ ok: false, error: e.message.slice(0, 300) }),
    );
    return NextResponse.json({ ...info, ok: true, reply: msg.content, vision });
  } catch (err) {
    // When a model is missing, list what this key can use.
    const models = await fetch(`${openBase()}/models`, { headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}` } })
      .then((r) => r.json() as Promise<{ data?: { id: string; active?: boolean }[] }>)
      .then((d) => (d.data ?? []).filter((m) => m.active !== false).map((m) => m.id).sort())
      .catch(() => []);
    return NextResponse.json({ ...info, ok: false, available: models, error: (err as Error).message.replace(/(sk|gsk|key)[-_][A-Za-z0-9]{8,}/g, "[key]") });
  }
}
