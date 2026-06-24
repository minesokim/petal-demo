import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, asTenant } from "../helpers/db";

// Cross-tenant RLS isolation for the tables added this session: chat_threads /
// chat_messages (#42) and firm_files.household_id (#35). Locks in the security fixes
// from the adversarial review (esp. the chat cross-tenant write).

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const THREAD_A = "33333333-3333-3333-3333-333333333333";
const THREAD_B = "44444444-4444-4444-4444-444444444444";
let db: PGlite;

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A'), ('${B}','org_b','Firm B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('h-a','${A}','HH A','individual','Standard',2024), ('h-b','${B}','HH B','individual','Standard',2024);
    insert into firm_folders (id, firm_id, name) values ('fold-a','${A}','Uploads'), ('fold-b','${B}','Uploads');
    insert into firm_files (id, firm_id, folder_id, household_id, name, kind, ts) values
      ('file-a','${A}','fold-a','h-a','A.pdf','pdf',1), ('file-b','${B}','fold-b','h-b','B.pdf','pdf',1);
    insert into chat_threads (id, firm_id, title) values ('${THREAD_A}','${A}','A chat'), ('${THREAD_B}','${B}','B chat');
    insert into chat_messages (thread_id, firm_id, role, content) values
      ('${THREAD_A}','${A}','user','secret A'), ('${THREAD_B}','${B}','user','secret B');
  `);
});

describe("RLS isolation — chat history (#42)", () => {
  it("a firm reads ONLY its own threads + messages", async () => {
    const out = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => ({
      threads: (await d.query<{ title: string }>("select title from chat_threads")).rows.map((r) => r.title),
      messages: (await d.query<{ content: string }>("select content from chat_messages")).rows.map((r) => r.content),
    }));
    expect(out.threads).toEqual(["A chat"]); // B's thread hidden
    expect(out.messages).toEqual(["secret A"]); // B's message hidden
  });

  it("a firm cannot insert a chat_message stamped with another firm's id (RLS WITH CHECK)", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query("insert into chat_messages (thread_id, firm_id, role, content) values ($1,$2,$3,$4)", [THREAD_A, B, "user", "evil"]);
      }),
    ).rejects.toThrow();
  });

  it("a firm cannot read another firm's thread even by its exact id", async () => {
    const rows = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) =>
      (await d.query<{ id: string }>("select id from chat_threads where id = $1", [THREAD_B])).rows,
    );
    expect(rows).toEqual([]);
  });
});

describe("RLS isolation — firm_files household tagging (#35)", () => {
  it("a firm reads ONLY its own files — even querying by another firm's household id", async () => {
    const out = await asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => ({
      mine: (await d.query<{ name: string }>("select name from firm_files")).rows.map((r) => r.name),
      byForeignHousehold: (await d.query<{ name: string }>("select name from firm_files where household_id = 'h-b'")).rows.map((r) => r.name),
    }));
    expect(out.mine).toEqual(["A.pdf"]); // B's file hidden
    expect(out.byForeignHousehold).toEqual([]); // RLS filters by firm_id, not just household_id
  });

  it("a firm cannot insert a firm_file stamped with another firm's id", async () => {
    await expect(
      asTenant(db, { firm_id: A, role: "owner", user_type: "preparer" }, async (d) => {
        await d.query("insert into firm_files (id, firm_id, folder_id, household_id, name, kind, ts) values ($1,$2,$3,$4,$5,$6,$7)", ["evil-file", B, "fold-b", "h-b", "evil.pdf", "pdf", 1]);
      }),
    ).rejects.toThrow();
  });
});
