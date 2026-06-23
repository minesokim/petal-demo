import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { firmFolders as fxFolders } from "../../lib/fixtures/firm-files";
import { firmFoldersWithFiles, allFirmFiles, folderById } from "../../lib/repository/documents";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const totalFiles = fxFolders.reduce((n, f) => n + f.files.length, 0);
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
  const db = drizzle(pg, { schema });
  await db.insert(schema.firmFolders).values(
    fxFolders.map((f) => ({ id: f.id, firmId: A, name: f.name, description: f.description })),
  );
  await db.insert(schema.firmFiles).values(
    fxFolders.flatMap((f) => f.files.map((file) => ({ ...file, firmId: A, folderId: f.id }))),
  );
});

async function asTenant<T>(firmId: string, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const claims: Claims = { firm_id: firmId, role: "owner", user_type: "preparer" };
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

describe("③ document library repository", () => {
  it("firmFoldersWithFiles matches the fixture shape (folders with nested files, no firm_id)", async () => {
    const folders = await asTenant(A, (db) => firmFoldersWithFiles(db as never));
    expect(folders.length).toBe(fxFolders.length);
    expect(Object.keys(folders[0]).sort()).toEqual(["description", "files", "id", "name"]);
    expect(Object.keys(folders[0].files[0]).sort()).toEqual(
      ["id", "kind", "modified", "name", "owner", "size", "starred", "ts"].sort(),
    );
    const seededFirst = fxFolders.find((f) => f.id === folders[0].id)!;
    expect(folders[0].files.length).toBe(seededFirst.files.length);
  });

  it("allFirmFiles is the flat list with folder names", async () => {
    const flat = await asTenant(A, (db) => allFirmFiles(db as never));
    expect(flat.length).toBe(totalFiles);
    expect(flat[0]).toHaveProperty("folderName");
  });

  it("folderById resolves; another firm sees nothing", async () => {
    const f = await asTenant(A, (db) => folderById(db as never, fxFolders[0].id));
    expect(f?.id).toBe(fxFolders[0].id);
    const none = await asTenant(B, (db) => firmFoldersWithFiles(db as never));
    expect(none).toEqual([]);
  });
});
