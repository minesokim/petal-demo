import { createHmac, timingSafeEqual } from "node:crypto";
import { inArray } from "drizzle-orm";
import { people } from "@/lib/db/schema";
import { toE164 } from "@/lib/sms/twilio";
import type { SmsMediaInput } from "@/lib/repository/sms";

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

// Non-PII diagnostic line for production debugging (vercel logs). NEVER logs the message body
// or the phone number — only which BRANCH the request took + the signature/URL outcome, so a
// misconfigured Twilio webhook (not reaching us / 403 signature mismatch / unknown sender) is
// diagnosable from our side without ever exposing client content.
function diag(stage: string, extra?: Record<string, string | number | boolean>) {
  const tail = extra ? " " + Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ") : "";
  console.log(`[sms-inbound] ${stage}${tail}`);
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

// MMS: pull each media item off the webhook (Twilio sends NumMedia + MediaUrl{i} +
// MediaContentType{i}), fetch the bytes from Twilio (authed — the media URL is private), store
// in the firm-files bucket under the resolved firm, and return refs for recordSms. Best-effort
// per item: a failed fetch is skipped and logged (the text body still records). No PII logged.
async function collectInboundMedia(params: Record<string, string>, firmId: string): Promise<SmsMediaInput[]> {
  const n = parseInt(params.NumMedia ?? "0", 10);
  if (!Number.isFinite(n) || n <= 0) return [];
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return [];
  const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
  const { uploadFirmFileBytes } = await import("@/lib/storage/firm-files");
  const out: SmsMediaInput[] = [];
  for (let i = 0; i < n; i++) {
    const url = params[`MediaUrl${i}`];
    const contentType = params[`MediaContentType${i}`] || "application/octet-stream";
    if (!url) continue;
    try {
      const res = await fetch(url, { headers: { Authorization: auth }, redirect: "follow" });
      if (!res.ok) { diag("media:fetch-failed", { i, status: res.status }); continue; }
      const bytes = new Uint8Array(await res.arrayBuffer());
      const ext = (contentType.split("/")[1] || "bin").split("+")[0].split(";")[0];
      const name = `mms-${i + 1}.${ext}`;
      const up = await uploadFirmFileBytes(firmId, bytes, name, contentType);
      out.push({ storagePath: up.storagePath, contentType, name, sizeBytes: up.sizeBytes });
    } catch { diag("media:error", { i }); }
  }
  return out;
}

export async function POST(req: Request): Promise<Response> {
  diag("hit"); // Twilio reached us at all — the single line that rules out "webhook not pointed here".

  // The webhook is meaningless (and unverifiable) without the auth token — reject.
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) { diag("reject:no-auth-token"); return new Response("forbidden", { status: 403 }); }

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) { diag("reject:no-signature"); return new Response("forbidden", { status: 403 }); }

  // Twilio posts application/x-www-form-urlencoded.
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string") params[k] = v;
  }

  const url = signedUrl(req);
  const expected = expectedSignature(authToken, url, params);
  if (!signaturesMatch(signature, expected)) {
    // Logs OUR reconstructed URL (a public endpoint, not a secret) so a host/URL mismatch — the
    // usual cause of a 403 behind a proxy — is obvious: compare it to the webhook URL in Twilio.
    diag("reject:bad-signature", { signedUrl: url });
    return new Response("forbidden", { status: 403 });
  }

  // Signature verified — body is now trusted.
  const from = params.From ?? "";
  const body = params.Body ?? "";
  const twilioSid = params.MessageSid || undefined;

  const fromE164 = toE164(from);
  if (!fromE164) { diag("ack:unparseable-sender"); return twiml(); } // nothing to thread; ack so Twilio stops retrying.

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
  if (matches.length === 0) { diag("ack:unknown-sender"); return twiml(); } // no person on file — no leak.

  // Cross-tenant safety (fail closed): we resolve the firm from the SENDER's number because
  // a Twilio callback carries no JWT. The firm-owned DESTINATION number would identify the
  // firm unambiguously, but every firm currently shares one global number, so the sender is
  // all we have. If that number maps to people in MORE THAN ONE firm, we must NOT guess —
  // stamping the text under an arbitrary firm would disclose a client's inbound message to
  // the wrong tenant. Refuse silently (ack so Twilio stops retrying) until per-firm inbound
  // numbers + To-based resolution exist. Within a single firm we keep first-match behavior.
  const firmIds = new Set(matches.map((p) => p.firmId));
  if (firmIds.size > 1) { diag("ack:ambiguous-firm", { firms: firmIds.size }); return twiml(); } // no cross-tenant guess.

  const match = matches[0];

  // MMS: fetch + store any media under the matched firm before recording the message.
  const media = await collectInboundMedia(params, match.firmId);

  // Insert under the matched firm via the existing repository writer. firm_id is stamped
  // from this system ctx; the audit row it writes records direction/sid only (never body).
  const { recordSms } = await import("@/lib/repository/sms");
  await recordSms(db as never, { firmId: match.firmId, actorId: null, actorType: "system" }, {
    householdId: match.householdId,
    direction: "inbound",
    body,
    phone: fromE164,
    twilioSid,
    media,
  });

  diag("recorded", { media: media.length }); // success — inbound text + N media under the resolved firm.
  return twiml();
}
