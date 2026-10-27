/**
 * Training record: one page of what this person has done in the guide — badges with the day each was earned, practice
 * scores and times, the Daily 5 and team drills — to print, save as a PDF or share, for a CPD portfolio or to show a
 * team leader. It is built from what is already kept on this device, and is the person's own record, not a FIFA
 * certificate. Plain functions, tested with `node --test`.
 */
import { BADGES, CASE_IDS, MISTAKES_FOR_BADGE, type Progress, type TeamRun } from "./progress.ts";
import { type Review, streakNow } from "./review.ts";

/** One line of the record: what it is, its value (numbers, or "Done" / "Not yet" / "—"), and whether it is complete. */
export type Row = { label: string; value: string; done: boolean };
export type RecordBadge = { id: string; title: string; how: string; earned: boolean; day: string | null };

const ROLES = ["black", "orange", "red", "blue", "white", "green"];
const MODULES = ["1", "2", "3", "4", "5", "6"];
const count = (list: readonly (string | number)[], all: readonly (string | number)[]) => all.filter((x) => list.includes(x)).length;
const yes = (on: boolean) => (on ? "Done" : "Not yet");

/** Every badge: earned or not, and the day it was earned when that was kept. */
export function recordBadges(p: Progress): RecordBadge[] {
  return BADGES.map((b) => {
    const earned = b.done(p);
    return { id: b.id, title: b.title, how: b.how, earned, day: earned ? (p.earnedAt[b.id] ?? null) : null };
  });
}

/** What has been practised, with the best scores and times. */
export function practiceRows(p: Progress): Row[] {
  const roles = count(p.roles, ROLES);
  const modules = count(p.modules, MODULES);
  const arrest = count(p.drills.arrest, [1, 2, 3, 4, 5, 6]);
  const spine = count(p.drills.spine, [1, 2, 3, 4, 5, 6, 7]);
  const cases = count(p.cases, CASE_IDS);
  return [
    { label: "Role cards opened", value: `${roles} / 6`, done: roles === 6 },
    { label: "Skill modules opened", value: `${modules} / 6`, done: modules === 6 },
    { label: "Cardiac arrest drill: steps watched in 3D", value: `${arrest} / 6`, done: arrest === 6 },
    { label: "Neck injury drill: steps watched in 3D", value: `${spine} / 7`, done: spine === 7 },
    { label: "Who does what?: best score", value: p.quizBest === null ? "—" : `${p.quizBest} / 10`, done: (p.quizBest ?? 0) >= 8 },
    { label: "Place the team", value: yes(p.placed), done: p.placed },
    { label: "AED pads trainer: fastest clean run (seconds)", value: p.aedBest === null ? "—" : p.aedBest.toFixed(1), done: p.aedClean },
    { label: "CPR rhythm: 30 compressions in a row at 100–120 a minute", value: yes(p.cprGood), done: p.cprGood },
    { label: "Case simulator: cases solved", value: `${cases} / ${CASE_IDS.length}`, done: cases === CASE_IDS.length },
    { label: "Spot the mistake: mistakes found", value: String(p.mistakes.length), done: p.mistakes.length >= MISTAKES_FOR_BADGE },
    { label: "Pack the bag: every item right", value: yes(p.bagClean), done: p.bagClean },
  ];
}

/** The Daily 5: the streak as it stands today, the longest run, and how the answers have gone. */
export function dailyRows(r: Review, day: string): Row[] {
  const now = streakNow(r, day);
  return [
    { label: "Daily 5: days in a row now", value: String(now), done: now > 0 },
    { label: "Daily 5: longest run of days", value: String(r.streak.best), done: r.streak.best >= 5 },
    { label: "Questions answered", value: String(r.answered), done: r.answered > 0 },
    { label: "Answered right (%)", value: r.answered ? String(Math.round((r.right / r.answered) * 100)) : "—", done: r.answered > 0 && r.right / r.answered >= 0.8 },
  ];
}

/** Team drills joined from this phone, newest first. */
export const teamRuns = (p: Progress): TeamRun[] => [...p.team].reverse();

/** The drill's name on the record. */
export const drillName = (drill: TeamRun["drill"]) => (drill === "spine" ? "Neck injury drill" : "Cardiac arrest drill");
