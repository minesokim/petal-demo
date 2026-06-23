import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed middleware -> proxy. clerkMiddleware makes Clerk's auth()
// available on every matched route so getFirmContext can read the active org.
// Not force-protecting yet: signed-out requests still render (fixture fallback)
// during the data-wiring rollout. The legacy template redirect is preserved.
export const proxy = clerkMiddleware((_auth, request: NextRequest) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/" || pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/default", request.url));
  }
});

export const config = {
  matcher: [
    // run on everything except Next internals + static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|otf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
