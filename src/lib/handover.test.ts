import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ArrestSession } from "./arrest-log.ts";
import { arrestPieces, EMPTY_HANDOVER, handoverLines, isEmpty } from "./handover.ts";

const T0 = 1_000_000;
const at = (sec: number) => T0 + sec * 1000;
// clock times as minutes:seconds from the collapse, so the tests do not depend on the time zone
const tod = (ms: number) => `t+${Math.round((ms - T0) / 1000)}s`;

describe("handover", () => {
  it("is empty until something is filled in", () => {
    assert.equal(isEmpty(EMPTY_HANDOVER), true);
    assert.deepEqual(handoverLines(EMPTY_HANDOVER, at(0), tod), ["Handover · ATMIST"]);
    assert.equal(isEmpty({ ...EMPTY_HANDOVER, notes: "  " }), true);
    assert.equal(isEmpty({ ...EMPTY_HANDOVER, age: "24" }), false);
  });

  it("writes each ATMIST line in order, leaving out what is not known", () => {
    const lines = handoverLines(
      {
        ...EMPTY_HANDOVER,
        age: " 24 ",
        sex: "male",
        time: at(0),
        mechanism: ["Head impact", "Fall"],
        injuries: ["Concussion"],
        avpu: "V",
        hr: "96",
        spo2: "97",
        sys: "128",
        dia: "",
        treatment: ["Head held (MILS)", "Collar"],
        notes: "Allergic to penicillin",
      },
      at(12 * 60 + 30),
      tod,
    );
    assert.deepEqual(lines, [
      "Handover · ATMIST",
      "Age: 24 years · Male",
      "Time: t+0s (12 min ago)",
      "Mechanism: Head impact · Fall",
      "Injuries: Concussion",
      "Signs: Responds to voice · HR 96 · SpO₂ 97% · BP 128/?",
      "Treatment: Head held (MILS) · Collar",
      "Also: Allergic to penicillin",
    ]);
  });

  it("fills in the time, the arrest and the treatment from the arrest timer", () => {
    const s: ArrestSession = {
      startedAt: at(0),
      events: [
        { kind: "cpr", at: at(20) },
        { kind: "aed", at: at(95) },
        { kind: "shock", at: at(130) },
        { kind: "shock", at: at(250) },
        { kind: "airway", at: at(300) },
        { kind: "adrenaline", at: at(380) },
        { kind: "rosc", at: at(600) },
      ],
    };
    assert.deepEqual(arrestPieces(s, tod), ["CPR from t+20s", "AED on at t+95s", "2 shocks", "Adrenaline 1 mg × 1", "i-gel in", "Signs of life at t+600s"]);
    const lines = handoverLines({ ...EMPTY_HANDOVER, arrest: s, treatment: ["CPR", "Oxygen"], mechanism: ["Collapsed, no contact"] }, at(14 * 60), tod);
    assert.deepEqual(lines, [
      "Handover · ATMIST",
      "Time: t+0s (14 min ago)",
      "Mechanism: Collapsed, no contact",
      "Injuries: Cardiac arrest",
      "Treatment: CPR from t+20s · AED on at t+95s · 2 shocks · Adrenaline 1 mg × 1 · i-gel in · Signs of life at t+600s · Oxygen",
    ]);
  });

  it("says when no shock was advised, and counts amiodarone doses", () => {
    const noShock: ArrestSession = { startedAt: at(0), events: [{ kind: "aed", at: at(60) }, { kind: "noshock", at: at(90) }] };
    assert.deepEqual(arrestPieces(noShock, tod), ["AED on at t+60s", "No shock advised"]);
    const events: ArrestSession["events"] = [1, 2, 3, 4, 5].map((n) => ({ kind: "shock" as const, at: at(n * 120) }));
    events.push({ kind: "amiodarone", at: at(400) }, { kind: "amiodarone", at: at(700) });
    const amio: ArrestSession = { startedAt: at(0), events };
    assert.ok(arrestPieces(amio, tod).includes("Amiodarone 300 mg and 150 mg"));
    assert.ok(arrestPieces(amio, tod).includes("5 shocks"));
  });
});
