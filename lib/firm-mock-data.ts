/**
 * Firm + role + permissions mock data.
 *
 * Petal is multi-user firm-based: every practice (the "firm") has multiple
 * members with role-gated access. This module owns the firm/member/role
 * shapes and the permission map that surfaces role gates throughout the
 * UI via `useCanPerform()`.
 *
 * For the demo, the default session is the firm owner (Antonio). The user
 * switcher in the header lets a demo flip between personas to show how
 * the experience changes per role.
 */

// ─────────────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────────────

/** Concrete roles a firm member can hold. Sized for a solo-EA / small
 *  practice (Antonio's scale: ~200 clients, owner + part-timers). */
export type FirmRole =
  | "owner"            // Full access. Sign, bill, manage team, delete.
  | "preparer"         // Sign returns, full client access. Peak hires.
  | "junior_preparer"  // Limited prep, no signing. Seasonal.
  | "bookkeeper"       // Data entry, no signing or billing.
  | "reviewer"         // Read-only across the firm.
  | "ai";              // Petal itself, counted as a "team member".

export const ROLE_LABEL: Record<FirmRole, string> = {
  owner: "Owner",
  preparer: "Preparer",
  junior_preparer: "Junior preparer",
  bookkeeper: "Bookkeeper",
  reviewer: "Reviewer",
  ai: "AI",
};

/** Short description shown next to the role label in the user switcher
 *  + Team settings page. */
export const ROLE_DESCRIPTION: Record<FirmRole, string> = {
  owner: "Full access. Signs returns, manages billing + team + settings.",
  preparer: "Signs returns. Full access to all clients.",
  junior_preparer: "Drafts returns for review. Cannot sign or e-file.",
  bookkeeper: "Data entry + intake. Cannot sign or modify billing.",
  reviewer: "Read-only across the firm.",
  ai: "Petal. Drafts, classifies, surfaces — never acts without approval.",
};

// ─────────────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────────────

/** Granular gates the UI checks. Adding a new gate? Add it here, add the
 *  role mappings below, then call `useCanPerform("...")` at the gate. */
export type Permission =
  | "sign_returns"      // ERO countersignature, e-file transmission
  | "manage_billing"    // Stripe, fee schedule, deposit settings
  | "manage_team"       // Add/remove members, change roles
  | "manage_settings"   // Firm-wide settings (profile, templates, AI tone)
  | "delete_clients"    // Remove client records permanently
  | "view_all_clients"  // See every client (vs only assigned)
  | "edit_clients";     // Update client data, notes, documents

export const ROLE_PERMISSIONS: Record<FirmRole, Permission[]> = {
  owner: [
    "sign_returns",
    "manage_billing",
    "manage_team",
    "manage_settings",
    "delete_clients",
    "view_all_clients",
    "edit_clients",
  ],
  preparer: ["sign_returns", "view_all_clients", "edit_clients"],
  junior_preparer: ["edit_clients"], // Only their assigned clients (enforced separately)
  bookkeeper: ["edit_clients"],      // Same scoping
  reviewer: ["view_all_clients"],    // Read-only firm-wide
  ai: [],                            // Petal never has direct permissions
};

/** True if the role can perform the action. */
export function canPerform(role: FirmRole, action: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}

// ─────────────────────────────────────────────────────────────────────────
// Firm + members
// ─────────────────────────────────────────────────────────────────────────

export interface FirmMember {
  id: string;
  fullName: string;
  /** Short display name for chrome (avatar fallbacks, switcher rows). */
  shortName: string;
  email: string;
  /** Optional professional credential — "EA", "CPA", "Bookkeeper". */
  credential?: string;
  role: FirmRole;
  avatar?: string;
  /** Active = currently working at the firm. Inactive members stay in the
   *  list for historical attribution (notes, activity, etc.). */
  active: boolean;
  /** Used by the overview's team-activity card and capacity views. */
  returnsThisSeason?: number;
  /** IRS Preparer Tax ID Number. Required for any role that can sign as
   *  ERO. Stored per-member because each preparer must use their own. */
  ptin?: string;
  /** IRS Electronic Filing ID Number. Issued to the firm but tied to the
   *  individual who applied. Most firms have one EFIN per office. */
  efin?: string;
}

