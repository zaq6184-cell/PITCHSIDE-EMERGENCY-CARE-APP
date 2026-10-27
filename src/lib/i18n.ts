import { useCallback, useSyncExternalStore } from "react";
import { asset } from "@/lib/asset";
import { I18N_FILES } from "@/lib/i18n-files";

/**
 * Languages. English is the app's own language and the default; the others are translations of all the
 * text the app shows (i18n/<code>.json, keyed by the English, built into public/i18n by
 * scripts/i18n-build.mjs). Translation happens where text enters the page — new text nodes, changed text,
 * and the attributes people read or hear (aria-label, alt, title, placeholder) — so the components stay
 * in English and need no changes. "Step {0} of {1}" entries are patterns: the {n} parts are kept, and
 * translated too when they are text. The recorded voices stay in English; their captions are translated.
 * Text inside translate="no" is left alone.
 */
export type Lang = "en" | keyof typeof I18N_FILES;

export const LANGS: { code: Lang; name: string; english: string }[] = [
  { code: "en", name: "English", english: "English" },
  ...(
    [
      { code: "es", name: "Español", english: "Spanish" },
      { code: "fr", name: "Français", english: "French" },
      { code: "pt", name: "Português", english: "Portuguese" },
      { code: "ms", name: "Bahasa Malaysia", english: "Malay" },
      { code: "de", name: "Deutsch", english: "German" },
    ] as const
  ).filter((l) => l.code in I18N_FILES),
] as { code: Lang; name: string; english: string }[];

const KEY = "pec-lang";
const fileFor = (code: string) => (I18N_FILES as Record<string, string>)[code];

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v && fileFor(v) ? (v as Lang) : "en";
  } catch {
    return "en";
  }
}

/** Choose a language: the page reloads in it (English reloads untouched). */
export function setLang(code: Lang) {
  try {
    if (code === "en") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, code);
  } catch {
    // storage blocked: the choice cannot be kept
    return;
  }
  window.location.reload();
}

/**
 * Runs in <head> before the page shows: for a chosen language it sets <html lang>, starts loading the
 * translations, and keeps the page hidden until they are in (at most 1.6 s; see .i18n-wait in styles.css).
 */
export const i18nBootScript = `try{var l=localStorage.getItem("${KEY}"),f=${JSON.stringify(Object.fromEntries(Object.entries(I18N_FILES).map(([k, v]) => [k, asset(`/i18n/${v}`)])))}[l];if(f){var d=document.documentElement;d.lang=l;d.classList.add("i18n-wait");window.__pecDict=fetch(f).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}}catch(e){}`;

// ------------------------------------------------------------------ the dictionary
type Pattern = { re: RegExp; order: number[]; out: string; weight: number };
const exact = new Map<string, string>();
const upper = new Map<string, string>();
const patterns: Pattern[] = [];
const memo = new Map<string, string | null>();
/** Every translation, so text already translated is not reported as missing. */
const outputs = new Set<string>();
let lang: Lang = "en";
let active = false;
/** Text that found no translation, kept for the coverage check (scripts look at window.__i18nMisses). */
const misses = new Set<string>();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function load(dict: Record<string, string>) {
  for (const [k, v] of Object.entries(dict)) {
    if (!v) continue;
    if (/\{\d\}/.test(k)) {
      const parts = k.split(/\{(\d)\}/);
      const order: number[] = [];
      let src = "^";
      parts.forEach((p, i) => {
        if (i % 2) {
          src += "([\\s\\S]*?)"; // a part can be empty ("{2}" when there is no reading)
          order.push(Number(p));
        } else src += escapeRe(p);
      });
      patterns.push({ re: new RegExp(`${src}$`), order, out: v, weight: k.replace(/\{\d\}/g, "").length });
    } else {
      exact.set(k, v);
      upper.set(k.toUpperCase(), v);
    }
    // kept as translate() sees text: the build puts no-break spaces between numbers and units, translate() reads them as spaces
    const seen = v.replace(/\u00a0/g, " ");
    outputs.add(seen).add(seen.toLocaleUpperCase(lang));
  }
  // the most specific pattern first
  patterns.sort((a, b) => b.weight - a.weight);
}

