import Anthropic from "@anthropic-ai/sdk";

// THE single place an Anthropic client is constructed, so auth can be swapped centrally.
//
// DEFAULT (prod, CI, and any unset env): API-key auth — byte-identical to before. This is the
// ONLY path used in production; the ZDR/BAA terms that the §7216 posture depends on attach to the
// API account, so real taxpayer data always goes through here.
//
// DEV COST-SAVER (opt-in, local only): when AI_PROVIDER=claude-code and a Claude Code subscription
// OAuth token is present, authenticate with the subscription (Bearer) instead of an API key, so
// LOCAL testing of Petal's AI does not bill API tokens — it counts against your Claude Max/Pro
// plan. Get the token with `claude setup-token` and put it in .env.local:
//     AI_PROVIDER=claude-code
//     CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...        # from `claude setup-token`
//     # ANTHROPIC_OAUTH_BETA=oauth-2025-04-20         # only if the default beta header is rejected
//
// HARD CONSTRAINTS on the OAuth path (why it is dev-only):
//   • Subscriptions are for individual use — this must NEVER serve production or real users.
//   • The consumer OAuth path is NOT the ZDR/BAA path. Run ONLY synthetic/demo data through it
//     (which is all that is permitted pre-§7216 counsel anyway). Real client data → API, always.
// The flag is set only in your local .env.local; prod/CI never set it, so this code is inert there.

const OAUTH_BETA = process.env.ANTHROPIC_OAUTH_BETA ?? "oauth-2025-04-20";

/** True when the dev Claude Code subscription path is active (local opt-in only). */
export function usingClaudeCodeAuth(): boolean {
  return process.env.AI_PROVIDER === "claude-code"
    && !!(process.env.CLAUDE_CODE_OAUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN);
}

export function anthropicClient(): Anthropic {
  if (usingClaudeCodeAuth()) {
    const authToken = (process.env.CLAUDE_CODE_OAUTH_TOKEN ?? process.env.ANTHROPIC_AUTH_TOKEN)!;
    // Bearer (OAuth) auth against the subscription. The beta header is overridable via env in case
    // the value changes; the standard models still apply (assertZdrModel still gates the MODEL).
    return new Anthropic({ authToken, defaultHeaders: { "anthropic-beta": OAUTH_BETA } });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}
