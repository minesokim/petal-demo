import { createHmac, timingSafeEqual } from "node:crypto";
import { inArray } from "drizzle-orm";
import { people } from "@/lib/db/schema";
import { toE164 } from "@/lib/sms/twilio";

// Inbound SMS webhook (Twilio → us). A client texts the firm's Twilio number and the
// reply lands in the household's SMS thread. We trust NOTHING about the body until
// Twilio's X-Twilio-Signature is verified (HMAC-SHA1 of the request URL + sorted POST
// params, keyed by TWILIO_AUTH_TOKEN). There is no JWT/firm context on a webhook, so we
// resolve the firm from the sender's phone via the SERVICE-role db (bypasses RLS), then
// stamp the row with THAT firm_id. Unknown numbers get a silent 200 (no enumeration leak).
// No PII (phone/body) is ever logged.

export const runtime = "nodejs";

const TWIML_EMPTY = "<Response></Response>";

function twiml(): Response {
  return new Response(TWIML_EMPTY, { status: 200, headers: { "content-type": "text/xml" } });
}

// The exact public URL Twilio signed. Twilio HMACs the URL it posted to; behind Vercel's
// proxy the request URL host is internal, so prefer an explicit override, then forwarded
// headers, then the raw request URL.
function signedUrl(req: Request): string {
  const override = process.env.TWILIO_INBOUND_URL;
  if (override) return override;
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    url.protocol = `${proto ?? "https"}:`;
    url.host = host;
  }
  return url.toString();
}

// Twilio's signature: base64( HMAC-SHA1( url + concat(sortedKey + value for each param) ) ).
function expectedSignature(authToken: string, url: string, params: Record<string, string>): string {
  let data = url;
  for (const key of Object.keys(params).sort()) {
    data += key + params[key];
  }
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

// Plausible stored representations of an E.164 number, to narrow the people scan without
// pulling the whole table. The find() afterwards re-normalizes both sides so an unlisted
// format is never a false match — this only prunes the candidate set. US (+1) formats are
// expanded; any other country falls back to the E.164 form alone.
function phoneVariants(e164: string): string[] {
  const variants = new Set<string>([e164]);
  if (e164.startsWith("+1") && e164.length === 12) {
    const d = e164.slice(2); // 10 digits
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6);
    variants.add(d);
    variants.add(`1${d}`);
    variants.add(`(${a}) ${b}-${c}`);
    variants.add(`${a}-${b}-${c}`);
    variants.add(`${a}.${b}.${c}`);
    variants.add(`+1 ${a}-${b}-${c}`);
    variants.add(`+1 (${a}) ${b}-${c}`);
  }
  return [...variants];
}

function signaturesMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request): Promise<Response> {
  // The webhook is meaningless (and unverifiable) without the auth token — reject.
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return new Response("forbidden", { status: 403 });

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return new Response("forbidden", { status: 403 });

  // Twilio posts application/x-www-form-urlencoded.
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") params[k] = v;
  }

  const expected = expectedSignature(authToken, signedUrl(req), params);
  if (!signaturesMatch(signature, expected)) {
    return new Response("forbidden", { status: 403 });
  }

  // Signature verified — body is now trusted.
  const from = params.From ?? "";
  const body = params.Body ?? "";
  const twilioSid = params.MessageSid || undefined;

  const fromE164 = toE164(from);
  if (!fromE164) return twiml(); // unparseable sender — nothing to thread; ack so Twilio stops retrying.

  // No JWT here: use the service-role db (bypasses RLS) to resolve the firm from the
  // sender's number, then scope everything to that firm.
  const { getServiceDb } = await import("@/lib/db/client");
  const db = getServiceDb();

  // Match on the normalized phone. people.phone may be stored in a few formats, so narrow
  // the scan with an IN over the plausible stored representations of this number, then
  // confirm in JS by normalizing both sides (defends against formatting drift).
  const candidates = await db
    .select({ firmId: people.firmId, householdId: people.householdId, phone: people.phone })
    .from(people)
    .where(inArray(people.phone, phoneVariants(fromE164)));

  const matches = candidates.filter((p) => p.phone && toE164(p.phone) === fromE164);
  if (matches.length === 0) return twiml(); // unknown number — do nothing, no leak.

  // Cross-tenant safety (fail closed): we resolve the firm from the SENDER's number because
  // a Twilio callback carries no JWT. The firm-owned DESTINATION number would identify the
  // firm unambiguously, but every firm currently shares one global number, so the sender is
  // all we have. If that number maps to people in MORE THAN ONE firm, we must NOT guess —
  // stamping the text under an arbitrary firm would disclose a client's inbound message to
  // the wrong tenant. Refuse silently (ack so Twilio stops retrying) until per-firm inbound
  // numbers + To-based resolution exist. Within a single firm we keep first-match behavior.
  const firmIds = new Set(matches.map((p) => p.firmId));
  if (firmIds.size > 1) return twiml(); // ambiguous across firms — no write, no cross-tenant leak.

  const match = matches[0];

  // Insert under the matched firm via the existing repository writer. firm_id is stamped
  // from this system ctx; the audit row it writes records direction/sid only (never body).
  const { recordSms } = await import("@/lib/repository/sms");
  await recordSms(db as never, { firmId: match.firmId, actorId: null, actorType: "system" }, {
    householdId: match.householdId,
    direction: "inbound",
    body,
    phone: fromE164,
    twilioSid,
  });

  return twiml();
}
