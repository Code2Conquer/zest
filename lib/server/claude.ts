import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ZEST_MODEL ?? "claude-opus-5-5";

/**
 * True when the server has Claude credentials. Without them the copilot falls
 * back to keyword routing and document reading is unavailable.
 */
export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ZEST_USE_CLAUDE === "1");
}

let client: Anthropic | null = null;
export function claude(): Anthropic {
  return (client ??= new Anthropic());
}

/** Readable message for an API failure, without leaking request details. */
export function describeClaudeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Claude API key was rejected.";
  if (err instanceof Anthropic.RateLimitError) return "Claude is rate-limited right now. Try again in a minute.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach Claude.";
  if (err instanceof Anthropic.APIError) return `Claude returned an error (${err.status}).`;
  return "Something went wrong talking to Claude.";
}
