/**
 * Listen mode: a drill as sound only — every call-out in order, with the AED's shock and the siren — to rehearse with
 * the screen off. It plays the narration recorded for the AR models (public/ar/<drill>-all.mp3), which follows the 3D
 * drill's own timeline (lib/drill-timeline.ts) after a 3-second lead, so the same timeline gives the step and the line
 * heard at every moment. Plain functions, tested with `node --test`.
 */
import { drillTimeline, SFX_MS, VOICE_MIN_MS } from "./drill-timeline.ts";

export type ListenDrill = "arrest" | "spine";

/** The team in place before step 1, as in the narration (scripts/build-ar-models.mjs records the same timeline). */
export const LISTEN_LEAD_MS = 3000;

/** The narration of a whole drill. */
export const listenTrack = (drill: ListenDrill) => `/ar/${drill}-all.mp3`;

/** Something heard, from `at` to `end` (ms): a call-out (its id) or an effect ("sfx:shock", "sfx:siren"). */
export type Heard = { at: number; end: number; id: string };
export type ListenPlan = { length: number; chapters: { step: number; start: number }[]; heard: Heard[] };

const isVoice = (id: string) => id !== "cue" && !id.includes(":");

/** Each call-out's length in seconds, through the file it plays (a re-recorded line plays a new file). */
export function durationsFor(script: Record<number, readonly string[]>, seconds: Record<string, number>, file: (id: string) => string) {
  return Object.fromEntries(
    Object.values(script)
      .flat()
      .filter(isVoice)
      .map((id) => [id, seconds[file(id)] ?? 0]),
  );
}

/**
 * The drill laid out as it is heard: when each step starts, and when each call-out and effect plays. A call-out's line
 * stays up at least as long as the 3D player keeps its caption.
 */
export function listenPlan(
  script: Record<number, readonly string[]>,
  steps: readonly { hold?: number }[],
  durations: Record<string, number>,
  lead = LISTEN_LEAD_MS,
): ListenPlan {
  const { segments, length } = drillTimeline(script, steps, durations, lead);
  const heard: Heard[] = [];
  for (const s of segments)
    for (const e of s.events) {
      if (e.kind === "voice") heard.push({ at: e.at, end: e.at + Math.max(e.ms, VOICE_MIN_MS), id: e.id });
      else if (e.kind === "sfx") heard.push({ at: e.at, end: e.at + SFX_MS, id: `sfx:${e.name}` });
    }
  return { length, chapters: segments.map((s) => ({ step: s.step, start: s.start })), heard };
}

/** The step playing at `t` ms: 0 while the team gets in place. */
export function stepAt(plan: ListenPlan, t: number): number {
  let step = 0;
  for (const c of plan.chapters) if (t >= c.start) step = c.step;
  return step;
}

/** What is being heard at `t` ms, if anything. */
export function heardAt(plan: ListenPlan, t: number): Heard | null {
  return plan.heard.find((h) => t >= h.at && t < h.end) ?? null;
}

const startOf = (plan: ListenPlan, step: number) => plan.chapters.find((c) => c.step === step)?.start ?? 0;

/** Where the next step starts (the lock screen's skip forward), or null in the last step. */
export function nextStart(plan: ListenPlan, t: number): number | null {
  const next = plan.chapters.find((c) => c.start > t + 1);
  return next ? next.start : null;
}

/** The skip back: to the start of this step, or, in its first 2 seconds, of the step before. */
export function prevStart(plan: ListenPlan, t: number): number {
  const step = stepAt(plan, t);
  const start = startOf(plan, step);
  if (t - start > 2000 || step === 0) return start;
  return startOf(plan, step - 1);
}
