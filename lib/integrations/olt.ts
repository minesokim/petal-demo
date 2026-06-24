// Stubbed OLT browser-automation client (slice ⑥ — the brief's Module 4b: the
// agentic layer's BROWSER-AUTOMATION tier). OLT (OnLine Taxes) is a *web* tax
// platform with no API — the only way to drive it is a real browser. So unlike the
// Xero connector (an MCP/API client), this tier ultimately needs Stagehand+Playwright
// driving an isolated, per-task browser context. v1 ships NONE of that: this module is
// a clean INTERFACE with a synthetic stub behind it so a real Stagehand+Playwright
// implementation drops in later WITHOUT changing any caller.
//
// Posture (mirrors xero.ts):
//   • Read surface (status) is tier-1 and returns synthetic data for a stub connection.
//   • The "write" surface NEVER executes a browser action in v1. stageReturnFromIntake
//     is a PURE planner: it RETURNS the would-be field entries (the planned actions) for
//     a human to review / for the agent to stage as an action_proposal. It does not open
//     a browser, does not log in, does not type into OLT.
//   • A non-stub / live connection routes to notLive(), which throws
//     "OLT automation not enabled in v1" — so a misconfigured live connection fails
//     LOUDLY instead of silently driving a real return.
//
// INV-3: every OLT write is a tier-3 governed write — staged as a proposal, executed
//        only after a recorded human approval, and even then deferred in v1 (the tools
//        are excluded from ENABLED_WRITE_TOOLS). v1 makes NO external write into OLT.
// INV-4: a connection is referenced by id only. OLT credentials live behind the
//        connection's secret_ref (agent_connections.secret_ref → vault), resolved
//        OUTSIDE model context at the moment a browser would log in. This module never
//        sees a password, never logs it, never returns it, and it never enters a prompt.
//
// ── What a REAL slice-⑥ implementation needs (explicitly deferred) ──────────────
//   • Stagehand + Playwright driving an ISOLATED, per-task browser context (one fresh
//     incognito context per agent_task; no shared cookies/session across firms/clients).
//   • Credentials resolved from secret_ref via the existing vault path at login time,
//     injected straight into the page — never into the model, the audit log, or a return.
//   • Every action OBSERVABLE: a screenshot + DOM snapshot per step persisted as an
//     artifact for audit (so an auditor can replay exactly what was typed where).
//   • VERIFICATION-AFTER-ACTION: after each write, re-read the field/page and confirm it
//     holds the intended value before proceeding (verifyOltState below is that seam).
//   • RETRIES → HUMAN FALLBACK: bounded retries on a flaky step, then surface to a human
//     (never guess past an ambiguous OLT screen).
//   • SCOPE: OLT is a *browser* platform. Desktop tax packages (Drake / Lacerte /
//     ProSeries) are EXPLICITLY OUT OF SCOPE for this tier — they are native Windows apps,
//     not web flows, and would need a different (RDP/desktop-automation) approach entirely.

import "server-only";

// ── The shapes the rest of the app speaks (provider-neutral) ──────────────────

// An opaque handle for one OLT automation session. In a real impl this wraps the live
// Stagehand/Playwright context + page; in the stub it is just the resolved connection
// descriptor. It deliberately carries NO credential material (INV-4) — the secret is
// resolved from secretRef at login time and never stored on the session object.
export type OltSession = {
  connectionId: string;
  /** true for a "stub:"/absent connection (synthetic); false would be a live browser. */
  isStub: boolean;
  /** the vault pointer for this connection's OLT login — a pointer ONLY, never the secret. */
  secretRef: string | null;
};

// A reference to a specific return inside OLT (client + tax year). In OLT's UI this is
// how you navigate to the right return; we keep it provider-neutral here.
export type OltReturnRef = {
  clientId: string;
  taxYear: number;
};

// The would-be field entries to stage a return from an intake plan. stageReturnFromIntake
// RETURNS these — it never executes them. Each entry names an OLT screen + field and the
// value the agent WOULD type, plus the source it came from (so a human can audit provenance).
export type OltFieldEntry = {
  /** the OLT screen/section this field lives on, e.g. "1040 / Income / W-2". */
  screen: string;
  /** the OLT field label/selector key, e.g. "wages_box1". */
  field: string;
  /** the value that WOULD be entered (decimal string for money; never a float). */
  value: string;
  /** provenance: where this value came from (e.g. "extracted:W-2 box 1"). For audit. */
  source: string;
};

// The plan handed to stageReturnFromIntake — the intake-derived facts to transcribe into
// OLT. Provider-neutral; the planner maps these onto OltFieldEntry rows.
export type OltStagePlan = {
  ref: OltReturnRef;
  /** the field entries the agent intends to make (already deterministic, model-free). */
  entries: OltFieldEntry[];
};

// The status of a return as OLT would report it (read surface). Synthetic in the stub.
export type OltReturnStatus = {
  clientId: string;
  taxYear: number;
  /** OLT's pipeline state, e.g. "in_progress" | "ready_to_efile" | "accepted". */
  state: string;
  /** number of e-file validation errors OLT reports outstanding. */
  efileErrors: number;
  lastUpdated: string; // ISO yyyy-mm-dd
};

