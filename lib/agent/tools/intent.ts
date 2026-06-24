// Intent tools — the capabilities the UNIFIED model-driven agent chooses from. These are the
// tools that let the model resolve a natural-language request without any trigger-word routing:
// it can find a client by name/email, pull a client's detail, research a tax question (always
// cited), compute a defensible figure, or draft an email. They are all READ access (access:
// "read") because none of them MUTATE firm state — they auto-execute inside the agent loop so
// the model can chain lookup → act in a single turn. The external WRITES (send_sms, create_*,
// request_documents, …) stay in core.ts as tier-3 staged proposals; the model stages those for
// the preparer to confirm.
//
// §7216 posture, per tool:
//   - find_client / get_client_detail read RLS-scoped firm data via loadFirmData and return
//     CONTACT + workflow fields only (NEVER SSN/EIN). The runner additionally redacts every
//     read-tool output before it re-enters the model context (HIGH-5), so this is defense in
//     depth, not the only control.
//   - tax_research runs lib/research over PUBLIC authority only (no taxpayer data) — synthetic
//     scope, always clears.
//   - tax_compute runs lib/tax-ai on inputs the model proposes — deterministic arithmetic, no
//     PII leaves the process.
//   - draft_email DRAFTS only. There is no email SEND provider wired in v1, so this returns the
//     drafted subject + body as an artifact for the preparer to review/copy; the result says so.

import { z } from "zod";
import type { AgentTool } from "../registry";
import { loadFirmData } from "@/lib/server/firm-data";
import { researchAnswer } from "@/lib/research/engine";
import { compute, ComputeRequest } from "@/lib/tax-ai/compute";
import { lookupParameter, type ParameterProvision } from "@/lib/tax/figures/params";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import type { Jurisdiction } from "@/lib/tax/types";

async function firm() {
  return loadFirmData();
}

