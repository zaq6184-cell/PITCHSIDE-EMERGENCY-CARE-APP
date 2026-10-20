import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bandText, matchClock, survivalBand, survivalMid } from "./survival.ts";

describe("survival", () => {
  it("starts at the full chance for an immediate shock", () => {
    assert.deepEqual(survivalBand(0, false), [100, 100]);
    assert.deepEqual(survivalBand(0, true), [100, 100]);
  });

  it("falls 7–10% a minute without CPR and 3–4% with it", () => {
    assert.deepEqual(survivalBand(3, false), [70, 79]);
    assert.deepEqual(survivalBand(3, true), [88, 91]);
    assert.deepEqual(survivalBand(10, true), [60, 70]);
  });

  it("never goes below zero", () => {
    assert.deepEqual(survivalBand(12, false), [0, 16]);
    assert.deepEqual(survivalBand(20, false), [0, 0]);
    assert.equal(survivalMid(20, false), 0);
  });

  it("CPR always keeps more of the chance", () => {
    for (let m = 0.5; m <= 12; m += 0.5) assert.ok(survivalMid(m, true) > survivalMid(m, false), `at ${m} min`);
  });

  it("writes the band and the match clock", () => {
    assert.equal(bandText([70, 79]), "70–79%");
    assert.equal(bandText([0, 0]), "0%");
    assert.equal(matchClock(63, 3), "66:00");
    assert.equal(matchClock(63, 2.5), "65:30");
  });
});
