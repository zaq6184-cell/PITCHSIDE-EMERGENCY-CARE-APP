/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.7.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "team-170",
    title: "Team drill on every phone",
    text: "The instructor plays a 3D drill on a big screen and each trainee takes a colour on their phone with a QR code. The phone shows that colour's part of each step and where to stand, buzzes when the line is due and says it, so the six voices come from the six people. Start it under the drill; it earns the new Team player badge.",
  },
  {
    id: "daily-170",
    title: "Daily 5",
    text: "Five quick questions a day from the role cards, on Home. A question you miss comes back the next day; one you know comes back after a longer gap each time. Finishing the five on days in a row builds a streak, and five days running earns the new Five in a row badge.",
  },
  {
    id: "listen-170",
    title: "Listen mode",
    text: "Both team drills as sound only: every call-out in order with the AED's shock and the siren, the step and the line on screen, and play, pause and skip on the lock screen. It keeps playing with the screen off, and listening to a whole drill earns the new All ears badge.",
  },
  {
    id: "record-170",
    title: "Training record",
    text: "One page of what you have done: badges with the day each was earned, best scores and times, the Daily 5 and team drills. Print it, save it as a PDF or share it as text, for a CPD portfolio or your team leader. It is your own record, not a FIFA certificate.",
  },
];
