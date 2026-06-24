import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Mirror tsconfig's "@/*" -> "./*" path alias so tests can import modules that use
  // the @/ alias (e.g. the agent tool registry + its per-domain modules). Additive:
  // existing tests use relative imports, so this only enables new resolutions.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // The Next.js `server-only` guard throws when loaded outside a Server Component.
      // In the test runner there is no RSC boundary, so map it to a no-op module. The
      // actual server-only guarantee is enforced by Next at build/runtime, not by tests.
      "server-only": fileURLToPath(new URL("./tests/helpers/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // RLS/DB tests run against an in-process PGlite Postgres — no Docker.
    // Each file spins its own PGlite (WASM) instance; run files sequentially so
    // many heavy instances don't contend for memory/CPU and time out.
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30000,
    // makeTestDb applies all migrations per file; give beforeAll headroom under load.
    hookTimeout: 60000,
  },
});
