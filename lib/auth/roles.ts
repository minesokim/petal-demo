// Firm roles + the permission gate. Pure, dependency-free (unit-tested).
export type Role = "owner" | "admin" | "reviewer" | "preparer";
const ROLES: Role[] = ["owner", "admin", "reviewer", "preparer"];

// Clerk org role slug ("org:admin", "owner", "org:member", …) → our Role.
// Clerk's default non-admin org role is "member" → preparer.
export function mapClerkRole(clerkRole: string | null | undefined): Role {
  const slug = (clerkRole ?? "").replace(/^org:/, "").toLowerCase();
  if ((ROLES as string[]).includes(slug)) return slug as Role;
  if (slug === "admin") return "admin";
  return "preparer";
}

export function requireRole(ctx: { role: Role }, allowed: Role[]): void {
  if (!allowed.includes(ctx.role)) {
    const err = new Error("forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
}

// The preparer-drafts / reviewer-approves split: a "preparer" may stage/draft AI actions, but
// only a reviewer/admin/owner may APPROVE a staged proposal. A missing role (a system/test ctx
// without one) is least-privileged → cannot approve. Gates the proposal-resolution path.
export const APPROVER_ROLES: Role[] = ["owner", "admin", "reviewer"];
export function canApprove(role: Role | undefined | null): boolean {
  return !!role && (APPROVER_ROLES as string[]).includes(role);
}
