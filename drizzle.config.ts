import { defineConfig } from "drizzle-kit";

// Generates SQL migrations from lib/db/schema.ts into supabase/migrations.
// `generate` runs offline (no DB connection). RLS lives in a hand-written
// migration (0001_rls.sql) applied after the generated schema.
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
});
