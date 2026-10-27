#!/usr/bin/env node
/**
 * Writes src/lib/voice-durations.ts: how long each recorded call-out in public/audio/voice/ lasts (ffprobe), by file
 * name. Listen mode lays its captions over the drill narration with it, and the team drill keeps the drill screen's
 * pace while a phone says a colour's line. Run it after a call-out is re-recorded (and rebuild the AR narration too):
 *   node scripts/voice-durations.mjs
 * Needs ffprobe on the PATH.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const DIR = new URL("public/audio/voice/", ROOT);
const path = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

const rows = readdirSync(DIR)
  .filter((f) => f.endsWith(".mp3"))
  .sort()
  .map((f) => `  "${f.replace(/\.mp3$/, "")}": ${probe(path(new URL(f, DIR))).toFixed(3)},`);

writeFileSync(
  new URL("src/lib/voice-durations.ts", ROOT),
  `/**
 * How long each recorded call-out lasts, in seconds, by file name (public/audio/voice/). Written by
 * scripts/voice-durations.mjs (ffprobe): run it again after a call-out is re-recorded.
 */
export const VOICE_SECONDS: Record<string, number> = {
${rows.join("\n")}
};
`,
);
console.log(`[voice-durations] ${rows.length} call-outs → src/lib/voice-durations.ts`);
