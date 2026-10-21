#!/usr/bin/env node
/**
 * Builds the augmented-reality models from the app's own 3D set piece, one per drill step:
 *   public/ar/<drill>-<step>.glb   Android: Google's AR viewer (Scene Viewer)
 *   public/ar/<drill>-<step>.usdz  iPhone and iPad: AR Quick Look
 *   public/ar/<drill>-<step>.webp  the preview picture on the AR page
 * Run it with the dev server going (npm run dev), after changing the 3D team or the steps:
 *   node scripts/build-ar-models.mjs [http://127.0.0.1:8080]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const OUT = new URL("../public/ar/", import.meta.url);
// the steps after "the team in place" (0): the arrest drill has 6, the neck injury drill 7
const DRILLS = { arrest: 6, spine: 7 };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("pageerror", (e) => console.error("[page]", String(e)));
await page.goto(`${BASE}/about`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

// everything is written at the end: a change in public/ makes the dev server reload the page mid-run
const files = [];
for (const [drill, last] of Object.entries(DRILLS)) {
  for (let step = 0; step <= last; step++) {
    // the neck drill's last step shows the lift: the basket brought to the player, raised on Black's count
    const opts = drill === "spine" && step === 7 ? { phase: 2, settleMs: 1300 } : {};
    const r = await page.evaluate(
      async ([d, s, o]) => {
        const m = await import("/scripts/ar/harness.tsx");
        return m.exportStep(d, s, o);
      },
      [drill, step, opts],
    );
    const glb = Buffer.from(r.glb, "base64");
    const usdz = Buffer.from(r.usdz, "base64");
    const webp = Buffer.from(r.picture.split(",")[1], "base64");
    files.push([`${drill}-${step}.glb`, glb], [`${drill}-${step}.usdz`, usdz], [`${drill}-${step}.webp`, webp]);
    console.log(`${drill}-${step}: glb ${(glb.length / 1024).toFixed(0)} KB, usdz ${(usdz.length / 1024).toFixed(0)} KB, webp ${(webp.length / 1024).toFixed(0)} KB`);
  }
}
await browser.close();
for (const [name, data] of files) writeFileSync(new URL(name, OUT), data);
console.log(`total ${(files.reduce((n, [, d]) => n + d.length, 0) / 1048576).toFixed(1)} MB in public/ar/`);
