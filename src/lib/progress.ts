/**
 * "Your training": what this person has done in the guide, and the badges it earns. It is kept on this
 * device only (localStorage) and never sent anywhere. The badge rules are plain functions so they can
 * be tested with `node --test`; the store around them only runs in the browser.
 */
import { dayKey, isDay } from "./day.ts";

export type DrillName = "arrest" | "spine";

/** A team drill taken part in from this phone: the day, the drill and the colour. */
export type TeamRun = { d: string; drill: DrillName; role: string };

export type Progress = {
  /** role cards opened */
  roles: string[];
  /** skill modules opened */
  modules: string[];
  /** drill steps watched in 3D */
  drills: Record<DrillName, number[]>;
  /** best score out of 10 in "Who does what?" */
  quizBest: number | null;
  /** "Place the team" finished */
  placed: boolean;
  /** fastest clean run of the AED trainer, in seconds */
  aedBest: number | null;
  /** a run with both pads right first time and everyone clear before the shock */
  aedClean: boolean;
  /** 30 compressions in a row at 100–120 a minute in the CPR rhythm trainer */
  cprGood: boolean;
  /** "Pack the bag" with every item right and nothing faulty packed */
  bagClean: boolean;
  /** case simulator: the cases finished with a good outcome */
  cases: string[];
  /** spot the mistake: the planted mistakes found in the 3D drills */
  mistakes: string[];
  /** team drills joined from this phone, newest last */
  team: TeamRun[];
  /** drills listened to to the end in Listen mode */
  listened: DrillName[];
  /** the longest run of days with the Daily 5 finished */
  bestStreak: number;
  /** badges already celebrated */
  badges: string[];
  /** the day each badge was earned (badges earned before dates were kept have none) */
  earnedAt: Record<string, string>;
};

export const EMPTY: Progress = {
  roles: [],
  modules: [],
  drills: { arrest: [], spine: [] },
  quizBest: null,
  placed: false,
  aedBest: null,
  aedClean: false,
  cprGood: false,
  bagClean: false,
  cases: [],
  mistakes: [],
  team: [],
  listened: [],
  bestStreak: 0,
  badges: [],
  earnedAt: {},
};

/** The team drills kept (the training record lists them). */
export const TEAM_RUNS_KEPT = 50;
/** Days running of the Daily 5 for "Five in a row". */
export const STREAK_FOR_BADGE = 5;

/** The three cases in the simulator, and how many planted mistakes earn "Eagle eye". */
export const CASE_IDS = ["vf", "commotio", "heat"] as const;
export const MISTAKES_FOR_BADGE = 6;

export type Badge = { id: string; title: string; how: string; done: (p: Progress) => boolean };

const has = (list: readonly (string | number)[], all: readonly (string | number)[]) => all.every((x) => list.includes(x));

/** The badges, in the order they are shown. */
export const BADGES: Badge[] = [
  { id: "colours", title: "All six colours", how: "Open every role card", done: (p) => has(p.roles, ["black", "orange", "red", "blue", "white", "green"]) },
  { id: "modules", title: "Skill modules", how: "Open all six modules", done: (p) => has(p.modules, ["1", "2", "3", "4", "5", "6"]) },
  { id: "arrest", title: "Arrest drill", how: "Watch all six steps in 3D", done: (p) => has(p.drills.arrest, [1, 2, 3, 4, 5, 6]) },
  { id: "spine", title: "Neck injury drill", how: "Watch all seven steps in 3D", done: (p) => has(p.drills.spine, [1, 2, 3, 4, 5, 6, 7]) },
  { id: "quiz", title: "Sharp", how: "Score 8 or more in Who does what?", done: (p) => (p.quizBest ?? 0) >= 8 },
  { id: "place", title: "Team placed", how: "Place all six colours correctly", done: (p) => p.placed },
  { id: "aed", title: "Safe shock", how: "AED trainer: pads right first time, everyone clear", done: (p) => p.aedClean },
  { id: "aed-fast", title: "Under 20 seconds", how: "A clean AED run in under 20 seconds", done: (p) => p.aedBest !== null && p.aedBest < 20 },
  { id: "cpr", title: "In the zone", how: "30 compressions in a row at 100–120 a minute", done: (p) => p.cprGood },
  { id: "cases", title: "Case solved", how: "Finish all three cases in the simulator with a good outcome", done: (p) => has(p.cases, CASE_IDS) },
  { id: "mistakes", title: "Eagle eye", how: `Spot ${MISTAKES_FOR_BADGE} planted mistakes in the 3D drills`, done: (p) => p.mistakes.length >= MISTAKES_FOR_BADGE },
  { id: "bag", title: "Bag packed", how: "Pack the bag with every item right and nothing faulty", done: (p) => p.bagClean },
  { id: "team", title: "Team player", how: "Take part in a team drill from your phone", done: (p) => p.team.length > 0 },
  { id: "streak", title: "Five in a row", how: "Finish the Daily 5 five days running", done: (p) => p.bestStreak >= STREAK_FOR_BADGE },
  { id: "listen", title: "All ears", how: "Listen to a whole drill in Listen mode", done: (p) => p.listened.length > 0 },
];

/** Badges earned but not yet celebrated. */
export function newBadges(p: Progress): Badge[] {
  return BADGES.filter((b) => b.done(p) && !p.badges.includes(b.id));
}

