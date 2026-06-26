import { describe, it, expect } from "vitest";
import { isProtectedOsPath } from "../lib/auth/os-route";

// The /os workspace must be auth-gated (RULE 1: unauth -> redirect, never a fixture shell). This locks the
// protection DECISION (which paths the middleware protects); Clerk's auth.protect() enforces the redirect.

describe("/os workspace auth gate — protected route matcher", () => {
  it("protects the workspace root and every sub-route", () => {
    expect(isProtectedOsPath("/os")).toBe(true);
    expect(isProtectedOsPath("/os/tasks")).toBe(true);
    expect(isProtectedOsPath("/os/clients/h-1")).toBe(true);
    expect(isProtectedOsPath("/os/agents")).toBe(true);
    expect(isProtectedOsPath("/os/settings")).toBe(true);
  });

  it("does NOT gate sign-in, marketing, or look-alike paths", () => {
    expect(isProtectedOsPath("/sign-in")).toBe(false);
    expect(isProtectedOsPath("/")).toBe(false);
    expect(isProtectedOsPath("/oslo")).toBe(false); // not a "/os"-prefix false positive
    expect(isProtectedOsPath("/oscars")).toBe(false);
  });
});
