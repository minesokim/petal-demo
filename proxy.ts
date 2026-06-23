import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed middleware -> proxy. clerkMiddleware makes Clerk's auth()
// available on every matched route so getFirmContext can read the active org.
// On the PRODUCTION deploy, the PREPARER surfaces (/os, /onboarding) require Clerk sign-in.
// /portal is intentionally PUBLIC (prospects/clients aren't Clerk users — gated at the data
// layer by the invite token + client OTP). The gate keys on VERCEL_ENV==="production" (not
// NODE_ENV, which is also "production" on preview builds) so PREVIEW deploys render the
// fixture fallback un-gated — letting signed-out /os surfaces be screenshot-diffed against
// the mockup without an account. Real data stays RLS-protected regardless of who reaches /os.
export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/" || pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/os", request.url));
  }
  if (process.env.VERCEL_ENV === "production" && (pathname.startsWith("/os") || pathname.startsWith("/onboarding"))) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in", request.url));
  }
});

export const config = {
  matcher: [
    // run on everything except Next internals + static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|otf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
