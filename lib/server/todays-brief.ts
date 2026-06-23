import { unstable_cache } from "next/cache";
import { z } from "zod";
import { AnthropicProvider } from "../ai/anthropic";
import { makeDerive } from "../fixtures/derive";
import { brief as FIXTURE_BRIEF, type BriefItem } from "../fixtures/firm";
import type { FirmData } from "./fixture-data";

// Today's Brief — a REAL daily situational brief, four desks:
//   irs/practice → AI-generated regulatory awareness (public, no client PII), cached daily.
//   firm         → DERIVED from the firm's real data (no AI; never leaves the server).
//   season       → date logic (the tax calendar).
// §7216: no taxpayer PII is ever sent to the model — the AI desks get only the date.

const AiBriefItem = z.object({
  desk: z.enum(["irs", "practice"]),
  tone: z.enum(["urgent", "alert", "win", "info"]),
  source: z.string(), // "IRS", "FinCEN", "Treasury", "Petal · Practice"
  headline: z.string(),
  detail: z.string(), // one line
  body: z.string(), // the full briefing
  whyItMatters: z.string().optional(),
});
const AiBrief = z.object({ items: z.array(AiBriefItem) });

const BRIEF_SYSTEM = `You write a daily situational brief for a US tax practice — like a sharp morning newspaper
for an enrolled agent / CPA. Produce SPECIFIC, currently-relevant items, not generic filler.
Desks you write: "irs" (IRS/FinCEN/Treasury/regulatory developments + new laws/guidance that
affect a tax practice right now) and "practice" (one practice-management or compliance insight
for running the firm). Ground everything in the given date and the real US tax calendar.
Be accurate and concrete about REAL programs/forms (CP2000/AUR, BOI/CTA, inflation
adjustments, §199A, estimated-tax dates, etc.). CRITICAL: do NOT fabricate specific Notice/
Rev-Proc numbers, exact effective dates, or precise dollar figures you are not certain are
real — refer to the real program/theme and keep specifics general unless you are confident.
It is better to be directionally accurate than to invent a citation. NEVER invent client data.
Each item: a punchy headline, a one-line detail, a 2-3 sentence body, and why it matters to a
small firm. Tone: urgent (act now), alert (watch), win (good news), info (context).`;

// AI desks (irs + practice), cached for the day (keyed by date → regenerates daily).
const getDailyAiDesks = unstable_cache(
  async (dateStr: string): Promise<BriefItem[]> => {
    try {
      const provider = new AnthropicProvider(undefined, "claude-haiku-4-5");
      const { object } = await provider.generateObject({
        system: BRIEF_SYSTEM,
        prompt: `Today is ${dateStr}. Write 3 "irs" desk items (the most relevant current IRS/regulatory
developments + any new law/guidance a US tax practice should know this week) and 1 "practice" desk item.
Return them in the items array.`,
        schema: AiBrief,
        maxTokens: 2200,
      });
      const dl = formatDateline(dateStr);
      return object.items.map((it, i) => ({
        id: `br-ai-${it.desk}-${i}`,
        desk: it.desk,
        tone: it.tone,
        source: it.source,
        dateline: dl,
        headline: it.headline,
        detail: it.detail,
        body: it.body,
        whyItMatters: it.whyItMatters,
      }));
    } catch {
      // AI unavailable → fall back to the curated irs/practice items so the brief never blanks.
      return FIXTURE_BRIEF.filter((b) => b.desk === "irs" || b.desk === "practice");
    }
  },
  ["todays-brief-ai-desks"],
  { revalidate: 86400 },
);

