import { describe, it, expect } from "vitest";
import { mapClerkRole, requireRole } from "../../lib/auth/roles";

describe("mapClerkRole", () => {
  it("maps our custom slugs (with or without org: prefix)", () => {
    expect(mapClerkRole("owner")).toBe("owner");
    expect(mapClerkRole("org:reviewer")).toBe("reviewer");
    expect(mapClerkRole("org:admin")).toBe("admin");
  });
  it("defaults member/unknown/null to preparer", () => {
    expect(mapClerkRole("org:member")).toBe("preparer");
    expect(mapClerkRole("something")).toBe("preparer");
    expect(mapClerkRole(null)).toBe("preparer");
  });
});

describe("requireRole", () => {
  it("throws forbidden for a disallowed role", () => {
    expect(() => requireRole({ role: "preparer" }, ["owner", "admin"])).toThrow("forbidden");
  });
  it("passes for an allowed role", () => {
    expect(() => requireRole({ role: "owner" }, ["owner", "admin"])).not.toThrow();
  });
});
