import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addDays, dayKey } from "./day.ts";
import { answer, DAILY, doneToday, EMPTY_REVIEW, ensureToday, GAPS, parseReview, pick, questionId, type Review, streakNow } from "./review.ts";

const pool = Array.from({ length: 20 }, (_, i) => `q${i}`);
const day = "2026-10-27";

/** Answers all of today's five, in the Daily 5. */
function finish(r: Review, d: string, right = true) {
  let next = ensureToday(r, pool, d);
  for (const id of next.today!.ids) next = answer(next, id, right, d, true);
  return next;
}

describe("days", () => {
  it("counts calendar days across months and years", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
    assert.equal(dayKey(new Date(2026, 9, 7, 23, 59)), "2026-10-07");
  });
});

describe("Daily 5", () => {
  it("gives every question one lasting id, whichever game asks it", () => {
    const q = { prompt: "Who says this?", text: "“Cardiac arrest.”", answer: "black" };
    assert.equal(questionId(q), questionId({ ...q }));
    assert.notEqual(questionId(q), questionId({ ...q, answer: "red" }));
    assert.match(questionId(q), /^q[0-9a-z]+$/);
  });

  it("picks five a day, the same five all day", () => {
    const r = ensureToday(EMPTY_REVIEW, pool, day);
    assert.equal(r.today!.ids.length, DAILY);
    assert.equal(new Set(r.today!.ids).size, DAILY);
    assert.equal(ensureToday(r, pool, day), r);
    assert.deepEqual(ensureToday(EMPTY_REVIEW, pool, day).today!.ids, r.today!.ids, "a reload gives the same five");
    assert.notDeepEqual(ensureToday(EMPTY_REVIEW, pool, addDays(day, 1)).today!.ids, r.today!.ids);
  });

  it("brings a wrong answer back tomorrow, and a right one after longer gaps", () => {
    let r = answer(EMPTY_REVIEW, "q3", false, day);
    assert.deepEqual(r.cards.q3, { box: 1, due: addDays(day, 1), seen: 1, right: 0 });
    r = answer(r, "q3", true, addDays(day, 1));
    assert.equal(r.cards.q3.box, 2);
    assert.equal(r.cards.q3.due, addDays(day, 1 + GAPS[2]));
    r = answer(r, "q3", true, r.cards.q3.due);
    assert.equal(r.cards.q3.box, 3);
    r = answer(r, "q3", false, r.cards.q3.due);
    assert.equal(r.cards.q3.box, 1, "a miss sends it back to the start");
    assert.equal(r.answered, 4);
    assert.equal(r.right, 2);
  });

  it("asks what is due first, then what is new, and what is known well last", () => {
    let r = EMPTY_REVIEW;
    for (const id of pool.slice(0, 18)) r = answer(r, id, true, day); // all known, due in 2 days
    r = answer(r, "q5", false, day); // missed: due tomorrow
    const next = pick(r, pool, addDays(day, 1));
    assert.equal(next[0], "q5");
    assert.deepEqual(new Set(next.slice(1, 3)), new Set(["q18", "q19"]), "then the two never asked");
    assert.equal(next.length, DAILY);
    assert.ok(!pick(r, pool, addDays(day, 1), 5, ["q5"]).includes("q5"), "a question can be left out (more practice)");
  });

  it("ticks off today's five only in the Daily 5, and builds a streak day by day", () => {
    let r = ensureToday(EMPTY_REVIEW, pool, day);
    const first = r.today!.ids[0];
    r = answer(r, first, true, day); // from another quiz: does not tick it off
    assert.equal(Object.keys(r.today!.answers).length, 0);
    r = finish(r, day);
    assert.ok(doneToday(r, day));
    assert.deepEqual(r.streak, { last: day, count: 1, best: 1 });
    r = finish(r, addDays(day, 1), false); // wrong answers still finish the day
    assert.equal(r.streak.count, 2);
    assert.equal(streakNow(r, addDays(day, 2)), 2, "the streak holds through the next day");
    assert.equal(streakNow(r, addDays(day, 3)), 0, "and breaks after a day missed");
    r = finish(r, addDays(day, 3));
    assert.deepEqual(r.streak, { last: addDays(day, 3), count: 1, best: 2 });
  });

  it("swaps a question the app no longer asks for another", () => {
    const r = ensureToday(EMPTY_REVIEW, pool, day);
    const gone = r.today!.ids[2];
    const smaller = pool.filter((id) => id !== gone);
    const next = ensureToday(r, smaller, day);
    assert.equal(next.today!.ids.length, DAILY);
    assert.ok(!next.today!.ids.includes(gone));
    assert.deepEqual(next.today!.ids.slice(0, 2), r.today!.ids.slice(0, 2));
  });

  it("reads the saved Daily 5 safely", () => {
    assert.deepEqual(parseReview(null), EMPTY_REVIEW);
    assert.deepEqual(parseReview("{"), EMPTY_REVIEW);
    const r = parseReview(
      JSON.stringify({
        cards: { a: { box: 9, due: day, seen: 2, right: 1 }, b: { box: 2, due: "soon" } },
        today: { day, ids: ["a", 3], answers: { a: true, b: "yes" } },
        streak: { last: day, count: 3, best: "7" },
        answered: -4,
      }),
    );
    assert.deepEqual(r.cards, { a: { box: 6, due: day, seen: 2, right: 1 } });
    assert.deepEqual(r.today, { day, ids: ["a"], answers: { a: true } });
    assert.deepEqual(r.streak, { last: day, count: 3, best: 0 });
    assert.equal(r.answered, 0);
  });
});
