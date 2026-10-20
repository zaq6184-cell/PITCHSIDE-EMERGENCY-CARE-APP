import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRegion, ottawaAnkle, ottawaKnee, REGIONS } from "./injuries.ts";

const none = { lateralMalleolus: false, medialMalleolus: false, fifthMetatarsal: false, navicular: false, fourSteps: true };
const knee = { age55: false, patella: false, fibularHead: false, flex90: true, fourSteps: true };

describe("injuries", () => {
  it("Ottawa ankle: no tenderness and four steps means no X-ray", () => {
    assert.deepEqual(ottawaAnkle(none), { ankle: false, foot: false });
  });

  it("Ottawa ankle: malleolar tenderness asks for an ankle X-ray, midfoot tenderness for a foot X-ray", () => {
    assert.deepEqual(ottawaAnkle({ ...none, lateralMalleolus: true }), { ankle: true, foot: false });
    assert.deepEqual(ottawaAnkle({ ...none, medialMalleolus: true }), { ankle: true, foot: false });
    assert.deepEqual(ottawaAnkle({ ...none, fifthMetatarsal: true }), { ankle: false, foot: true });
    assert.deepEqual(ottawaAnkle({ ...none, navicular: true }), { ankle: false, foot: true });
  });

  it("Ottawa ankle: unable to take four steps asks for both", () => {
    assert.deepEqual(ottawaAnkle({ ...none, fourSteps: false }), { ankle: true, foot: true });
  });

  it("Ottawa knee: any one criterion is enough", () => {
    assert.equal(ottawaKnee(knee).xray, false);
    for (const change of [{ age55: true }, { patella: true }, { fibularHead: true }, { flex90: false }, { fourSteps: false }]) {
      const r = ottawaKnee({ ...knee, ...change });
      assert.equal(r.xray, true);
      assert.equal(r.reasons.length, 1);
    }
  });

  it("every region has at least one card, and the two rule tools are where they belong", () => {
    for (const r of REGIONS) assert.ok(r.cards.length > 0, r.id);
    assert.equal(getRegion("knee")?.ottawa, "knee");
    assert.equal(getRegion("ankle")?.ottawa, "ankle");
  });
});
