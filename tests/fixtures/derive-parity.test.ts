import { describe, it, expect } from "vitest";
import { makeDerive, tieOutChecks } from "../../lib/fixtures/derive";
import { fixtureFirmData } from "../../lib/server/fixture-data";

// The factory must produce byte-identical numbers whether bound to the fixtures
// (the named exports) or to a FirmData bundle from the seam (real data path).
// tieOutChecks() encodes ~25 canonical values; all must stay ok.
describe("derive factory parity", () => {
  it("makeDerive(seam bundle) passes every tie-out check", () => {
    const d = makeDerive(fixtureFirmData());
    const failed = d.tieOutChecks().filter(c => !c.ok);
    expect(failed.map(f => `${f.surface}:${f.label}`)).toEqual([]);
    expect(d.tieOutChecks().length).toBeGreaterThan(20);
  });

  it("factory-over-seam equals the fixture-bound named exports", () => {
    const d = makeDerive(fixtureFirmData());
    expect(d.tieOutChecks().length).toBe(tieOutChecks().length);
    expect(d.needsYouCount()).toBe(12);
    expect(d.invoiceOf("h-park").balance).toBe(1140);
    expect(d.householdFee("h-park")).toBe(1900);
    expect(d.roiWeek().actions).toBe(41);
    expect(d.feesInPipeline()).toBe(9000);
    const hc = d.healthCounts();
    expect(hc.at_risk + hc.watch + hc.healthy).toBe(11);
  });

  it("the named exports themselves still tie out (frozen-UI guarantee)", () => {
    expect(tieOutChecks().every(c => c.ok)).toBe(true);
  });
});
