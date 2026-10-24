import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Which AI runs Zest's smart parts (menu photos, documents, the assistant, review drafts, payout emails):
//   "claude" when ANTHROPIC_API_KEY is set;
//   "open"   when LLM_API_KEY is set: any OpenAI-compatible endpoint serving open models (lib/server/open-llm.ts),
//            Groq's free tier by default;
//   null     otherwise: the assistant answers from its own rules and photo reading is off.

export const MODEL = process.env.ZEST_MODEL ?? "claude-opus-5-5";

export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ZEST_USE_CLAUDE === "1");
}

export type AIProvider = "claude" | "open";
export function aiProvider(): AIProvider | null {
  if (hasClaude()) return "claude";
  if (process.env.LLM_API_KEY) return "open";
  return null;
}
export const hasAI = () => aiProvider() !== null;

let client: Anthropic | null = null;
export function claude(): Anthropic {
  return (client ??= new Anthropic());
}

/** Readable message for an AI failure, without leaking request details. */
export function describeAIError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The AI key was rejected.";
  if (err instanceof Anthropic.RateLimitError) return "The AI is busy right now. Try again in a minute.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach the AI service.";
  if (err instanceof Anthropic.APIError) return `The AI service returned an error (${err.status}).`;
  const m = (err as Error)?.message ?? "";
  if (/429|rate/i.test(m)) return "The AI is busy right now. Try again in a minute.";
  if (/401|403/.test(m)) return "The AI key was rejected.";
  return "Something went wrong talking to the AI.";
}
