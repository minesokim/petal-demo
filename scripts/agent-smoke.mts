// Smoke test: run the FULL agent loop and report which brain it ran on. With PETAL_DEV_INFERENCE=
// codex-sub (and not deployed) this exercises the codex seam end-to-end — Anthropic-shape loop ↔
// OpenAI proxy tool-calling round-trip. Synthetic scope only.
import { runAgent } from "../lib/agent/runner";
import { usingDevCodexProvider } from "../lib/ai/provider-factory";

const q = process.argv.slice(2).join(" ") || "What is the SALT deduction cap for 2026?";
console.log("brain:", usingDevCodexProvider() ? "GPT-5.5 (codex proxy)" : "Claude Opus (anthropic)");
console.log("Q:", q, "\n");

const r = await runAgent(q, [], { scope: "synthetic" });
console.log("REPLY:\n" + r.reply + "\n");
console.log("citations:", r.citations.map((c) => c.cite).join(" | ") || "(none)");
console.log("calibration:", r.calibration ?? "(n/a)");
console.log("staged actions:", r.proposedActions.map((a) => a.title).join(" | ") || "(none)");
console.log("ungrounded figures:", r.ungroundedFigures?.join(", ") || "(none)");
