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
const roles = read("src/lib/workshop.ts").match(/export type RoleId = ([^;]+);/)[1].match(/"([a-z]+)"/g).map((s) => `role-${s.slice(1, -1)}`);
const named = [...scenes, ...cases, ...(read("src/lib/role-images.ts").includes("/video/role-${id}.mp4") ? roles : [])];

describe("animated pictures", () => {
  it("finds the medical cards, the cases, the heat and handover headers and the six roles", () => {
    for (const n of ["medical-chest", "medical-female", "case-vf", "case-commotio", "case-heat", "heat-cooling", "handover", "role-black", "role-green"]) {
      assert.ok(named.includes(n), n);
    }
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
