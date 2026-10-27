/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.6.2";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "ar-solid-162",
    title: "Google's AR viewer shows the team properly",
    text: "In Google's AR viewer, parts of the team could be drawn in the wrong order, so hair covered faces and the stripes on the bibs went missing. The AR models now draw the team solid, as the drills do; only the mask and the oxygen tubing stay see-through.",
  },
];
