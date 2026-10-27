import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BADGES, EMPTY, earnedCount, newBadges, nextBadge, parseProgress, stampBadges, step, TEAM_RUNS_KEPT } from "./progress.ts";

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

  it("earns the new badges: all three cases, six mistakes, a clean bag", () => {
    let p = EMPTY;
    for (const id of ["vf", "commotio"]) p = step.caseSolved(p, id);
    assert.equal(BADGES.find((b) => b.id === "cases")!.done(p), false);
    p = step.caseSolved(p, "heat");
    assert.equal(BADGES.find((b) => b.id === "cases")!.done(p), true);
    for (let i = 1; i <= 6; i++) p = step.mistake(step.mistake(p, `m${i}`), `m${i}`);
    assert.equal(p.mistakes.length, 6);
    assert.equal(BADGES.find((b) => b.id === "mistakes")!.done(p), true);
    assert.equal(BADGES.find((b) => b.id === "bag")!.done(step.bag(p)), true);
    assert.equal(BADGES.length, 15);
  });

  it("earns the badges of the team drill, the Daily 5 streak and Listen mode", () => {
    const badge = (id: string) => BADGES.find((b) => b.id === id)!;
    let p = step.team(EMPTY, { d: "2026-10-27", drill: "arrest", role: "red" });
    assert.ok(badge("team").done(p));
    p = step.team(p, { d: "2026-10-27", drill: "arrest", role: "red" }); // the same drill, colour and day once
    assert.equal(p.team.length, 1);
    assert.equal(badge("streak").done(step.streak(p, 4)), false);
    assert.ok(badge("streak").done(step.streak(step.streak(p, 5), 2)), "the longest run is kept");
    assert.ok(badge("listen").done(step.listened(EMPTY, "spine")));
  });

  it("keeps only the latest team drills", () => {
    let p = EMPTY;
    for (let i = 0; i < TEAM_RUNS_KEPT + 5; i++) p = step.team(p, { d: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`, drill: "spine", role: `r${i}` });
    assert.equal(p.team.length, TEAM_RUNS_KEPT);
    assert.equal(p.team.at(-1)?.role, `r${TEAM_RUNS_KEPT + 4}`);
  });

  it("dates each badge the day it is earned, once", () => {
    const p = stampBadges(step.cpr(EMPTY), "2026-10-27");
    assert.deepEqual(p.badges, ["cpr"]);
    assert.deepEqual(p.earnedAt, { cpr: "2026-10-27" });
    const later = stampBadges(step.bag(p), "2026-10-28");
    assert.deepEqual(later.earnedAt, { cpr: "2026-10-27", bag: "2026-10-28" });
    assert.equal(stampBadges(later, "2026-11-01"), later);
  });

  it("reads saved progress safely", () => {
    assert.deepEqual(parseProgress(null), EMPTY);
    assert.deepEqual(parseProgress("not json"), EMPTY);
    const p = parseProgress(JSON.stringify({ roles: ["red", 3], drills: { arrest: [1, "2"] }, quizBest: "9", placed: true }));
    assert.deepEqual(p.roles, ["red"]);
    assert.deepEqual(p.drills, { arrest: [1], spine: [] });
    assert.equal(p.quizBest, null);
    assert.equal(p.placed, true);
    assert.deepEqual(p.team, []);
    assert.equal(p.bestStreak, 0);
    const q = parseProgress(
      JSON.stringify({
        team: [{ d: "2026-10-27", drill: "arrest", role: "green" }, { d: "today", drill: "arrest", role: "red" }, { d: "2026-10-27", drill: "swim", role: "red" }],
        listened: ["spine", "dance"],
        bestStreak: 6,
        earnedAt: { cpr: "2026-10-27", bag: 5 },
      }),
    );
    assert.deepEqual(q.team, [{ d: "2026-10-27", drill: "arrest", role: "green" }]);
    assert.deepEqual(q.listened, ["spine"]);
    assert.equal(q.bestStreak, 6);
    assert.deepEqual(q.earnedAt, { cpr: "2026-10-27" });
  });
});
