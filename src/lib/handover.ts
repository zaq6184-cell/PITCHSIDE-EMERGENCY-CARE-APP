import { type ArrestSession, count, first } from "./arrest-log.ts";

/**
 * The handover to the ambulance crew, in the ATMIST order used in pre-hospital care: Age, Time, Mechanism, Injuries
 * (or illness), Signs, Treatment. The handover page fills it in; this file turns it into the lines that are read out
 * or shared. Pure functions only, tested with `node --test`. Parts are joined with " · " so each one is translated.
 */
export type Sex = "" | "male" | "female";
export type Avpu = "" | "A" | "V" | "P" | "U";

export type Handover = {
  age: string;
  sex: Sex;
  /** When it happened (ms); the arrest timer's collapse time when that is filled in instead. */
  time: number | null;
  mechanism: string[];
  injuries: string[];
  avpu: Avpu;
  hr: string;
  rr: string;
  spo2: string;
  sys: string;
  dia: string;
  temp: string;
  glucose: string;
  treatment: string[];
  notes: string;
  /** The arrest timer's run, when the handover was filled in from it. */
  arrest: ArrestSession | null;
};

export const EMPTY_HANDOVER: Handover = {
  age: "",
  sex: "",
  time: null,
  mechanism: [],
  injuries: [],
  avpu: "",
  hr: "",
  rr: "",
  spo2: "",
  sys: "",
  dia: "",
  temp: "",
  glucose: "",
  treatment: [],
  notes: "",
  arrest: null,
};

export const MECHANISMS = ["Collapsed, no contact", "Head impact", "Collision with a player", "Fall", "Struck by the ball", "Heat", "Illness"];
export const INJURIES = ["Cardiac arrest", "Concussion", "Neck injury", "Limb fracture", "Heat illness", "Anaphylaxis", "Asthma attack", "Low blood sugar", "Seizure", "Choking"];
export const TREATMENTS = ["CPR", "AED", "i-gel", "Oxygen", "Head held (MILS)", "Collar", "Scoop", "Splint", "Cooling", "IM adrenaline", "Salbutamol", "Glucose", "Glucagon", "Benzodiazepine"];
/** What the arrest timer's own log already says, so these taps are not repeated beside it. */
const ARREST_COVERS = new Set(["CPR", "AED", "i-gel"]);

export const AVPU: { id: Exclude<Avpu, "">; label: string }[] = [
  { id: "A", label: "Alert" },
  { id: "V", label: "Responds to voice" },
  { id: "P", label: "Responds to pain" },
  { id: "U", label: "Unresponsive" },
];

/** What the arrest timer logged, with clock times: CPR, the AED, shocks, drugs, the i-gel, signs of life. */
export function arrestPieces(s: ArrestSession, timeOfDay: (ms: number) => string): string[] {
  const out: string[] = [];
  const cpr = first(s, "cpr");
  if (cpr) out.push(`CPR from ${timeOfDay(cpr.at)}`);
  const aed = first(s, "aed");
  if (aed) out.push(`AED on at ${timeOfDay(aed.at)}`);
  const shocks = count(s, "shock");
  if (shocks) out.push(shocks === 1 ? "1 shock" : `${shocks} shocks`);
  else if (count(s, "noshock")) out.push("No shock advised");
  const adrenaline = count(s, "adrenaline");
  if (adrenaline) out.push(`Adrenaline 1 mg × ${adrenaline}`);
  const amiodarone = count(s, "amiodarone");
  if (amiodarone) out.push(amiodarone === 1 ? "Amiodarone 300 mg" : "Amiodarone 300 mg and 150 mg");
  if (first(s, "airway")) out.push("i-gel in");
  const rosc = first(s, "rosc");
  if (rosc) out.push(`Signs of life at ${timeOfDay(rosc.at)}`);
  return out;
}

/** The handover, a line per ATMIST letter; parts not filled in are left out. `now` gives the minutes since. */
export function handoverLines(h: Handover, now: number, timeOfDay: (ms: number) => string): string[] {
  const lines = ["Handover · ATMIST"];
  const age = [h.age.trim() ? `${h.age.trim()} years` : "", h.sex === "male" ? "Male" : h.sex === "female" ? "Female" : ""].filter(Boolean);
  if (age.length) lines.push(`Age: ${age.join(" · ")}`);
  const t = h.time ?? h.arrest?.startedAt ?? null;
  if (t !== null) lines.push(`Time: ${timeOfDay(t)} (${Math.max(0, Math.floor((now - t) / 60_000))} min ago)`);
  if (h.mechanism.length) lines.push(`Mechanism: ${h.mechanism.join(" · ")}`);
  const injuries = h.arrest && !h.injuries.includes("Cardiac arrest") ? ["Cardiac arrest", ...h.injuries] : h.injuries;
  if (injuries.length) lines.push(`Injuries: ${injuries.join(" · ")}`);
  const v = (s: string) => s.trim();
  const signs = [
    h.avpu ? (AVPU.find((a) => a.id === h.avpu)?.label ?? "") : "",
    v(h.hr) ? `HR ${v(h.hr)}` : "",
    v(h.rr) ? `RR ${v(h.rr)}` : "",
    v(h.spo2) ? `SpO₂ ${v(h.spo2)}%` : "",
    v(h.sys) ? `BP ${v(h.sys)}/${v(h.dia) || "?"}` : "",
    v(h.temp) ? `Temp ${v(h.temp)} °C` : "",
    v(h.glucose) ? `Glucose ${v(h.glucose)} mmol/L` : "",
  ].filter(Boolean);
  if (signs.length) lines.push(`Signs: ${signs.join(" · ")}`);
  const treatment = h.arrest ? [...arrestPieces(h.arrest, timeOfDay), ...h.treatment.filter((x) => !ARREST_COVERS.has(x))] : h.treatment;
  if (treatment.length) lines.push(`Treatment: ${treatment.join(" · ")}`);
  if (v(h.notes)) lines.push(`Also: ${v(h.notes)}`);
  return lines;
}

/** Nothing filled in yet. */
export const isEmpty = (h: Handover) => handoverLines(h, 0, () => "").length === 1;
