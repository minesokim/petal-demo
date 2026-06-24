import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Edge auth gate. The firm app under /os/* must require a signed-in user — previously auth was
// only enforced per-page (withFirm returns null), so an UNAUTHENTICATED visitor rendered the
// fixture/demo shell instead of being redirected. clerkMiddleware now redirects unauthenticated
// /os/* requests to sign-in before any page renders.
//
// Scope is deliberately narrow: ONLY /os/* is protected here. API routes self-gate at the handler
// (getFirmContext -> 401); the Twilio/Stripe/Clerk webhooks and the client portal are public by
// design (signature- or OTP-gated). This keeps the blast radius to the firm UI.
const isProtectedAppPage = createRouteMatcher(["/os(.*)"]);

// TEST-ONLY bypass (mirrors getFirmContext): on a NON-production deploy with PETAL_TEST_BYPASS set,
// skip protection so Playwright can drive the signed-in /os surfaces. The double gate (env var AND
// not production) makes it impossible to disable auth on petal-prod even if the var were set.
const testBypass = () => !!process.env.PETAL_TEST_BYPASS && process.env.VERCEL_ENV !== "production";

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedAppPage(req) && !testBypass()) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on app routes; skip Next internals and static files (so auth() has request context
    // where it's called, without intercepting assets).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|woff2?|ttf|map|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
