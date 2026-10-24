import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { acclimatisationDays, ALTITUDE, bandFor, COLD, SHELTER, VENUES } from "./environment.ts";

describe("cold and altitude", () => {
  it("spells S.H.E.L.T.E.R.", () => {
    assert.equal(SHELTER.map((s) => s.letter).join(""), "SHELTER");
  });

  it("has complete cards in full sentences, each naming FIFA's chapter 9 first", () => {
    for (const c of [...COLD, ...ALTITUDE]) {
      assert.ok(c.title && c.sub && c.call && c.football, c.id);
      assert.ok(c.recognise.length >= 2 && c.steps.length >= 4 && c.trained.length >= 1, c.id);
      assert.match(c.source, /^FIFA Emergency Care Manual, chapter 9/, c.id);
      for (const line of [...c.recognise, ...c.steps, ...c.trained, c.call, c.football, c.source]) assert.match(line, /[.!?]$/, `${c.id}: ${line}`);
    }
  });

  it("uses FIFA's altitude bands", () => {
    assert.equal(bandFor(0).id, "sea");
    assert.equal(bandFor(500).id, "sea");
    assert.equal(bandFor(501).id, "low");
    assert.equal(bandFor(2000).id, "low");
    assert.equal(bandFor(2001).id, "moderate");
    assert.equal(bandFor(3000).id, "moderate");
    assert.equal(bandFor(3001).id, "high");
    assert.equal(bandFor(5500).id, "high");
    assert.equal(bandFor(5501).id, "extreme");
  });

  it("allows a day for every 300–500 m above 2,000 m", () => {
    assert.deepEqual(acclimatisationDays(1800), { min: 0, max: 0 });
    assert.deepEqual(acclimatisationDays(2000), { min: 0, max: 0 });
    assert.deepEqual(acclimatisationDays(2240), { min: 1, max: 1 });
    assert.deepEqual(acclimatisationDays(2850), { min: 2, max: 3 });
    assert.deepEqual(acclimatisationDays(3640), { min: 4, max: 6 });
  });

  it("keeps the doses FIFA gives", () => {
    const text = JSON.stringify([COLD, ALTITUDE]);
    assert.match(text, /35–40 °C for 15–30 minutes/);
    assert.match(text, /Dexamethasone 4–8 mg/);
    assert.match(text, /nifedipine 30 mg slow-release/);
    assert.match(text, /morphine 15 mg titrated IV/);
    assert.match(text, /dexamethasone 2 mg every 6 hours or 4 mg every 12 hours/);
    assert.match(text, /SpO₂ above 90%/);
  });

  it("follows FIFA in a hypothermic cardiac arrest", () => {
    const text = COLD.find((c) => c.id === "hypothermia")!.trained.join(" ");
    assert.match(text, /a full minute/);
    assert.match(text, /Withhold adrenaline and delay defibrillation until the core temperature reaches 30 °C/);
    assert.match(text, /every 6–10 minutes/);
    assert.match(text, /normal protocols at 35 °C/);
    assert.doesNotMatch(text, /limit shocks/);
  });

  it("lists venues above 2,000 m, highest last", () => {
    for (const v of VENUES) assert.ok(v.metres > 2000, v.name);
    assert.deepEqual([...VENUES].sort((a, b) => a.metres - b.metres), VENUES);
  });
});