/** The translation of a piece of text without its outer spaces, or null. */
function lookup(s: string, depth = 0): string | null {
  const hit = exact.get(s);
  if (hit !== undefined) return hit;
  // text shown in capitals ("STEP 3 · AED AND SHOCK") is the same text upper-cased
  if (/[A-Z]/.test(s) && s === s.toUpperCase()) {
    const u = upper.get(s);
    if (u !== undefined) return u.toLocaleUpperCase(lang);
  }
  // and text lower-cased in a sentence ("Call ambulance") is the same text too
  if (/^[a-z]/.test(s)) {
    const c = exact.get(s[0].toUpperCase() + s.slice(1));
    if (c !== undefined) return c[0].toLocaleLowerCase(lang) + c.slice(1);
  }
  if (depth > 2) return null;
  for (const p of patterns) {
    const m = p.re.exec(s);
    if (!m) continue;
    return p.out.replace(/\{(\d)\}/g, (_, n: string) => {
      const part = m[p.order.indexOf(Number(n)) + 1] ?? "";
      if (!/[A-Za-z]/.test(part)) return part;
      // a part keeps its outer spaces, like a whole piece of text (" Inside the 3-minute target.")
      const [, lead, core, tail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(part) ?? ["", "", part, ""];
      return lead + capturedPart(core, depth + 1) + tail;
    });
  }
  return pieces(s, depth);
}

/**
 * A part a pattern captured. A list run together with middle dots ("CPR from 15:42 · 2 shocks") is translated item by
 * item; otherwise the first item's own pattern ("CPR from {0}") would take the rest of the list as its part.
 */
function capturedPart(core: string, depth: number): string {
  if (core.includes(" · ") && !exact.has(core)) return core.split(" · ").map((x) => (/[A-Za-z]/.test(x) ? (lookup(x, depth) ?? x) : x)).join(" · ");
  return lookup(core, depth) ?? core;
}

/**
 * Text the app puts together from pieces it knows: a list run together with middle dots ("Touchline · Visible
 * signs"), sentences side by side, a label and what follows it, a quotation, a note in brackets, a name and
 * its number ("BLACK 1"). Each piece is looked up on its own; null when none of them is known.
 */
function pieces(s: string, depth: number): string | null {
  const join = (parts: string[], sep: string) => {
    let known = false;
    const out = parts.map((p) => {
      const t = /[A-Za-z]/.test(p) ? lookup(p, depth + 1) : null;
      if (t !== null) known = true;
      return t ?? p;
    });
    return known ? out.join(sep) : null;
  };
  let m = /^([“"«‘([])([\s\S]+)([”"»’)\]])$/.exec(s);
  if (m) {
    const t = lookup(m[2], depth + 1);
    if (t !== null) return m[1] + t + m[3];
  }
  if (s.includes(" · ")) return join(s.split(" · "), " · ");
  // sentences: split after . ! ? where the next one starts with a capital (no look-behind: older iPhones)
  const sentences: string[] = [];
  let from = 0;
  for (const end of s.matchAll(/[.!?]\s+(?=[“"(]?[A-Z0-9])/g)) {
    sentences.push(s.slice(from, end.index + 1));
    from = end.index + end[0].length;
  }
  if (sentences.length) return join([...sentences, s.slice(from)], " ");
  m = /^([^:]{2,40}): ([\s\S]+)$/.exec(s);
  if (m) {
    const head = lookup(`${m[1]}:`, depth + 1);
    const tail = lookup(m[2], depth + 1);
    if (head !== null || tail !== null) return `${head ?? `${m[1]}:`} ${tail ?? m[2]}`;
  }
  m = /^([\s\S]+?) \(([^()]+)\)$/.exec(s);
  if (m) {
    const main = lookup(m[1], depth + 1);
    const note = lookup(m[2], depth + 1);
    if (main !== null || note !== null) return `${main ?? m[1]} (${note ?? m[2]})`;
  }
  // …or a time ("CPR 1:00")
  m = /^([\s\S]*[A-Za-z][\s\S]*?) (\d[\d:.,]*)$/.exec(s);
  if (m) {
    const t = lookup(m[1], depth + 1);
    if (t !== null) return `${t} ${m[2]}`;
  }
  return null;
}

/** Translate one piece of text, keeping its outer spaces; text with no letters is left as it is. */
export function translate(text: string): string {
  if (!active || !text || !/[A-Za-z]/.test(text)) return text;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!m) return text;
  const core = m[2].replace(/\u00a0/g, " ");
  let t = memo.get(core);
  if (t === undefined) {
    t = lookup(core);
    if (memo.size > 4000) memo.clear(); // timers and scores make endless new strings
    memo.set(core, t);
    if (t === null && misses.size < 2000 && !outputs.has(core)) misses.add(core);
    // a translation put together from patterns and pieces is not reported as missing when it passes through again
    else if (t !== null && outputs.size < 50_000) outputs.add(t.replace(/\u00a0/g, " "));
  }
  return t === null ? text : m[1] + t + m[3];
}

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * For text a component works out from other text (a title cut short for a chip): translate the whole text
 * first. The component renders again once the language is in; until then, and in English, text passes through.
 */
export function useTranslate() {
  const on = useSyncExternalStore(subscribe, () => active, () => false);
  return useCallback((s: string) => (on ? translate(s) : s), [on]);
}

/** Text that leaves the page — a shared log, a copied plan, words drawn on a canvas — translated line by line. */
export function translateText(text: string): string {
  return active ? text.split("\n").map(translate).join("\n") : text;
}

// ------------------------------------------------------------------ the page
const ATTRS = new Set(["aria-label", "alt", "title", "placeholder", "aria-description", "aria-roledescription", "aria-valuetext"]);
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"]);

/** Left alone: scripts and styles, and anything inside translate="no". */
function skipped(node: Node | null) {
  const el = node && (node.nodeType === 1 ? (node as Element) : node.parentElement);
  if (!el) return false;
  return SKIP_TAGS.has(el.tagName) || Boolean(el.closest('[translate="no"]'));
}

/**
 * The English of whatever was translated before it joined the page. React builds new parts of the page away from
 * it, so a node cannot yet see that it will sit inside translate="no"; once it is attached, `restore` puts the
 * English back (the app's name in the top bar is one such part).
 */
const english = new WeakMap<Node, { text?: string; attrs?: Map<string, string> }>();
const remember = (n: Node, change: { text?: string; attr?: [string, string] }) => {
  const e = english.get(n) ?? {};
  if (change.text !== undefined) e.text = change.text;
  if (change.attr) (e.attrs ??= new Map()).set(...change.attr);
  english.set(n, e);
};

function install() {
  const nodeValue = Object.getOwnPropertyDescriptor(Node.prototype, "nodeValue");
  const textContent = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
  if (!nodeValue?.set || !textContent?.set) return;
  const setValue = nodeValue.set;
  const setContent = textContent.set;
  Object.defineProperty(Node.prototype, "nodeValue", {
    ...nodeValue,
    set(this: Node, v: string | null) {
      const t = this.nodeType === 3 && typeof v === "string" && !skipped(this) ? translate(v) : v;
      if (t !== v && typeof v === "string") remember(this, { text: v });
      setValue.call(this, t);
    },
  });
  Object.defineProperty(Node.prototype, "textContent", {
    ...textContent,
    set(this: Node, v: string | null) {
      const t = typeof v === "string" && (this.nodeType === 1 || this.nodeType === 3) && !skipped(this) ? translate(v) : v;
      if (t !== v && typeof v === "string") remember(this, { text: v });
      setContent.call(this, t);
    },
  });
  const createTextNode = Document.prototype.createTextNode;
  Document.prototype.createTextNode = function (this: Document, data: string) {
    const t = translate(data);
    const node = createTextNode.call(this, t);
    if (t !== data) remember(node, { text: data });
    return node;
  };
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    const t = ATTRS.has(name) && typeof value === "string" && !skipped(this) ? translate(value) : value;
    if (t !== value) remember(this, { attr: [name, value] });
    setAttribute.call(this, name, t);
  };
  // put the English back in anything that turns out to sit inside translate="no" once it is attached
  const restore = (root: Node) => {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n: Node | null = root; n; n = walk.nextNode()) {
      // text there was never meant to be translated, so it is not missing either (the language names in the menu)
      if (n.nodeType === 3) misses.delete((n.nodeValue ?? "").trim().replace(/\u00a0/g, " "));
      const e = english.get(n);
      if (!e) continue;
      english.delete(n);
      if (e.text !== undefined) (n.nodeType === 3 ? setValue : setContent).call(n, e.text);
      e.attrs?.forEach((v, a) => setAttribute.call(n as Element, a, v));
    }
  };
  // React inserts a whole new part of the page at once: the translate="no" region may be the part, sit inside
  // one already on the page, or lie somewhere within it
  const settle = (n: Node) => {
    if (skipped(n)) restore(n);
    else if (n.nodeType === 1) (n as Element).querySelectorAll('[translate="no"]').forEach(restore);
  };
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach(settle);
  }).observe(document.body, { childList: true, subtree: true });
  const title = Object.getOwnPropertyDescriptor(Document.prototype, "title");
  if (title?.set) {
    const setTitle = title.set;
    Object.defineProperty(Document.prototype, "title", {
      ...title,
      set(this: Document, v: string) {
        setTitle.call(this, translate(v));
      },
    });
  }
}

