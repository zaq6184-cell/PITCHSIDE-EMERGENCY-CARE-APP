#!/usr/bin/env node
/**
 * Builds the translations the app loads (src/lib/i18n.ts): each i18n/<code>.json (English → translation)
 * is checked against i18n/strings.json (scripts/i18n-extract.mjs) and written to public/i18n/<code>-<hash>.json
 * — a new name whenever it changes, so installed apps never keep an old copy — and src/lib/i18n-files.ts
 * lists the files. A language joins the app's language list as soon as its file is here.
 *   node scripts/i18n-extract.mjs && node scripts/i18n-build.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "i18n");
const out = join(root, "public", "i18n");
const strings = JSON.parse(readFileSync(join(dir, "strings.json"), "utf8"));
const holes = (s) => (s.match(/\{\d\}/g) ?? []).sort().join("");

mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) rmSync(join(out, f));
const files = {};
let problems = 0;
for (const f of readdirSync(dir).filter((n) => /^[a-z]{2}\.json$/.test(n)).sort()) {
  const code = f.slice(0, 2);
  const src = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const dict = {};
  let missing = 0;
  for (const s of strings) {
    const t = src[s];
    if (typeof t !== "string" || !t.trim()) {
      missing += 1;
      continue;
    }
    if (holes(t) !== holes(s)) {
      console.error(`[i18n] ${code}: the {n} parts differ — "${s}" → "${t}"`);
      problems += 1;
      continue;
    }
    dict[s] = t;
  }
  const json = JSON.stringify(dict);
  const name = `${code}-${createHash("sha256").update(json).digest("hex").slice(0, 10)}.json`;
  writeFileSync(join(out, name), json);
  files[code] = name;
  console.log(`[i18n] ${code}: ${Object.keys(dict).length}/${strings.length} strings${missing ? ` (${missing} missing)` : ""} → public/i18n/${name}`);
}
writeFileSync(
  join(root, "src", "lib", "i18n-files.ts"),
  `// Written by scripts/i18n-build.mjs — the translation files in public/i18n, by language.\nexport const I18N_FILES = ${JSON.stringify(files, null, 2).replace(/"(\w\w)":/g, "$1:")} as const;\n`,
);
if (problems) process.exit(1);
