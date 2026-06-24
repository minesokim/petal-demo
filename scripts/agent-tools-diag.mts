// Reproduce the /api/agent crash: build the agent's tool schemas exactly as runner.ts does and
// make the real Anthropic tools call. If a tool's input_schema is rejected we see the exact error
// + can bisect which tool. Run: node --env-file=.env.local --import tsx scripts/agent-tools-diag.mts
import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// Replicated tool schemas (same shapes as lib/agent/tools/*). Keep in sync with the real ones.
const schemas: Record<string, z.ZodTypeAny> = {
  list_clients: z.object({}),
  list_tasks: z.object({}),
  find_client: z.object({ query: z.string().min(1) }),
  get_client_detail: z.object({ householdId: z.string().min(1) }),
  tax_research: z.object({
    question: z.string().min(1),
    taxYear: z.number().int().min(2020).max(2030).optional(),
    jurisdiction: z.enum(["federal", "CA"]).optional(),
  }),
  tax_compute: z.object({
    worksheet: z.string().min(1),
    facts: z.record(z.unknown()),
    taxYear: z.number().int().min(2020).max(2030).optional(),
  }),
  draft_email: z.object({
    householdId: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().min(1),
    goal: z.string().min(1),
  }),
  send_sms: z.object({ householdId: z.string(), body: z.string().min(1).max(1600) }),
  send_email: z.object({
    householdId: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  create_client: z.object({
    name: z.string(),
    kind: z.enum(["individual", "business", "mixed"]),
    serviceTier: z.enum(["Basic", "Standard", "Premium"]).default("Standard"),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
  }),
};

const tools = Object.entries(schemas).map(([name, s]) => ({
  name,
  description: name,
  input_schema: zodToJsonSchema(s, { target: "openApi3" }) as Anthropic.Tool.InputSchema,
}));

// 1) Flag any tool whose top-level isn't a clean {type:"object"} (what Anthropic requires).
for (const t of tools) {
  const sch = t.input_schema as Record<string, unknown>;
  const ok = sch.type === "object" && !("$ref" in sch);
  if (!ok) console.log(`SUSPECT ${t.name}: top-level =`, JSON.stringify(sch).slice(0, 200));
}

// 2) Make the real call (model + tools), exactly like the runner.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
try {
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: "test",
    tools,
    messages: [{ role: "user", content: "hi" }],
  });
  console.log("OK — call succeeded, stop_reason:", res.stop_reason);
} catch (e: unknown) {
  const err = e as { status?: number; message?: string };
  console.log("CALL FAILED status", err.status, "→", (err.message || String(e)).slice(0, 600));
}
