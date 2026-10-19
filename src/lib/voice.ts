import { type RoleId, voiceId, workshop } from "@/lib/workshop";

/**
 * Spoken call-outs: the "What you say" lines already in each role, one recorded voice per colour
 * (ElevenLabs). File ids follow the order of `say` in workshop.ts: black-1, black-2, …
 */
export type Callout = { id: string; role: RoleId; text: string };

export const callouts: Record<string, Callout> = Object.fromEntries(
  workshop.roles.flatMap((r) => r.say.map((text, i) => [voiceId(r, i), { id: voiceId(r, i), role: r.id, text }])),
);

export const calloutFor = (role: RoleId, i: number) => {
  const r = workshop.roles.find((x) => x.id === role);
  return r ? callouts[voiceId(r, i)] : undefined;
};

/** What the team says in each drill step, in order. "sfx:shock" is the AED; "sfx:siren" the ambulance leaving. */
export const drillCallouts: Record<number, string[]> = {
  1: ["red-1", "black-1"],
  2: ["red-2"],
  3: ["black-2", "green-1", "sfx:shock", "green-2"],
  4: ["orange-1", "blue-1"],
  5: ["black-4", "white-1", "orange-2", "orange-3", "white-3"],
  6: ["black-3", "green-3", "sfx:siren"],
};

/** The AED's own spoken prompts (a training voice, not a team member) for the pads trainer. */
export const aedPrompts = {
  pads: { id: "aed-1", text: "Apply pads to the patient's bare chest." },
  analyse: { id: "aed-2", text: "Analysing heart rhythm. Do not touch the patient." },
  shock: { id: "aed-3", text: "Shock advised. Stand clear. Press the flashing button." },
  done: { id: "aed-4", text: "Shock delivered. Start CPR now." },
} as const;
