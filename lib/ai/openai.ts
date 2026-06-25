import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { AIProvider, GenerateArgs, GenerateTextArgs, AnalyzeDocumentArgs } from "./provider";
import { redactText } from "./redact";

// DEV-ONLY OpenAI-compatible provider, for running Petal's AI on a GPT-5.5 endpoint during LOCAL
// development (e.g. a Codex-subscription proxy that exposes http://127.0.0.1:PORT/v1). It is
// selected ONLY by the provider factory under a dev flag and can NEVER be constructed in prod (the
// factory throws). It is NOT a ZDR/BAA surface, so:
//   - it must only ever see SYNTHETIC/demo data (the factory + §7216 gate enforce dev-only),
//   - assertZdrModel is intentionally NOT called here (gpt-5.5 is not an Anthropic ZDR model; the
//     safety boundary for this provider is "dev + synthetic only", not the ZDR allowlist),
//   - the prompt is still redacted before it leaves the process, same as the Anthropic provider
//     (defense in depth on a consumer endpoint).
//
// Mirrors AnthropicProvider's shape exactly: forced-tool generateObject (an "emit" function, like
// the Anthropic "emit" tool), plain generateText, and image analyzeDocument. GPT-5.5 is a reasoning
// model, so we use max_completion_tokens + reasoning_effort and omit temperature.
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  constructor(
    private baseURL = process.env.PETAL_DEV_OPENAI_BASE_URL ?? "http://127.0.0.1:8317/v1",
    private defaultModel = process.env.PETAL_DEV_OPENAI_MODEL ?? "gpt-5.5",
    private reasoningEffort = process.env.PETAL_DEV_OPENAI_REASONING ?? "high",
  ) {
    // §7216 defense in depth: this is a non-ZDR consumer endpoint, so it must NEVER exist on the
    // DEPLOYED server (where real client data lives) — independent of the provider factory's guard.
    // Allowed locally (incl. a local production build) for synthetic-data evaluation only.
    if (!!process.env.VERCEL || process.env.PETAL_DEPLOYED === "1") {
      throw new Error(
        "OpenAIProvider is a non-ZDR eval provider and must never be constructed on the deployed " +
          "server (§7216: no taxpayer data to a non-ZDR/uncleared path). It is allowed only locally.",
      );
    }
    // The proxy holds the real auth (a Codex OAuth token); the SDK still needs a non-empty key.
    this.client = new OpenAI({ baseURL, apiKey: process.env.PETAL_DEV_OPENAI_KEY ?? "codex-proxy" });
  }

  private params(extra: Record<string, unknown>) {
    // reasoning_effort is valid for GPT-5.x reasoning models; cast keeps tsc happy across SDK minors.
    return { reasoning_effort: this.reasoningEffort, ...extra } as never;
  }

  async generateObject<T>(args: GenerateArgs<T>) {
    const model = args.model ?? this.defaultModel;
    const parameters = zodToJsonSchema(args.schema, { target: "openApi3" }) as Record<string, unknown>;
    const res = await this.client.chat.completions.create(this.params({
      model,
      max_completion_tokens: args.maxTokens ?? 1024,
      messages: [
        { role: "system", content: redactText(args.system) },
        { role: "user", content: redactText(args.prompt) },
      ],
      tools: [{ type: "function", function: { name: "emit", description: "Return the structured result.", parameters } }],
      tool_choice: { type: "function", function: { name: "emit" } },
    }));
    const call = res.choices[0]?.message?.tool_calls?.[0];
    if (!call || call.type !== "function") throw new Error("no function tool_call in OpenAI response");
    let raw: unknown;
    try {
      raw = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("OpenAI emit tool returned non-JSON arguments (proxy/model degraded structured output)");
    }
    return { object: args.schema.parse(raw), model };
  }

  async generateText(args: GenerateTextArgs) {
    const model = args.model ?? this.defaultModel;
    const history = (args.history ?? []).map((m) => ({ role: m.role, content: redactText(m.content) }));
    const res = await this.client.chat.completions.create(this.params({
      model,
      max_completion_tokens: args.maxTokens ?? 1024,
      messages: [
        { role: "system", content: redactText(args.system) },
        ...history,
        { role: "user", content: redactText(args.prompt) },
      ],
    }));
    return { text: (res.choices[0]?.message?.content ?? "").trim(), model };
  }

  async analyzeDocument(args: AnalyzeDocumentArgs) {
    const model = args.model ?? this.defaultModel;
    // Chat-completions vision takes images as data URIs. PDFs are not supported on this dev path;
    // real documents are taxpayer data and must use the Anthropic (ZDR) provider anyway.
    if (!args.mediaType.startsWith("image/")) {
      throw new Error(`OpenAI dev provider supports image documents only (got ${args.mediaType}); use the Anthropic provider for PDFs / real documents.`);
    }
    const res = await this.client.chat.completions.create(this.params({
      model,
      max_completion_tokens: args.maxTokens ?? 1500,
      messages: [
        { role: "system", content: redactText(args.system) },
        {
          role: "user",
          content: [
            { type: "text", text: redactText(args.prompt) },
            { type: "image_url", image_url: { url: `data:${args.mediaType};base64,${args.base64}` } },
          ],
        },
      ],
    }));
    return { text: (res.choices[0]?.message?.content ?? "").trim(), model };
  }
}
