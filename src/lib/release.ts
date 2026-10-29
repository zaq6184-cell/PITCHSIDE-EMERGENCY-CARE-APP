/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.8.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "kit-180",
    title: "Kit rebuilt at real size",
    text: "The eight pieces of kit in the 3D drills and in AR are new models, built in Blender at their real sizes: the emergency bag, the AED, the oxygen cylinder, the bag valve, the scoop with its two blades, the long board, the basket stretcher and the collar. In the cardiac arrest drill the bag valve now connects to the i-gel in the player's mouth through a catheter mount, with no face mask, and is set aside for the log roll. In the neck injury drill the collar sits up under the chin. In AR, White no longer disappears during the carry.",
  },
];
