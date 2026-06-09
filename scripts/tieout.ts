// Petal OS tie-out — run with: npx -y tsx scripts/tieout.ts
// Renders every displayed aggregate next to its derivation; any mismatch exits 1.

import { tieOutChecks } from "../lib/fixtures/derive";

const checks = tieOutChecks();
const bad = checks.filter(c => !c.ok);

for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} · ${c.surface} · ${c.label}: ${c.displayed}  ⇐  ${c.derivation}`);
}

if (bad.length) {
  console.error(`\n${bad.length} mismatch(es) — the world does not tie out.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks tie out.`);
