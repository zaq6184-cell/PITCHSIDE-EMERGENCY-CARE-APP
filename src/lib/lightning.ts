/**
 * Lightning on match day: the 30/30 rule. Count from the flash to the thunder — under 30 seconds the storm
 * is within about 10 km and play stops; resume only 30 minutes after the LAST flash or thunder (NATA
 * position statement on lightning safety; Football NSW lightning policy). Plain functions, tested with
 * `node --test`; the tool around them is components/lightning-tool.tsx.
 */
export const SOUND_KM_PER_S = 0.343;
export const STOP_SECONDS = 30;
export const RESUME_MINUTES = 30;
const RESUME_MS = RESUME_MINUTES * 60_000;

/** How far away the strike was, and whether play must stop. */
export function flashToBang(seconds: number) {
  const s = Math.max(0, seconds);
  return { seconds: s, km: Math.round(s * SOUND_KM_PER_S * 10) / 10, stop: s < STOP_SECONDS };
}

/** When play may resume: 30 minutes after the last flash or thunder. */
export const resumeAt = (lastStrike: number) => lastStrike + RESUME_MS;

/** Milliseconds still to wait (0 once the 30 minutes are up). */
export const waitLeft = (lastStrike: number, now: number) => Math.max(0, resumeAt(lastStrike) - now);

/** "29:05" */
export function mmss(ms: number) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Saved storm state (so a reload does not lose the countdown): the time of the last strike, or null. */
export function parseStorm(raw: string | null, now: number): number | null {
  if (!raw) return null;
  const t = Number(raw);
  if (!Number.isFinite(t) || t > now + 60_000) return null;
  return now - t < RESUME_MS ? t : null; // a finished countdown is not restored
}
