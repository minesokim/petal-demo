// No-op stand-in for the `server-only` package under vitest. `server-only` throws if
// imported outside a React Server Component; the test runner has no RSC boundary, so we
// alias it here to an empty module (vitest.config.ts resolve.alias). The real server-only
// guarantee is enforced by Next at build time, not by these unit tests.
export {};
