import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { judgeTap, PAD_CHOICES, PAD_RADIUS, PAD_TARGETS } from "./aed-pads.ts";

const none = { right: false, left: false };

describe("judgeTap", () => {
  it("places a pad on or near its target", () => {
    assert.deepEqual(judgeTap(PAD_TARGETS.right, none), { pad: "right" });
    assert.deepEqual(judgeTap(PAD_TARGETS.left, none), { pad: "left" });
    assert.deepEqual(judgeTap({ x: PAD_TARGETS.left.x, z: PAD_TARGETS.left.z + PAD_RADIUS * 0.9 }, none), { pad: "left" });
  });

  it("does not place the same pad twice", () => {
    const v = judgeTap(PAD_TARGETS.right, { right: true, left: false });
    assert.ok("miss" in v && /already on/.test(v.miss));
  });

  it("explains the common mistakes", () => {
    const hint = (x: number, z: number) => {
      const v = judgeTap({ x, z }, none);
      assert.ok("miss" in v, `expected a miss at ${x}, ${z}`);
      return v.miss;
    };
    assert.match(hint(0, -0.55), /breastbone/);
    assert.match(hint(0.1, -0.47), /side/);
    assert.match(hint(-0.12, -0.4), /Higher/);
    assert.match(hint(0.23, -0.7), /Lower/);
    assert.match(hint(0.23, -0.25), /Higher/);
    assert.match(hint(0.5, -0.5), /off the chest/);
  });

  it("offers list choices that agree with the targets", () => {
    const verdicts = PAD_CHOICES.map((c) => judgeTap(c.tap, none));
    assert.deepEqual(
      verdicts.map((v) => ("pad" in v ? v.pad : "miss")),
      ["right", "miss", "left", "miss"],
    );
  });
});
