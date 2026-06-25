import Anthropic from "@anthropic-ai/sdk";

// THE single place an Anthropic client is constructed, so auth lives in one spot.
//
// AUTH: always the Console API key (x-api-key). The ZDR/BAA terms the §7216 posture depends on
// attach to the API account, so this is the only sanctioned path. (We evaluated routing dev through
// a Claude Code Max subscription token to save money — Anthropic BLOCKS that: a sk-ant-oat01 token
// used outside Claude Code returns 400 "This credential is only authorized for use with Claude
// Code", and their Consumer Terms forbid using Pro/Max OAuth in any other product/SDK. Dead end.)
//
// Model selection is production-grade everywhere (dev included): each call uses its real model
// (Opus for the agent loop, Sonnet for research). There is no dev downgrade.

export function anthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}
