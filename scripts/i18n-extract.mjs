#!/usr/bin/env node
/**
 * Collects every piece of English text the app can show, for the translations (src/lib/i18n.ts):
 * JSX text, the attributes people read or hear (aria-label, alt, title, placeholder), and string literals
 * that read as words. A template literal becomes a pattern, "Step {0} of {1}", whose {n} parts are filled
 * in at run time (and translated themselves when they are text). Writes i18n/strings.json, sorted.
 *   node scripts/i18n-extract.mjs            write the list
 *   node scripts/i18n-extract.mjs --check    list what each language is missing (exit 1 if any)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");
// not shown to people: generated routes, sign-in and storage plumbing, the preview bridge
const SKIP = [
  /routeTree\.gen\.ts$/,
  /\.test\.tsx?$/,
  /[\\/]lib[\\/](auth|app-data|multiplayer)[\\/]/,
  /preview-host-bridge/,
  /[\\/]lib[\\/](image-sizes|db|search)\.ts$/,
  /[\\/]lib[\\/]i18n/,
];
const UI_ATTRS = new Set(["aria-label", "alt", "title", "placeholder", "aria-description", "aria-roledescription", "aria-valuetext"]);
const NOT_TEXT_ATTRS = new Set(["className", "style", "key", "id", "to", "href", "src", "hash", "type", "role", "rel", "target", "name", "method", "lang", "dir", "fill", "stroke", "d", "viewBox", "allow", "sandbox", "referrerPolicy"]);
// calls whose string arguments are never shown
const NOT_TEXT_CALLS = /^(cn|clsx|console\.\w+|localStorage\.\w+|sessionStorage\.\w+|document\.\w+|querySelector\w*|addEventListener|removeEventListener|setAttribute|getAttribute|matchMedia|new RegExp|RegExp|fetch|asset|import|require|navigate|Error|new Error|postMessage|dispatchEvent|createElement|classList\.\w+|startsWith|endsWith|includes|split|replace|test|match|padStart|toLocaleString|Intl\.\w+)$/;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mts)$/.test(n) ? [p] : [];
  });
}

const norm = (s) => s.replace(/\s+/g, " ").trim();
// JSX text reaches the page with its entities decoded ("GCS &lt; 15" shows as "GCS < 15")
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
  );
/** Reads as words: letters, and either a space or a capitalised word; not a list of CSS classes, a path or an id. */
function readsAsText(s) {
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (/^(https?:|mailto:|tel:|data:|\/|\.\/|#|@|[a-z]+:\/\/)/.test(s)) return false;
  if (/^[\w.-]+\.(png|jpe?g|webp|svg|mp3|mp4|glb|usdz|json|pdf|css|js|ts|tsx)$/i.test(s)) return false;
  if (/^[a-z0-9_.:/-]+$/.test(s)) return false; // ids, keys, slugs, single lowercase words
  if (/^[A-Z0-9_]+$/.test(s) && s.length <= 3) return false; // short codes
  if (/^\[|^[\w-]*\{\d\}[\w-]*$/.test(s)) return false; // selectors and ids built from a pattern ("tab-{0}")
  // media queries ("(min-width: 640px)", "(hover: none)", not "(studies: 0.15–0.35)"), SVG transforms, selectors, code
  if (/^\((?:[a-z]+-[\w-]+|hover|pointer|orientation|color|monochrome|resolution|scan|grid|update):|^(rotate|translate|scale|matrix)\(|\[data-|function\s*\(|=>|localStorage\./.test(s)) return false;
  if (/^\d{3} \d+px |^\d+px( \d+px)*$|; (autoplay|gyroscope)/.test(s)) return false; // canvas fonts, sizes, iframe permissions
  const words = s.split(" ");
  // one word: a real word ("Pause", "Needles", "SCORE", "Hands-off", "Name(s)"), not a video id or a camelCase name
  if (words.length === 1 && !/^(?:[A-Z]?[a-z]+(?:-[a-z]+)*(?:\(s\))?|[A-Z][A-Z]+(?:-[A-Z]+)*)[.!?:…]?$/.test(s.replace(/\{\d\}/g, ""))) return false;
  // class lists: every word has a dash, colon or bracket and no capitals outside brackets ("flex items-center text-[#1A7F45]")
  // (a word ending in a colon is a label, "{0}: tender", never a class)
  if (words.length > 1 && words.every((w) => (/[-:[\]/]/.test(w) && !/:$/.test(w)) || /^[a-z]+$/.test(w)) && words.some((w) => /[-:[\]]/.test(w)) && !/[A-Z]/.test(s.replace(/\[[^\]]*\]/g, ""))) return false;
  return true;
}

export function extract() {
  const found = new Set();
  const add = (s) => {
    const t = norm(s);
    if (t && readsAsText(t)) found.add(t);
  };
  for (const file of walk(src)) {
    if (SKIP.some((r) => r.test(file))) continue;
    const text = readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const callName = (n) => {
      for (let p = n.parent; p; p = p.parent) {
        if (ts.isCallExpression(p) || ts.isNewExpression(p)) return (ts.isNewExpression(p) ? "new " : "") + p.expression.getText(sf).replace(/^.*\.(?=\w+\.\w+$)/, "");
        if (ts.isJsxAttribute(p) || ts.isVariableDeclaration(p) || ts.isPropertyAssignment(p) || ts.isBlock(p)) return null;
      }
      return null;
    };
    const attrName = (n) => {
      for (let p = n.parent; p; p = p.parent) {
        if (ts.isJsxAttribute(p)) return p.name.getText(sf);
        if (ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p) || ts.isBlock(p)) return null;
      }
      return null;
    };
    const propName = (n) => (n.parent && ts.isPropertyAssignment(n.parent) && n.parent.initializer === n ? n.parent.name.getText(sf) : null);
    // search: only the titles show as they are; a result's snippet is cut from the English text
    const searchText = /search-index.ts$/.test(file);
    const skipLiteral = (n) => {
      if (searchText && propName(n) === "text") return true;
      const a = attrName(n);
      if (a && (NOT_TEXT_ATTRS.has(a) || (a.startsWith("data-") && !UI_ATTRS.has(a)))) return true;
      const c = callName(n);
      if (c && NOT_TEXT_CALLS.test(c.replace(/^new /, "new "))) return true;
      const p = propName(n);
      // (a role's name, a tab's label and a document's kind show on screen: "role", "tab" and "kind" are not here)
      if (p && /^(id|key|to|href|src|icon|color|tint|ink|bg|className|class|type|slug|path|file|url|hash|voice|sound|sfx|pattern|mime|format|lang|unit)$/.test(p)) return true;
      // object keys, import paths, type positions
      if (ts.isImportDeclaration(n.parent) || ts.isExportDeclaration(n.parent) || ts.isLiteralTypeNode(n.parent)) return true;
      if (ts.isPropertyAssignment(n.parent) && n.parent.name === n) return true;
      if (ts.isElementAccessExpression(n.parent) && n.parent.argumentExpression === n) return true;
      if (ts.isCaseClause(n.parent) || (ts.isBinaryExpression(n.parent) && /^(===|!==|==|!=|in)$/.test(n.parent.operatorToken.getText(sf)))) return true;
      return false;
    };
    (function visit(n) {
      if (ts.isImportDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n)) return;
      if (ts.isJsxText(n)) {
        // JSX text always shows: keep every piece with letters, short words too ("OF" in "STEP 3 OF 6")
        const t = norm(decode(n.text));
        if (/[A-Za-z]/.test(t)) found.add(t);
      }
      else if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !skipLiteral(n)) {
        const a = attrName(n);
        if (!a || UI_ATTRS.has(a) || !NOT_TEXT_ATTRS.has(a)) add(n.text);
      } else if (ts.isTemplateExpression(n) && !skipLiteral(n)) {
        let s = n.head.text;
        n.templateSpans.forEach((sp, i) => (s += `{${i}}` + sp.literal.text));
        // a pattern needs words of its own, not just the parts filled in
        if (/[A-Za-z]{2}/.test(s.replace(/\{\d\}/g, ""))) add(s);
      }
      ts.forEachChild(n, visit);
    })(sf);
  }
  return [...found].sort((a, b) => a.localeCompare(b, "en"));
}

const out = join(root, "i18n", "strings.json");
if (process.argv.includes("--check")) {
  const strings = extract();
  const langs = readdirSync(join(root, "i18n")).filter((f) => /^[a-z]{2}\.json$/.test(f));
  let missing = 0;
  for (const f of langs) {
    const dict = JSON.parse(readFileSync(join(root, "i18n", f), "utf8"));
    const gaps = strings.filter((s) => !(s in dict));
    missing += gaps.length;
    console.log(`${f}: ${strings.length - gaps.length}/${strings.length} translated${gaps.length ? `, missing ${gaps.length}` : ""}`);
    for (const g of gaps.slice(0, 40)) console.log(`  - ${g}`);
  }
  process.exit(missing ? 1 : 0);
} else {
  const strings = extract();
  writeFileSync(out, JSON.stringify(strings, null, 1) + "\n");
  const words = strings.reduce((n, s) => n + s.split(" ").length, 0);
  console.log(`[i18n] ${strings.length} strings, ${words} words → ${relative(root, out).split(sep).join("/")}`);
}