function formatDateline(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// FIRM desk — derived from the firm's REAL data (counts only, no PII, no AI).
function deriveFirmDesk(firmData: FirmData, dateline: string): BriefItem[] {
  const d = makeDerive(firmData);
  const items: BriefItem[] = [];
  const needsYou = d.needsYouCount();
  const atRisk = d.atRiskHouseholds().length;
  const fr = d.filingReadiness();
  const blocked = firmData.expectedDocs.filter((x) => x.status === "requested").length;

  if (needsYou > 0) {
    items.push({
      id: "br-firm-review", desk: "firm", tone: needsYou > 8 ? "alert" : "info",
      source: "Petal · Queue", dateline,
      headline: `${needsYou} item${needsYou === 1 ? "" : "s"} need your review`,
      detail: `Petal has drafts and decisions staged for your sign-off across the book.`,
      body: `There ${needsYou === 1 ? "is" : "are"} ${needsYou} item${needsYou === 1 ? "" : "s"} in your review queue — drafts, approvals, and decisions Petal has prepared and is holding for your sign-off. Clearing these keeps returns moving toward filing.`,
      whyItMatters: atRisk > 0 ? `${atRisk} client${atRisk === 1 ? "" : "s"} ${atRisk === 1 ? "is" : "are"} flagged at-risk — those are worth taking first.` : undefined,
      action: { label: "Start reviewing", href: "/os/review" },
    });
  }
  if (blocked > 0) {
    items.push({
      id: "br-firm-blocked", desk: "firm", tone: "alert",
      source: "Petal · Documents", dateline,
      headline: `${blocked} return${blocked === 1 ? "" : "s"} blocked on missing documents`,
      detail: `Preparation can't advance until requested client documents arrive.`,
      body: `${blocked} expected document${blocked === 1 ? " is" : "s are"} still outstanding across your engagements. Petal is chasing them; until they land, the affected returns can't move to preparation.`,
      action: { label: "Open documents", href: "/os/documents" },
    });
  }
  if (fr && typeof fr.filed === "number") {
    items.push({
      id: "br-firm-readiness", desk: "firm", tone: fr.atRisk > 0 ? "info" : "win",
      source: "Petal · Filing", dateline,
      headline: `Filing readiness: ${fr.filed} filed, ${fr.onTrack} on track, ${fr.atRisk} at risk`,
      detail: `Where the book stands against the season's deadlines.`,
      body: `Across active returns: ${fr.filed} filed, ${fr.onTrack} on track, and ${fr.atRisk} at risk of slipping. The at-risk set is where your attention moves the needle most.`,
      action: { label: "Open Home", href: "/os/today" },
    });
  }
  return items;
}

// SEASON desk — pure date logic against the US tax calendar.
function deriveSeasonDesk(dateStr: string, dateline: string): BriefItem[] {
  const today = new Date(dateStr + "T12:00:00");
  const y = today.getFullYear();
  const items: BriefItem[] = [];
  const daysUntil = (m: number, day: number) => Math.ceil((new Date(y, m, day).getTime() - today.getTime()) / 86400000);

  const dToSep15 = daysUntil(8, 15); // business extensions + Q3 estimates
  const dToOct15 = daysUntil(9, 15); // individual extensions

  if (dToSep15 > 0 && dToSep15 <= 120) {
    items.push({
      id: "br-season-q3", desk: "season", tone: dToSep15 <= 21 ? "alert" : "info",
      source: "IRS calendar", dateline: `Sep 15`,
      headline: `Q3 estimated payments + extended business returns due Sep 15 (${dToSep15} days)`,
      detail: `1040-ES Q3 and extended S-corp/partnership returns share the September 15 deadline.`,
      body: `September 15 is the next firm-wide deadline: third-quarter individual estimated payments (1040-ES) and extended calendar-year S-corporation (1120-S) and partnership (1065) returns. Staging vouchers and extended returns now leaves room before the October crunch.`,
    });
  }
  if (dToOct15 > 0 && dToOct15 <= 150) {
    items.push({
      id: "br-season-oct", desk: "season", tone: dToOct15 <= 30 ? "alert" : "info",
      source: "IRS calendar", dateline: `Oct 15`,
      headline: `Extended individual 1040s due Oct 15 (${dToOct15} days)`,
      detail: `The extension season finish line — every 4868 return must be filed by October 15.`,
      body: `October 15 is the extended-individual-return deadline. Every client on a 4868 extension must be filed by then. This is the season's busiest stretch; the returns furthest from ready are the ones to sequence first.`,
      action: { label: "Open returns", href: "/os/clients" },
    });
  }
  return items;
}

// Compose the real brief in desk order: irs → firm → season → practice.
export async function buildTodaysBrief(firmData: FirmData, dateStr = isoToday()): Promise<BriefItem[]> {
  const dateline = formatDateline(dateStr);
  const [ai, firm, season] = await Promise.all([
    getDailyAiDesks(dateStr),
    Promise.resolve(deriveFirmDesk(firmData, dateline)),
    Promise.resolve(deriveSeasonDesk(dateStr, dateline)),
  ]);
  const irs = ai.filter((b) => b.desk === "irs");
  const practice = ai.filter((b) => b.desk === "practice");
  const composed = [...irs, ...firm, ...season, ...practice];
  // Never render a blank brief (e.g. brand-new empty firm + AI down) — fall back to curated.
  return composed.length ? composed : FIXTURE_BRIEF;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
