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
const named = [...scenes, ...cases, ...roles, ...modules];

describe("animated pictures", () => {
  it("finds the medical cards, the cases, every page header, the six roles and the six modules", () => {
    for (const n of ["medical-chest", "medical-female", "case-vf", "case-commotio", "case-heat", "heat-cooling", "handover", "live-quiz", "scorer", "env-cold-altitude", "module-1", "module-6"]) {
      assert.ok(named.includes(n), n);
    }
    assert.equal(roles.length, 6, `role clips: ${roles.join(", ")}`);
    assert.equal(modules.length, 6, `module clips: ${modules.join(", ")}`);
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
