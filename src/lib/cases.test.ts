import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CASES, choose, finished, getCase, outcome, startRun } from "./cases.ts";

/** Play a case taking the given choice index at every stage (0 = the right answer in this content). */
function play(id: string, pick: (stage: string) => number) {
  const c = getCase(id)!;
  let run = startRun(c);
  for (let guard = 0; guard < 20 && !finished(run); guard++) run = choose(c, run, pick(run.stage));
  return { c, run };
}

describe("cases", () => {
  it("every choice leads to a real stage or the end, and every case can be finished", () => {
    for (const c of CASES) {
      const ids = new Set(c.stages.map((s) => s.id));
      assert.ok(ids.has(c.start));
      for (const s of c.stages) for (const ch of s.choices) assert.ok(ch.next === "end" || ids.has(ch.next), `${c.id}:${s.id} → ${ch.next}`);
      assert.ok(finished(play(c.id, () => 0).run));
    }
  });

  it("every stage has exactly one right answer, listed first", () => {
    for (const c of CASES) for (const s of c.stages) {
      assert.equal(s.choices.filter((ch) => ch.ok).length, 1, `${c.id}:${s.id}`);
      assert.equal(s.choices[0].ok, true, `${c.id}:${s.id}`);
    }
  });

  it("the right path through each case is a good outcome", () => {
    for (const c of CASES) {
      const { run } = play(c.id, () => 0);
      const o = outcome(c, run);
      assert.equal(o.good, true, c.id);
      assert.equal(o.criticals, 0);
      assert.equal(o.right, o.total);
    }
  });

  it("wrong choices cost time and the good outcome", () => {
    const right = play("vf", () => 0);
    const wrong = play("vf", (s) => (s === "s1" || s === "s2" ? 1 : 0));
    assert.ok(wrong.run.shockAt! > right.run.shockAt!);
    assert.equal(outcome(wrong.c, wrong.run).good, false);
    assert.ok(outcome(wrong.c, wrong.run).score < outcome(right.c, right.run).score);
  });

  it("times CPR and the shock in the arrest cases", () => {
    const { run } = play("commotio", () => 0);
    assert.equal(run.cprAt, 25);
    assert.equal(run.shockAt, 55);
  });

  it("transport first misses the cooling window in the heat case", () => {
    const { c, run } = play("heat", (s) => (s === "h2" ? 1 : 0));
    const o = outcome(c, run);
    assert.equal(o.good, false);
    assert.match(o.headline, /only after/);
  });
});
