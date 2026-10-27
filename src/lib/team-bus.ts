/**
 * Between the 3D drill player and a team drill on the same screen: the player tells it which step it is on and who
 * speaks, and the team drill passes that on to the phones; the team drill tells the player which colours have a phone,
 * whose voices then come from the phones. With no team drill running nothing listens and every voice plays here.
 * Tested with `node --test`.
 */
import type { ScreenMsg } from "./team.ts";
import type { RoleId } from "./workshop.ts";

export type DrillEvent = Extract<ScreenMsg, { t: "step" | "say" | "sfx" }>;

const listeners = new Set<(e: DrillEvent) => void>();
let phones = new Set<RoleId>();
let last: Extract<DrillEvent, { t: "step" }> | null = null;

/** The player: this is happening now. */
export function tell(e: DrillEvent) {
  if (e.t === "step") last = e;
  listeners.forEach((l) => l(e));
}

/** The team drill: hear what the player does; returns the function that stops listening. */
export function listen(l: (e: DrillEvent) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** The step the player is on, for a phone that joins in the middle. */
export const lastStep = () => last;

/** The team drill: these colours have a phone (an empty list when it ends). */
export function setPhones(roles: Iterable<RoleId>) {
  phones = new Set(roles);
}

/** The player: this colour's voice comes from a phone. */
export const onPhone = (role: RoleId) => phones.has(role);
