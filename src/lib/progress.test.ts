import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BADGES, EMPTY, earnedCount, newBadges, nextBadge, parseProgress, step } from "./progress.ts";

describe("progress", () => {
  it("earns the colours badge only when all six role cards are opened", () => {
    let p = EMPTY;
    for (const id of ["black", "orange", "red", "blue", "white"]) p = step.role(p, id);
    assert.equal(newBadges(p).some((b) => b.id === "colours"), false);
    p = step.role(p, "green");
    assert.deepEqual(newBadges(p).map((b) => b.id), ["colours"]);
  });

  it("does not count the same step twice", () => {
    const p = step.drill(step.drill(EMPTY, "spine", 3), "spine", 3);
    assert.deepEqual(p.drills.spine, [3]);
  });

  it("keeps the best quiz score", () => {
    const p = step.quiz(step.quiz(EMPTY, 9), 6);
    assert.equal(p.quizBest, 9);
  });

  it("records only clean AED runs as the best time", () => {
    let p = step.aed(EMPTY, { seconds: 15, wrong: 1, unsafe: 0 });
    assert.equal(p.aedClean, false);
    assert.equal(p.aedBest, null);
    p = step.aed(p, { seconds: 24.36, wrong: 0, unsafe: 0 });
    assert.equal(p.aedClean, true);
    assert.equal(p.aedBest, 24.4);
    p = step.aed(p, { seconds: 18, wrong: 0, unsafe: 0 });
    assert.equal(p.aedBest, 18);
    assert.ok(BADGES.find((b) => b.id === "aed-fast")!.done(p));
  });

  it("does not celebrate a badge twice", () => {
    const p = { ...step.cpr(EMPTY), badges: ["cpr"] };
    assert.equal(newBadges(p).length, 0);
    assert.equal(earnedCount(p), 1);
  });

  it("suggests the next badge in order", () => {
    assert.equal(nextBadge(EMPTY)?.id, "colours");
  });

  it("reads saved progress safely", () => {
    assert.deepEqual(parseProgress(null), EMPTY);
    assert.deepEqual(parseProgress("not json"), EMPTY);
    const p = parseProgress(JSON.stringify({ roles: ["red", 3], drills: { arrest: [1, "2"] }, quizBest: "9", placed: true }));
    assert.deepEqual(p.roles, ["red"]);
    assert.deepEqual(p.drills, { arrest: [1], spine: [] });
    assert.equal(p.quizBest, null);
    assert.equal(p.placed, true);
  });
});
