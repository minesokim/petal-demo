"use client";

/**
 * Session context — the "who am I and what can I do" provider that wraps
 * the dashboard. Defaults to the firm owner (Antonio) for the demo per
 * spec; the user switcher in the header lets a demo flip personas to
 * showcase role-gated UI.
 *
 * In production this would hydrate from a real auth provider (Clerk/
 * NextAuth/Convex). For now it's pure client-state with a sensible
 * default and a setter for switching.
 */

import * as React from "react";
import {
  FIRM,
  canPerform,
  getMemberById,
  type Firm,
  type FirmMember,
  type Permission,
} from "@/lib/firm-mock-data";

interface SessionContextValue {
  /** The currently signed-in firm member. */
  user: FirmMember;
  /** The firm itself (for things like firm name in chrome, member list). */
  firm: Firm;
  /** Switch the active user by id. Used by the header demo switcher. */
  setUserId: (id: string) => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

/** Default user for the demo = the firm owner (Antonio). */
const DEFAULT_USER_ID = FIRM.members.find((m) => m.role === "owner")?.id ?? FIRM.members[0].id;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState<string>(DEFAULT_USER_ID);
  const user = getMemberById(userId);

  const value = React.useMemo<SessionContextValue>(
    () => ({ user, firm: FIRM, setUserId }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Read the current session. Throws if used outside SessionProvider. */
export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}

/** Role-gate hook. Returns true if the current user can perform the action. */
export function useCanPerform(action: Permission): boolean {
  const { user } = useSession();
  return canPerform(user.role, action);
}

/** Soft-fail variant for components that may render outside the provider
 *  (e.g. server snapshots, isolated tests). Returns the owner as a safe
 *  default so chrome doesn't break. */
export function useSessionSafe(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (ctx) return ctx;
  return {
    user: getMemberById(DEFAULT_USER_ID),
    firm: FIRM,
    setUserId: () => {},
  };
}
