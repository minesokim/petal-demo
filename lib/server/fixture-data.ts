import * as fx from "../fixtures/firm";

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
  };
}
