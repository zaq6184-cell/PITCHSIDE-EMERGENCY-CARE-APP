import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_HOLD_MS, drillTimeline, LEAD_MS, REST_MIN_MS, SFX_MS, stateAt, stepTimeline, VOICE_GAP_MS, VOICE_MIN_MS } from "./drill-timeline.ts";

const durations = { "red-1": 1.43, "black-1": 2.37, "black-3": 3.99, "green-3": 0.84 };

describe("drill timeline", () => {
  it("paces a step the way the 3D player does: lead, call-outs held long enough to read, then rest", () => {
    const { events, length } = stepTimeline(["red-1", "black-1"], durations);
    assert.deepEqual(
      events.map((e) => e.at),
      [LEAD_MS, LEAD_MS + VOICE_MIN_MS + VOICE_GAP_MS],
    );
    // the script ends near 5.4 s, so the step's 9-second hold decides its length
    assert.equal(length, DEFAULT_HOLD_MS);
  });

  it("gives a long call-out its own length, sound effects their slot, and runs past the hold when needed", () => {
    const { events, length } = stepTimeline(["black-3", "green-3", "sfx:siren"], durations, 3000);
    const black = events[0];
    assert.equal(black.kind === "voice" && black.ms, 3990);
    assert.equal(events[1].at, LEAD_MS + 3990 + VOICE_GAP_MS);
    assert.equal(events[2].at, events[1].at + VOICE_MIN_MS + VOICE_GAP_MS);
    assert.equal(length, events[2].at + SFX_MS + REST_MIN_MS);
  });

  it("counts cues as the scene's phases and lets waits push the script on", () => {
    const { events } = stepTimeline(["wait:1500", "cue", "wait:4200", "black-3", "cue"], durations);
    assert.deepEqual(
      events.map((e) => [e.kind, e.at]),
      [
        ["cue", LEAD_MS + 1500],
        ["voice", LEAD_MS + 5700],
        ["cue", LEAD_MS + 5700 + 3990 + VOICE_GAP_MS],
      ],
    );
  });

  it("strings the steps together after the team in place, and says where the scene is at any moment", () => {
    const { segments, length } = drillTimeline({ 1: ["red-1"], 2: ["wait:1000", "cue", "black-1"] }, [{}, { hold: 6000 }], durations, 3000);
    assert.deepEqual(
      segments.map((s) => [s.step, s.start]),
      [
        [0, 0],
        [1, 3000],
        [2, 12000],
      ],
    );
    assert.equal(length, 18000);
    assert.deepEqual(stateAt(segments, 1000), { step: 0, phase: 0 });
    assert.deepEqual(stateAt(segments, 12000 + LEAD_MS + 999), { step: 2, phase: 0 });
    assert.deepEqual(stateAt(segments, 12000 + LEAD_MS + 1000), { step: 2, phase: 1 });
  });
});
