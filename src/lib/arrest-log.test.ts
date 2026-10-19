import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  amiodaroneDose,
  type ArrestEventKind,
  type ArrestSession,
  checksDue,
  clock,
  CYCLE_MS,
  logText,
  nextCheckIn,
  parseSession,
  prompts,
  STALE_MS,
  summary,
} from "./arrest-log.ts";

const T0 = 1_000_000;
const at = (sec: number) => T0 + sec * 1000;
const session = (...events: [ArrestEventKind, number][]): ArrestSession => ({
  startedAt: T0,
  events: events.map(([kind, sec]) => ({ kind, at: at(sec) })),
});
const mentions = (list: string[], text: string) => list.some((p) => p.includes(text));

describe("clock", () => {
  it("shows minutes and seconds since the collapse", () => {
    assert.equal(clock(0), "0:00");
    assert.equal(clock(7_400), "0:07");
    assert.equal(clock(760_000), "12:40");
    assert.equal(clock(-5), "0:00");
  });
});

describe("rhythm checks", () => {
  it("fall every 2 minutes from the collapse until CPR is logged", () => {
    const s = session();
    assert.equal(checksDue(s, at(119)), 0);
    assert.equal(checksDue(s, at(120)), 1);
    assert.equal(nextCheckIn(s, at(30)), CYCLE_MS - 30_000);
  });
  it("fall every 2 minutes from the start of CPR once it is logged", () => {
    const s = session(["cpr", 20]);
    assert.equal(checksDue(s, at(139)), 0);
    assert.equal(checksDue(s, at(140)), 1);
    assert.equal(checksDue(s, at(260)), 2);
    assert.equal(nextCheckIn(s, at(20)), CYCLE_MS);
  });
});

describe("reminders", () => {
  it("ask for compressions and the AED until both are logged", () => {
    assert.ok(mentions(prompts(session(), at(3)), "Start chest compressions"));
    assert.ok(mentions(prompts(session(), at(3)), "Apply the AED"));
    assert.deepEqual(prompts(session(["cpr", 5], ["aed", 40]), at(50)), []);
  });
  it("give adrenaline and amiodarone 300 mg only after the 3rd shock", () => {
    const two = session(["cpr", 5], ["aed", 60], ["shock", 90], ["shock", 210]);
    assert.ok(!mentions(prompts(two, at(220)), "adrenaline") && !mentions(prompts(two, at(220)), "amiodarone"));
    const three = session(["cpr", 5], ["aed", 60], ["shock", 90], ["shock", 210], ["shock", 330]);
    assert.ok(mentions(prompts(three, at(335)), "adrenaline 1 mg IV (after the 3rd shock)"));
    assert.ok(mentions(prompts(three, at(335)), "amiodarone 300 mg"));
  });
  it("give adrenaline as soon as possible when no shock is advised", () => {
    assert.ok(mentions(prompts(session(["cpr", 5], ["aed", 60], ["noshock", 90]), at(95)), "no shock advised: adrenaline"));
  });
  it("repeat adrenaline after 3 minutes and suggest extrication after shocks and medications", () => {
    const s = session(["cpr", 5], ["aed", 60], ["shock", 90], ["shock", 210], ["shock", 330], ["adrenaline", 340], ["amiodarone", 345]);
    assert.ok(!mentions(prompts(s, at(500)), "every 3–5 minutes"));
    assert.ok(mentions(prompts(s, at(520)), "every 3–5 minutes — last dose 3:00 ago"));
    assert.ok(mentions(prompts(s, at(520)), "plan the move — the ambulance or a buggy"));
    assert.ok(!mentions(prompts(s, at(520)), "amiodarone 150 mg"));
  });
  it("give amiodarone 150 mg after the 5th shock", () => {
    const s = session(["cpr", 5], ["aed", 60], ["shock", 90], ["shock", 210], ["shock", 330], ["adrenaline", 340], ["amiodarone", 345], ["shock", 450], ["shock", 570]);
    assert.ok(mentions(prompts(s, at(575)), "amiodarone 150 mg (after the 5th shock)"));
  });
  it("stop the drug reminders once there are signs of life", () => {
    const s = session(["cpr", 5], ["aed", 60], ["shock", 90], ["shock", 210], ["shock", 330], ["rosc", 400]);
    assert.deepEqual(prompts(s, at(410)), []);
  });
});

describe("amiodaroneDose", () => {
  it("is 300 mg first, then 150 mg, then no more", () => {
    assert.equal(amiodaroneDose(session()), 300);
    assert.equal(amiodaroneDose(session(["amiodarone", 300])), 150);
    assert.equal(amiodaroneDose(session(["amiodarone", 300], ["amiodarone", 700])), null);
  });
});

describe("debrief", () => {
  it("marks the first shock against the 3-minute target", () => {
    const first = (s: ArrestSession) => summary(s, at(400)).find((r) => r.label === "Collapse → first shock");
    assert.equal(first(session(["cpr", 5], ["aed", 60], ["shock", 150]))?.target, "met");
    assert.equal(first(session(["shock", 181]))?.target, "missed");
    assert.equal(first(session(["cpr", 5]))?.value, "—");
  });
  it("writes the log as plain text with labels and times", () => {
    const s: ArrestSession = { ...session(["cpr", 7], ["shock", 95], ["amiodarone", 400], ["amiodarone", 800]), endedAt: at(900) };
    const text = logText(s, at(900), () => "14:03");
    assert.ok(text.startsWith("Arrest timer — drill log\nCollapse at 14:03\n\n0:00 Collapse\n0:07 CPR started\n1:35 Shock 1\n"));
    assert.ok(text.includes("6:40 Amiodarone 300 mg\n13:20 Amiodarone 150 mg\n15:00 Timer stopped"));
    assert.ok(text.includes("Collapse → first shock: 1:35 (within 3 minutes)"));
    assert.ok(text.includes("Total time: 15:00"));
  });
});

describe("parseSession", () => {
  it("keeps valid events in order and drops the rest", () => {
    const raw = JSON.stringify({
      startedAt: T0,
      events: [{ kind: "shock", at: at(90) }, { kind: "bogus", at: at(10) }, { kind: "cpr", at: at(5) }, { kind: "aed" }, null, { kind: "aed", at: T0 - 1 }],
    });
    const s = parseSession(raw, at(100));
    assert.deepEqual(s, { startedAt: T0, events: [{ kind: "cpr", at: at(5) }, { kind: "shock", at: at(90) }], endedAt: undefined });
  });
  it("brings back a timer left running for hours as stopped", () => {
    const raw = JSON.stringify({ startedAt: T0, events: [{ kind: "cpr", at: at(5) }] });
    assert.equal(parseSession(raw, T0 + STALE_MS + 1)?.endedAt, at(5));
  });
  it("rejects anything that is not a session", () => {
    assert.equal(parseSession(null, 0), null);
    assert.equal(parseSession("not json", 0), null);
    assert.equal(parseSession(JSON.stringify({ events: [] }), 0), null);
  });
});
