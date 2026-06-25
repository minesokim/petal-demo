// §7216 guard for the retrieve-on-demand fetch path.
//
// When the engine hits a coverage gap it may FETCH from a public primary-source API (GovInfo, eCFR,
// the Federal Register, the Tax Court, the IRS). Those queries leave the process, so they must be
// PUBLIC-LAW-SHAPED — a topic, a section number, a citation, a docket number — and NEVER carry
// taxpayer PII. This guard fails CLOSED: a query that contains PII-shaped content throws, so the
// engine does an honest abstain instead of leaking. It does not "redact and proceed" on a hit,
// because a tax-law query containing a client's SSN means the caller is doing something wrong.

import { redactText } from "@/lib/ai/redact";

// PII shapes that must never appear in an outbound public-API query.
const PII_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: "EIN", re: /\b\d{2}-\d{7}\b/ },
  { name: "long account/id number", re: /\b\d{9,}\b/ },
  { name: "email", re: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
];

/**
 * Assert a fetch query is safe to send to a public primary-source API and return the cleaned query.
 * Throws (fails closed) if the RAW query contains any PII shape — the engine treats the throw as
 * "can't fetch" and abstains honestly. A belt-and-suspenders redaction pass runs on the survivor.
 */
export function assertPublicLawQuery(query: string): string {
  const raw = typeof query === "string" ? query : "";
  for (const { name, re } of PII_PATTERNS) {
    if (re.test(raw)) {
      throw new Error(`fetch query blocked (§7216): contains ${name}-shaped content — public-law queries must carry no taxpayer data`);
    }
  }
  const cleaned = redactText(raw).trim();
  if (!cleaned) throw new Error("fetch query blocked: empty after cleaning");
  return cleaned;
}

/** Non-throwing predicate form, for callers that want to branch rather than catch. */
export function isPublicLawQuery(query: string): boolean {
  try {
    assertPublicLawQuery(query);
    return true;
  } catch {
    return false;
  }
}
