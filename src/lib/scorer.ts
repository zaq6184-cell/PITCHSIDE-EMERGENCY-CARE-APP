/**
 * Practical scorer: an instructor taps the events of a cardiac arrest set piece run on a manikin, and the
 * hands-off pauses. The timeline is measured against targets (editable, defaulting to this guide's: first
 * shock within 3 minutes of the collapse) and the compression fraction — the share of time with hands on the
 * chest — against ≥ 80%. Plain functions, tested with `node --test`; the page is routes/scorer.tsx.
 */
export type MarkId = "enter" | "call" | "cpr" | "aed" | "shock" | "airway" | "oxygen" | "transfer";

export type MarkDef = { id: MarkId; label: string; who: string; repeat?: boolean };

export const MARKS: MarkDef[] = [
  { id: "enter", label: "Team on the pitch", who: "All" },
  { id: "call", label: "Arrest called · ambulance", who: "Black" },
  { id: "cpr", label: "First compression", who: "Red" },
  { id: "aed", label: "AED pads on", who: "Green" },
  { id: "shock", label: "Shock", who: "Green", repeat: true },
  { id: "airway", label: "i-gel in", who: "Orange" },
  { id: "oxygen", label: "Oxygen on", who: "Blue" },
  { id: "transfer", label: "Transfer begins", who: "Black" },
];

/** Targets in seconds from the collapse; a mark without one is just timed. */
export type Targets = Partial<Record<MarkId, number>>;
export const DEFAULT_TARGETS: Targets = { enter: 15, call: 30, cpr: 60, aed: 120, shock: 180 };

export const CCF_TARGET = 0.8;
export const PAUSE_LIMIT = 10;

export type FlagId = "unsafe" | "pulse" | "oxygen" | "role" | "loop";
export const FLAGS: { id: FlagId; label: string }[] = [
  { id: "unsafe", label: "Touching at the shock" },
  { id: "pulse", label: "Pulse check after a shock" },
  { id: "oxygen", label: "Face-mask oxygen not removed" },
  { id: "role", label: "Out of role" },
  { id: "loop", label: "Call not closed-loop" },
];

export type Session = {
  /** wall-clock ms of the collapse */
  startedAt: number;
  /** seconds from the collapse */
  marks: { id: MarkId; at: number }[];
  pauses: { from: number; to: number | null }[];
  flags: { id: FlagId; at: number }[];
  endedAt: number | null;
};

export const newSession = (now: number): Session => ({ startedAt: now, marks: [], pauses: [], flags: [], endedAt: null });

export const firstAt = (s: Session, id: MarkId) => s.marks.find((m) => m.id === id)?.at ?? null;
export const count = (s: Session, id: MarkId) => s.marks.filter((m) => m.id === id).length;
export const pausing = (s: Session) => s.pauses.some((p) => p.to == null);

export function mark(s: Session, id: MarkId, at: number): Session {
  const def = MARKS.find((m) => m.id === id);
  if (!def || (!def.repeat && firstAt(s, id) != null)) return s;
  return { ...s, marks: [...s.marks, { id, at }] };
}

export function flag(s: Session, id: FlagId, at: number): Session {
  return { ...s, flags: [...s.flags, { id, at }] };
}

/** Hands off (start a pause) or hands back on (end it). Only counts once compressions have started. */
export function togglePause(s: Session, at: number): Session {
  if (firstAt(s, "cpr") == null) return s;
  if (pausing(s)) return { ...s, pauses: s.pauses.map((p) => (p.to == null ? { ...p, to: at } : p)) };
  return { ...s, pauses: [...s.pauses, { from: at, to: null }] };
}

export function end(s: Session, at: number): Session {
  const closed = pausing(s) ? togglePause(s, at) : s;
  return { ...closed, endedAt: at };
}

/** Pauses clipped to [from, to], with open ones running to `to`. */
function pauseSpans(s: Session, from: number, to: number) {
  return s.pauses.map((p) => [Math.max(from, p.from), Math.min(to, p.to ?? to)] as const).filter(([a, b]) => b > a);
}

/** Share of the time from the first compression to `now` with hands on the chest (null before CPR starts). */
export function compressionFraction(s: Session, now: number): number | null {
  const cpr = firstAt(s, "cpr");
  if (cpr == null || now <= cpr) return null;
  const off = pauseSpans(s, cpr, now).reduce((a, [x, y]) => a + (y - x), 0);
  return (now - cpr - off) / (now - cpr);
}

export function longestPause(s: Session, now: number): number {
  return pauseSpans(s, 0, now).reduce((a, [x, y]) => Math.max(a, y - x), 0);
}

export type Check = { id: MarkId; label: string; at: number | null; target: number | undefined; ok: boolean | null };

/** Each mark against its target: ok, late, or (no time yet) null. */
export function checks(s: Session, targets: Targets): Check[] {
  return MARKS.map((m) => {
    const at = firstAt(s, m.id);
    const target = targets[m.id];
    return { id: m.id, label: m.label, at, target, ok: at == null || target == null ? null : at <= target };
  });
}

export const mmss = (sec: number) => {
  const t = Math.max(0, Math.round(sec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** A plain-text debrief to paste into a team chat. */
export function debriefText(s: Session, targets: Targets): string {
  const now = s.endedAt ?? 0;
  const ccf = compressionFraction(s, now);
  const lines = [
    `Cardiac arrest set piece — practical debrief (${new Date(s.startedAt).toLocaleString()})`,
    `Run time ${mmss(now)}`,
    ...checks(s, targets)
      .filter((c) => c.at != null || c.target != null)
      .map((c) => `${c.label}: ${c.at == null ? "not done" : mmss(c.at)}${c.target != null ? ` (target ${mmss(c.target)}) ${c.ok === true ? "✓" : c.ok === false ? "late" : ""}` : ""}`),
    `Shocks: ${count(s, "shock")}`,
    `Compression fraction: ${ccf == null ? "—" : `${Math.round(ccf * 100)}%`} (target ≥ ${Math.round(CCF_TARGET * 100)}%)`,
    `Longest hands-off pause: ${Math.round(longestPause(s, now))} s (target < ${PAUSE_LIMIT} s)`,
    ...(s.flags.length ? ["Points to discuss:", ...s.flags.map((f) => `· ${mmss(f.at)} ${FLAGS.find((x) => x.id === f.id)?.label ?? f.id}`)] : []),
  ];
  return lines.join("\n");
}

/** Saved session (a reload keeps the run going). */
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Session;
    if (typeof v?.startedAt !== "number" || !Array.isArray(v.marks) || !Array.isArray(v.pauses) || !Array.isArray(v.flags)) return null;
    return v;
  } catch {
    return null;
  }
}