/** Marks newly earned badges as celebrated, with the day they were earned. */
export function stampBadges(p: Progress, day: string): Progress {
  const fresh = newBadges(p);
  if (!fresh.length) return p;
  return { ...p, badges: [...p.badges, ...fresh.map((b) => b.id)], earnedAt: { ...p.earnedAt, ...Object.fromEntries(fresh.map((b) => [b.id, day])) } };
}

export const earnedCount = (p: Progress) => BADGES.filter((b) => b.done(p)).length;

/** The next thing to try, for the Home card. */
export const nextBadge = (p: Progress) => BADGES.find((b) => !b.done(p));

const add = <T>(list: T[], x: T) => (list.includes(x) ? list : [...list, x]);

/** Pure updates, one per thing that can happen in the guide. */
export const step = {
  role: (p: Progress, id: string): Progress => ({ ...p, roles: add(p.roles, id) }),
  module: (p: Progress, id: string): Progress => ({ ...p, modules: add(p.modules, id) }),
  drill: (p: Progress, drill: DrillName, n: number): Progress => ({ ...p, drills: { ...p.drills, [drill]: add(p.drills[drill], n) } }),
  quiz: (p: Progress, score: number): Progress => ({ ...p, quizBest: Math.max(p.quizBest ?? 0, score) }),
  placed: (p: Progress): Progress => ({ ...p, placed: true }),
  aed: (p: Progress, r: { seconds: number; wrong: number; unsafe: number }): Progress => {
    const clean = r.wrong === 0 && r.unsafe === 0;
    return {
      ...p,
      aedClean: p.aedClean || clean,
      aedBest: clean ? Math.min(p.aedBest ?? Infinity, Math.round(r.seconds * 10) / 10) : p.aedBest,
    };
  },
  cpr: (p: Progress): Progress => ({ ...p, cprGood: true }),
  bag: (p: Progress): Progress => ({ ...p, bagClean: true }),
  caseSolved: (p: Progress, id: string): Progress => ({ ...p, cases: add(p.cases, id) }),
  mistake: (p: Progress, id: string): Progress => ({ ...p, mistakes: add(p.mistakes, id) }),
  /** a team drill joined: once a day for each drill and colour */
  team: (p: Progress, run: TeamRun): Progress =>
    p.team.some((t) => t.d === run.d && t.drill === run.drill && t.role === run.role) ? p : { ...p, team: [...p.team, run].slice(-TEAM_RUNS_KEPT) },
  listened: (p: Progress, drill: DrillName): Progress => ({ ...p, listened: add(p.listened, drill) }),
  streak: (p: Progress, days: number): Progress => ({ ...p, bestStreak: Math.max(p.bestStreak, days) }),
};

/** Reads saved progress back, keeping only what is well formed. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as Partial<Progress> | null;
    if (!v || typeof v !== "object") return EMPTY;
    const strings = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);
    const numbers = (x: unknown) => (Array.isArray(x) ? x.filter((n): n is number => typeof n === "number") : []);
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
    const drill = (x: unknown): x is DrillName => x === "arrest" || x === "spine";
    const team = Array.isArray(v.team)
      ? v.team.filter((t): t is TeamRun => !!t && typeof t === "object" && isDay(t.d) && drill(t.drill) && typeof t.role === "string").slice(-TEAM_RUNS_KEPT)
      : [];
    const earnedAt = Object.fromEntries(Object.entries(v.earnedAt ?? {}).filter(([, d]) => isDay(d)));
    return {
      roles: strings(v.roles),
      modules: strings(v.modules),
      drills: { arrest: numbers(v.drills?.arrest), spine: numbers(v.drills?.spine) },
      quizBest: num(v.quizBest),
      placed: v.placed === true,
      aedBest: num(v.aedBest),
      aedClean: v.aedClean === true,
      cprGood: v.cprGood === true,
      bagClean: v.bagClean === true,
      cases: strings(v.cases),
      mistakes: strings(v.mistakes),
      team,
      listened: strings(v.listened).filter(drill),
      bestStreak: num(v.bestStreak) ?? 0,
      badges: strings(v.badges),
      earnedAt,
    };
  } catch {
    return EMPTY;
  }
}

// ------------------------------------------------------------------ the store (browser only)
const KEY = "pec-progress";
let state: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const unlockListeners = new Set<(b: Badge) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseProgress(localStorage.getItem(KEY));
  } catch {
    state = EMPTY;
  }
}

export function getProgress(): Progress {
  load();
  return state;
}

export function subscribeProgress(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Called once for each badge as it is earned (the toast and confetti listen). */
export function onBadge(l: (b: Badge) => void) {
  unlockListeners.add(l);
  return () => {
    unlockListeners.delete(l);
  };
}

function commit(next: Progress) {
  const fresh = newBadges(next);
  next = stampBadges(next, dayKey(new Date()));
  if (JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked: progress lasts for this visit
  }
  listeners.forEach((l) => l());
  fresh.forEach((b) => unlockListeners.forEach((l) => l(b)));
}

export function record<A extends unknown[]>(fn: (p: Progress, ...a: A) => Progress, ...args: A) {
  load();
  commit(fn(state, ...args));
}

export function resetProgress() {
  load();
  state = EMPTY;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing saved
  }
  listeners.forEach((l) => l());
}
