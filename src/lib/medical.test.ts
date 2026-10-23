import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MEDICAL } from "./medical.ts";

describe("medical emergencies", () => {
  it("has the five cards, each complete", () => {
    assert.deepEqual(
      MEDICAL.map((c) => c.id),
      ["anaphylaxis", "asthma", "hypo", "seizure", "choking"],
    );
    for (const c of MEDICAL) {
      assert.ok(c.title && c.sub && c.call && c.football && c.source, c.id);
      assert.ok(c.recognise.length >= 2 && c.steps.length >= 4 && c.trained.length >= 2, c.id);
    }
  });

  it("writes full sentences", () => {
    for (const c of MEDICAL) {
      for (const line of [...c.recognise, ...c.steps, ...c.trained, c.call, c.football, c.source]) {
        assert.match(line, /[.!?”]$/, `${c.id}: ${line}`);
      }
    }
  });

  it("keeps the adult doses the guidelines give", () => {
    const all = (id: string) => {
      const c = MEDICAL.find((m) => m.id === id)!;
      return [...c.steps, ...c.trained].join(" ");
    };
    assert.match(all("anaphylaxis"), /0\.5 mL \(500 micrograms\) IM/);
    assert.match(all("anaphylaxis"), /after 5 minutes/);
    assert.match(all("asthma"), /up to 10 puffs/);
    assert.match(all("asthma"), /salbutamol 5 mg/);
    assert.match(all("hypo"), /15–20 g/);
    assert.match(all("hypo"), /Glucagon 1 mg IM/);
    assert.match(all("seizure"), /5 minutes or more/);
    assert.match(all("seizure"), /midazolam 10 mg/);
    assert.match(all("choking"), /5 back blows/);
  });

  it("rules out cardiac arrest where a collapse can hide one", () => {
    for (const id of ["anaphylaxis", "asthma", "seizure", "choking"]) {
      const c = MEDICAL.find((m) => m.id === id)!;
      assert.match([...c.recognise, ...c.steps].join(" "), /CPR|breathing/, id);
    }
  });
});
