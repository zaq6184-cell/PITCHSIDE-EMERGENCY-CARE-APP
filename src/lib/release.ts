/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.8.1";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "airway-181",
    title: "Bag valve straight on the i-gel",
    text: "In the cardiac arrest drill and the AED pads trainer, the bag valve now fits straight onto the i-gel, as FIFA describes it: insert the laryngeal mask airway, then attach the bag valve to it. There is no connector tube in between. The i-gel is the green size 4, FIFA's size for 50–90 kg. In AR, the i-gel no longer shows before the airway step.",
  },
];
