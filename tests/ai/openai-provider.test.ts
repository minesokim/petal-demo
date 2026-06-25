import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock the OpenAI SDK so we exercise the provider's request shaping + response parsing without a
// network call. The dev provider mirrors AnthropicProvider: forced "emit" function for structured
// output, plain content for text, images only for documents.
const createMock = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: createMock } };
    constructor(_opts: unknown) {}
  },
}));

import { OpenAIProvider } from "../../lib/ai/openai";

beforeEach(() => createMock.mockReset());

describe("OpenAIProvider (dev Codex-proxy)", () => {
  it("generateObject forces the emit tool + reasoning_effort and parses its arguments", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { tool_calls: [{ type: "function", function: { name: "emit", arguments: JSON.stringify({ answer: "42" }) } }] } }],
    });
    const p = new OpenAIProvider("http://127.0.0.1:8317/v1", "gpt-5.5", "high");
    const { object, model } = await p.generateObject({ system: "s", prompt: "p", schema: z.object({ answer: z.string() }) });
    expect(object).toEqual({ answer: "42" });
    expect(model).toBe("gpt-5.5");
    const sent = createMock.mock.calls[0][0];
    expect(sent.tool_choice).toEqual({ type: "function", function: { name: "emit" } });
    expect(sent.reasoning_effort).toBe("high");
    expect(sent.max_completion_tokens).toBeGreaterThan(0);
  });

  it("generateText returns the message content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "hello world" } }] });
    const p = new OpenAIProvider("http://127.0.0.1:8317/v1", "gpt-5.5", "high");
    const { text } = await p.generateText({ system: "s", prompt: "p" });
    expect(text).toBe("hello world");
  });

  it("generateObject throws a clear error when the proxy returns non-JSON args (degraded structured output)", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { tool_calls: [{ type: "function", function: { name: "emit", arguments: "not-json{" } }] } }] });
    const p = new OpenAIProvider("http://127.0.0.1:8317/v1", "gpt-5.5", "high");
    await expect(p.generateObject({ system: "s", prompt: "p", schema: z.object({ answer: z.string() }) }))
      .rejects.toThrow(/degraded structured output/);
  });

  it("analyzeDocument refuses PDFs (real-doc path stays on Anthropic)", async () => {
    const p = new OpenAIProvider("http://127.0.0.1:8317/v1", "gpt-5.5", "high");
    await expect(p.analyzeDocument({ system: "s", prompt: "p", base64: "x", mediaType: "application/pdf" }))
      .rejects.toThrow(/image documents only/);
  });
});
