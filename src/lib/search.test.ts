import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { norm, prepare, search, snippet } from "./search.ts";

const docs = prepare([
  { title: "Arrest timer", sub: "Tools", text: "CPR clock, 2-minute rhythm checks, shocks, adrenaline and amiodarone." },
  { title: "AED pads trainer", sub: "Tools", text: "Place the pads in 3D, call everyone clear, shock." },
  { title: "Cervical collar", sub: "Module 4 · Immobilisation", text: "Size the collar with fingerbreadths; keep MILS until blocks and tape are on." },
  { title: "Orange 2 · Head · airway & cervical spine", sub: "Role", text: "Kneel directly behind the head. Insert the i-gel." },
  { title: "Sudden cardiac arrest", sub: "FIFA", text: "Four signs of SCA. Early CPR and defibrillation." },
]);

const titles = (q: string) => search(docs, q).map((h) => h.doc.title);

describe("search", () => {
  it("normalises punctuation and case", () => {
    assert.equal(norm("C-Spine & MILS!"), "c spine mils");
  });

  it("ranks title matches first", () => {
    assert.equal(titles("collar")[0], "Cervical collar");
    assert.equal(titles("timer")[0], "Arrest timer");
  });

  it("needs every word, and the last one may be half typed", () => {
    assert.deepEqual(titles("pads cle"), ["AED pads trainer"]);
    assert.deepEqual(titles("collar zebra"), []);
  });

  it("understands other words for the same thing", () => {
    assert.ok(titles("epinephrine").includes("Arrest timer"));
    assert.ok(titles("defibrillator").includes("AED pads trainer"));
    assert.ok(titles("neck").includes("Cervical collar"));
    assert.ok(titles("lma").some((t) => t.startsWith("Orange")));
  });

  it("finds nothing for an empty query", () => {
    assert.deepEqual(search(docs, "   "), []);
  });

  it("cuts a snippet around the match", () => {
    const s = snippet("a ".repeat(100) + "the word fingerbreadths sits here " + "b ".repeat(100), ["fingerbreadths"], 40);
    assert.ok(s.includes("fingerbreadths"));
    assert.ok(s.startsWith("…") && s.endsWith("…"));
  });
});
