"use client";

import { Agentation } from "agentation";

/**
 * Dev-only visual-feedback toolbar. Lets you click + annotate elements on the
 * running app and copy structured output (or sync to a connected coding agent
 * via the agentation MCP server). Renders nothing in production.
 *
 * Optional live sync: set NEXT_PUBLIC_AGENTATION_ENDPOINT (e.g. http://localhost:4747)
 * to stream annotations to the agent instead of copy-pasting.
 */
export function AgentationDev() {
  if (process.env.NODE_ENV !== "development") return null;
  const endpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;
  return <Agentation {...(endpoint ? { endpoint } : {})} />;
}
