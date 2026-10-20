import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { flashToBang, mmss, parseStorm, resumeAt, waitLeft } from "./lightning.ts";

describe("lightning", () => {
  it("turns the flash-to-bang count into a distance", () => {
    assert.equal(flashToBang(30).km, 10.3);
    assert.equal(flashToBang(9).km, 3.1);
    assert.equal(flashToBang(-2).seconds, 0);
  });

  it("stops play under 30 seconds", () => {
    assert.equal(flashToBang(29.9).stop, true);
    assert.equal(flashToBang(30).stop, false);
    assert.equal(flashToBang(45).stop, false);
  });

  it("waits 30 minutes from the last strike", () => {
    const t = 1_000_000;
    assert.equal(resumeAt(t), t + 30 * 60_000);
    assert.equal(waitLeft(t, t + 10 * 60_000), 20 * 60_000);
    assert.equal(waitLeft(t, t + 31 * 60_000), 0);
    assert.equal(mmss(20 * 60_000), "20:00");
    assert.equal(mmss(61_500), "1:02");
  });

  it("restores only a countdown that is still running", () => {
    const now = 5_000_000;
    assert.equal(parseStorm(String(now - 60_000), now), now - 60_000);
    assert.equal(parseStorm(String(now - 31 * 60_000), now), null);
    assert.equal(parseStorm("nonsense", now), null);
    assert.equal(parseStorm(null, now), null);
  });
});
