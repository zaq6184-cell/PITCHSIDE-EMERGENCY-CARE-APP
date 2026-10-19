import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCompressionDetector } from "./compression-detector.ts";

/** A seeded random number generator, so the noise is the same on every run. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Simulated sensor: compressions at `rate` a minute with `swing` m/s², plus hand tremor, at 60 samples a second. */
function simulate(rate: number, seconds: number, swing: number, noise = 0.35, tilt = 0.4) {
  const d = createCompressionDetector();
  const rand = rng(rate * 7 + seconds);
  let hits = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const t = (i / 60) * 1000;
    const phase = (t / 1000) * (rate / 60) * Math.PI * 2;
    // a push is a sharp dip-and-rise rather than a pure sine
    const push = swing * (Math.sin(phase) + 0.35 * Math.sin(2 * phase));
    const n = () => (rand() - 0.5) * 2 * noise;
    const g = 9.81 + push;
    if (d.push(t, g * Math.sin(tilt) + n(), n(), g * Math.cos(tilt) + n())) hits++;
  }
  return hits;
}

describe("compression detector", () => {
  for (const rate of [100, 110, 120]) {
    it(`counts compressions at ${rate} a minute`, () => {
      const expected = rate / 2; // 30 seconds
      const hits = simulate(rate, 30, 3);
      assert.ok(Math.abs(hits - expected) <= 2, `got ${hits}, expected about ${expected}`);
    });
  }

  it("counts slow and fast rhythms too", () => {
    assert.ok(Math.abs(simulate(80, 30, 3) - 40) <= 2);
    assert.ok(Math.abs(simulate(140, 30, 3) - 70) <= 3);
  });

  it("ignores a phone held still with a little tremor", () => {
    assert.equal(simulate(110, 20, 0, 0.35), 0);
  });

  it("works with a weaker push", () => {
    const hits = simulate(110, 30, 1.6, 0.25);
    assert.ok(Math.abs(hits - 55) <= 3, `got ${hits}`);
  });
});
