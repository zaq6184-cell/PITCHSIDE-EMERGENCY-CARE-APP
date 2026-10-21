/**
 * The arrest timer's log, counted from the collapse. Pure functions only (no DOM), so it can be tested
 * with `node --test`. The timings and drug steps are the ones this guide already teaches from FIFA's
 * protocol: rhythm check every 2 minutes, first shock within 3 minutes, and — only if trained —
 * adrenaline after the 3rd shock (at once if no shock is advised), amiodarone 300 mg then 150 mg.
 */
/** Where the arrest timer keeps its run on this device, and whether its voice is on — read by the timer page and by
 *  the live bar every other page shows while a run is going (components/live-arrest.tsx). */
export const ARREST_KEY = "pec-arrest-timer";
export const ARREST_VOICE_KEY = "pec-arrest-voice";

export type ArrestEventKind = "cpr" | "aed" | "shock" | "noshock" | "adrenaline" | "amiodarone" | "airway" | "rosc" | "ambulance";
export type ArrestEvent = { kind: ArrestEventKind; at: number };
export type ArrestSession = { startedAt: number; events: ArrestEvent[]; endedAt?: number };

/** Rhythm check, and swap the person compressing: every 2 minutes. */
export const CYCLE_MS = 2 * 60_000;
/** Aim for the first shock within 3 minutes of the collapse. */
export const FIRST_SHOCK_TARGET_MS = 3 * 60_000;
/** Adrenaline, if trained, is repeated every 3–5 minutes. */
export const ADRENALINE_EVERY_MS = 3 * 60_000;
/** A timer left running this long is treated as finished when the page opens again. */
export const STALE_MS = 2 * 60 * 60_000;

/** Events that happen once: their buttons show the time instead of logging again. */
export const ONCE: readonly ArrestEventKind[] = ["cpr", "aed", "airway", "rosc", "ambulance"];

const KINDS = new Set<ArrestEventKind>(["cpr", "aed", "shock", "noshock", "adrenaline", "amiodarone", "airway", "rosc", "ambulance"]);

export function count(s: ArrestSession, kind: ArrestEventKind) {
  return s.events.filter((e) => e.kind === kind).length;
}

export function first(s: ArrestSession, kind: ArrestEventKind) {
  return s.events.find((e) => e.kind === kind);
}

export function latest(s: ArrestSession, kind: ArrestEventKind) {
  for (let i = s.events.length - 1; i >= 0; i--) if (s.events[i].kind === kind) return s.events[i];
  return undefined;
}

