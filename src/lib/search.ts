/**
 * Finding things in the guide: every word typed must appear somewhere in an entry (the last word may be
 * half-typed). Matches in the title count most, then the subtitle, then the body. Pure functions, so
 * they can be tested with `node --test`.
 */
export type Doc = { title: string; sub?: string; text: string };
export type Hit<T> = { doc: T; snippet: string; score: number };

/** Lower case, accents and punctuation off, so "C-spine" finds "c spine". */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();

/** Other words people type for the same thing. */
const ALIASES: Record<string, string[]> = {
  epinephrine: ["adrenaline"],
  defib: ["aed"],
  defibrillator: ["aed"],
  neck: ["cervical", "spine"],
  cspine: ["cervical"],
  spinal: ["spine", "cervical"],
  board: ["scoop", "spinal board"],
  stretcher: ["scoop", "basket"],
  concussion: ["focus"],
  head: ["focus", "head"],
  ambulance: ["ambulance", "transfer"],
  lma: ["i gel", "igel"],
  igel: ["i gel"],
  cpr: ["compressions", "cpr"],
  heart: ["cardiac", "heart"],
  sca: ["cardiac arrest", "sca"],
  timer: ["timer", "clock"],
};

type Prepared<T> = { doc: T; title: string; sub: string; text: string };

export function prepare<T extends Doc>(docs: readonly T[]): Prepared<T>[] {
  return docs.map((doc) => ({ doc, title: norm(doc.title), sub: norm(doc.sub ?? ""), text: norm(doc.text) }));
}

/** Points for one word in one entry, or 0 if it is nowhere. */
function wordScore(p: Prepared<unknown>, word: string, prefix: boolean) {
  const forms = [word, ...(ALIASES[word] ?? [])];
  let best = 0;
  for (const f of forms) {
    const esc = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^| )${esc}${prefix ? "" : "($| |s )"}`);
    const wholeTitle = re.test(p.title);
    // a half-typed word that is already a whole word of the title ("ar" in "AR: …") beats one it only starts
    const exactTitle = prefix && wholeTitle && new RegExp(`(^| )${esc}($| |s )`).test(`${p.title} `);
    const s =
      (exactTitle ? 13 : wholeTitle ? 12 : p.title.includes(f) ? 7 : 0) +
      (re.test(p.sub) ? 4 : p.sub.includes(f) ? 2 : 0) +
      (re.test(p.text) ? 2 : p.text.includes(f) ? 1 : 0);
    best = Math.max(best, f === word ? s : s * 0.8);
  }
  return best;
}

/** A short piece of the body around the first word found, for the result line. */
export function snippet(text: string, words: string[], size = 110) {
  const lower = text.toLowerCase();
  let at = -1;
  for (const w of words) {
    const i = lower.indexOf(w);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) at = 0;
  let start = Math.max(0, at - Math.round(size * 0.3));
  // begin and end on whole words, never part-way through one
  if (start > 0 && /\S/.test(text[start - 1])) {
    const space = text.indexOf(" ", start);
    if (space >= 0 && space < at) start = space + 1;
  }
  let end = Math.min(text.length, start + size);
  if (end < text.length && /\S/.test(text[end - 1]) && /\S/.test(text[end])) {
    const space = text.lastIndexOf(" ", end);
    if (space > Math.max(start, at)) end = space;
  }
  const piece = text.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${piece}${end < text.length ? "…" : ""}`;
}

export function search<T extends Doc>(prepared: readonly Prepared<T>[], query: string, limit = 20): Hit<T>[] {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const hits: Hit<T>[] = [];
  for (const p of prepared) {
    let total = 0;
    let ok = true;
    for (let i = 0; i < words.length; i++) {
      const s = wordScore(p, words[i], i === words.length - 1);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) hits.push({ doc: p.doc, score: total, snippet: snippet(p.doc.text, words) });
  }
  return hits.sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length).slice(0, limit);
}
