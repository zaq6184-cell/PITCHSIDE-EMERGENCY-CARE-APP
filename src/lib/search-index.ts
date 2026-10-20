import { bagGroups } from "@/lib/bag";
import { CASES } from "@/lib/cases";
import { SIGNS } from "@/lib/concussion-signs";
import { METHODS, ZONES } from "@/lib/heat";
import { REGIONS } from "@/lib/injuries";
import { MISTAKES } from "@/lib/mistakes";
import { fifaSca } from "@/lib/fifa-sca";
import { focusStages } from "@/lib/focus";
import type { Doc } from "@/lib/search";
import { spineSteps } from "@/lib/spine-drill";
import { type Block, sectionSlug, stations } from "@/lib/stations";
import { type RoleId, roleTag, workshop } from "@/lib/workshop";

/** Where a search result goes. */
export type Target =
  | { to: "/role/$id"; id: RoleId }
  | { to: "/case/$id"; id: string }
  | { to: "/station/$id"; id: string; hash?: string }
  | { to: "/drill"; neck?: boolean; mistakes?: boolean }
  | {
      to: "/" | "/fifa" | "/cspine" | "/focus" | "/pitchside" | "/stations" | "/bag" | "/guides" | "/quiz" | "/plan" | "/arrest" | "/timer" | "/aed" | "/rules" | "/install" | "/about" | "/cases" | "/heat" | "/injuries" | "/live" | "/scorer";
      hash?: string;
    };

export type Kind = "page" | "tool" | "role" | "module" | "section";
export type Entry = Doc & { id: string; kind: Kind; target: Target };

function blockText(b: Block): string {
  switch (b.kind) {
    case "text":
    case "remember":
      return b.text;
    case "alert":
    case "info":
      return [b.title, b.text].filter(Boolean).join(". ");
    case "list":
      return b.items.join(" ");
    case "defs":
      return b.items.map((d) => `${d.term}: ${d.text}`).join(" ");
    case "table":
      return [...b.head, ...b.rows.flat()].join(" ");
    case "steps":
      return b.items.map((s) => `${s.title}. ${s.lines.join(" ")}`).join(" ");
    case "cards":
      return b.items.map((c) => [c.title, c.sub, ...c.lines].filter(Boolean).join(". ")).join(" ");
    case "image":
    case "device":
      return b.alt;
    case "video":
      return `${b.clip.title}. ${b.clip.why ?? ""}`;
    case "link":
      return `${b.label}. ${b.text ?? ""}`;
    case "aed-trainer":
      return "AED pads trainer in 3D: pads, everyone clear, shock.";
    case "spine-3d":
      return "Neck injury set piece in 3D with the team's call-outs.";
    case "survival":
      return "Every minute counts: survival falls 7 to 10 percent a minute without CPR and 3 to 4 percent with CPR until the first shock. FIFA Sudden Death Registry: 85 percent survived with an AED, 35 percent without.";
    case "positions":
      return "Team positions diagram.";
  }
}

