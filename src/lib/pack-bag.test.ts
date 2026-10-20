import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BINS, FAULTS, GOOD_ITEMS, makeRound, scoreRound } from "./pack-bag.ts";

/** A repeatable random sequence for the tests. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("pack the bag", () => {
  it("every good item belongs to a real bin", () => {
    const ids = new Set(BINS.map((b) => b.id));
    for (const i of GOOD_ITEMS) assert.ok(ids.has(i.bin), i.name);
    assert.ok(GOOD_ITEMS.length > 50);
  });

  it("a round has one item from every tray or pouch, and two faults", () => {
    for (let seed = 1; seed < 30; seed++) {
      const round = makeRound(seeded(seed));
      assert.equal(round.length, 11);
      for (const bin of ["airway", "circulation", "wound", "monitor", "ppe", "drugs"]) assert.ok(round.some((i) => i.bin === bin), `${bin}, seed ${seed}`);
      assert.equal(round.filter((i) => i.fault).length, 2);
      assert.equal(new Set(round.map((i) => i.name + i.detail)).size, round.length, "no repeats");
    }
  });

  it("scores right answers, wrong trays and critical fails", () => {
    const good = GOOD_ITEMS.find((i) => i.bin === "airway")!;
    const fault = FAULTS[0];
    const clean = scoreRound([
      { item: good, bin: "airway" },
      { item: fault, bin: "replace" },
    ]);
    assert.equal(clean.clean, true);
    const bad = scoreRound([
      { item: good, bin: "drugs" },
      { item: fault, bin: "circulation" },
    ]);
    assert.equal(bad.right, 0);
    assert.equal(bad.criticalFails.length, 1);
    assert.equal(bad.wrongBin.length, 1);
  });
});
