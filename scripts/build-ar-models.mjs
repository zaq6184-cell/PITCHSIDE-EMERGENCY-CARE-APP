#!/usr/bin/env node
/**
 * Builds the augmented-reality models from the app's own 3D set piece, with the team moving:
 *   public/ar/<drill>-<step>.glb   Android: Google's AR viewer (Scene Viewer) — glTF animation
 *   public/ar/<drill>-<step>.usdz  iPhone and iPad: AR Quick Look — USD time samples
 *   public/ar/<drill>-<step>.mp3   the step's call-outs, timed to the animation (Scene Viewer plays it with
 *                                  the model, in a loop)
 * <step> is 0 (the team in place, still) … the last step, or "all" for the whole drill end to end. The AR page's
 * moving pictures of each step come from scripts/build-ar-cards.mjs.
 * Each drill is recorded once on the 3D drill player's own timeline (src/lib/drill-timeline.ts), so the
 * moves and the voices land where they do in the app. Run it with the dev server going (npm run dev),
 * after changing the 3D team, the steps or the call-outs:
 *   node scripts/build-ar-models.mjs [http://127.0.0.1:8080] [--audio-only]
 * Needs ffmpeg and ffprobe on the PATH for the narration.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

// --audio-only rewrites only the narration (.mp3), e.g. after a call-out is re-recorded or re-levelled at the same
// length; the models stay as they are
const AUDIO_ONLY = process.argv.includes("--audio-only");
const BASE = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const ROOT = new URL("../", import.meta.url);
const OUT = new URL("public/ar/", ROOT);
const AUDIO = new URL("public/audio/", ROOT);
const FPS = 15;
const DRILLS = ["arrest", "spine"];
// the 3D drill player plays these effects at these levels (components/set-piece-3d.tsx)
const SFX_VOLUME = { shock: 0.6, siren: 0.35 };

const path = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

// a call-out whose recording was replaced keeps its id but plays a new file (src/lib/voice-files.ts)
const VOICE_FILES = Object.fromEntries([...readFileSync(new URL("src/lib/voice-files.ts", ROOT), "utf8").matchAll(/^\s*"([a-z0-9-]+)": "([a-z0-9-]+)",/gm)].map((m) => [m[1], m[2]]));
const voiceFile = (id) => VOICE_FILES[id] ?? id;

// how long each recorded call-out is: the timeline holds each one at least this long
const durations = Object.fromEntries(readdirSync(new URL("voice/", AUDIO)).map((f) => [f.replace(/\.mp3$/, ""), probe(path(new URL(`voice/${f}`, AUDIO)))]));
for (const [id, file] of Object.entries(VOICE_FILES)) durations[id] = durations[file];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("pageerror", (e) => console.error("[page]", String(e)));
await page.goto(`${BASE}/about`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

// everything is written at the end: a change in public/ makes the dev server reload the page mid-run
const files = [];
const narration = [];
for (const drill of DRILLS) {
  const rec = await page.evaluate(
    async ([d, opts]) => (await import("/scripts/ar/harness.tsx")).recordDrill(d, opts),
    [drill, { fps: FPS, durations }],
  );
  console.log(`${drill}: ${rec.frames} frames, ${(rec.length / 1000).toFixed(1)} s`);
  for (const seg of rec.segments) {
    const r = await page.evaluate(async (name) => (await import("/scripts/ar/harness.tsx")).exportSegment(name), seg.name);
    const name = `${drill}-${seg.name}`;
    const glb = Buffer.from(r.glb, "base64");
    const usdz = Buffer.from(r.usdz, "base64");
    files.push([`${name}.glb`, glb], [`${name}.usdz`, usdz]);
    if (seg.name !== "0") narration.push({ name, lengthMs: r.lengthMs, events: r.events });
    console.log(`  ${name}: ${(r.lengthMs / 1000).toFixed(1)} s, ${r.tracks} moving parts · glb ${(glb.length / 1024).toFixed(0)} KB, usdz ${(usdz.length / 1024).toFixed(0)} KB`);
  }
  await page.evaluate(async () => (await import("/scripts/ar/harness.tsx")).finishDrill());
}
await browser.close();
if (!AUDIO_ONLY) for (const [name, data] of files) writeFileSync(new URL(name, OUT), data);

// the narration: each call-out and effect at its moment, mixed, exactly as long as the animation
for (const { name, lengthMs, events } of narration) {
  const clips = events.filter((e) => e.kind === "voice" || e.kind === "sfx");
  const out = path(new URL(`${name}.mp3`, OUT));
  const secs = (lengthMs / 1000).toFixed(3);
  const args = ["-y", "-v", "error"];
  clips.forEach((e) => args.push("-i", path(new URL(e.kind === "voice" ? `voice/${voiceFile(e.id)}.mp3` : `sfx/${e.name}.mp3`, AUDIO))));
  // silence underneath, so the track runs the animation's full length even where nobody speaks
  args.push("-f", "lavfi", "-t", secs, "-i", "anullsrc=r=44100:cl=mono");
  const chains = clips.map((e, i) => `[${i}:a]aformat=sample_rates=44100:channel_layouts=mono,volume=${e.kind === "sfx" ? (SFX_VOLUME[e.name] ?? 0.6) : 1},adelay=${Math.round(e.at)}[a${i}]`);
  const inputs = clips.map((_, i) => `[a${i}]`).join("") + `[${clips.length}:a]`;
  args.push("-filter_complex", `${chains.join(";")}${chains.length ? ";" : ""}${inputs}amix=inputs=${clips.length + 1}:normalize=0:dropout_transition=0,atrim=0:${secs}[out]`);
  args.push("-map", "[out]", "-t", secs, "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "64k", out);
  execFileSync("ffmpeg", args);
  console.log(`  ${name}.mp3: ${probe(out).toFixed(2)} s for a ${secs} s animation, ${clips.length} sounds`);
}
const total = files.reduce((n, [, d]) => n + d.length, 0);
console.log(AUDIO_ONLY ? `${narration.length} narration tracks (models left as they were)` : `models ${(total / 1048576).toFixed(1)} MB in public/ar/, plus ${narration.length} narration tracks`);
