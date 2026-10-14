import { type RoleId, workshop } from "@/lib/workshop";

/**
 * Spoken call-outs: the "What you say" lines already in each role, one recorded voice per colour
 * (ElevenLabs). File ids follow the order of `say` in workshop.ts: black-1, black-2, …
 */
export type Callout = { id: string; role: RoleId; text: string };

export const callouts: Record<string, Callout> = Object.fromEntries(
  workshop.roles.flatMap((r) => r.say.map((text, i) => [`${r.id}-${i + 1}`, { id: `${r.id}-${i + 1}`, role: r.id, text }])),
);

export const calloutFor = (role: RoleId, i: number) => callouts[`${role}-${i + 1}`];

/** What the team says in each drill step, in order. "sfx:shock" is the AED; "sfx:siren" the ambulance leaving. */
export const drillCallouts: Record<number, string[]> = {
  1: ["red-1", "black-1"],
  2: ["red-2"],
  3: ["black-2", "green-1", "sfx:shock", "green-2"],
  4: ["orange-1", "blue-1"],
  5: ["white-1", "orange-2", "orange-3", "white-3"],
  6: ["black-3", "green-3", "sfx:siren"],
};
