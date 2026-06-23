import { withFirm } from "../auth/tenant";
import { firmFoldersWithFiles, allFirmFiles as repoAllFirmFiles } from "../repository/documents";
import { fixtureFirmDocs, type FirmDocsData } from "./fixture-data";

// ③ Document-library seam. Real RLS-scoped data when a firm resolves, else the
// fixtures — identical shape, so the documents UI is untouched. recent/starred
// are derived here exactly as the fixture module derives them.
export async function loadFirmDocuments(): Promise<FirmDocsData> {
  const real = await withFirm(async (db) => ({
    firmFolders: await firmFoldersWithFiles(db),
    allFirmFiles: await repoAllFirmFiles(db),
  }));
  if (!real) return fixtureFirmDocs();

  const { firmFolders, allFirmFiles } = real;
  const recentFirmFiles = [...allFirmFiles].sort((a, b) => b.ts - a.ts).slice(0, 6);
  const starredFirmFiles = allFirmFiles.filter((f) => f.starred);
  return {
    firmFolders: firmFolders as FirmDocsData["firmFolders"],
    recentFirmFiles: recentFirmFiles as FirmDocsData["recentFirmFiles"],
    starredFirmFiles: starredFirmFiles as FirmDocsData["starredFirmFiles"],
    allFirmFiles: allFirmFiles as FirmDocsData["allFirmFiles"],
    firmFileCount: allFirmFiles.length,
  };
}
