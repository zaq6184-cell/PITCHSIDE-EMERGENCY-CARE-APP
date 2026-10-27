import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EMPTY, stampBadges, step } from "./progress.ts";
import { dailyRows, drillName, practiceRows, recordBadges, teamRuns } from "./record.ts";
import { answer, EMPTY_REVIEW } from "./review.ts";

describe("training record", () => {
  it("lists every badge, with the day it was earned when that was kept", () => {
    const old = { ...step.bag(EMPTY), badges: ["bag"] }; // earned before badge days were kept
    const p = stampBadges(step.cpr(old), "2026-10-27");
    const rows = recordBadges(p);
    assert.equal(rows.length, 15);
    assert.deepEqual(rows.find((b) => b.id === "cpr"), { id: "cpr", title: "In the zone", how: "30 compressions in a row at 100–120 a minute", earned: true, day: "2026-10-27" });
    assert.equal(rows.find((b) => b.id === "bag")?.day, null);
    assert.equal(rows.find((b) => b.id === "quiz")?.earned, false);
  });

  it("shows practice as numbers, Done or Not yet, and a dash for what was never tried", () => {
    let p = step.drill(step.drill(EMPTY, "arrest", 1), "arrest", 2);
    p = step.aed(step.quiz(p, 9), { seconds: 17.04, wrong: 0, unsafe: 0 });
    const rows = Object.fromEntries(practiceRows(p).map((r) => [r.label, r]));
    assert.deepEqual(rows["Cardiac arrest drill: steps watched in 3D"], { label: "Cardiac arrest drill: steps watched in 3D", value: "2 / 6", done: false });
    assert.equal(rows["Who does what?: best score"].value, "9 / 10");
    assert.equal(rows["Who does what?: best score"].done, true);
    assert.equal(rows["AED pads trainer: fastest clean run (seconds)"].value, "17.0");
    assert.equal(rows["Place the team"].value, "Not yet");
    assert.equal(practiceRows(EMPTY).find((r) => r.label.startsWith("AED"))?.value, "—");
  });

  it("sums up the Daily 5 as it stands today", () => {
    let r = EMPTY_REVIEW;
    for (const [id, right] of [
      ["a", true],
      ["b", true],
      ["c", false],
      ["d", true],
    ] as const)
      r = answer(r, id, right, "2026-10-27");
    r = { ...r, streak: { last: "2026-10-26", count: 3, best: 4 } };
    const rows = dailyRows(r, "2026-10-27").map((x) => [x.label, x.value]);
    assert.deepEqual(rows, [
      ["Daily 5: days in a row now", "3"],
      ["Daily 5: longest run of days", "4"],
      ["Questions answered", "4"],
      ["Answered right (%)", "75"],
    ]);
    assert.equal(dailyRows(EMPTY_REVIEW, "2026-10-27")[3].value, "—");
  });

  it("lists team drills newest first", () => {
    let p = step.team(EMPTY, { d: "2026-10-20", drill: "arrest", role: "red" });
    p = step.team(p, { d: "2026-10-27", drill: "spine", role: "orange" });
    assert.deepEqual(
      teamRuns(p).map((t) => t.d),
      ["2026-10-27", "2026-10-20"],
    );
    assert.equal(drillName("spine"), "Neck injury drill");
  });
});