/** Minutes and seconds, e.g. 0:07 or 12:40. */
export function clock(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** The next amiodarone dose in FIFA's sequence: 300 mg after the 3rd shock, 150 mg after the 5th. */
export function amiodaroneDose(s: ArrestSession): 300 | 150 | null {
  const n = count(s, "amiodarone");
  return n === 0 ? 300 : n === 1 ? 150 : null;
}

/** What a log line says, e.g. "Shock 2" or "Amiodarone 150 mg". */
export function eventLabel(s: ArrestSession, index: number) {
  const e = s.events[index];
  const n = s.events.slice(0, index + 1).filter((x) => x.kind === e.kind).length;
  switch (e.kind) {
    case "cpr":
      return "CPR started";
    case "aed":
      return "AED on";
    case "shock":
      return `Shock ${n}`;
    case "noshock":
      return "No shock advised";
    case "adrenaline":
      return n === 1 ? "Adrenaline 1 mg" : `Adrenaline 1 mg (dose ${n})`;
    case "amiodarone":
      return n === 1 ? "Amiodarone 300 mg" : "Amiodarone 150 mg";
    case "airway":
      return "i-gel in";
    case "rosc":
      return "Signs of life";
    case "ambulance":
      return "Ambulance here";
  }
}

/** Rhythm checks fall every 2 minutes from the start of CPR (from the collapse until CPR is logged). */
function cycleStart(s: ArrestSession) {
  return first(s, "cpr")?.at ?? s.startedAt;
}

/** Time left until the next rhythm check. */
export function nextCheckIn(s: ArrestSession, now: number) {
  return CYCLE_MS - (Math.max(0, now - cycleStart(s)) % CYCLE_MS);
}

/** How many rhythm checks have come round by now: 1 at 2:00, 2 at 4:00 … */
export function checksDue(s: ArrestSession, now: number) {
  return Math.floor(Math.max(0, now - cycleStart(s)) / CYCLE_MS);
}

/** Reminders from the protocol for this moment. Drug and extrication lines are for trained teams. */
export function prompts(s: ArrestSession, now: number): string[] {
  const out: string[] = [];
  if (!first(s, "cpr")) out.push("Start chest compressions: 100–120 a minute, 5–6 cm deep, full recoil.");
  if (!first(s, "aed")) out.push("Apply the AED the moment it arrives — do not wait for the 30-count.");
  if (first(s, "rosc")) return out;
  const shocks = count(s, "shock");
  const adrenaline = latest(s, "adrenaline");
  if (!adrenaline && shocks < 3 && count(s, "noshock") > 0) out.push("If trained — no shock advised: adrenaline 1 mg IV as soon as possible.");
  if (!adrenaline && shocks >= 3) out.push("If trained: adrenaline 1 mg IV (after the 3rd shock).");
  if (adrenaline && now - adrenaline.at >= ADRENALINE_EVERY_MS)
    out.push(`If trained: adrenaline every 3–5 minutes — last dose ${clock(now - adrenaline.at)} ago.`);
  const dose = amiodaroneDose(s);
  if (dose === 300 && shocks >= 3) out.push("If trained: amiodarone 300 mg (after the 3rd shock).");
  if (dose === 150 && shocks >= 5) out.push("If trained: amiodarone 150 mg (after the 5th shock).");
  if (shocks >= 3 && (adrenaline || count(s, "amiodarone") > 0))
    out.push("Team leader: plan the move — the ambulance or a buggy onto the pitch to the player, and a mechanical CPR device (LUCAS) if available. 10-second carries only as a last resort.");
  return out;
}

export type SummaryRow = { label: string; value: string; target?: "met" | "missed" };

/** The debrief: how long each step took from the collapse. */
export function summary(s: ArrestSession, now: number): SummaryRow[] {
  const end = s.endedAt ?? now;
  const since = (e?: ArrestEvent) => (e ? clock(e.at - s.startedAt) : "—");
  const shock = first(s, "shock");
  const rows: SummaryRow[] = [
    { label: "Total time", value: clock(end - s.startedAt) },
    { label: "Collapse → CPR", value: since(first(s, "cpr")) },
    { label: "Collapse → AED on", value: since(first(s, "aed")) },
    {
      label: "Collapse → first shock",
      value: since(shock),
      target: shock ? (shock.at - s.startedAt <= FIRST_SHOCK_TARGET_MS ? "met" : "missed") : undefined,
    },
    { label: "Shocks", value: String(count(s, "shock")) },
    { label: "Adrenaline doses", value: String(count(s, "adrenaline")) },
    { label: "Amiodarone doses", value: String(count(s, "amiodarone")) },
  ];
  const rosc = first(s, "rosc");
  if (rosc) rows.push({ label: "Signs of life at", value: since(rosc) });
  return rows;
}

/** The whole log as plain text, for the debrief or the ambulance crew. `timeOfDay` formats a clock time. */
export function logText(s: ArrestSession, now: number, timeOfDay: (ms: number) => string) {
  const lines = ["Arrest timer — drill log", `Collapse at ${timeOfDay(s.startedAt)}`, "", "0:00 Collapse"];
  s.events.forEach((e, i) => lines.push(`${clock(e.at - s.startedAt)} ${eventLabel(s, i)}`));
  if (s.endedAt) lines.push(`${clock(s.endedAt - s.startedAt)} Timer stopped`);
  lines.push("");
  for (const r of summary(s, now)) {
    const note = r.target === "met" ? " (within 3 minutes)" : r.target === "missed" ? " (over 3 minutes)" : "";
    lines.push(`${r.label}: ${r.value}${note}`);
  }
  return lines.join("\n");
}

/** Reads a saved session back, dropping anything malformed; an old running timer comes back stopped. */
export function parseSession(raw: string | null, now: number): ArrestSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ArrestSession> | null;
    if (!v || typeof v.startedAt !== "number" || !Array.isArray(v.events)) return null;
    const events = v.events
      .filter((e): e is ArrestEvent => Boolean(e) && KINDS.has(e.kind) && typeof e.at === "number" && e.at >= v.startedAt!)
      .sort((a, b) => a.at - b.at);
    let endedAt = typeof v.endedAt === "number" ? v.endedAt : undefined;
    if (endedAt === undefined && now - v.startedAt > STALE_MS) endedAt = events.length ? events[events.length - 1].at : v.startedAt;
    return { startedAt: v.startedAt, events, endedAt };
  } catch {
    return null;
  }
}
