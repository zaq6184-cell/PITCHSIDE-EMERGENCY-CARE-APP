import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CHECKLIST, EMPTY_PLAN, isBlank, type MatchPlan, parsePlan, planText, prettyDate, telHref } from "./match-plan.ts";

const roles = [
  { id: "black", num: 1, name: "BLACK", role: "Team leader" },
  { id: "orange", num: 2, name: "ORANGE", role: "Head · airway & cervical spine" },
  { id: "red", num: 3, name: "RED", role: "Chest" },
  { id: "blue", num: 4, name: "BLUE", role: "Pelvis" },
  { id: "white", num: 5, name: "WHITE", role: "Legs" },
  { id: "green", num: 6, name: "GREEN", role: "Equipment · bag & AED" },
];

describe("telHref", () => {
  it("keeps the digits and a leading plus", () => {
    assert.equal(telHref("+852 1234 5678"), "tel:+85212345678");
    assert.equal(telHref("(03) 9999-0000"), "tel:0399990000");
    assert.equal(telHref("999"), "tel:999");
    assert.equal(telHref("12+34"), "tel:1234");
  });
  it("gives no link without at least three digits", () => {
    assert.equal(telHref(""), null);
    assert.equal(telHref("ask Ali"), null);
    assert.equal(telHref("12"), null);
  });
});

describe("prettyDate", () => {
  it("writes a picked date the short way and leaves anything else as typed", () => {
    assert.equal(prettyDate("2026-10-15"), "15 Oct 2026");
    assert.equal(prettyDate(""), "");
    assert.equal(prettyDate("next Saturday"), "next Saturday");
    assert.equal(prettyDate("2026-13-01"), "2026-13-01");
  });
});

describe("parsePlan", () => {
  it("returns an empty plan for nothing or junk", () => {
    assert.deepEqual(parsePlan(null), EMPTY_PLAN);
    assert.deepEqual(parsePlan("{"), EMPTY_PLAN);
    assert.deepEqual(parsePlan("42"), EMPTY_PLAN);
  });
  it("keeps the known fields only, within their lengths", () => {
    const p = parsePlan(
      JSON.stringify({ venue: "Stadium", hospitalPhone: 999, names: { red: "Ana", purple: "x" }, checks: { aed: true, bogus: true, bag: "yes" }, notes: "n".repeat(2000), extra: 1 }),
    );
    assert.equal(p.venue, "Stadium");
    assert.equal(p.hospitalPhone, "");
    assert.equal(p.names.red, "Ana");
    assert.equal("purple" in p.names, false);
    assert.deepEqual(p.checks, { aed: true });
    assert.equal(p.notes.length, 1000);
    assert.equal("extra" in p, false);
  });
});

describe("isBlank", () => {
  it("is blank until something is written in; ticks alone do not count", () => {
    assert.equal(isBlank(EMPTY_PLAN), true);
    assert.equal(isBlank({ ...EMPTY_PLAN, checks: { aed: true } }), true);
    assert.equal(isBlank({ ...EMPTY_PLAN, names: { ...EMPTY_PLAN.names, green: "Sam" } }), false);
    assert.equal(isBlank({ ...EMPTY_PLAN, venue: "  " }), true);
  });
});

describe("planText", () => {
  it("lists what is filled in, in the PEAP's order, and leaves blanks out", () => {
    const p: MatchPlan = {
      ...EMPTY_PLAN,
      venue: "City Stadium",
      date: "2026-10-15",
      ko: "19:30",
      hospital: "General Hospital",
      hospitalPhone: "999",
      leader: "Dr Tan",
      leaderPhone: "+852 1234",
      names: { ...EMPTY_PLAN.names, orange: "Ali", blue: "Mei" },
    };
    assert.equal(
      planText(p, roles, "https://example.org/app/"),
      [
        "Match plan (FIFA PEAP)",
        "City Stadium · 15 Oct 2026 · KO 19:30",
        "Nearest hospital: General Hospital · 999",
        "Team leader (Black 1): Dr Tan · +852 1234 — ensures the ambulance is called",
        "Orange 2 (Head · airway & cervical spine): Ali",
        "Blue 4 (Pelvis): Mei",
        "",
        "Pitchside Emergency Care: https://example.org/app/",
      ].join("\n"),
    );
  });
});

describe("CHECKLIST", () => {
  it("has unique ids", () => {
    assert.equal(new Set(CHECKLIST.map((c) => c.id)).size, CHECKLIST.length);
  });
});