/**
 * React has taken this node over (hydrated it): it carries React's own fiber key. Text that is an element's
 * only content has no fiber of its own; its element is hydrated after all it holds, so that one counts.
 */
const fiber = (n: Node | null) => Boolean(n) && Object.keys(n as Node).some((k) => k.startsWith("__reactFiber$"));
const hydrated = (n: Node) => fiber(n) || (n.nodeType === 3 && fiber(n.parentElement));
const done = new WeakSet<Node>();

/**
 * Translate what was already on the page in the built HTML, node by node as React takes it over — never
 * before, or React would find its text changed under it. Returns how many nodes are still waiting.
 */
function translateBuiltPage() {
  let waiting = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (done.has(t) || !/[A-Za-z]/.test(t.data) || skipped(t)) continue;
    if (!hydrated(t)) {
      waiting += 1;
      continue;
    }
    done.add(t);
    const v = translate(t.data);
    if (v !== t.data) t.data = v;
  }
  document.body.querySelectorAll([...ATTRS].map((a) => `[${a}]`).join(",")).forEach((el) => {
    if (done.has(el) || skipped(el)) return;
    if (!hydrated(el)) {
      waiting += 1;
      return;
    }
    done.add(el);
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) el.setAttribute(a, v); // through the translating setAttribute
    }
  });
  return waiting;
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Start the chosen language (the root layout calls this from an effect, once React is running). */
export async function startI18n() {
  const html = document.documentElement;
  lang = getLang();
  if (lang === "en") return html.classList.remove("i18n-wait");
  const w = window as Window & { __pecDict?: Promise<Record<string, string> | null>; __i18nMisses?: Set<string> };
  const dict =
    (await w.__pecDict) ??
    (await fetch(asset(`/i18n/${fileFor(lang)}`))
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : null))
      .catch(() => null));
  if (dict && !active) {
    load(dict);
    active = true;
    w.__i18nMisses = misses;
    install();
    // parts of the page hydrate a little later (each page's code arrives on its own): keep going until all is in
    for (let i = 0; translateBuiltPage() > 0 && i < 40; i++) await sleep(i < 10 ? 50 : 150);
    const title = document.title;
    document.title = title; // again, through the translating setter
    listeners.forEach((l) => l());
  }
  html.lang = dict ? lang : "en";
  html.classList.remove("i18n-wait");
}
