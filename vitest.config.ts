import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // RLS/DB tests run against an in-process PGlite Postgres — no Docker.
    // Each file spins its own PGlite (WASM) instance; run files sequentially so
    // many heavy instances don't contend for memory/CPU and time out.
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30000,
  },
});
