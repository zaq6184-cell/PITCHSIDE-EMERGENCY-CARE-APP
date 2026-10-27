/**
 * "Every minute counts": how the chance of surviving a witnessed VF arrest falls with the minutes from
 * collapse to the first shock — about 7–10% a minute without CPR, about 3–4% a minute with bystander CPR
 * (AHA guidelines, Part 6: Electrical therapies). Shown as a share of the chance an immediate shock gives.
 * A teaching estimate, not a prediction for any one player. Plain functions, tested with `node --test`.
 */
export const DECLINE = { none: [7, 10], cpr: [3, 4] } as const;

/**
 * The aim for the first shock, in minutes from collapse — from the sports-medicine consensus and NATA sources in
 * Module 1, not from FIFA's documents (FIFA gives the "up to 10% a minute" decline).
 */
export const TARGET_MINUTES = 3;

/** FIFA Sudden Death Registry, 2014–2018: survival of players who received CPR, with and without an AED. */
export const FIFA_SDR = { players: 617, years: "2014–2018", withAed: 85, withoutAed: 35 } as const;

const pct = (x: number) => Math.min(100, Math.max(0, x));

/** The range of the remaining chance, [worst, best] in %, after `minutes` to the first shock. */
export function survivalBand(minutes: number, cpr: boolean): [number, number] {
  const [slow, fast] = cpr ? DECLINE.cpr : DECLINE.none;
  const m = Math.max(0, minutes);
  return [pct(100 - fast * m), pct(100 - slow * m)];
}

/** The line through the band: the average rate (8.5% or 3.5% a minute), down to zero. */
export function survivalMid(minutes: number, cpr: boolean): number {
  const [slow, fast] = cpr ? DECLINE.cpr : DECLINE.none;
  return pct(100 - ((slow + fast) / 2) * Math.max(0, minutes));
}

/** "70–79%" — or one number when the band has closed to it. */
export function bandText([lo, hi]: [number, number]): string {
  const a = Math.round(lo);
  const b = Math.round(hi);
  return a === b ? `${a}%` : `${a}–${b}%`;
}

/** mm:ss on the match clock, `minutes` after a collapse at `start` (e.g. 63). */
export function matchClock(start: number, minutes: number): string {
  const total = Math.round((start + minutes) * 60);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
