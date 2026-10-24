import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { runCopilot } from "@/lib/server/copilot";
import { openStructured } from "@/lib/server/open-llm";
import { freshOutlet } from "../helpers";

// The open-model path (Groq or any OpenAI-compatible API), with the API mocked.

const reply = (message: unknown) => new Response(JSON.stringify({ choices: [{ message, finish_reason: "stop" }] }), { status: 200 });

describe("open models", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("runs the assistant's tool loop: look something up, then answer", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("LLM_API_KEY", "test");
    const calls: { tools?: unknown[]; messages: { role: string }[] }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        calls.push(body);
        return calls.length === 1
          ? reply({ content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "get_menu", arguments: "{}" } }] })
          : reply({ content: "You have 0 dishes on the menu right now." });
      }),
    );
    const o = await freshOutlet();
    const r = await runCopilot(o, "What's on my menu?", "en");
    expect(r.engine).toBe("open");
    expect(r.text).toContain("dishes");
    expect(calls).toHaveLength(2);
    expect(calls[0].tools?.length).toBeGreaterThan(3);
    expect(calls[1].messages.at(-1)?.role).toBe("tool");
  });

  it("checks structured answers against the schema", async () => {
    vi.stubEnv("LLM_API_KEY", "test");
    const schema = z.object({ items: z.array(z.object({ name: z.string(), price: z.number() })) });
    vi.stubGlobal("fetch", vi.fn(async () => reply({ content: JSON.stringify({ items: [{ name: "Thali", price: 120 }] }) })));
    expect(await openStructured(schema, "read this")).toEqual({ items: [{ name: "Thali", price: 120 }] });
    vi.stubGlobal("fetch", vi.fn(async () => reply({ content: '{"items":[{"name":"Thali"}]}' })));
    expect(await openStructured(schema, "read this")).toBeNull();
  });
});
