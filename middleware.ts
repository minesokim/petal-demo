import { clerkMiddleware } from "@clerk/nextjs/server";
import { isProtectedOsPath } from "@/lib/auth/os-route";

// SECURITY / RULE 1: gate the /os workspace. An unauthenticated request to /os/* must REDIRECT to sign-in,
// never fall through to loadFirmData's fixture shell (the spec's named "unauth /os/* redirects, never a
// fixture shell"). API routes self-protect (getFirmContext -> 401) and webhooks verify their own
// signatures, so only the UI workspace is gated here. The non-prod test bypass (PETAL_TEST_BYPASS, mirrored
// from lib/auth/context.ts) lets Playwright drive a preview deploy; it is IMPOSSIBLE on production
// (the VERCEL_ENV==="production" half can never be satisfied with the bypass there).
export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedOsPath(req.nextUrl.pathname)) return;
  if (process.env.PETAL_TEST_BYPASS && process.env.VERCEL_ENV !== "production") return;
  await auth.protect(); // unauth -> redirect to NEXT_PUBLIC_CLERK_SIGN_IN_URL
});

export const config = {
  matcher: [
    // Run on everything except Next internals + static assets; always on API/trpc.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
