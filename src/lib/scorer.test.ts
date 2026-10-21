import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checks, compressionFraction, count, debriefText, DEFAULT_TARGETS, end, flag, lastTap, longestPause, mark, newSession, parseSession, pausing, togglePause, undo } from "./scorer.ts";

describe("scorer", () => {
  it("takes back the last mark or flag after a mis-tap", () => {
    let s = mark(mark(newSession(0), "enter", 12), "cpr", 30);
    s = flag(s, "role", 31);
    assert.equal(lastTap(s)?.kind, "flag");
    s = undo(s);
    assert.equal(s.flags.length, 0);
    s = togglePause(togglePause(s, 40), 44);
    s = undo(s); // the first compression: its pauses go with it
    assert.equal(count(s, "cpr"), 0);
    assert.equal(s.pauses.length, 0);
    assert.equal(lastTap(s)?.id, "enter");
    assert.equal(undo(undo(s)).marks.length, 0);
  });

  it("records each mark once, except shocks", () => {
    let s = newSession(0);
    s = mark(mark(s, "cpr", 40), "cpr", 50);
    s = mark(mark(s, "shock", 150), "shock", 280);
    assert.equal(count(s, "cpr"), 1);
    assert.equal(count(s, "shock"), 2);
  });

  it("checks the marks against the targets", () => {
    let s = mark(mark(newSession(0), "cpr", 42), "shock", 200);
    const c = checks(s, DEFAULT_TARGETS);
    assert.equal(c.find((x) => x.id === "cpr")?.ok, true);
    assert.equal(c.find((x) => x.id === "shock")?.ok, false);
    assert.equal(c.find((x) => x.id === "aed")?.ok, null);
    s = mark(s, "airway", 240);
    assert.equal(checks(s, DEFAULT_TARGETS).find((x) => x.id === "airway")?.ok, null); // no target: just timed
  });

  it("works out the compression fraction and the longest pause", () => {
    let s = mark(newSession(0), "cpr", 20);
    assert.equal(togglePause(newSession(0), 5).pauses.length, 0); // no pauses before CPR starts
    s = togglePause(s, 60); // hands off for 12 s
    s = togglePause(s, 72);
    s = togglePause(s, 100); // hands off, still open
    assert.equal(pausing(s), true);
    // 20 → 120: 100 s, 12 + 20 s off
    assert.ok(Math.abs((compressionFraction(s, 120) ?? 0) - 0.68) < 1e-9);
    assert.equal(longestPause(s, 120), 20);
    s = end(s, 120);
    assert.equal(pausing(s), false);
    assert.equal(s.endedAt, 120);
    assert.equal(compressionFraction(newSession(0), 50), null);
  });

  it("writes a debrief to share and reads a saved session back", () => {
    let s = mark(mark(mark(newSession(Date.UTC(2026, 9, 21)), "cpr", 30), "aed", 75), "shock", 110);
    s = end(flag(s, "pulse", 115), 200);
    const text = debriefText(s, DEFAULT_TARGETS);
    assert.match(text, /First compression: 0:30 \(target 1:00\) ✓/);
    assert.match(text, /Shocks: 1/);
    assert.match(text, /Pulse check after a shock/);
    assert.deepEqual(parseSession(JSON.stringify(s)), s);
    assert.equal(parseSession("{}"), null);
  });
});
