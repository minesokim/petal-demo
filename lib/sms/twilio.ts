import "server-only";

// Outbound SMS via Twilio's REST API (no SDK dependency). Credentials are server-only env
// vars the firm sets in Vercel — never shipped to the browser, never entered through Petal:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (an SMS-capable Twilio number).
// Sending is an outbound action on the firm's behalf, so the CALLER gates it behind the
// preparer's confirmation (the agent confirm-card / the compose Send button).

const API_BASE = "https://api.twilio.com/2010-04-01";

export type SmsResult = { sid: string; to: string };

function creds() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).");
  }
  return { accountSid, authToken, from };
}

// Normalize a US phone to E.164 (+1XXXXXXXXXX). Returns null if it can't (caller rejects).
export function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export async function sendSms(args: { to: string; body: string }): Promise<SmsResult> {
  const { accountSid, authToken, from } = creds();
  const to = toE164(args.to);
  if (!to) throw new Error(`invalid phone: ${args.to}`);
  const body = args.body.trim();
  if (!body) throw new Error("empty message");

  const res = await fetch(`${API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1600) }).toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { sid?: string };
  if (!data.sid) throw new Error("Twilio returned no message sid");
  return { sid: data.sid, to };
}
