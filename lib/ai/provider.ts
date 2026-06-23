import type { z } from "zod";

// The AI seam. One method: produce a schema-validated object. No LangChain.
// Implementations: MockProvider (tests) and AnthropicProvider (runtime, ZDR).
export type GenerateArgs<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  model?: string;
  maxTokens?: number;
};

export interface AIProvider {
  generateObject<T>(args: GenerateArgs<T>): Promise<{ object: T; model: string }>;
}

// Deterministic provider for tests: responder maps the prompt to a raw object,
// then the schema validates it (so tests exercise the same validation path).
export class MockProvider implements AIProvider {
  constructor(private responder: (args: { system: string; prompt: string }) => unknown) {}
  async generateObject<T>(args: GenerateArgs<T>) {
    const raw = this.responder({ system: args.system, prompt: args.prompt });
    return { object: args.schema.parse(raw), model: "mock" };
  }
}
