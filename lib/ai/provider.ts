import type { z } from "zod";

// The AI seam. One method: produce a schema-validated object. No LangChain.
// Implementations: MockProvider (tests) and AnthropicProvider (runtime, ZDR).
export type GenerateArgs<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  model?: string;
  maxTokens?: number;
  /** cost-meter tag for this call (e.g. "research:reason"); defaults to the method name. */
  operation?: string;
  /** Per-call reasoning effort for reasoning models (GPT-5.x). Absent ⇒ the provider's default effort.
   * A LATENCY lever: a narrow, structured, rubric-bound call (faithfulness labeling, a binary freshness
   * verdict) does NOT need the proposer's full reasoning budget. Lowering it changes SPEED, not the
   * abstention semantics — the grounding GATE is deterministic code (deriveTier), not the model's effort. */
  effort?: "low" | "medium" | "high";
};

// Plain-text completion seam (the assistant chat). Same provider, no schema:
// returns the model's text reply. Implementations redact the prompt body before
// it leaves the process, same as generateObject.
export type GenerateTextArgs = {
  system: string;
  /** the user's latest message */
  prompt: string;
  /** prior turns for context (already plain text; redacted by the impl) */
  history?: { role: "user" | "assistant"; content: string }[];
  model?: string;
  maxTokens?: number;
  /** cost-meter tag for this call; defaults to the method name. */
  operation?: string;
};

// Document-analysis seam (Ask Petal drag-drop). Sends a document/image block + a
// prompt and returns the model's analysis. The CALLER must pass the §7216 gate
// (assertCleared) before invoking this — a document is real taxpayer data.
export type AnalyzeDocumentArgs = {
  system: string;
  prompt: string;
  /** the file bytes, base64-encoded */
  base64: string;
  /** "application/pdf" | "image/png" | "image/jpeg" | "image/webp" | "image/gif" */
  mediaType: string;
  model?: string;
  maxTokens?: number;
  /** cost-meter tag for this call; defaults to the method name. */
  operation?: string;
};

export interface AIProvider {
  generateObject<T>(args: GenerateArgs<T>): Promise<{ object: T; model: string }>;
  generateText(args: GenerateTextArgs): Promise<{ text: string; model: string }>;
  analyzeDocument(args: AnalyzeDocumentArgs): Promise<{ text: string; model: string }>;
}

// Deterministic provider for tests: responder maps the prompt to a raw object,
// then the schema validates it (so tests exercise the same validation path).
export class MockProvider implements AIProvider {
  constructor(
    private responder: (args: { system: string; prompt: string }) => unknown,
    /** optional plain-text responder for generateText; defaults to echoing the prompt */
    private textResponder?: (args: { system: string; prompt: string }) => string,
  ) {}
  async generateObject<T>(args: GenerateArgs<T>) {
    const raw = this.responder({ system: args.system, prompt: args.prompt });
    return { object: args.schema.parse(raw), model: "mock" };
  }
  async generateText(args: GenerateTextArgs) {
    const text = this.textResponder
      ? this.textResponder({ system: args.system, prompt: args.prompt })
      : args.prompt;
    return { text, model: "mock" };
  }
  async analyzeDocument(args: AnalyzeDocumentArgs) {
    const text = this.textResponder
      ? this.textResponder({ system: args.system, prompt: args.prompt })
      : `Analyzed ${args.mediaType} document.`;
    return { text, model: "mock" };
  }
}
