import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { AIProvider, GenerateArgs, GenerateTextArgs, AnalyzeDocumentArgs } from "./provider";
import { redactText } from "./redact";
import { assertZdrModel } from "./guard";

// Anthropic-direct (no LangChain). ZDR + no-training are contractual at the
// account/DPA level; here we enforce data-minimization (redact the prompt),
// force a single tool so the output is always schema-shaped, and HARD-reject any
// model not on the ZDR allowlist (assertZdrModel) before a prompt is built.
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  constructor(apiKey = process.env.ANTHROPIC_API_KEY, private defaultModel = "claude-opus-4-8") {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    // Reject a non-ZDR default at construction so it can never become the
    // fallback model for a call that omits args.model.
    assertZdrModel(defaultModel);
    this.client = new Anthropic({ apiKey });
  }

  async generateObject<T>(args: GenerateArgs<T>) {
    const model = args.model ?? this.defaultModel;
    // HARD ZDR allowlist: throw on any non-ZDR model (e.g. Fable/Mythos) before
    // we build or send a prompt. Centralized allowlist lives in ./guard.
    assertZdrModel(model);
    const inputSchema = zodToJsonSchema(args.schema, { target: "openApi3" }) as Record<string, unknown>;
    const res = await this.client.messages.create({
      model,
      max_tokens: args.maxTokens ?? 1024,
      // Prompt caching: the (static) reasoning system prompt repeats across research calls; an
      // ephemeral breakpoint caches it (no-op below the cache minimum, so always safe). ZDR-safe.
      system: [{ type: "text", text: redactText(args.system), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: redactText(args.prompt) }],
      tools: [{ name: "emit", description: "Return the structured result.", input_schema: inputSchema as never }],
      tool_choice: { type: "tool", name: "emit" },
    });
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use block in response");
    return { object: args.schema.parse(block.input), model };
  }

  // Plain-text completion for the assistant chat. Data-minimization: redact the
  // system, the user's message, AND every prior turn before they leave the
  // process. General Q&A only — no client records are injected here, and the
  // §7216 PII guard lives in the system prompt the caller passes in.
  async generateText(args: GenerateTextArgs) {
    const model = args.model ?? this.defaultModel;
    // HARD ZDR allowlist: same gate as generateObject — no non-ZDR model carries
    // a prompt (system, user, or any prior turn) out of the process.
    assertZdrModel(model);
    const history = (args.history ?? []).map((m) => ({
      role: m.role,
      content: redactText(m.content),
    }));
    const res = await this.client.messages.create({
      model,
      max_tokens: args.maxTokens ?? 1024,
      // Prompt caching for the (static) assistant system prompt; no-op below the cache minimum.
      system: [{ type: "text", text: redactText(args.system), cache_control: { type: "ephemeral" } }],
      messages: [...history, { role: "user", content: redactText(args.prompt) }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { text, model };
  }

  // Analyze a dropped document (Ask Petal). The bytes go to the model as a native
  // document/image block — there is no text to redact, so the §7216 gate
  // (assertCleared, enforced by the CALLER) is the control that this only runs on
  // cleared data. ZDR allowlist still applies. Returns the model's analysis text.
  async analyzeDocument(args: AnalyzeDocumentArgs) {
    const model = args.model ?? this.defaultModel;
    assertZdrModel(model);
    const isPdf = args.mediaType === "application/pdf";
    const block = isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: args.base64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: args.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: args.base64 } };
    const res = await this.client.messages.create({
      model,
      max_tokens: args.maxTokens ?? 1500,
      system: redactText(args.system),
      messages: [{ role: "user", content: [block, { type: "text", text: redactText(args.prompt) }] }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { text, model };
  }
}
