import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { MockProvider } from "../../lib/ai/provider";
import { extractDocument, type ExtractDeps } from "../../lib/intake/extract";
import { seedManifestFromTemplate, completionFor, TEMPLATE_1040_INDIVIDUAL } from "../../lib/sor/manifest";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since)
      values ('hA','${A}','Vazquez','individual','Premium',2019);
  `);
});

const claims: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
async function asTenant<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };

// A mock provider whose analyzeDocument returns a JSON extraction (the deterministic path the
// extractor parses). textResponder is what MockProvider.analyzeDocument echoes back.
function mockDeps(extraction: object): ExtractDeps {
  const json = JSON.stringify(extraction);
  return {
    provider: new MockProvider(() => ({}), () => json),
    loadBytes: async () => "ZmFrZQ==", // base64("fake") — never sent anywhere in tests
  };
}

const W2_EXTRACTION = {
  docType: "W-2 (wages)",
  taxYear: 2025,
  parties: [{ role: "employer", name: "Acme Corp" }],
  figures: [{ label: "Box 1 wages", amount: 84000 }],
  flags: [],
};

describe("extract_document — structured extraction + manifest linking", () => {
  it("returns schema-validated fields and marks the matching requirement received with evidence", async () => {
    const out = await asTenant(async (db) => {
      const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_1040_INDIVIDUAL);
      const before = await completionFor(db as never, "hA", "2025");

      const res = await extractDocument(
        mockDeps(W2_EXTRACTION),
        {
          doc: { storageKey: `${A}/abc-w2.pdf`, mediaType: "application/pdf", fileName: "w2.pdf" },
          docTypeHint: "W-2",
          manifest: { clientId: "hA", period: "2025" },
          scope: "synthetic",
        },
        { db: db as never, ctx },
      );

      const after = await completionFor(db as never, "hA", "2025");
      const linked = res.linkedRequirementId
        ? (await db.select().from(schema.fetchRequirements).where(eq(schema.fetchRequirements.id, res.linkedRequirementId)))[0]
        : null;
      return { seed, before, res, after, linked };
    });

    expect(out.res.gated).toBe(false);
    expect(out.res.fields?.docType).toBe("W-2 (wages)");
    expect(out.res.fields?.figures[0]?.amount).toBe(84000);
    // a fetch_requirement was advanced to received with the document as evidence
    expect(out.res.linkedRequirementId).toBeTruthy();
    expect(out.res.evidenceKey).toBe(`${A}/abc-w2.pdf`);
    expect(out.linked?.status).toBe("received");
    expect(out.linked?.evidenceR2Key).toBe(`${A}/abc-w2.pdf`);
    // completion ticked up by exactly one received item
    expect(out.after.received).toBe(out.before.received + 1);
  });

  it("§7216 gate: scope 'real' (uncleared) returns gated and never touches the manifest", async () => {
    const out = await asTenant(async (db) => {
      const seed = await seedManifestFromTemplate(db as never, ctx, "hA", "2025", TEMPLATE_1040_INDIVIDUAL);
      const res = await extractDocument(
        mockDeps(W2_EXTRACTION),
        {
          doc: { storageKey: `${A}/abc-w2.pdf`, mediaType: "application/pdf", fileName: "w2.pdf" },
          docTypeHint: "W-2",
          manifest: { clientId: "hA", period: "2025" },
          scope: "real", // PETAL_7216_CLEARED is unset in tests → gated
        },
        { db: db as never, ctx },
      );
      const roll = await completionFor(db as never, "hA", "2025");
      return { seed, res, roll };
    });
    expect(out.res.gated).toBe(true);
    expect(out.res.fields).toBeNull();
    expect(out.res.linkedRequirementId).toBeNull();
    expect(out.roll.received).toBe(0); // manifest untouched
  });

  it("no manifest target: returns fields without linking anything", async () => {
    const res = await extractDocument(mockDeps(W2_EXTRACTION), {
      doc: { storageKey: "k", mediaType: "image/png", fileName: "w2.png" },
      docTypeHint: "W-2",
      scope: "synthetic",
    });
    expect(res.gated).toBe(false);
    expect(res.fields?.docType).toBe("W-2 (wages)");
    expect(res.linkedRequirementId).toBeNull();
  });
});
