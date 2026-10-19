/**
 * The match plan: FIFA's Pre-Match Emergency Action Plan (PEAP) filled in on the phone — the poster's
 * match details, contact information and a name for each colour. Pure helpers (no DOM), so they can be
 * tested; the page keeps the plan in this device's storage only.
 */
export type ColourId = "orange" | "red" | "blue" | "white" | "green";

export type MatchPlan = {
  venue: string;
  date: string;
  ko: string;
  hospital: string;
  hospitalPhone: string;
  leader: string;
  leaderPhone: string;
  ambulance: string;
  names: Record<ColourId, string>;
  extrication: string;
  notes: string;
  checks: Record<string, boolean>;
};

/** The five colours named under "Responsible" on the PEAP; Black is the team leader above them. */
export const COLOURS: readonly ColourId[] = ["orange", "red", "blue", "white", "green"];

export const EMPTY_PLAN: MatchPlan = {
  venue: "",
  date: "",
  ko: "",
  hospital: "",
  hospitalPhone: "",
  leader: "",
  leaderPhone: "",
  ambulance: "",
  names: { orange: "", red: "", blue: "", white: "", green: "" },
  extrication: "",
  notes: "",
  checks: {},
};

/** Before kick-off — from the guide's PEAP module (M-CRET) and FIFA's matchday principles. */
export const CHECKLIST: readonly { id: string; text: string }[] = [
  { id: "names", text: "A name against every colour, and everyone knows their colour" },
  { id: "meeting", text: "Met the home and visiting team doctors, the venue medical officer and the paramedics" },
  { id: "contacts", text: "Emergency numbers, access gates, ambulance location and receiving hospital agreed" },
  { id: "aed", text: "AED checked, pads ready" },
  { id: "oxygen", text: "Oxygen and bag-valve-mask ready" },
  { id: "bag", text: "Emergency care bag packed and checked" },
  { id: "kit", text: "Scoop or spinal board, basket and straps set up beside the bench" },
  { id: "rehearsal", text: "Critical scenarios rehearsed before kick-off: cardiac arrest, neck injury" },
  { id: "bibs", text: "Bibs on, phones away pitchside" },
];

const TEXT_FIELDS = ["venue", "date", "ko", "hospital", "hospitalPhone", "leader", "leaderPhone", "ambulance", "extrication", "notes"] as const;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Reads a saved plan back, keeping only the expected fields. */
export function parsePlan(raw: string | null): MatchPlan {
  if (!raw) return EMPTY_PLAN;
  try {
    const v = JSON.parse(raw) as Record<string, unknown> | null;
    if (!v || typeof v !== "object") return EMPTY_PLAN;
    const plan: MatchPlan = { ...EMPTY_PLAN, names: { ...EMPTY_PLAN.names }, checks: {} };
    for (const k of TEXT_FIELDS) plan[k] = str(v[k], k === "notes" ? 1000 : 120);
    const names = (v.names ?? {}) as Record<string, unknown>;
    for (const id of COLOURS) plan.names[id] = str(names[id], 120);
    const checks = (v.checks ?? {}) as Record<string, unknown>;
    for (const c of CHECKLIST) if (checks[c.id] === true) plan.checks[c.id] = true;
    return plan;
  } catch {
    return EMPTY_PLAN;
  }
}

/** True while nothing has been written in (ticks on the checklist do not count). */
export function isBlank(p: MatchPlan) {
  return TEXT_FIELDS.every((k) => !p[k].trim()) && COLOURS.every((id) => !p.names[id].trim());
}

/** A tel: link for a number as typed ("0123 456 789", "+852 …"), or null when it has too few digits. */
export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  const clean = (digits.startsWith("+") ? "+" : "") + digits.replace(/\+/g, "");
  return (clean.match(/\d/g)?.length ?? 0) >= 3 ? `tel:${clean}` : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-15" → "15 Oct 2026"; anything else comes back as typed. */
export function prettyDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

type RoleInfo = { id: string; name: string; role: string; num?: number };

/** The plan as plain text for the team chat; blank fields are left out. */
export function planText(p: MatchPlan, roles: readonly RoleInfo[], url?: string) {
  const join = (...parts: string[]) => parts.map((x) => x.trim()).filter(Boolean).join(" · ");
  const lines = ["Match plan (FIFA PEAP)"];
  const match = join(p.venue, prettyDate(p.date.trim()), p.ko.trim() ? `KO ${p.ko.trim()}` : "");
  if (match) lines.push(match);
  const hospital = join(p.hospital, p.hospitalPhone);
  if (hospital) lines.push(`Nearest hospital: ${hospital}`);
  const word = (r: RoleInfo) => `${r.name.charAt(0)}${r.name.slice(1).toLowerCase()}${r.num ? ` ${r.num}` : ""}`;
  const black = roles.find((x) => x.id === "black");
  const leader = join(p.leader, p.leaderPhone);
  if (leader) lines.push(`Team leader (${black ? word(black) : "Black"}): ${leader} — ensures the ambulance is called`);
  for (const id of COLOURS) {
    const r = roles.find((x) => x.id === id);
    const name = p.names[id].trim();
    if (r && name) lines.push(`${word(r)} (${r.role}): ${name}`);
  }
  if (p.ambulance.trim()) lines.push(`Ambulance: ${p.ambulance.trim()}`);
  if (p.extrication.trim()) lines.push(`Extrication team: ${p.extrication.trim()}`);
  if (p.notes.trim()) lines.push(`Notes: ${p.notes.trim()}`);
  if (url) lines.push("", `Pitchside Emergency Care: ${url}`);
  return lines.join("\n");
}
