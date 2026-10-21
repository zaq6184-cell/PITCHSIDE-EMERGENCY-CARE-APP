#!/usr/bin/env node
/**
 * Writes the service worker into the built site (run after `vite build`):
 *   node scripts/build-sw.mjs [outDir=.output/public]
 * Lists the app shell (pages, code, fonts, icons) to save at install and the media
 * (pictures, audio, video, documents) that can be saved on request.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, process.argv[2] ?? ".output/public");
if (!existsSync(out)) {
  console.error(`[build-sw] ${out} does not exist — run the build first`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(out).map((p) => relative(out, p).split(sep).join("/"));
// install-dialog screenshots and the share card are never needed offline, nor the AR models' call-outs
// (Google's AR viewer downloads those itself, past the service worker)
const skip = (f) =>
  f === "sw.js" || f === ".nojekyll" || f === "404.html" || f === "og.jpg" || f.startsWith("__grok/") || f.startsWith("screenshots/") || /^ar\/.*\.mp3$/.test(f);
const shell = [];
const media = [];
for (const f of files.sort()) {
  if (skip(f)) continue;
  if (f.endsWith(".html") || f.startsWith("assets/") || f.startsWith("fonts/") || f.startsWith("icons/") || f === "favicon.svg" || f === "manifest.webmanifest" || f === "brand/logo-mark.svg") {
    shell.push(f);
  } else if (/\.(png|jpe?g|webp|svg|gif|mp3|mp4|pdf)$/i.test(f)) {
    media.push(f);
  }
}

const template = readFileSync(join(root, "scripts/sw-template.js"), "utf8");
const hash = createHash("sha256").update(template); // a change to the worker itself is a new version too
// each prerendered page carries the router's build timestamps (u:1792…): left out, so rebuilding the same
// app is the same version and installed apps are not asked to update for nothing
const content = (f) => (f.endsWith(".html") ? readFileSync(join(out, f), "utf8").replace(/\bu:\d{12,}/g, "u:0") : readFileSync(join(out, f)));
for (const f of shell) hash.update(f).update(content(f));
const version = hash.digest("hex").slice(0, 12);
const sw = template
  .replace('const VERSION = "__VERSION__";', `const VERSION = "${version}";`)
  .replace("const SHELL = __SHELL__;", `const SHELL = ${JSON.stringify(shell)};`)
  .replace("const MEDIA = __MEDIA__;", `const MEDIA = ${JSON.stringify(media)};`);
if (/= __(SHELL|MEDIA|VERSION)__/.test(sw)) throw new Error("[build-sw] a placeholder was not filled in");
writeFileSync(join(out, "sw.js"), sw);

const size = (list) => list.reduce((n, f) => n + statSync(join(out, f)).size, 0);
const mb = (n) => (n / 1048576).toFixed(1);
console.log(`[build-sw] version ${version}: ${shell.length} shell files (${mb(size(shell))} MB), ${media.length} media files (${mb(size(media))} MB)`);
