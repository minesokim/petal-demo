// Data minimization before anything leaves for the model. Crown-jewel PII
// (SSN/EIN/bank/account) is stripped by key name, and SSN-shaped strings are
// masked anywhere they appear. Pair with ZDR + no-training (contractual).
const SENSITIVE_KEY = /ssn|social|ein|\btin\b|account|routing|bank|card|cvv|password|dob|birth/i;
const SSN_RE = /\b\d{3}-?\d{2}-?\d{4}\b/g;

export function redactText(s: string): string {
  return s.replace(SSN_RE, "[REDACTED-SSN]");
}

export function redactValue(v: unknown): unknown {
  if (typeof v === "string") return redactText(v);
  if (Array.isArray(v)) return v.map(redactValue);
  if (v && typeof v === "object") return redactObject(v as Record<string, unknown>);
  return v;
}

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(obj)) {
    out[k] = SENSITIVE_KEY.test(k) ? "[REDACTED]" : redactValue(val);
  }
  return out;
}
