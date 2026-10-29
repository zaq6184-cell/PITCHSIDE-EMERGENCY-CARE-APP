// Every animated picture points at a clip that exists, each clip is small enough for a phone, and no clip in
// public/video is left without a picture. Read from the source, so the test needs no build.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const video = (name) => new URL(`public/video/${name}.mp4`, root);

const scenes = [...read("src/lib/scene-images.ts").matchAll(/animated\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const cases = [...read("src/lib/scene-images.ts").matchAll(/casePic\("([a-z0-9-]+)"/g)].map((m) => m[1]);
// role-images.ts names each role's clip; module-covers.ts gives every module its own
const roles = [...read("src/lib/role-images.ts").matchAll(/^\s*[a-z]+: "(role-[a-z0-9-]+)",/gm)].map((m) => m[1]);
const covers = read("src/lib/module-covers.ts");
const modules = covers.includes("/video/module-${id}.mp4") ? [...covers.matchAll(/^\s*"(\d+)": "/gm)].map((m) => `module-${m[1]}`) : [];
// the list of cases plays a small copy of each case's loop
const caseSmall = read("src/lib/scene-images.ts").includes("smallVideo: asset(`/video/${name}-sm.mp4`)") ? cases.map((c) => `${c}-sm`) : [];
// the AR page: every step of both drills and the whole drill, big and small (lib/ar.ts; scripts/build-ar-cards.mjs makes them)
const steps = read("src/lib/ar.ts").match(/AR_STEPS: Record<ArDrill, number> = \{ arrest: (\d+), spine: (\d+) \}/);
// the cards' version, part of every name
const cards = read("src/lib/ar.ts").match(/^const CARDS = "([a-z0-9]+)";/m)[1];
const arClips = [
  ["arrest", Number(steps[1])],
  ["spine", Number(steps[2])],
].flatMap(([d, n]) => [...Array.from({ length: n + 1 }, (_, i) => `${d}-${i}-${cards}`), `${d}-all-${cards}`]);
const ar = arClips.flatMap((c) => [`ar-${c}`, `ar-${c}-sm`]);
// the AR page's header names its clip itself
const header = [...read("src/routes/ar.tsx").matchAll(/"\/video\/([a-z0-9-]+)\.mp4"/g)].map((m) => m[1]);
const named = [...scenes, ...cases, ...caseSmall, ...roles, ...modules, ...ar, ...header];

describe("animated pictures", () => {
  it("finds the medical cards, the cases, every page header, the six roles, the six modules and the AR page", () => {
    for (const n of [
      ...["medical-chest", "medical-female", "case-vf", "case-commotio", "case-heat", "case-vf-sm", "heat-cooling", "handover", "live-quiz", "scorer"],
      ...["env-cold-altitude", "module-1", "module-6", `ar-arrest-0-${cards}`, `ar-arrest-all-${cards}-sm`, `ar-spine-7-${cards}-sm`, "ar-phone"],
    ]) {
      assert.ok(named.includes(n), n);
    }
    assert.equal(roles.length, 6, `role clips: ${roles.join(", ")}`);
    assert.equal(modules.length, 6, `module clips: ${modules.join(", ")}`);
    assert.equal(caseSmall.length, 3, `small case clips: ${caseSmall.join(", ")}`);
    assert.equal(ar.length, 2 * (Number(steps[1]) + Number(steps[2]) + 4), `AR clips: ${ar.join(", ")}`);
  });

  it("has a still under every AR card's loop: its first frame", () => {
    for (const c of arClips) assert.ok(existsSync(new URL(`public/img/ar-cards/${c}.webp`, root)), `public/img/ar-cards/${c}.webp is missing`);
  });

  it("has a clip for every animated picture, each under 600 KB", () => {
    for (const n of named) {
      assert.ok(existsSync(video(n)), `public/video/${n}.mp4 is missing`);
      assert.ok(statSync(video(n)).size < 600_000, `${n}.mp4 is ${statSync(video(n)).size} bytes`);
    }
  });

  it("leaves no clip without a picture (the home page's intro aside)", () => {
    const used = new Set([...named, "intro"]);
    const files = readdirSync(new URL("public/video/", root)).filter((f) => f.endsWith(".mp4"));
    for (const f of files) assert.ok(used.has(f.slice(0, -4)), `public/video/${f} is not used`);
  });
});
