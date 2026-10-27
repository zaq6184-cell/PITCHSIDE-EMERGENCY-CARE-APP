/**
 * Daily 5: five quick questions a day from the role cards. A question answered wrongly comes back the next day; one
 * answered rightly comes back after a longer gap each time (spaced repetition, in Leitner boxes), so what is known is
 * asked less and what is not is asked more. Finishing the five on days in a row builds a streak. Answers in "Who does
 * what?" and the live class quiz count too. Kept on this device only (localStorage, never sent anywhere); plain
 * functions tested with `node --test`, the store around them runs in the browser only.
 */
import { addDays, dayKey, isDay } from "./day.ts";
import { record, step as did } from "./progress.ts";

export const DAILY = 5;
/** Days until a question comes back from each box: box 1 is just missed, box 6 known well. */
export const GAPS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };
const TOP = 6;

export type Card = { box: number; due: string; seen: number; right: number };
export type Today = { day: string; ids: string[]; answers: Record<string, boolean> };
export type Review = {
  cards: Record<string, Card>;
  /** today's five and how each went */
  today: Today | null;
  /** days in a row with the five finished: the last such day, the run up to it, and the longest run */
  streak: { last: string | null; count: number; best: number };
  answered: number;
  right: number;
};

export const EMPTY_REVIEW: Review = { cards: {}, today: null, streak: { last: null, count: 0, best: 0 }, answered: 0, right: 0 };

// ------------------------------------------------------------------ questions
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A question's lasting id, from what it asks and its answer: the same question in any game has the same id. */
export const questionId = (q: { prompt: string; text: string; answer: string }) => `q${hash(`${q.prompt}|${q.text}|${q.answer}`).toString(36)}`;

/** A shuffle that is the same all day (so today's five do not change on a reload). */
function seeded<T>(list: readonly T[], seed: string): T[] {
  let a = hash(seed) || 1;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const b = [...list];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * The questions to ask, best first: those due again (the longest overdue and least known first), then ones never asked
 * (in today's order), then the rest, soonest due first.
 */
export function pick(r: Review, pool: readonly string[], day: string, n = DAILY, skip: readonly string[] = []): string[] {
  const ids = pool.filter((id) => !skip.includes(id));
  const due = ids.filter((id) => r.cards[id] && r.cards[id].due <= day);
  due.sort((a, b) => r.cards[a].due.localeCompare(r.cards[b].due) || r.cards[a].box - r.cards[b].box || a.localeCompare(b));
  const fresh = seeded(
    ids.filter((id) => !r.cards[id]),
    day,
  );
  const rest = ids.filter((id) => r.cards[id] && r.cards[id].due > day);
  rest.sort((a, b) => r.cards[a].due.localeCompare(r.cards[b].due) || r.cards[a].box - r.cards[b].box || a.localeCompare(b));
  return [...due, ...fresh, ...rest].slice(0, n);
}

/** Today's five, chosen once a day (a question the app no longer asks is swapped for another). */
export function ensureToday(r: Review, pool: readonly string[], day: string): Review {
  const t = r.today;
  if (t?.day !== day) return { ...r, today: { day, ids: pick(r, pool, day), answers: {} } };
  if (t.ids.every((id) => pool.includes(id))) return r;
  const kept = t.ids.filter((id) => pool.includes(id));
  return { ...r, today: { ...t, ids: [...kept, ...pick(r, pool, day, DAILY - kept.length, kept)] } };
}

export const doneToday = (r: Review, day: string) => r.today?.day === day && r.today.ids.length > 0 && r.today.ids.every((id) => id in r.today!.answers);

/** The streak as it stands today: it holds through today if yesterday's five were finished. */
export const streakNow = (r: Review, day: string) => (r.streak.last === day || r.streak.last === addDays(day, -1) ? r.streak.count : 0);

/**
 * An answer: the question moves up a box (right) or back to box 1 (wrong). One of today's five answered in the Daily 5
 * (`daily`) is ticked off, and finishing the five counts for the streak.
 */
export function answer(r: Review, id: string, right: boolean, day: string, daily = false): Review {
  const was = r.cards[id];
  const box = right ? Math.min(TOP, (was?.box ?? 1) + 1) : 1;
  const card: Card = { box, due: addDays(day, GAPS[box]), seen: (was?.seen ?? 0) + 1, right: (was?.right ?? 0) + (right ? 1 : 0) };
  let next: Review = { ...r, cards: { ...r.cards, [id]: card }, answered: r.answered + 1, right: r.right + (right ? 1 : 0) };
  const t = r.today;
  if (daily && t?.day === day && t.ids.includes(id) && !(id in t.answers)) {
    next = { ...next, today: { ...t, answers: { ...t.answers, [id]: right } } };
    if (doneToday(next, day) && r.streak.last !== day) {
      const count = r.streak.last === addDays(day, -1) ? r.streak.count + 1 : 1;
      next = { ...next, streak: { last: day, count, best: Math.max(r.streak.best, count) } };
    }
  }
  return next;
}

/** Reads the saved Daily 5 back, keeping only what is well formed. */
export function parseReview(raw: string | null): Review {
  if (!raw) return EMPTY_REVIEW;
  try {
    const v = JSON.parse(raw) as Partial<Review> | null;
    if (!v || typeof v !== "object") return EMPTY_REVIEW;
    const int = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
    const cards: Record<string, Card> = {};
    for (const [id, c] of Object.entries(v.cards ?? {})) {
      if (c && typeof c === "object" && isDay(c.due)) cards[id] = { box: Math.min(TOP, Math.max(1, int(c.box))), due: c.due, seen: int(c.seen), right: int(c.right) };
    }
    const t = v.today;
    const today =
      t && isDay(t.day) && Array.isArray(t.ids)
        ? {
            day: t.day,
            ids: t.ids.filter((x): x is string => typeof x === "string"),
            answers: Object.fromEntries(Object.entries(t.answers ?? {}).filter(([, a]) => typeof a === "boolean")),
          }
        : null;
    const s = v.streak;
    return {
      cards,
      today,
      streak: { last: isDay(s?.last) ? s.last : null, count: int(s?.count), best: int(s?.best) },
      answered: int(v.answered),
      right: int(v.right),
    };
  } catch {
    return EMPTY_REVIEW;
  }
}

// ------------------------------------------------------------------ the store (browser only)
const KEY = "pec-review";
let state: Review = EMPTY_REVIEW;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseReview(localStorage.getItem(KEY));
  } catch {
    state = EMPTY_REVIEW;
  }
}

export function getReview(): Review {
  load();
  return state;
}

export function subscribeReview(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function commit(next: Review) {
  if (next === state) return;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked: the five last for this visit
  }
  listeners.forEach((l) => l());
}

const today = () => dayKey(new Date());

/** Chooses today's five (once a day) from the questions' ids. */
export function startToday(pool: readonly string[]) {
  load();
  commit(ensureToday(state, pool, today()));
}

/** Records an answer to a question: from the Daily 5 (`daily`), or from any quiz. */
export function noteAnswer(q: { prompt: string; text: string; answer: string }, right: boolean, daily = false) {
  load();
  const day = today();
  const was = state.streak.best;
  commit(answer(state, questionId(q), right, day, daily));
  if (state.streak.best !== was) record(did.streak, state.streak.best);
}
