/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.6.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "moving-pictures-160",
    title: "Moving pictures on the AR page, the modules and the cases",
    text: "The AR page's pictures now move. Each step card shows the 3D team working through that step, the whole-drill card plays the drill at double speed, and the phone at the top shows the team doing chest compressions. The list of skill modules and the list of cases now play their pictures' loops too. As everywhere in the app, the pictures stay still if your phone is set to reduce motion or to save data.",
  },
];
