#!/usr/bin/env node
/**
 * Builds the AR page's moving cards from the app's own 3D drills, so the cards show the team at work:
 *   public/video/ar-<drill>-<step>.mp4      720×480 loop, for the big preview of the chosen step
 *   public/video/ar-<drill>-<step>-sm.mp4   360×240 loop, for the small cards
 *   public/img/ar-cards/<drill>-<step>.webp the loop's first frame, the still under it
 * on a pitch-green ground (a video has no transparency, and green suits the light and the dark theme alike).
 * Each step loop starts on the preview moment and wraps round, with a short crossfade where the step's end meets its
 * start; the team in place (step 0) sways the camera gently round it instead; the whole drill plays at double speed.
 * The drills are recorded on their own timeline (lib/drill-timeline.ts), as scripts/build-ar-models.mjs records them.
 * Run it with the dev server going (npm run dev), after changing the 3D team, the steps or the call-outs, and leave
 * the app's files alone while it runs (an edit reloads the page under it):
 *   node scripts/build-ar-cards.mjs [http://127.0.0.1:8080]
 * Needs ffmpeg and ffprobe on the PATH.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const ROOT = new URL("../", import.meta.url);
const AUDIO = new URL("public/audio/", ROOT);
const FPS = 30;
const XFADE = 15; // frames: half a second where a step's end meets its start
const SWAY = { frames: 300, degrees: 10 }; // step 0: ten seconds, ±10° round the team
const DRILLS = ["arrest", "spine"];
const GREEN = "0x447a3c";
const LIMIT = 590_000; // bytes: scripts/media-clips.test.mjs allows a clip up to 600,000

const path = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);

// the drill timeline holds each call-out at least as long as its recording (as build-ar-models.mjs does)
const VOICE_FILES = Object.fromEntries([...readFileSync(new URL("src/lib/voice-files.ts", ROOT), "utf8").matchAll(/^\s*"([a-z0-9-]+)": "([a-z0-9-]+)",/gm)].map((m) => [m[1], m[2]]));
const durations = Object.fromEntries(readdirSync(new URL("voice/", AUDIO)).map((f) => [f.replace(/\.mp3$/, ""), probe(path(new URL(`voice/${f}`, AUDIO)))]));
for (const [id, file] of Object.entries(VOICE_FILES)) durations[id] = durations[file];

const work = mkdtempSync(join(tmpdir(), "ar-cards-"));
const save = (dir, prefix, urls, start) =>
  urls.forEach((u, i) => writeFileSync(join(dir, `${prefix}_${String(start + i + 1).padStart(4, "0")}.webp`), Buffer.from(u.split(",")[1], "base64")));

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("pageerror", (e) => console.error("[page]", String(e)));
await page.goto(`${BASE}/about`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const jobs = [];
for (const drill of DRILLS) {
  const rec = await page.evaluate(async ([d, opts]) => (await import("/scripts/ar/harness.tsx")).recordDrill(d, opts), [drill, { fps: FPS, durations }]);
  console.log(`${drill}: ${rec.frames} frames, ${(rec.length / 1000).toFixed(1)} s`);
  for (const seg of rec.segments) {
    const name = `${drill}-${seg.name}`;
    const { f0, f1, preview } = await page.evaluate(async (n) => (await import("/scripts/ar/harness.tsx")).cardFraming(n), seg.name);
    const dir = join(work, name);
    mkdirSync(dir);
    // which recorded frames, in which order: a = from the preview moment to the end, b = from the start back to it
    let a;
    let b = [];
    let sway;
    if (seg.name === "0") {
      a = Array.from({ length: SWAY.frames }, () => preview);
      sway = a.map((_, i) => SWAY.degrees * Math.sin((2 * Math.PI * i) / SWAY.frames));
    } else {
      const step = seg.name === "all" ? 2 : 1; // the whole drill at double speed
      const frames = [];
      for (let f = f0; f <= f1; f += step) frames.push(f);
      const at = frames.indexOf(frames.reduce((best, f) => (Math.abs(f - preview) < Math.abs(best - preview) ? f : best), frames[0]));
      a = frames.slice(at);
      b = frames.slice(0, at);
    }
    for (const [prefix, list] of [["a", a], ["b", b]]) {
      for (let i = 0; i < list.length; i += 45) {
        const urls = await page.evaluate(
          async ([fr, sw]) => (await import("/scripts/ar/harness.tsx")).renderCardFrames(fr, sw),
          [list.slice(i, i + 45), prefix === "a" && sway ? sway.slice(i, i + 45) : undefined],
        );
        save(dir, prefix, urls, i);
      }
    }
    jobs.push({ name, dir, a: a.length, b: b.length });
    console.log(`  ${name}: ${a.length + b.length} frames rendered`);
  }
  await page.evaluate(async () => (await import("/scripts/ar/harness.tsx")).finishDrill());
}
await browser.close();

// the ground: green, a touch darker towards the corners
const ground = join(work, "ground.png");
ff(["-f", "lavfi", "-i", `color=c=${GREEN}:s=720x480`, "-vf", "vignette=angle=PI/7", "-frames:v", "1", ground]);
const x264 = (crf, file) => ["-an", "-c:v", "libx264", "-crf", String(crf), "-preset", "slow", "-profile:v", "high", "-movflags", "+faststart", file];

const VIDEO = path(new URL("public/video/", ROOT));
const STILLS = path(new URL("public/img/ar-cards/", ROOT));
mkdirSync(STILLS, { recursive: true });
for (const { name, dir, a, b } of jobs) {
  const big = join(VIDEO, `ar-${name}.mp4`);
  const small = join(VIDEO, `ar-${name}-sm.mp4`);
  const inputs = ["-loop", "1", "-framerate", String(FPS), "-i", ground, "-framerate", String(FPS), "-i", join(dir, "a_%04d.webp")];
  let graph = `[1:v]format=yuva420p[fa];[0:v][fa]overlay=shortest=1:format=auto[va]`;
  let last = "va";
  if (b > 0) {
    inputs.push("-framerate", String(FPS), "-i", join(dir, "b_%04d.webp"));
    // the second ground copy: the overlay of b needs its own endless background
    inputs.push("-loop", "1", "-framerate", String(FPS), "-i", ground);
    const k = Math.min(XFADE, a - 1, b - 1);
    graph += `;[2:v]format=yuva420p[fb];[3:v][fb]overlay=shortest=1:format=auto[vb];[va][vb]xfade=transition=fade:duration=${(k / FPS).toFixed(4)}:offset=${((a - k) / FPS).toFixed(4)}[vx]`;
    last = "vx";
  }
  ff([...inputs, "-filter_complex", `${graph};[${last}]format=yuv420p,split[o1][o2];[o2]scale=360:240:flags=lanczos[o2s]`, "-map", "[o1]", ...x264(26, big), "-map", "[o2s]", ...x264(27, small)]);
  // a long loop (the whole drill) can come out over the limit: a notch more compression until it fits
  for (let crf = 27; statSync(big).size > LIMIT; crf++) ff([...inputs, "-filter_complex", `${graph};[${last}]format=yuv420p[o1]`, "-map", "[o1]", ...x264(crf, big)]);
  // the still: the loop's first frame on the ground
  ff(["-i", ground, "-i", join(dir, "a_0001.webp"), "-filter_complex", "[1:v]format=yuva420p[f];[0:v][f]overlay=format=auto", "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", join(STILLS, `${name}.webp`)]);
  const kb = (f) => Math.round(statSync(f).size / 1024);
  console.log(`  ${name}: ${probe(big).toFixed(1)} s · ${kb(big)} KB, small ${kb(small)} KB, still ${kb(join(STILLS, `${name}.webp`))} KB`);
}
rmSync(work, { recursive: true, force: true });
