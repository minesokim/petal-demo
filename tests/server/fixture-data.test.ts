import { describe, it, expect } from "vitest";
import * as fx from "../../lib/fixtures/firm";
import { fixtureFirmData } from "../../lib/server/fixture-data";

describe("fixtureFirmData (fallback dataset)", () => {
  it("exposes the full base dataset keyed for the dashboard", () => {
    const d = fixtureFirmData();
    expect(Object.keys(d).sort()).toEqual(
      ["activity", "engagements", "entities", "expectedDocs", "households", "notices", "people",
       "positions", "skillRuns", "skills", "tasks", "threads"].sort(),
    );
    expect(d.households).toBe(fx.households);
    expect(d.tasks).toBe(fx.tasks);
    expect(d.skills.length).toBe(fx.skills.length);
    expect(d.activity).toBe(fx.activity);
    expect(d.threads).toBe(fx.threads);
  });
});