// What verifyOltState checks after a (would-be) action: the expected post-condition.
export type OltExpectation = {
  ref: OltReturnRef;
  /** expected OLT state after the action, e.g. "ready_to_efile". */
  expectState?: string;
  /** field values expected to be present (verification-after-action). */
  expectFields?: Array<{ field: string; value: string }>;
};

export type OltVerifyResult = {
  ok: boolean;
  /** human-readable mismatches; empty when ok. */
  mismatches: string[];
};

// ── Connection resolution (stub vs real) ──────────────────────────────────────

// A connectionId is a stub iff it is missing or prefixed "stub:". Mirrors xero.ts so the
// whole automation pipeline is exercisable in tests + preview without a real OLT login.
export function isStubConnection(connectionId: string | null | undefined): boolean {
  return !connectionId || connectionId.startsWith("stub:");
}

// The deliberate not-implemented-in-v1 trap for the live (real browser) path. A live
// connection hitting any function here throws LOUDLY rather than silently doing nothing
// (or worse, half-driving a real return). The real Stagehand+Playwright path swaps in
// behind this guard later.
function notLive(): never {
  throw new Error("OLT automation not enabled in v1");
}

// ── Session ───────────────────────────────────────────────────────────────────

// Open an OLT automation session for a connection. In the stub this just resolves the
// connection descriptor (no browser, no login). For a live connection it is intentionally
// not implemented in v1 — a real impl would launch an isolated per-task Playwright context
// here. The secret behind secretRef is NOT resolved at this point and is never attached to
// the returned session (INV-4); it is resolved only at the moment loginOlt would type it.
export async function oltSession(
  connectionId: string,
  opts?: { secretRef?: string | null },
): Promise<OltSession> {
  const isStub = isStubConnection(connectionId);
  if (!isStub) return notLive();
  return { connectionId, isStub, secretRef: opts?.secretRef ?? null };
}

// Log in to OLT. STUB: a no-op success (no browser, no credential read). LIVE: would
// resolve the credential from session.secretRef via the vault path and type it into the
// OLT login page inside the isolated browser context — the credential never enters model
// context, logs, or the return data. Not wired in v1.
export async function loginOlt(session: OltSession): Promise<{ loggedIn: true }> {
  if (!session.isStub) return notLive();
  // STUB: pretend we are logged in. We deliberately do NOT touch session.secretRef here —
  // a stub never resolves a secret, so there is nothing to leak.
  return { loggedIn: true };
}

// Navigate to a specific return inside OLT. STUB: a no-op acknowledgement. LIVE: would
// drive the browser to the client's return for the given tax year (with a screenshot +
// DOM snapshot persisted as an audit artifact). Not wired in v1.
export async function navigateToReturn(
  session: OltSession,
  ref: OltReturnRef,
): Promise<{ navigated: true; ref: OltReturnRef }> {
  if (!session.isStub) return notLive();
  return { navigated: true, ref };
}

// ── Stage a return from an intake plan — the PLANNER (never executes) ──────────
// This is the heart of the write surface and it is PURE: it RETURNS the field entries the
// agent WOULD type into OLT, for a human to review and for the agent to stage as an
// action_proposal. It does NOT open a browser, log in, navigate, or type. The actual
// transcription (post-approval, behind Stagehand+Playwright) is intentionally not
// implemented in v1 — INV-3: no external write into OLT happens here.
export function stageReturnFromIntake(session: OltSession, plan: OltStagePlan): OltFieldEntry[] {
  if (!session.isStub) return notLive();
  // Pure: echo back the planned, model-free field entries. A live impl would, AFTER a
  // recorded human approval, replay these entries into OLT one field at a time with a
  // verifyOltState check between each — but that path is out of scope for v1.
  return plan.entries.map((e) => ({ ...e }));
}

// ── Verification-after-action seam ─────────────────────────────────────────────
// In a live impl this re-reads OLT after a write and confirms the expected post-condition
// (the load-bearing "verify-after-action" control). STUB: returns ok with no mismatches
// for a stub session (there is no real OLT to disagree with). LIVE: not wired in v1.
export async function verifyOltState(
  session: OltSession,
  expectation: OltExpectation,
): Promise<OltVerifyResult> {
  if (!session.isStub) return notLive();
  void expectation; // STUB: nothing to verify against synthetic state.
  return { ok: true, mismatches: [] };
}

// ── READ surface (tier-1, scope olt:read) ──────────────────────────────────────

// Read the status of a return from OLT. STUB: synthetic, deterministic status derived
// from the ref (so the read tool + preview are fully exercisable offline). LIVE: would
// log in (credential from secret_ref), navigate, and scrape the status page — read-only,
// scoped credential, OUTSIDE model context. Not wired in v1.
export async function readReturnStatus(
  connectionId: string,
  ref: OltReturnRef,
): Promise<OltReturnStatus> {
  if (isStubConnection(connectionId)) {
    return {
      clientId: ref.clientId,
      taxYear: ref.taxYear,
      state: "in_progress",
      efileErrors: 0,
      lastUpdated: `${ref.taxYear + 1}-03-15`,
    };
  }
  // Real OLT read (browser scrape, read-only) would go here. Not wired in v1.
  return notLive();
}
