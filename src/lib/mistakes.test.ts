import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MISTAKES, mistakeRound, whatOptions } from "./mistakes.ts";

describe("spot the mistake", () => {
  it("has enough different mistakes for the badge, each with a unique id", () => {
    assert.ok(MISTAKES.length >= 6);
    assert.equal(new Set(MISTAKES.map((m) => m.id)).size, MISTAKES.length);
  });

  it("puts each mistake on a real step of its drill", () => {
    for (const m of MISTAKES) {
      const max = m.scenario === "arrest" ? 6 : 7;
      assert.ok(m.step >= 1 && m.step <= max, m.id);
    }
  });

  it("builds a round of different mistakes", () => {
    const r = mistakeRound(6);
    assert.equal(r.length, 6);
    assert.equal(new Set(r.map((m) => m.id)).size, 6);
  });

  it("offers the right answer among three different options", () => {
    for (const m of MISTAKES) {
      const o = whatOptions(m);
      assert.equal(o.length, 3);
      assert.ok(o.includes(m.what));
      assert.equal(new Set(o).size, 3);
    }
  });
});
