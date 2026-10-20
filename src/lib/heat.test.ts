import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GOAL_MINUTES, METHODS, minutesAboveCritical, minutesToTarget, tempAt, TARGET_TEMP, zoneFor } from "./heat.ts";

describe("heat", () => {
  it("puts a WBGT reading in its zone", () => {
    assert.equal(zoneFor(20).id, "low");
    assert.equal(zoneFor(26).id, "high");
    assert.equal(zoneFor(29.5).id, "very");
    assert.equal(zoneFor(32).id, "extreme");
    assert.equal(zoneFor(40).id, "extreme");
  });

  it("only cold-water cooling at the pitch reaches the target inside 30 minutes", () => {
    const rate = (id: string) => METHODS.find((m) => m.id === id)!.rate;
    assert.ok(minutesToTarget(rate("cwi"), 3) <= GOAL_MINUTES);
    assert.ok(minutesToTarget(rate("taco"), 3) <= GOAL_MINUTES);
    assert.ok(minutesToTarget(rate("packs"), 3) > GOAL_MINUTES);
    assert.ok(minutesToTarget(rate("cwi"), 30) > GOAL_MINUTES); // transport first loses the window
  });

  it("holds the temperature until cooling starts, then falls to just below the target", () => {
    assert.equal(tempAt(2, 0.2, 3), 41.5);
    assert.ok(Math.abs(tempAt(8, 0.2, 3) - 40.5) < 1e-9);
    assert.ok(tempAt(60, 0.2, 3) < TARGET_TEMP);
    assert.ok(tempAt(60, 0.2, 3) > TARGET_TEMP - 0.5);
  });

  it("counts the minutes above 40.5 °C", () => {
    assert.equal(minutesAboveCritical(0.2, 3), 8);
    assert.equal(minutesAboveCritical(0.2, 3, 40), 0);
  });

  it("lists the methods fastest first", () => {
    for (let i = 1; i < METHODS.length; i++) assert.ok(METHODS[i - 1].rate > METHODS[i].rate);
  });
});
