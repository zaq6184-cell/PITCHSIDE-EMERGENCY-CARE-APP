import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BLEEDING, getRegion, ottawaAnkle, ottawaKnee, type RegionId, REGIONS, TOOTH_MINUTES, toothClock } from "./injuries.ts";

const none = { malleolarPain: true, midfootPain: false, lateralMalleolus: false, medialMalleolus: false, fifthMetatarsal: false, navicular: false, fourSteps: true };
const xray = (f: typeof none) => {
  const { ankle, foot } = ottawaAnkle(f);
  return { ankle, foot };
};
const knee = { age55: false, patella: false, fibularHead: false, flex90: true, fourSteps: true };

describe("injuries", () => {
  it("Ottawa ankle: no tenderness and four steps means no X-ray", () => {
    assert.deepEqual(xray(none), { ankle: false, foot: false });
  });

  it("Ottawa ankle: malleolar tenderness asks for an ankle X-ray, midfoot tenderness for a foot X-ray", () => {
    assert.deepEqual(xray({ ...none, lateralMalleolus: true }), { ankle: true, foot: false });
    assert.deepEqual(xray({ ...none, medialMalleolus: true }), { ankle: true, foot: false });
    // tenderness at C or D counts as midfoot pain, even when only ankle pain was ticked
    assert.deepEqual(xray({ ...none, fifthMetatarsal: true }), { ankle: false, foot: true });
    assert.deepEqual(xray({ ...none, navicular: true }), { ankle: false, foot: true });
  });

  it("Ottawa ankle: unable to take four steps asks for the X-ray of the zone that hurts", () => {
    assert.deepEqual(xray({ ...none, fourSteps: false }), { ankle: true, foot: false });
    assert.deepEqual(xray({ ...none, malleolarPain: false, midfootPain: true, fourSteps: false }), { ankle: false, foot: true });
    assert.deepEqual(xray({ ...none, midfootPain: true, fourSteps: false }), { ankle: true, foot: true });
    assert.deepEqual(xray({ ...none, malleolarPain: false, fourSteps: false }), { ankle: false, foot: false });
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
    assert.equal(getRegion("head")?.toothClock, true);
  });

  it("covers FIFA's trauma chapter: pelvis, flail chest, tension pneumothorax, posterior collarbone, elbow", () => {
    const all = REGIONS.flatMap((r) => r.cards.map((c) => c.title)).join(" | ");
    for (const t of ["Possible pelvic fracture", "Dislocated hip", "Flail chest", "Tension pneumothorax", "Collarbone driven in at the breastbone", "Dislocated elbow", "Jaw and cheekbone", "Fracture-dislocated ankle"]) {
      assert.ok(all.includes(t), t);
    }
  });

  it("cites the bleeding rule as Law 5 and the tooth as 30 minutes", () => {
    const text = JSON.stringify([REGIONS, BLEEDING]);
    assert.ok(!text.includes("Law 4"));
    assert.match(BLEEDING.lines.join(" "), /\(Law 5\)/);
    assert.match(getRegion("head")!.cards.find((c) => c.title === "Knocked-out tooth")!.lines.join(" "), /within 30 minutes/);
  });

  it("keeps the details FIFA gives", () => {
    const card = (region: RegionId, title: string) => getRegion(region)!.cards.find((c) => c.title === title)!.lines.join(" ");
    assert.match(card("head", "Nose"), /usually on both sides/);
    assert.match(card("head", "Knocked-out tooth"), /upper or lower jaw/);
    assert.match(card("head", "Knocked-out tooth"), /iced salt water/);
    assert.match(card("chest", "Tension pneumothorax"), /only with shock, collapse or a peri-arrest state/);
    assert.match(card("chest", "Ribs"), /No Entonox \(gas and air\) for a possible rib fracture or pneumothorax/);
    assert.doesNotMatch(card("abdomen", "A knee or collision to the belly, lower ribs or back"), /left shoulder/);
    assert.match(card("abdomen", "A knee or collision to the belly, lower ribs or back"), /90 mmHg, no higher/);
  });

  it("tooth clock: replant, hurry in the last 10 minutes, then late", () => {
    assert.deepEqual(toothClock(0), { elapsed: 0, left: TOOTH_MINUTES * 60, stage: "replant" });
    assert.equal(toothClock(19 * 60_000).stage, "replant");
    assert.equal(toothClock(20 * 60_000).stage, "hurry");
    assert.equal(toothClock(29 * 60_000 + 59_000).stage, "hurry");
    assert.equal(toothClock(30 * 60_000).stage, "late");
    assert.equal(toothClock(45 * 60_000).left, 0);
    assert.equal(toothClock(-5000).elapsed, 0);
  });
});
