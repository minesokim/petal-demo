import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed middleware -> proxy. clerkMiddleware makes Clerk's auth()
// available on every matched route so getFirmContext can read the active org.
// In PRODUCTION, the PREPARER surfaces (/os, /onboarding) require Clerk sign-in. /portal is
// intentionally PUBLIC: prospects/clients are not Clerk users, so it cannot be Clerk-gated —
// access is gated at the data layer by the invite capability token (and client OTP). In dev
// everything stays open so the fixture fallback is verifiable without an account.
export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/" || pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/os", request.url));
  }
  if (process.env.NODE_ENV === "production" && (pathname.startsWith("/os") || pathname.startsWith("/onboarding"))) {
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
