import type * as schema from "../db/schema";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Role } from "../auth/roles";

// A tenant-scoped Drizzle handle. Same query API across drivers: PGlite (tests)
// and postgres-js (runtime). All queries run under the caller's JWT claims so
// RLS scopes them — the repository never has to remember to filter by firm.
export type Db = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

export type Ctx = {
  firmId: string;
  actorId: string | null;
  actorType: "preparer" | "client" | "system";
  // The signed-in member's firm role, set by withFirm from the verified Clerk org role.
  // Optional so test/system contexts can omit it; RBAC checks treat a missing role as
  // least-privileged (denied). Real user-facing actions always carry it.
  role?: Role;
};
