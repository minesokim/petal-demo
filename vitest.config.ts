import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // RLS/DB tests run against an in-process PGlite Postgres — no Docker.
    pool: "forks",
    testTimeout: 30000,
  },
});