export interface Firm {
  id: string;
  name: string;
  /** EIN / firm identifier for the IRS — shown on defense packages. */
  ein?: string;
  /** Where the firm is registered (state for licensing). */
  state?: string;
  members: FirmMember[];
}

/** Antonio Vazquez's practice — the demo firm. */
export const FIRM: Firm = {
  id: "firm-vazant",
  name: "Vazant Consulting",
  ein: "85-1234567",
  state: "CA",
  members: [
    {
      id: "u-antonio",
      fullName: "Antonio Vazquez",
      shortName: "Antonio",
      email: "antonio@vazantconsulting.com",
      credential: "EA",
      role: "owner",
      avatar: "/images/avatars/04.png",
      active: true,
      returnsThisSeason: 28,
      ptin: "P01234567",
      efin: "123456",
    },
    {
      id: "u-elena",
      fullName: "Elena Martinez",
      shortName: "Elena",
      email: "elena@vazantconsulting.com",
      credential: "CPA",
      role: "preparer",
      avatar: "/images/avatars/03.png",
      active: true,
      returnsThisSeason: 18,
      ptin: "P02345678",
      // Elena uses the firm's EFIN (Antonio's, since the firm operates under one)
      efin: "123456",
    },
    {
      id: "u-james",
      fullName: "James Chen",
      shortName: "James",
      email: "james@vazantconsulting.com",
      role: "junior_preparer",
      avatar: "/images/avatars/06.png",
      active: true,
      returnsThisSeason: 9,
    },
    {
      id: "u-maria",
      fullName: "Maria Rodriguez",
      shortName: "Maria",
      email: "maria@vazantconsulting.com",
      credential: "Bookkeeper",
      role: "bookkeeper",
      avatar: "/images/avatars/05.png",
      active: true,
      returnsThisSeason: 12,
    },
    {
      id: "u-petal",
      fullName: "Petal",
      shortName: "Petal",
      email: "petal@vazantconsulting.com",
      role: "ai",
      active: true,
      returnsThisSeason: 86,
    },
  ],
};

/** Convenience: just the human (non-AI) members. */
export const HUMAN_MEMBERS = FIRM.members.filter((m) => m.role !== "ai");

/** Resolve a member by id, or fall back to the owner. */
export function getMemberById(id: string): FirmMember {
  return FIRM.members.find((m) => m.id === id) ?? FIRM.members[0];
}

/** The firm owner — used for letterhead, legal documents, and IRS-facing
 *  fields where the practice's principal must sign regardless of which
 *  member is currently logged in. */
export function getFirmOwner(): FirmMember {
  return FIRM.members.find((m) => m.role === "owner") ?? FIRM.members[0];
}

/** Convenience: "Antonio Vazquez, EA" formatted with the credential when
 *  present, falling back to just the name. */
export function memberSignatureLine(member: FirmMember): string {
  return member.credential ? `${member.fullName}, ${member.credential}` : member.fullName;
}

/** Initials for avatar fallbacks. */
export function memberInitials(member: FirmMember): string {
  return member.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Tint classes for a role's badge / chip. Single source so the switcher,
 *  team table, and any other surface stay consistent. */
export const ROLE_TINT: Record<FirmRole, string> = {
  owner:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40",
  preparer:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40",
  junior_preparer:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:ring-sky-900/40",
  bookkeeper:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40",
  reviewer:
    "bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-900/40 dark:text-stone-300 dark:ring-stone-800",
  ai: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-900/40",
};

/** Ordered list of role choices a human firm member can hold. The `ai` role
 *  is excluded — only Petal occupies it, set when Petal is provisioned. */
export const ASSIGNABLE_ROLES: FirmRole[] = [
  "owner",
  "preparer",
  "junior_preparer",
  "bookkeeper",
  "reviewer",
];