// Fuzzy contains match (case-insensitive). The model passes a name/email fragment; we match it
// against household names, person names, and person emails so "email Haokun" or "text marcus"
// or a partial email all resolve to the right household.
function matches(haystack: string | undefined | null, needle: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const INTENT_TOOLS: AgentTool[] = [
  {
    name: "find_client",
    description:
      "Fuzzy-find a client (household) by a name or email fragment. Use this FIRST to resolve a person mentioned in natural language (e.g. \"email Haokun\", \"text Marcus\") to a householdId before acting. Returns matching households with their id, name, kind, service tier, and contact people (name/role/email/phone). NEVER invent an id — always resolve it here.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({ query: z.string().min(1) }),
    run: async (a) => {
      const q = (a.query as string).trim();
      const data = await firm();
      const peopleByHh = new Map<string, typeof data.people>();
      for (const p of data.people) {
        const list = peopleByHh.get(p.householdId) ?? [];
        list.push(p);
        peopleByHh.set(p.householdId, list);
      }
      const hits = data.households.filter((h) => {
        if (matches(h.name, q)) return true;
        const ppl = peopleByHh.get(h.id) ?? [];
        return ppl.some((p) => matches(p.name, q) || matches(p.email, q));
      });
      return {
        query: q,
        matches: hits.map((h) => ({
          id: h.id,
          name: h.name,
          kind: h.kind,
          serviceTier: h.serviceTier,
          contacts: (peopleByHh.get(h.id) ?? []).map((p) => ({
            name: p.name,
            role: p.role,
            email: p.email,
            phone: p.phone,
          })),
        })),
      };
    },
    describe: (a) => `Find client matching "${a.query}"`,
  },
  {
    name: "get_client_detail",
    description:
      "Get a client's detail by householdId: their people (with role/email/phone), active engagements (form/taxYear/stage), open tasks (title/status), and recent expected documents (type/status). RLS-scoped; NEVER returns SSN/EIN. Use after find_client to ground a reply in the client's actual state.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({ householdId: z.string().min(1) }),
    run: async (a) => {
      const id = a.householdId as string;
      const data = await firm();
      const household = data.households.find((h) => h.id === id);
      if (!household) return { householdId: id, found: false };
      const people = data.people
        .filter((p) => p.householdId === id)
        .map((p) => ({ name: p.name, role: p.role, email: p.email, phone: p.phone }));
      const engagements = data.engagements
        .filter((e) => e.householdId === id)
        .map((e) => ({ id: e.id, form: e.form, taxYear: e.taxYear, stage: e.stage }));
      const engagementIds = new Set(engagements.map((e) => e.id));
      const openTasks = data.tasks
        .filter((t) => t.householdId === id && t.status !== "done")
        .map((t) => ({ id: t.id, title: t.title, status: t.status }));
      const recentDocs = data.expectedDocs
        .filter((d) => engagementIds.has(d.engagementId))
        .map((d) => ({ type: d.type, status: d.status, when: d.when }));
      return {
        householdId: id,
        found: true,
        name: household.name,
        kind: household.kind,
        serviceTier: household.serviceTier,
        people,
        engagements,
        openTasks,
        recentDocs,
      };
    },
    describe: (a) => `Get detail for client ${a.householdId}`,
  },
  {
    name: "tax_research",
    description:
      "Answer a tax-law QUESTION from primary authority, always cited. Use for any rule/threshold/conformity/treatment question (e.g. \"what is the SALT cap for 2026\"). Returns a SourcedAnswer: the prose answer, its citations (cite + sourceUrl), a bucket (answer | hedge | coverage_gap), an optional currency note, and review notes. Public authority only — never pass taxpayer data here.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({
      question: z.string().min(1),
      taxYear: z.number().int().min(2020).max(2030).optional(),
      jurisdiction: z.enum(["federal", "CA"]).optional(),
    }),
    run: async (a) => {
      const proposer = new AnthropicProvider(undefined, "claude-sonnet-4-6");
      // In-chat FAST path: skip the adversarial Opus freshness judge (a slow extra model call).
      // Grounding still holds — retrieval is year/jurisdiction-filtered + supersession-dropped,
      // and the numeric + citation-verify gates run. The full judge stays on /api/research.
      const result = await researchAnswer(proposer, undefined, a.question as string, {
        taxYear: (a.taxYear as number) ?? 2025,
        jurisdiction: ((a.jurisdiction as Jurisdiction) ?? "federal"),
      });
      // Map the internal `abstain` bucket to the observable `hedge` (same as /api/research).
      const bucket = result.bucket === "abstain" ? "hedge" : result.bucket;
      return {
        answer: result.answer,
        bucket,
        citations: result.citations.map((c) => ({ cite: c.cite, sourceUrl: c.sourceUrl, authority: c.authority })),
        currencyNote: result.currencyNote,
        reviewNotes: result.reviewNotes,
        computation: result.computation
          ? { worksheet: result.computation.worksheet, value: result.computation.value, taxYear: result.computation.taxYear }
          : undefined,
      };
    },
    describe: (a) => `Research: "${String(a.question).slice(0, 70)}"`,
  },
  {
    name: "tax_compute",
    description:
      "Compute a defensible tax figure with the DETERMINISTIC engine (the model proposes inputs; lib/tax does the arithmetic). worksheet is one of eitc | ctc | aotc | qbi | standardDeduction | saltCap | tipsDeduction | overtimeDeduction | seniorDeduction; facts is that worksheet's inputs. Returns the computed value, an auditable line trace, and citations. Use for a named credit/deduction figure (e.g. an EITC ask).",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({
      worksheet: z.string().min(1),
      facts: z.record(z.unknown()),
      taxYear: z.number().int().min(2020).max(2030).optional(),
    }),
    run: async (a) => {
      const request = ComputeRequest.parse({ worksheet: a.worksheet, facts: a.facts });
      const out = compute(request, (a.taxYear as number) ?? 2025);
      return {
        worksheet: out.worksheet,
        value: out.result.value,
        taxYear: out.taxYear,
        trace: out.result.lines,
        citations: out.result.citations.map((c) => ({ cite: c.cite })),
      };
    },
    describe: (a) => `Compute ${a.worksheet}`,
  },
  {
    name: "tax_param",
    description:
      "Look up a SETTLED, published tax parameter (a cap, threshold, rate, phase-out, floor, or standard amount) by name and year — a DETERMINISTIC keyed lookup of lib/tax's cited figures, NOT the model's memory and NOT corpus search. Use this FIRST for any \"what IS the X for year Y\" figure question (SALT cap, tips/overtime cap, senior deduction, QBI threshold, standard deduction, child tax credit). provision is one of: salt_cap | tips_deduction | overtime_deduction | senior_deduction | qbi_threshold | standard_deduction | child_tax_credit. Returns the value(s) with their official source cite — ground the number EXACTLY as returned. If it returns found:false, fall back to tax_research; do not state a figure from memory.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({
      provision: z.enum(["salt_cap", "tips_deduction", "overtime_deduction", "senior_deduction", "qbi_threshold", "standard_deduction", "child_tax_credit"]),
      taxYear: z.number().int().min(2020).max(2030).optional(),
    }),
    run: async (a) => {
      const result = lookupParameter(a.provision as ParameterProvision, (a.taxYear as number) ?? 2025, "federal");
      if (!result) return { found: false, note: "No confirmed figure for that provision/year — use tax_research to ground it, or hedge honestly. Do NOT state a number from memory." };
      return {
        found: true,
        provision: result.provision,
        taxYear: result.taxYear,
        summary: result.summary,
        facts: result.facts,
        citations: result.citations.map((c) => ({ cite: c.cite, sourceUrl: c.sourceUrl, authority: c.authority })),
      };
    },
    describe: (a) => `Look up ${a.provision} (${a.taxYear ?? 2025})`,
  },
  {
    name: "draft_email",
    description:
      "DRAFT an email body for review. Provide subject + goal (what the email should accomplish); optionally a householdId (find it with find_client) or a to address. Returns the drafted subject + body. To actually SEND it, call send_email with the same subject + body (it goes out through the firm's connected Gmail and is staged for the preparer to confirm). Use this to compose, then send_email to deliver.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({
      householdId: z.string().optional(),
      to: z.string().optional(),
      subject: z.string().min(1),
      goal: z.string().min(1),
    }),
    run: async (a) => {
      let to = (a.to as string | undefined) ?? undefined;
      let clientName: string | undefined;
      if (a.householdId) {
        const data = await firm();
        const hh = data.households.find((h) => h.id === a.householdId);
        clientName = hh?.name;
        if (!to) {
          const primary = data.people.find((p) => p.householdId === a.householdId);
          to = primary?.email;
        }
      }
      // Draft the body with the model (text only, redacted by the provider). DRAFT-ONLY — no send.
      const provider = new AnthropicProvider(undefined, "claude-sonnet-4-6");
      const { text } = await provider.generateText({
        system:
          "You are Petal, drafting a short, professional email on behalf of a US tax preparer. Write only the email body (no subject line, no preamble). Warm but concise; no emojis; no em dashes.",
        prompt:
          `Goal: ${a.goal}\nSubject: ${a.subject}` +
          (clientName ? `\nClient: ${clientName}` : "") +
          (to ? `\nTo: ${to}` : ""),
        maxTokens: 600,
      });
      return {
        draftOnly: true,
        note: "Draft ready. To deliver it, call send_email with this subject + body (sends via the firm's Gmail, confirm-gated).",
        to,
        subject: a.subject,
        body: text,
      };
    },
    describe: (a) => `Draft email: "${a.subject}"`,
  },
];

export default INTENT_TOOLS;
