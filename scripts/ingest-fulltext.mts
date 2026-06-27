// FULL-TEXT IRC INGEST (Phase-1 of the A-grade plan). NOT hand-distillation: fetch the RAW statutory text of a
// broad tier-1 section list across all 10 tax areas, window-chunk it (so deep subsections like §163(h)(3)(F) are
// PRESENT, not lost to a one-line paraphrase), and emit AuthorityChunks whose `text` IS the primary source.
// Deterministic — NO model calls, so it is fast and never stalls. Run: node --import tsx scripts/ingest-fulltext.mts
import { writeFileSync, readFileSync } from "node:fs";
import type { AuthorityChunk } from "../lib/tax/authority/store";

// Local path to the unzipped Title-26 USLM XML (OLRC release point). Download once:
//   curl -sL -o /tmp/usc26.zip "https://uscode.house.gov/download/releasepoints/us/pl/119/4/xml_usc26@119-4.zip"
//   unzip -o /tmp/usc26.zip -d /tmp/usc26x
const USLM_FILE = process.env.PETAL_USLM_FILE ?? "/tmp/usc26x/usc26.xml";

const lii = (n: string) => `https://www.law.cornell.edu/uscode/text/26/${n}`;

// Tier-1 sections by area — heavy on the EMPTY shelves (international / estate / accounting / procedure) the 24%
// baseline exposed, plus depth-fills for the covered areas (§121/§108/§163/§280A subsections that we abstained on).
const SECTIONS: string[] = [
  // Individual income
  "1","61","62","63","67","68","71","72","74","79","83","86","101","102","104","105","106","108","117","119","121","125","127","129","132","151","152","162","163","164","165","166","170","172","179","195","212","213","217","219","221","223","274","280A",
  // Credits
  "21","24","25A","25B","25C","25D","30D","32","36B","38","41","45","48",
  // Entities — Subchapter S / K / C
  "1361","1362","1366","1367","1368","1374","1375","701","702","704","705","706","707","721","722","723","731","732","733","736","741","743","751","752","754","301","302","304","305","311","312","316","317","318","331","332","336","337","338","351","354","355","356","357","358","362","368","381","382","383",
  // Property / capital gains / basis
  "1001","1011","1012","1014","1015","1016","1031","1033","1041","1060","1091","1202","1211","1212","1221","1222","1223","1231","1235","1245","1250","453",
  // Compensation & benefits
  "401","402","403","404","408","409A","410","411","412","414","415","421","422","423","424","457","3101","3111","3121","3301","3401",
  // Accounting methods & periods
  "441","442","443","446","448","451","453","460","461","465","469","471","472","475","481","483","263","263A","174","248","709",
  // International
  "861","862","863","864","865","871","881","882","894","901","902","904","911","951","951A","954","956","957","958","959","960","961","965","245A","250","267A","1291","1297","1441","1442","1445","1446","1471","1472","6038",
  // Estate, gift & trust
  "2001","2010","2031","2032","2033","2036","2053","2055","2056","2058","2501","2503","2505","2511","2513","2518","2522","2523","2601","2631","641","642","651","652","661","662","663","664","671","672","673","674","675","676","677","678","679",
  // Procedure, penalties & ethics
  "6011","6012","6031","6201","6213","6321","6330","6402","6404","6501","6502","6511","6601","6621","6651","6654","6655","6662","6662A","6663","6664","6694","6695","6700","6701","6707A","6713","7201","7202","7206","7216","7491","7525",
  // Exempt orgs
  "501","502","503","508","509","511","512","513","514","4940","4941","4942","4958",
];

// Parse the whole Title-26 USLM XML into { sectionNumber -> full operative text }. Real Code sections carry
// identifier="/us/usc/t26/sN"; inline quoted-section blocks (notes) have empty nums. Because inline sections
// NEST inside real ones, matching </section> is unsafe — instead SPLIT on the real-section identifiers and take
// each section's span up to the next, then strip tags. Robust to nesting.
function parseUSLM(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /<section\b[^>]*\bidentifier="\/us\/usc\/t26\/s([0-9]+[A-Za-z]?)"[^>]*>/gi;
  const marks: { sec: string; start: number }[] = [];
  for (const m of xml.matchAll(re)) marks.push({ sec: m[1].toUpperCase(), start: m.index! });
  for (let i = 0; i < marks.length; i++) {
    const block = xml.slice(marks[i].start, marks[i + 1]?.start ?? xml.length);
    const text = block
      .replace(/<[^>]+>/g, " ")
      .replace(/&#?[a-z0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 48000);
    if (text.length > (out.get(marks[i].sec)?.length ?? 0)) out.set(marks[i].sec, text);
  }
  return out;
}

// Overlapping windows so a rule that straddles a boundary is still wholly present in some chunk.
function windows(text: string, size = 2000, overlap = 250): string[] {
  if (text.length <= size) return [text];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) out.push(text.slice(i, i + size));
  return out.slice(0, 24); // cap per-section so one giant section can't dominate
}

const STOP = new Set("the and for that with this from shall under such other than section subsection paragraph subparagraph which any all not include including means term taxable amount person property year years during after before respect purpose purposes provided described preceding following clause".split(" "));
function keywordsFor(chunk: string, section: string): string[] {
  const freq = new Map<string, number>();
  for (const w of chunk.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? []) if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
  return [...new Set([section.toLowerCase(), ...top])];
}

async function main() {
  const YEARS = [2024, 2025, 2026];
  const NOW = "2026-06-27T00:00:00Z";
  console.log(`reading the full Title-26 USLM XML from ${USLM_FILE}…`);
  const xml = readFileSync(USLM_FILE, "utf8");
  console.log(`parsing ${(xml.length / 1e6).toFixed(1)}MB of USLM…`);
  const byNum = parseUSLM(xml);
  console.log(`parsed ${byNum.size} sections from the Code; selecting the tier-1 list (${SECTIONS.length})`);

  const chunks: AuthorityChunk[] = [];
  let ok = 0, fail = 0;
  const missing: string[] = [];
  for (const sec of SECTIONS) {
    const text = byNum.get(sec.toUpperCase());
    if (!text || text.length < 200) { fail++; missing.push(sec); continue; }
    ok++;
    windows(text).forEach((w, wi) => {
      chunks.push({
        chunkId: `fulltext-irc-${sec.toLowerCase()}-${wi}`,
        authorityType: "statute",
        citation: `IRC §${sec.toUpperCase()}`,
        jurisdiction: "federal",
        taxYear: YEARS,
        effectiveDate: `${YEARS[0]}-01-01`,
        sourceUrl: lii(sec),
        ingestedAt: NOW,
        text: w,
        keywords: keywordsFor(w, sec),
      });
    });
  }
  if (missing.length) console.log(`(not found in USLM: ${missing.join(", ")})`);
  const header = `// AUTO-GENERATED by scripts/ingest-fulltext.mts — RAW full-text IRC chunks (Phase-1 corpus). Do not hand-edit.
// ${chunks.length} chunks across ${ok} sections (${fail} failed). The text IS the primary source (no distillation),
// window-chunked so deep subsections are retrievable. Citation is section-level; retrieval matches the chunk TEXT.
import type { AuthorityChunk } from "../tax/authority/store";
export const CORPUS_FULLTEXT: AuthorityChunk[] = ${JSON.stringify(chunks, null, 1)};
`;
  writeFileSync("lib/research/corpus-fulltext.ts", header);
  console.log(`\nwrote lib/research/corpus-fulltext.ts — ${chunks.length} chunks from ${ok}/${SECTIONS.length} sections (${fail} failed)`);
}

main();
