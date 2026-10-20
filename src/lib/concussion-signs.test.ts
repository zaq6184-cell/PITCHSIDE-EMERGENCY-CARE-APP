import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SIGNS, signOptions, signRound } from "./concussion-signs.ts";

describe("spot the sign", () => {
  it("covers six visible signs, the sub and the watch ones", () => {
    assert.equal(SIGNS.length, 6);
    assert.ok(SIGNS.some((s) => s.outcome === "sub"));
    assert.ok(SIGNS.some((s) => s.outcome === "watch"));
  });

  it("a round shows every sign once", () => {
    const r = signRound();
    assert.equal(new Set(r.map((s) => s.id)).size, SIGNS.length);
  });

  it("offers four different names including the right one", () => {
    for (const s of SIGNS) {
      const o = signOptions(s.id);
      assert.equal(o.length, 4);
      assert.ok(o.some((x) => x.id === s.id));
      assert.equal(new Set(o.map((x) => x.id)).size, 4);
    }
  });
});
