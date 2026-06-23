import type * as schema from "../db/schema";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// A tenant-scoped Drizzle handle. Same query API across drivers: PGlite (tests)
// and postgres-js (runtime). All queries run under the caller's JWT claims so
// RLS scopes them — the repository never has to remember to filter by firm.
export type Db = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

export type Ctx = {
  firmId: string;
  actorId: string | null;
  actorType: "preparer" | "client" | "system";
};
