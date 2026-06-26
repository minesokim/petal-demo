import { describe, it, expect } from "vitest";
import { isProtectedPath } from "@/lib/auth/route-policy";

// The middleware's auth policy. These assertions ARE the contract: a regression here is a security
// regression (a protected surface going open, or a self-authed webhook getting Clerk-gated and breaking).
describe("auth route policy", () => {
  it("protects every /os + /onboarding surface (no fixture shell for the unauthenticated)", () => {
    for (const p of ["/os", "/os/today", "/os/clients/abc-123", "/os/ask", "/os/settings", "/os/", "/onboarding", "/onboarding/firm"]) {
      expect(isProtectedPath(p)).toBe(true);
    }
  });

  it("protects the data / agent / research / compute APIs", () => {
    for (const p of ["/api/os/clients", "/api/agent", "/api/ask", "/api/ask/analyze", "/api/research", "/api/tax/compute"]) {
      expect(isProtectedPath(p)).toBe(true);
    }
  });

  it("leaves the public marketing + Clerk auth routes open", () => {
    for (const p of ["/", "/sign-in", "/sign-up", "/pricing", "/about"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });

  it("leaves self-authed webhooks / cron / inbound SMS open (own secret or provider signature)", () => {
    for (const p of ["/api/webhooks/clerk", "/api/webhooks/stripe", "/api/cron/schedules", "/api/sms/inbound"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });

  it("does not protect by accidental prefix collision", () => {
    expect(isProtectedPath("/oslo")).toBe(false); // must not match the /os prefix
    expect(isProtectedPath("/api/oslo")).toBe(false);
    expect(isProtectedPath("/api/taxonomy")).toBe(false); // must not match /api/tax
  });
});
