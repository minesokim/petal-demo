// Replicate the app's /api/agent path for the failing SALT question: does the unified agent
// call tax_research and ground the answer, or answer from its stale prior (or error)?
// Stub `server-only` (the agent's write tools pull it in transitively via firm-files), which
// otherwise throws outside an RSC build.
import Module from "node:module";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const orig = (Module as any)._load;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._load = function (request: string, ...args: any[]) {
  if (request === "server-only") return {};
  return orig.apply(this, [request, ...args]);
};

const { runAgent } = await import("../lib/agent/runner");

async function ask(q: string, scope: "real" | "synthetic") {
  const steps: string[] = [];
  try {
    const r = await runAgent(q, [], { scope, onEvent: (e) => steps.push(e.label) });
    console.log(`\n=== scope=${scope} ===`);
    console.log("STEPS:", steps.join(" → ") || "(none)");
    console.log("usedTaxResearch:", steps.some((s) => /research/i.test(s)));
    console.log("REPLY:", r.reply.slice(0, 600));
  } catch (e) {
    console.log(`\n=== scope=${scope} ERRORED ===`);
    console.log("ERROR:", e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  }
}

const Q = "What is the SALT deduction cap for a married couple with $540,000 of MAGI in tax year 2026?";
await ask(Q, "synthetic"); // does the agent ground SALT when the gate clears?
