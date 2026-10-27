import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spineSteps } from "./spine-drill.ts";
import { canClaim, codeFromHash, linesFor, takenRoles, teamJoinUrl, teamPassword } from "./team.ts";
import { type DrillEvent, lastStep, listen, onPhone, setPhones, tell } from "./team-bus.ts";
import { type RoleId, workshop } from "./workshop.ts";

describe("team drill", () => {
  it("joins with a link whose code stays in the #fragment", () => {
    const url = teamJoinUrl("https://example.org/app#top", "ABC234");
    assert.equal(url, "https://example.org/app/team#join=ABC234");
    assert.equal(codeFromHash(new URL(url).hash), "ABC234");
    assert.equal(teamPassword("ABC234"), "pec-team-ABC234");
  });

  it("lists the colours taken in the team's order, and lets each go to one phone", () => {
    const roster = new Map<string, RoleId | null>([
      ["p1", "green"],
      ["p2", null],
      ["p3", "black"],
    ]);
    assert.deepEqual(takenRoles(roster), ["black", "green"]);
    assert.equal(canClaim(roster, "p2", "green"), false);
    assert.equal(canClaim(roster, "p1", "green"), true, "a phone keeps its own colour");
    assert.equal(canClaim(roster, "p2", "red"), true);
  });

  it("finds each colour's part of a step in the step's own lines", () => {
    const aed = workshop.steps.find((s) => s.n === 3)!;
    assert.deepEqual(linesFor(aed.lines, "Green"), aed.lines.slice(0, 2));
    assert.equal(linesFor(aed.lines, "Black").length, 0);
    const roll = spineSteps.find((s) => s.n === 5)!;
    for (const name of ["Orange", "Red", "Blue", "White", "Green"]) assert.ok(linesFor(roll.lines, name).length > 0, name);
    assert.equal(linesFor(["Reddish light"], "Red").length, 0, "whole words only");
  });

  it("passes the player's moments to the team drill, and tells the player which voices are on phones", () => {
    const heard: DrillEvent[] = [];
    const stop = listen((e) => heard.push(e));
    tell({ t: "step", drill: "arrest", step: 3 });
    tell({ t: "say", id: "green-1", role: "green" });
    stop();
    tell({ t: "sfx", name: "shock" });
    assert.deepEqual(
      heard.map((e) => e.t),
      ["step", "say"],
    );
    assert.deepEqual(lastStep(), { t: "step", drill: "arrest", step: 3 });
    setPhones(["green"]);
    assert.ok(onPhone("green"));
    assert.ok(!onPhone("red"));
    setPhones([]);
    assert.ok(!onPhone("green"));
  });
});
