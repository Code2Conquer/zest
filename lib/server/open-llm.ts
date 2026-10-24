import "server-only";
import { z } from "zod";

// Open models through any OpenAI-compatible chat API. Defaults to Groq's free tier:
//   LLM_API_KEY        required (from console.groq.com)
//   LLM_BASE_URL       default https://api.groq.com/openai/v1 (OpenRouter, Together, Cloudflare, Ollama… also work)
//   LLM_MODEL          text and tool use, default llama-3.3-70b-versatile
//   LLM_VISION_MODEL   photos of menus and documents, default meta-llama/llama-4-scout-17b-16e-instruct
// Open models can't read PDFs directly; photos only.

const base = () => (process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
export const openModel = () => process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
export const openVisionModel = () => process.env.LLM_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

export type OpenPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type OpenMessage =
  | { role: "system" | "user"; content: string | OpenPart[] }
  | { role: "assistant"; content: string | null; tool_calls?: OpenToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type OpenToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type OpenTool = { type: "function"; function: { name: string; description: string; parameters: unknown } };

type ChatResponse = { choices: { message: { content: string | null; tool_calls?: OpenToolCall[] }; finish_reason: string }[] };

export async function openChat(body: { model?: string; messages: OpenMessage[]; max_tokens?: number; tools?: OpenTool[]; json?: boolean; temperature?: number }) {
  const res = await fetch(`${base()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: body.model ?? openModel(),
      messages: body.messages,
      max_tokens: body.max_tokens ?? 1024,
      temperature: body.temperature ?? 0.3,
      ...(body.tools?.length ? { tools: body.tools, tool_choice: "auto" } : {}),
      ...(body.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`AI service returned ${res.status}`);
  const data = (await res.json()) as ChatResponse;
  return data.choices[0]?.message ?? { content: null };
}

/** Asks for JSON matching a schema (described to the model), and checks it. Null if the answer doesn't fit. */
export async function openStructured<T extends z.ZodType>(schema: T, prompt: string, image?: { base64: string; mediaType: string }, maxTokens = 4000): Promise<z.infer<T> | null> {
  const shape = JSON.stringify(z.toJSONSchema(schema));
  const content: OpenPart[] = [
    ...(image ? [{ type: "image_url" as const, image_url: { url: `data:${image.mediaType};base64,${image.base64}` } }] : []),
    { type: "text", text: `${prompt}\n\nReply with only a JSON object that matches this JSON Schema:\n${shape}` },
  ];
  const msg = await openChat({ model: image ? openVisionModel() : openModel(), messages: [{ role: "user", content }], max_tokens: maxTokens, json: true, temperature: 0 });
  try {
    const parsed = schema.safeParse(JSON.parse(msg.content ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
