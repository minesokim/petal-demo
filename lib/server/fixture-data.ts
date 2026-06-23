import * as fx from "../fixtures/firm";
import * as fxDocs from "../fixtures/firm-files";

// The base dataset the dashboard derives everything from. Same shape whether it
// comes from the repository (real, RLS-scoped) or the fixtures (fallback) — so
// derive.ts and every component stay byte-identical.
export type FirmData = {
  households: typeof fx.households;
  people: typeof fx.people;
  entities: typeof fx.entities;
  engagements: typeof fx.engagements;
  expectedDocs: typeof fx.expectedDocs;
  tasks: typeof fx.tasks;
  notices: typeof fx.notices;
  skills: typeof fx.skills;
  positions: typeof fx.positions;
  skillRuns: typeof fx.skillRuns;
  activity: typeof fx.activity;
  threads: typeof fx.threads;
  // The signed-in preparer + their firm (real identity, not the demo owner). Used for the
  // greeting ("Good morning, {firstName}") and "this week at {firm.name}".
  viewer: { firstName: string; fullName: string };
  firm: { name: string };
};

export function fixtureFirmData(): FirmData {
  return {
    households: fx.households,
    people: fx.people,
    entities: fx.entities,
    engagements: fx.engagements,
    expectedDocs: fx.expectedDocs,
    tasks: fx.tasks,
    notices: fx.notices,
    skills: fx.skills,
    positions: fx.positions,
    skillRuns: fx.skillRuns,
    activity: fx.activity,
    threads: fx.threads,
    viewer: { firstName: "Antonio", fullName: "Antonio Vazquez" },
    firm: { name: "Vazant EA" },
  };
}

// ③ Document-library shape (same whether real or fixtures). Client-safe (this
// module imports only fixtures), so client components may import the type.
export type FirmDocsData = {
  firmFolders: typeof fxDocs.firmFolders;
  recentFirmFiles: typeof fxDocs.recentFirmFiles;
  starredFirmFiles: typeof fxDocs.starredFirmFiles;
  allFirmFiles: typeof fxDocs.allFirmFiles;
  firmFileCount: number;
};

export function fixtureFirmDocs(): FirmDocsData {
  return {
    firmFolders: fxDocs.firmFolders,
    recentFirmFiles: fxDocs.recentFirmFiles,
    starredFirmFiles: fxDocs.starredFirmFiles,
    allFirmFiles: fxDocs.allFirmFiles,
    firmFileCount: fxDocs.firmFileCount,
  };
}
