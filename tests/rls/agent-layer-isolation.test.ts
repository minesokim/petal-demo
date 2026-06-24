import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

// Cross-tenant RLS isolation for the agentic layer (0028_agent_layer_schema.sql):
// agent_tasks, agent_runs, action_proposals, fetch_requirements, agent_connections,
// artifacts. Firm A must not read/update/insert across into Firm B. agent_runs has
// no direct firm_id — its policy scopes via the parent task's firm, so we assert the
// join-based isolation holds too. Mirrors session-tables-isolation.test.ts.

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const TASK_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TASK_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PROP_A = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const PROP_B = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const CONN_A = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const CONN_B = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const ART_A = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1";
const ART_B = "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2";

const OWNER_A = { firm_id: A, role: "owner", user_type: "preparer" };
const OWNER_B = { firm_id: B, role: "owner", user_type: "preparer" };

let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A'), ('${B}','org_b','Firm B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('h-a','${A}','HH A','individual','Standard',2024), ('h-b','${B}','HH B','individual','Standard',2024);

    insert into agent_tasks (id, firm_id, client_id, kind, tier, status) values
      ('${TASK_A}','${A}','h-a','collect_docs',2,'pending'),
      ('${TASK_B}','${B}','h-b','collect_docs',2,'pending');

    insert into agent_runs (task_id, role, model, transcript) values
      ('${TASK_A}','planner','claude','{"note":"secret A"}'),
      ('${TASK_B}','planner','claude','{"note":"secret B"}');

    insert into action_proposals (id, task_id, firm_id, client_id, tool_name, rationale, status) values
      ('${PROP_A}','${TASK_A}','${A}','h-a','send_email','because A','pending'),
      ('${PROP_B}','${TASK_B}','${B}','h-b','send_email','because B','pending');

    insert into agent_connections (id, firm_id, client_id, provider, auth_type, scopes, secret_ref, status) values
      ('${CONN_A}','${A}','h-a','gmail','oauth','["read"]','vault://a','connected'),
      ('${CONN_B}','${B}','h-b','gmail','oauth','["read"]','vault://b','connected');

    insert into fetch_requirements (firm_id, client_id, period, item, source_type, fetch_method, status) values
      ('${A}','h-a','2024','W-2','client_upload','manual','needed'),
      ('${B}','h-b','2024','W-2','client_upload','manual','needed');

    insert into artifacts (id, task_id, firm_id, client_id, type, content) values
      ('${ART_A}','${TASK_A}','${A}','h-a','brief','{"x":"A"}'),
      ('${ART_B}','${TASK_B}','${B}','h-b','brief','{"x":"B"}');
  `);
});

describe("RLS isolation — agentic layer (0028)", () => {
  it("a firm reads ONLY its own agent_tasks", async () => {
    const kinds = await asTenant(db, OWNER_A, async (d) =>
      (await d.query<{ id: string }>("select id from agent_tasks")).rows.map((r) => r.id),
    );
    expect(kinds).toEqual([TASK_A]); // B's task hidden
  });

  it("a firm cannot read another firm's task even by its exact id", async () => {
    const rows = await asTenant(db, OWNER_A, async (d) =>
      (await d.query("select id from agent_tasks where id = $1", [TASK_B])).rows,
    );
    expect(rows).toEqual([]);
  });

  it("a firm cannot insert an agent_task stamped with another firm's id (WITH CHECK)", async () => {
    await expect(
      asTenant(db, OWNER_A, async (d) => {
        await d.query("insert into agent_tasks (firm_id, kind, tier) values ($1,$2,$3)", [B, "evil", 1]);
      }),
    ).rejects.toThrow();
  });

  it("agent_runs scope via the parent task's firm — a firm reads only its own runs", async () => {
    const out = await asTenant(db, OWNER_A, async (d) =>
      (await d.query<{ transcript: { note: string } }>("select transcript from agent_runs")).rows.map((r) => r.transcript.note),
    );
    expect(out).toEqual(["secret A"]); // B's run hidden (join-based policy)
  });

  it("a firm cannot attach an agent_run to another firm's task (WITH CHECK via join)", async () => {
    await expect(
      asTenant(db, OWNER_A, async (d) => {
        await d.query("insert into agent_runs (task_id, role, model) values ($1,$2,$3)", [TASK_B, "planner", "claude"]);
      }),
    ).rejects.toThrow();
  });

  it("a firm reads ONLY its own action_proposals and cannot update another firm's", async () => {
    const mine = await asTenant(db, OWNER_A, async (d) =>
      (await d.query<{ id: string }>("select id from action_proposals")).rows.map((r) => r.id),
    );
    expect(mine).toEqual([PROP_A]);

    // Cross-tenant UPDATE affects zero rows (B's proposal invisible to A).
    const updated = await asTenant(db, OWNER_A, async (d) =>
      (await d.query("update action_proposals set status = 'approved' where id = $1 returning id", [PROP_B])).rows,
    );
    expect(updated).toEqual([]);
  });

  it("a firm reads ONLY its own fetch_requirements — even by another firm's client+period", async () => {
    const out = await asTenant(db, OWNER_A, async (d) => ({
      mine: (await d.query<{ item: string }>("select item from fetch_requirements")).rows.map((r) => r.item),
      foreign: (await d.query("select item from fetch_requirements where client_id = 'h-b'")).rows,
    }));
    expect(out.mine).toEqual(["W-2"]);
    expect(out.foreign).toEqual([]); // filtered by firm_id, not just client_id
  });

  it("a firm reads ONLY its own agent_connections (secret_ref never crosses tenants)", async () => {
    const refs = await asTenant(db, OWNER_B, async (d) =>
      (await d.query<{ secret_ref: string }>("select secret_ref from agent_connections")).rows.map((r) => r.secret_ref),
    );
    expect(refs).toEqual(["vault://b"]); // A's secret_ref hidden
  });

  it("a firm reads ONLY its own artifacts and cannot read another firm's by id", async () => {
    const out = await asTenant(db, OWNER_A, async (d) => ({
      mine: (await d.query<{ id: string }>("select id from artifacts")).rows.map((r) => r.id),
      byId: (await d.query("select id from artifacts where id = $1", [ART_B])).rows,
    }));
    expect(out.mine).toEqual([ART_A]);
    expect(out.byId).toEqual([]);
  });

  it("a firm cannot insert an artifact stamped with another firm's id (WITH CHECK)", async () => {
    await expect(
      asTenant(db, OWNER_A, async (d) => {
        await d.query("insert into artifacts (task_id, firm_id, type) values ($1,$2,$3)", [TASK_A, B, "brief"]);
      }),
    ).rejects.toThrow();
  });
});
