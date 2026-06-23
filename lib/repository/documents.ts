import { eq } from "drizzle-orm";
import { firmFolders, firmFiles } from "../db/schema";
import type { Db } from "./types";

// ③ Document library selectors mirroring lib/fixtures/firm-files.ts. Projects only
// fixture fields (no firm_id / storage_path / timestamps) so shapes are identical.
const folderCols = { id: firmFolders.id, name: firmFolders.name, description: firmFolders.description };
const fileCols = {
  id: firmFiles.id, name: firmFiles.name, kind: firmFiles.kind, size: firmFiles.size,
  modified: firmFiles.modified, ts: firmFiles.ts, owner: firmFiles.owner, starred: firmFiles.starred,
};

export async function listFirmFolders(db: Db) {
  return db.select(folderCols).from(firmFolders);
}
export async function folderById(db: Db, id: string) {
  const [r] = await db.select(folderCols).from(firmFolders).where(eq(firmFolders.id, id));
  return r;
}
export async function filesOf(db: Db, folderId: string) {
  return db.select(fileCols).from(firmFiles).where(eq(firmFiles.folderId, folderId));
}

// FirmFolder[] with nested files — the exact fixture `firmFolders` shape.
export async function firmFoldersWithFiles(db: Db) {
  const folders = await db.select(folderCols).from(firmFolders);
  const files = await db.select({ ...fileCols, folderId: firmFiles.folderId }).from(firmFiles);
  return folders.map((f) => ({
    ...f,
    files: files.filter((x) => x.folderId === f.id).map(({ folderId, ...rest }) => rest),
  }));
}

// FlatFile[] (file + folderId + folderName) — feeds recent/starred derivations.
export async function allFirmFiles(db: Db) {
  return db
    .select({ ...fileCols, folderId: firmFiles.folderId, folderName: firmFolders.name })
    .from(firmFiles)
    .innerJoin(firmFolders, eq(firmFiles.folderId, firmFolders.id));
}
