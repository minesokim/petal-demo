import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { AIProvider, GenerateArgs } from "./provider";
import { redactText } from "./redact";

// Anthropic-direct (no LangChain). ZDR + no-training are contractual at the
// account/DPA level; here we enforce data-minimization (redact the prompt) and
// force a single tool so the output is always schema-shaped.
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  constructor(apiKey = process.env.ANTHROPIC_API_KEY, private defaultModel = "claude-opus-4-8") {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async generateObject<T>(args: GenerateArgs<T>) {
    const model = args.model ?? this.defaultModel;
    const inputSchema = zodToJsonSchema(args.schema, { target: "openApi3" }) as Record<string, unknown>;
    const res = await this.client.messages.create({
      model,
      max_tokens: args.maxTokens ?? 1024,
      system: redactText(args.system),
      messages: [{ role: "user", content: redactText(args.prompt) }],
      tools: [{ name: "emit", description: "Return the structured result.", input_schema: inputSchema as never }],
      tool_choice: { type: "tool", name: "emit" },
    });
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use block in response");
    return { object: args.schema.parse(block.input), model };
  }
}
