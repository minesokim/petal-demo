import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed middleware -> proxy. clerkMiddleware makes Clerk's auth()
// available on every matched route so getFirmContext can read the active org.
// In PRODUCTION, /os and /portal require sign-in (no public fixture demo of a
// tax app). In dev they stay open so the fixture fallback is verifiable without
// an account. The legacy template redirect is preserved.
export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/" || pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/os", request.url));
  }
  if (process.env.NODE_ENV === "production" && (pathname.startsWith("/os") || pathname.startsWith("/portal") || pathname.startsWith("/onboarding"))) {
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