const PAGES: Entry[] = [
  { id: "home", kind: "page", title: "The six colours", sub: "Home · roles and the set piece in 3D", text: "Black Orange Red Blue White Green roles positions team explorer 3D PEAP", target: { to: "/" } },
  { id: "drill", kind: "page", title: "Cardiac arrest drill in 3D", sub: "Drill · six steps with call-outs", text: workshop.steps.map((s) => `${s.title}. ${s.lines.join(" ")}`).join(" "), target: { to: "/drill" } },
  { id: "drill-neck", kind: "page", title: "Neck injury drill in 3D", sub: "Drill · seven steps with call-outs", text: spineSteps.map((s) => `${s.title}. ${s.lines.join(" ")}`).join(" "), target: { to: "/drill", neck: true } },
  { id: "aed", kind: "tool", title: "AED pads trainer", sub: "Practise in 3D · against the clock", text: "Defibrillator pads placement below the right collarbone and the left mid-axillary line, hands off for analysis, everyone clear, shock.", target: { to: "/aed" } },
  { id: "arrest", kind: "tool", title: "Arrest timer", sub: "Match-day tool", text: "CPR clock from the collapse, 2-minute rhythm checks, shock, adrenaline and amiodarone log, debrief timings, share the log.", target: { to: "/arrest" } },
  { id: "plan", kind: "tool", title: "Match plan", sub: "FIFA PEAP on your phone", text: "Pre-match emergency action plan: names for each colour, hospital, ambulance, checklist, share.", target: { to: "/plan" } },
  { id: "cpr", kind: "tool", title: "CPR rhythm trainer", sub: "Tools · tap or motion, with a voice coach", text: "Compressions 100 to 120 a minute, 30:2 or continuous with an i-gel, guide beat 110, motion sensor, voice coach.", target: { to: "/timer", hash: "cpr-trainer" } },
  { id: "carry", kind: "tool", title: "10-second carry timer", sub: "Tools · last resort", text: workshop.dashRules.join(" "), target: { to: "/timer" } },
  { id: "fifa", kind: "page", title: "Sudden cardiac arrest", sub: "FIFA's key points, films and downloads", text: [...fifaSca.what, ...fifaSca.signs.map((s) => `${s.title}: ${s.text}`), ...fifaSca.steps].join(" "), target: { to: "/fifa" } },
  { id: "cspine", kind: "page", title: "Cervical spine injury", sub: "Major trauma · set piece, collar, log roll", text: "Neck injury MILS clearing the spine NSAID collar sizing head blocks log roll scoop basket extrication 3D set piece FIFA film poster.", target: { to: "/cspine" } },
  { id: "focus", kind: "page", title: "Concussion assessment (FOCUS)", sub: "FIFA FOCUS · on the pitch", text: focusStages.map((s) => `${s.where} ${s.when} ${s.domains.map((d) => `${d.domain} ${d.lead}`).join(" ")}`).join(" "), target: { to: "/focus" } },
  { id: "pitchside", kind: "page", title: "Pitchside emergency care", sub: "FIFA Health & Medical", text: "Set-piece protocols, role cards, emergency bag, FIFA documents.", target: { to: "/pitchside" } },
  { id: "rules", kind: "page", title: "Golden rules", sub: "Timings and FIFA key points", text: [...workshop.timings.map((t) => `${t.tag} ${t.text}`), ...workshop.fifaNotes].join(" "), target: { to: "/rules" } },
  { id: "bag", kind: "page", title: "Emergency bag", sub: "FIFA packing list · Green brings it", text: bagGroups.map((g) => `${g.title} ${g.items.map((i) => i.name).join(" ")}`).join(" "), target: { to: "/bag" } },
  { id: "quiz", kind: "page", title: "Test yourself", sub: "Who does what? · Place the team", text: "Quiz game questions colours roles positions.", target: { to: "/quiz" } },
  { id: "films", kind: "page", title: "Films", sub: "FIFA's films and skill zone", text: "Videos CPR AED cervical spine log roll scoop set-up sideline.", target: { to: "/guides" } },
  { id: "stations", kind: "page", title: "Skill modules", sub: "Study notes for the workshop", text: stations.map((s) => `${s.short} ${s.title}`).join(" "), target: { to: "/stations" } },
  { id: "install", kind: "page", title: "Install the app", sub: "Phone, tablet or computer", text: "Add to home screen offline download app.", target: { to: "/install" } },
  { id: "about", kind: "page", title: "About the app", sub: "Credits and disclaimer", text: "About credits sources disclaimer.", target: { to: "/about" } },
  {
    id: "cases",
    kind: "tool",
    title: "Case simulator",
    sub: "Make the calls · live monitor",
    text: `Branching cases with a patient monitor, ECG, VF, oxygen saturation, case clock and debrief. ${CASES.map((c) => `${c.title} ${c.short} ${c.teaching.join(" ")}`).join(" ")}`,
    target: { to: "/cases" },
  },
  ...CASES.map((c) => ({ id: `case-${c.id}`, kind: "tool" as const, title: `Case: ${c.title}`, sub: `Case simulator · ${c.short}`, text: `${c.setting} ${c.stages.map((s) => s.text).join(" ")}`, target: { to: "/case/$id" as const, id: c.id } })),
  {
    id: "heat",
    kind: "page",
    title: "Heat illness",
    sub: "Cool first, transport second",
    text: `Exertional heat stroke, WBGT heat risk, cooling breaks, hydration breaks, World Cup 2026, rectal temperature, cold-water immersion, ice towels, tarp. ${ZONES.map((z) => `${z.label}: ${z.actions.join(" ")}`).join(" ")} ${METHODS.map((m) => m.name).join(" ")}`,
    target: { to: "/heat" },
  },
  {
    id: "injuries",
    kind: "page",
    title: "Injury map",
    sub: "Tap where it hurts · Ottawa rules",
    text: `Body map, Ottawa ankle rule, Ottawa knee rule, X-ray, sprain, fracture, dislocation, bleeding, tourniquet. ${REGIONS.map((r) => `${r.name} ${r.cards.map((c) => `${c.title} ${c.lines.join(" ")}`).join(" ")}`).join(" ")}`,
    target: { to: "/injuries" },
  },
  { id: "scorer", kind: "tool", title: "Practical scorer", sub: "For instructors · time a team on the manikin", text: "Instructor assessment of the cardiac arrest set piece: tap events, compression fraction, hands-off pauses, first shock target, timeline, debrief to share as text or an image.", target: { to: "/scorer" } },
  { id: "live", kind: "tool", title: "Live class quiz", sub: "For instructors · trainees answer from their phones", text: "Classroom quiz with a QR code, room code, answers from phones, live chart of answers, leaderboard, podium. Kahoot-style.", target: { to: "/live" } },
  { id: "lightning", kind: "tool", title: "Lightning tool", sub: "Tools · flash to bang, the 30/30 rule", text: "Thunder and lightning: count from flash to bang, under 30 seconds stop play, 30 minutes before resuming, distance in km, safe shelter, someone struck by lightning, reverse triage.", target: { to: "/timer", hash: "lightning" } },
  { id: "signals", kind: "tool", title: "Hand signals game", sub: "Test yourself · numbers for each colour", text: "Hand signal numbers Black 1 Orange 2 Red 3 Blue 4 White 5 Green 6 against the clock.", target: { to: "/quiz", hash: "signals" } },
  { id: "pack", kind: "tool", title: "Pack the bag", sub: "Game · emergency bag trays", text: "Drag items into the FIFA emergency bag trays and pouches; faulty or out-of-date kit goes in the replace bin; critical fails.", target: { to: "/bag", hash: "pack" } },
  { id: "mistakes", kind: "tool", title: "Spot the mistake", sub: "Team drills in 3D · find the error", text: `Planted errors in the 3D drills. ${MISTAKES.map((m) => `${m.what}. ${m.why}`).join(" ")}`, target: { to: "/drill", mistakes: true } },
  { id: "signs", kind: "tool", title: "Spot the sign (concussion)", sub: "FOCUS · visible signs in 3D", text: `Visible signs of concussion acted out in 3D. ${SIGNS.map((s) => `${s.name}: ${s.what}`).join(" ")}`, target: { to: "/focus", hash: "focus-signs" } },
];

