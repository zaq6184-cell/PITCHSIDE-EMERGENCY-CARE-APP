/**
 * Team drill on every phone: the drill screen (the instructor's laptop or tablet, on the Drill page) hosts a room; each
 * trainee joins from a phone with a QR code and takes a colour. As the drill plays, the screen tells the phones which
 * step it is on and who speaks: each phone shows its colour's part, buzzes when that colour's line is due and says it,
 * and the screen leaves that voice to the phone. Phones talk straight to the screen (WebRTC through Trystero), as in
 * the live class quiz. This file is the plain part — links, messages, the colours taken and a colour's lines in a
 * step — tested with `node --test`.
 */
import { codeFromHash, isRoomCode, roomCode } from "./live.ts";
import type { RoleId } from "./workshop.ts";

export { codeFromHash, isRoomCode, roomCode };

export const TEAM_APP_ID = "pitchside-emergency-care-team";

/** The secret the relays' messages are encrypted with: only people with the code can join. */
export const teamPassword = (code: string) => `pec-team-${code}`;

/** The join link: the code rides in the #fragment, which browsers never send to a server. */
export const teamJoinUrl = (base: string, code: string) => `${base.replace(/#.*$/, "").replace(/\/?$/, "/")}team#join=${code}`;

export type TeamDrill = "arrest" | "spine";

/** The team's order: Black 1 … Green 6. */
export const ORDER: RoleId[] = ["black", "orange", "red", "blue", "white", "green"];

/** From the drill screen to the phones. */
export type ScreenMsg =
  | { t: "roster"; taken: RoleId[] }
  | { t: "claimed"; role: RoleId }
  | { t: "taken"; role: RoleId }
  | { t: "step"; drill: TeamDrill; step: number }
  | { t: "say"; id: string; role: RoleId }
  | { t: "sfx"; name: string }
  | { t: "end" };

/** From a phone to the drill screen. */
export type PhoneMsg = { t: "hello" } | { t: "claim"; role: RoleId } | { t: "release" };

/** The colours that have a phone, in the team's order. */
export function takenRoles(roster: ReadonlyMap<string, RoleId | null>): RoleId[] {
  const held = new Set([...roster.values()].filter((r): r is RoleId => r !== null));
  return ORDER.filter((r) => held.has(r));
}

/** A phone may take a colour nobody else holds (or the one it already has). */
export function canClaim(roster: ReadonlyMap<string, RoleId | null>, peer: string, role: RoleId): boolean {
  return ![...roster.entries()].some(([id, r]) => id !== peer && r === role);
}

/** The lines of a step about a colour: those that name it ("Green applies the AED…", "Orange's count"). */
export function linesFor(lines: readonly string[], name: string): string[] {
  const word = new RegExp(`\\b${name}\\b`, "i");
  return lines.filter((l) => word.test(l));
}

/** How long to buzz when a colour's line is due: two long pulses, easy to feel in a pocket. */
export const BUZZ = [180, 90, 180];
