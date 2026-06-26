// Which request paths are the firm's authenticated workspace. /os/* renders real, firm-scoped data, so an
// unauthenticated request must redirect to sign-in (RULE 1: never a fixture shell). Kept pure so the
// protection decision is unit-testable without the Clerk edge runtime; middleware.ts consumes it.
export function isProtectedOsPath(pathname: string): boolean {
  return pathname === "/os" || pathname.startsWith("/os/");
}
