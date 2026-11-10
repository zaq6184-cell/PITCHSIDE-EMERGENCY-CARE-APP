/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.9.0";
export const RELEASED = "November 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "badges-190",
    title: "Every badge takes you there",
    text: "Tap any badge in Your training on Home to go straight to the task that earns it: the next role card or skill module you have not opened, the next drill step to watch, the next case to solve, or the trainer or game itself. A badge you have started shows how far you have got, and the one to do next has a gold ring.",
  },
  {
    id: "developers-190",
    title: "The developers",
    text: "Under Developers, the About page now names the doctors whose intellectual property the app is.",
  },
];
