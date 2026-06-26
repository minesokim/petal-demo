import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "./helpers/db";
import * as schema from "../lib/db/schema";
import type { Ctx } from "../lib/repository/types";
import { createThread, appendMessage, getThreadMessages, updateMessage, getActiveRun } from "../lib/repository/chat";

// Reopening a saved chat must restore the REAL answer with its cited sources, not a plain-text rebuild.
// The sources ride along as chat_message.metadata; this proves the persist -> read round-trip preserves them.

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A');`);
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const CLAIMS: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const CTX: Ctx = { firmId: A, actorId: "alice", actorType: "preparer", role: "owner" };

describe("chat message metadata — sources survive a reopen", () => {
  it("persists an assistant turn's cited sources and reads them back intact", async () => {
    await asTenant(CLAIMS, async (db) => {
      const threadId = await createThread(db as never, CTX, { title: "SALT cap?" });
      await appendMessage(db as never, CTX, { threadId, role: "user", content: "What is the SALT cap for 2026?" });
      const citations = [{ cite: "§164(b)(6)", url: "https://www.law.cornell.edu/uscode/text/26/164", authority: "statute" }];
      await appendMessage(db as never, CTX, {
        threadId, role: "assistant", content: "The 2026 SALT cap is $40,000.",
        metadata: { citations, calibration: "grounded" },
      });

      const msgs = await getThreadMessages(db as never, threadId);
      expect(msgs.map((m) => m.role)).toEqual(["user", "assistant"]);
      const assistant = msgs.find((m) => m.role === "assistant")!;
      expect((assistant.metadata as { citations: unknown[] }).citations).toEqual(citations);
      expect((assistant.metadata as { calibration: string }).calibration).toBe("grounded");
    });
  });

  it("a turn with no metadata defaults to {} (user turns / demo answers never break the read)", async () => {
    await asTenant(CLAIMS, async (db) => {
      const threadId = await createThread(db as never, CTX, { title: "hi" });
      await appendMessage(db as never, CTX, { threadId, role: "user", content: "hello" });
      const [msg] = await getThreadMessages(db as never, threadId);
      expect(msg.metadata).toEqual({});
    });
  });
});

describe("durable runs — server-side run state survives a reload + reconnects", () => {
  it("persists a running trace, then finalizes; getActiveRun reflects the lifecycle", async () => {
    await asTenant(CLAIMS, async (db) => {
      const threadId = await createThread(db as never, CTX, { title: "QBI?" });
      // run starts: an assistant message marked running with an empty trace
      const msgId = await appendMessage(db as never, CTX, { threadId, role: "assistant", content: "", metadata: { status: "running", trace: [] } });
      // mid-run: persist the live trace (what reconnect shows)
      await updateMessage(db as never, CTX, { messageId: msgId, metadata: { status: "running", trace: [{ label: "Understanding the question" }], partialText: "QBI is" } });
      const active = await getActiveRun(db as never, threadId);
      expect(active?.id).toBe(msgId);
      expect((active!.metadata as { trace: unknown[] }).trace).toHaveLength(1);
      // finalize: the settled answer + status final → no longer an active run
      await updateMessage(db as never, CTX, { messageId: msgId, content: "The QBI deduction is 20%.", metadata: { status: "final", calibration: "grounded" } });
      expect(await getActiveRun(db as never, threadId)).toBeNull();
      const [msg] = await getThreadMessages(db as never, threadId);
      expect(msg.content).toBe("The QBI deduction is 20%.");
      expect((msg.metadata as { status: string }).status).toBe("final");
    });
  });

  it("refuses to update a message the firm cannot see (RLS guard)", async () => {
    await asTenant(CLAIMS, async (db) => {
      await expect(
        updateMessage(db as never, CTX, { messageId: "99999999-9999-9999-9999-999999999999", content: "x" }),
      ).rejects.toThrow(/not found in firm/);
    });
  });
});
