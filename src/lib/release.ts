/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.5.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "flow-clips",
    title: "More moving pictures, and CPR at the right pace",
    text: "The live class quiz, the practical scorer and the cold and altitude page now open with short loops made in Google Flow (Veo 3.1) from their own pictures, and the six skill modules with quieter ones (Omni 1.1 Flash) in which the grass and fabric stir under the floodlights. In the practical scorer and Red role loops, compressions now run at about 110 a minute, inside the 100–120 the app teaches. A loop plays only while it is on screen, and reduced motion or data saving keeps the still picture.",
  },
];
