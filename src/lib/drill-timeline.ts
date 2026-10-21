/**
 * When things happen in a drill played on its own: each step's call-outs in order, the cues that move the
 * 3D team on, and when the next step starts. The 3D drill player paces its scripts with these numbers,
 * and the AR models and their narration are recorded from the same timeline, so all three agree.
 * Plain functions, tested with `node --test`.
 */

/** A step starts with this pause before the first call-out. */
export const LEAD_MS = 400;
/** A call-out stays up at least this long, so its caption can be read. */
export const VOICE_MIN_MS = 2300;
/** And this gap follows it. */
export const VOICE_GAP_MS = 200;
/** A sound effect (the AED's shock, the siren) takes this long. */
export const SFX_MS = 1400;
/** After the script, at least this long before the next step. */
export const REST_MIN_MS = 1200;
/** A step without its own hold time lasts at least this long. */
export const DEFAULT_HOLD_MS = 9000;

export type TimelineEvent =
  | { at: number; kind: "voice"; id: string; ms: number }
  | { at: number; kind: "sfx"; name: string }
  | { at: number; kind: "cue"; phase: number };

/** One step's script laid out in time, from the step's start (ms), and how long the step lasts. */
export function stepTimeline(script: readonly string[], durations: Record<string, number>, hold = DEFAULT_HOLD_MS) {
  const events: TimelineEvent[] = [];
  let t = LEAD_MS;
  let phase = 0;
  for (const id of script) {
    if (id === "cue") {
      events.push({ at: t, kind: "cue", phase: ++phase });
    } else if (id.startsWith("wait:")) {
      t += Number(id.slice(5)) || 0;
    } else if (id.startsWith("sfx:")) {
      events.push({ at: t, kind: "sfx", name: id.slice(4) });
      t += SFX_MS;
    } else {
      const ms = Math.round((durations[id] ?? 0) * 1000);
      events.push({ at: t, kind: "voice", id, ms });
      t += Math.max(ms, VOICE_MIN_MS) + VOICE_GAP_MS;
    }
  }
  return { events, length: Math.max(hold, t + REST_MIN_MS) };
}

export type DrillSegment = { step: number; start: number; length: number; events: TimelineEvent[] };

/**
 * The whole drill, step after step as the player runs it on its own: `lead` ms of the team in place
 * (step 0), then each step. Event times are from the start of the whole drill.
 */
export function drillTimeline(
  script: Record<number, readonly string[]>,
  steps: readonly { hold?: number }[],
  durations: Record<string, number>,
  lead = 3000,
) {
  const segments: DrillSegment[] = [{ step: 0, start: 0, length: lead, events: [] }];
  let start = lead;
  steps.forEach((s, i) => {
    const n = i + 1;
    const { events, length } = stepTimeline(script[n] ?? [], durations, s.hold ?? DEFAULT_HOLD_MS);
    segments.push({ step: n, start, length, events: events.map((e) => ({ ...e, at: e.at + start })) });
    start += length;
  });
  return { segments, length: start };
}

/** The 3D scene's step and cue phase at time `t` (ms) of a drill timeline. */
export function stateAt(segments: readonly DrillSegment[], t: number) {
  const seg = [...segments].reverse().find((s) => t >= s.start) ?? segments[0];
  const phase = seg.events.filter((e) => e.kind === "cue" && e.at <= t).length;
  return { step: seg.step, phase };
}
