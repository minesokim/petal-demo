import { graphRetrieve } from "../lib/research/retrieval/graph-retrieve";

for (const [q, year] of [["gambling losses", 2026], ["SALT deduction cap", 2026], ["qualified business income deduction", 2026], ["SALT deduction cap", 2024]] as const) {
  const hits = await graphRetrieve(q, { taxYear: year, jurisdiction: "federal", k: 3 });
  console.log(`Q: "${q}" (TY${year})`);
  for (const h of hits) console.log(`   → ${h.citation}  [${h.authorityType}, yrs ${h.taxYear.join("/")}]`);
  if (!hits.length) console.log("   → (none)");
}
process.exit(0);
