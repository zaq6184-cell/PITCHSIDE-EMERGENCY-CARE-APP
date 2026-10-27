import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LEAD_MS, SFX_MS, VOICE_GAP_MS, VOICE_MIN_MS } from "./drill-timeline.ts";
import { durationsFor, heardAt, LISTEN_LEAD_MS, listenPlan, listenTrack, nextStart, prevStart, stepAt } from "./listen.ts";
import { spineCallouts, spineSteps } from "./spine-drill.ts";
import { VOICE_SECONDS } from "./voice-durations.ts";
import { voiceFile } from "./voice-files.ts";

const script = { 1: ["red-1", "sfx:shock"], 2: ["cue", "black-1"] };
const steps = [{ hold: 9000 }, { hold: 9000 }];
const seconds = { "red-1": 1.5, "black-1": 3 };

describe("listen mode", () => {
  it("lays the drill out as heard: a lead, then each step's call-outs and effects", () => {
    const plan = listenPlan(script, steps, seconds);
    assert.deepEqual(plan.chapters, [
      { step: 0, start: 0 },
      { step: 1, start: LISTEN_LEAD_MS },
      { step: 2, start: LISTEN_LEAD_MS + 9000 },
    ]);
    const red = LISTEN_LEAD_MS + LEAD_MS;
    const shock = red + VOICE_MIN_MS + VOICE_GAP_MS;
    assert.deepEqual(plan.heard, [
      { at: red, end: red + VOICE_MIN_MS, id: "red-1" }, // a short line stays up long enough to read
      { at: shock, end: shock + SFX_MS, id: "sfx:shock" },
      { at: LISTEN_LEAD_MS + 9000 + LEAD_MS, end: LISTEN_LEAD_MS + 9000 + LEAD_MS + 3000, id: "black-1" },
    ]);
    assert.equal(plan.length, LISTEN_LEAD_MS + 18000);
  });

  it("knows the step and the line at any moment", () => {
    const plan = listenPlan(script, steps, seconds);
    assert.equal(stepAt(plan, 0), 0);
    assert.equal(stepAt(plan, LISTEN_LEAD_MS), 1);
    assert.equal(stepAt(plan, plan.length - 1), 2);
    assert.equal(heardAt(plan, LISTEN_LEAD_MS + LEAD_MS + 100)?.id, "red-1");
    assert.equal(heardAt(plan, 100), null);
  });

  it("skips to the next step, and back to this step's start or, early in it, the one before", () => {
    const plan = listenPlan(script, steps, seconds);
    assert.equal(nextStart(plan, 0), LISTEN_LEAD_MS);
    assert.equal(nextStart(plan, LISTEN_LEAD_MS + 100), LISTEN_LEAD_MS + 9000);
    assert.equal(nextStart(plan, LISTEN_LEAD_MS + 9100), null);
    assert.equal(prevStart(plan, LISTEN_LEAD_MS + 4000), LISTEN_LEAD_MS);
    assert.equal(prevStart(plan, LISTEN_LEAD_MS + 9500), LISTEN_LEAD_MS);
    assert.equal(prevStart(plan, 1000), 0);
  });

  it("matches the neck injury narration recorded for the AR models (91.0 s)", () => {
    const plan = listenPlan(spineCallouts, spineSteps, durationsFor(spineCallouts, VOICE_SECONDS, voiceFile));
    // the narration is cut to the recording's frames: 15 a second
    assert.ok(plan.length >= 91000 && plan.length < 91000 + 1000 / 15, `plan ${plan.length} ms`);
    assert.equal(listenTrack("spine"), "/ar/spine-all.mp3");
  });

  it("has a length for every call-out the drills say, through re-recorded files", () => {
    const d = durationsFor({ 1: ["green-1", "wait:200", "cue", "sfx:siren"] }, VOICE_SECONDS, voiceFile);
    assert.deepEqual(Object.keys(d), ["green-1"]);
    assert.ok(d["green-1"] > 1, "green-1 plays green-1-v2");
    for (const id of Object.values(spineCallouts).flat()) {
      if (id === "cue" || id.includes(":")) continue;
      assert.ok(VOICE_SECONDS[voiceFile(id)] > 0, `no length for ${id}`);
    }
  });
});
