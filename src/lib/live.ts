/**
 * Live class quiz: the instructor's screen hosts a room; trainees join from their phones with a QR code and
 * answer each question with a tap. Phones talk straight to the instructor's device (WebRTC, through
 * Trystero); public relays only introduce them, and that introduction is encrypted with the room code.
 * This file is the plain part — codes, links, messages and scoring — tested with `node --test`.
 */
export const APP_ID = "pitchside-emergency-care-live";
export const QUESTION_SECONDS = 20;
export const ROUND = 10;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I

/** A six-character room code that is easy to read out and type. */
export function roomCode(rand: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join("");
}

export const isRoomCode = (s: string) => new RegExp(`^[${ALPHABET}]{6}$`).test(s);

/** The secret the relays' messages are encrypted with: only people with the code can join. */
export const roomPassword = (code: string) => `pec-live-${code}`;

/** The join link: the code rides in the #fragment, which browsers never send to a server. */
export const joinUrl = (base: string, code: string) => `${base.replace(/#.*$/, "").replace(/\/?$/, "/")}live#join=${code}`;

/** The room code in a page's #fragment, if any. */
export function codeFromHash(hash: string): string | null {
  const m = /join=([A-Z0-9]{6})/i.exec(hash);
  const code = m?.[1]?.toUpperCase() ?? null;
  return code && isRoomCode(code) ? code : null;
}

export const cleanName = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 20);

// ------------------------------------------------------------------ messages
export type Colour = "black" | "orange" | "red" | "blue" | "white" | "green";

/** From the instructor's screen to the phones. */
export type HostMsg =
  | { t: "welcome"; name: string; players: number }
  | { t: "q"; n: number; total: number; prompt: string; text: string; secs: number }
  | { t: "result"; n: number; answer: Colour; correct: boolean; points: number; score: number; rank: number; players: number }
  | { t: "end"; score: number; rank: number; players: number; podium: { name: string; score: number }[] };

/** From a phone to the instructor's screen. */
export type PlayerMsg = { t: "hello"; name: string } | { t: "answer"; n: number; choice: Colour };

/** Points for an answer: 500 for right, up to 500 more for speed; nothing for wrong or late. */
export function points(correct: boolean, ms: number, secs = QUESTION_SECONDS): number {
  if (!correct || ms > secs * 1000) return 0;
  return 500 + Math.round(500 * (1 - Math.max(0, ms) / (secs * 1000)));
}

export type Player = { id: string; name: string; score: number; answers: Record<number, { choice: Colour; ms: number; points: number }> };

/** Highest score first; on a tie, the faster total time. */
export function leaderboard(players: Player[]): Player[] {
  const time = (p: Player) => Object.values(p.answers).reduce((a, x) => a + x.ms, 0);
  return [...players].sort((a, b) => b.score - a.score || time(a) - time(b) || a.name.localeCompare(b.name));
}

/** How many chose each colour. */
export function counts(players: Player[], n: number): Record<Colour, number> {
  const c: Record<Colour, number> = { black: 0, orange: 0, red: 0, blue: 0, white: 0, green: 0 };
  for (const p of players) {
    const a = p.answers[n];
    if (a) c[a.choice] += 1;
  }
  return c;
}

/** A unique display name: "Sam", then "Sam 2" for the next Sam. */
export function uniqueName(name: string, taken: string[], fallbackIndex: number): string {
  const base = cleanName(name) || `Player ${fallbackIndex}`;
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}
