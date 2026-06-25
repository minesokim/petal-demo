// Verify the deterministic param lookup resolves for a year (default 2026) across all 9 provisions.
import { lookupParameter, PARAMETER_PROVISIONS } from "../lib/tax/figures/params";
const year = Number(process.argv[2] ?? 2026);
for (const p of PARAMETER_PROVISIONS) {
  const a = lookupParameter(p, year, "federal");
  if (!a) { console.log(`\n${p} (${year}): NULL (no figure → research fallback)`); continue; }
  console.log(`\n${p} (${year}): ${a.summary}`);
  console.log(`  cites: ${a.citations.map((c) => c.cite).join(" | ")}`);
}