let cache: Entry[] | null = null;

/** Every page, role card and module section, built once when search first opens. */
export function searchEntries(): Entry[] {
  if (cache) return cache;
  const roles: Entry[] = workshop.roles.map((r) => ({
    id: `role-${r.id}`,
    kind: "role",
    title: `${roleTag(r)} · ${r.role}`,
    sub: "Role card",
    text: [r.stand, `Brings: ${r.bring}`, ...r.arrest, ...r.trauma, ...r.both, ...r.say.map((l) => `“${l}”`), r.fifa].join(" "),
    target: { to: "/role/$id", id: r.id },
  }));
  const modules: Entry[] = stations.flatMap((s) => [
    {
      id: `module-${s.id}`,
      kind: "module" as const,
      title: `Module ${s.id} · ${s.short}`,
      sub: s.title,
      text: `${s.subtitle}. ${s.sections.map((sec) => sec.title).join(". ")}`,
      target: { to: "/station/$id" as const, id: s.id },
    },
    ...s.sections.map((sec) => ({
      id: `module-${s.id}-${sectionSlug(sec.title)}`,
      kind: "section" as const,
      title: sec.title,
      sub: `Module ${s.id} · ${s.short}`,
      text: sec.blocks.map(blockText).join(" "),
      target: { to: "/station/$id" as const, id: s.id, hash: sectionSlug(sec.title) },
    })),
  ]);
  cache = [...PAGES, ...roles, ...modules];
  return cache;
}

/** What search shows before anything is typed. */
export const QUICK = ["arrest", "aed", "cases", "cpr", "plan", "drill-neck", "heat", "injuries"];
