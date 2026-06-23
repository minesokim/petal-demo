import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { assertCleared } from "@/lib/ai/guard";

// ⑥ OLT (OnLine Taxes) browser automation via Stagehand on Browserbase (hosted, verified
// connectivity live). Petal OPERATES OLT to PULL a return's figures and reconcile them
// against source docs. Hard rules:
//  - Extracted data is AI output → it goes to the AI-quarantine (ai_suggestions,
//    pending_review), NEVER written to production directly (human promotes).
//  - Runs ONLY on §7216-cleared returns — the CALLER enforces that gate; this module
//    refuses to assume it. Real taxpayer data must not flow here until counsel clears it.
//  - Credentials are the firm's; they pass through to OLT's own login, never stored here.

const OLT_LOGIN_URL = "https://www.olt.com/main/home/login.asp";

// The structured shape we pull. Strings (verbatim transcription), nullable when not present.
export const ReturnPull = z.object({
  taxYear: z.number().int().nullable(),
  filingStatus: z.string().nullable(),
  wages: z.string().nullable(),
  federalWithholding: z.string().nullable(),
  agi: z.string().nullable(),
  refundOrBalanceDue: z.string().nullable(),
  forms: z.array(z.string()),
});
export type ReturnPull = z.infer<typeof ReturnPull>;

export function makeStagehand(): Stagehand {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("BROWSERBASE_API_KEY / BROWSERBASE_PROJECT_ID not set");
  // Model defaults from env (ANTHROPIC_API_KEY → ZDR-eligible Opus); Stagehand drives the
  // page via the model. env=BROWSERBASE runs the browser hosted (connectivity verified live).
  return new Stagehand({ env: "BROWSERBASE", apiKey, projectId });
}

export class OltPuller {
  constructor(private sh: Stagehand = makeStagehand()) {}

  async start() { await this.sh.init(); }
  async stop() { await this.sh.close(); }

  // The firm's OLT credentials drive OLT's own login (handed straight to the page).
  async login(username: string, password: string) {
    await this.sh.context.newPage(OLT_LOGIN_URL);
    await this.sh.act(`Log in with username "${username}" and password "${password}"`);
  }

  // Pull the current return's figures as structured, schema-validated data for the quarantine
  // queue. Model-driven (no brittle selectors); verbatim transcription only.
  async pullReturn(): Promise<ReturnPull> {
    // §7216 code-gate (enforcement point, not a comment): OLT pulls run on
    // §7216-cleared returns, which today are synthetic/public. If real taxpayer
    // returns are ever driven through OLT, switch this to assertCleared('real') —
    // which throws until counsel clears real-data AI via PETAL_7216_CLEARED.
    assertCleared("synthetic");
    await this.sh.act("Open the current tax return summary page");
    const res = await this.sh.extract("Extract the return's key figures", ReturnPull);
    return ReturnPull.parse(res);
  }
}
