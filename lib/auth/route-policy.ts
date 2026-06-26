// The auth policy for the edge middleware, as a PURE, UNIT-TESTABLE function (the middleware runs in the
// edge runtime and is awkward to exercise directly). This is the SINGLE SOURCE OF TRUTH for "what requires
// a signed-in user". The spec's hard rule: an unauthenticated request to a protected route must REDIRECT
// to sign-in and must NEVER fall through to the demo fixture shell (loadFirmData's `!real →
// fixtureFirmData()` path). Without enforcement here, anyone could load /os/* and be served demo data.

// Routes that carry their OWN non-Clerk auth (a shared secret or a provider signature) and therefore must
// stay OPEN to the Clerk middleware — gating these would break inbound webhooks, cron, and Twilio SMS.
const SELF_AUTHED_PUBLIC = ["/api/webhooks", "/api/cron", "/api/sms/inbound"];

// Everything a signed-in preparer touches: the OS + onboarding surfaces + the data/agent/research/compute
// APIs. (Consumed by proxy.ts — Next 16's edge-middleware convention — to gate these in production.)
const PROTECTED = ["/os", "/onboarding", "/api/os", "/api/agent", "/api/ask", "/api/research", "/api/tax"];

// Prefix match on PATH SEGMENTS so "/os" matches "/os" and "/os/today" but never "/oslo".
const underPrefix = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

export function isProtectedPath(pathname: string): boolean {
  if (SELF_AUTHED_PUBLIC.some((p) => underPrefix(pathname, p))) return false;
  return PROTECTED.some((p) => underPrefix(pathname, p));
}
