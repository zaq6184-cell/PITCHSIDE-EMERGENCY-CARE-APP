/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.5.1";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "recheck-151",
    title: "Rechecked: music, animation and FIFA content",
    text: "Every page, loop and 3D drill was checked again. The four music tracks now loop without a click or a gap, and two quiet call-outs and the wrong-answer buzz now sound as loud as the rest, in the AR drills too. Against FIFA's documents: the transfer brings the ambulance onto the pitch, as FIFA says (the buggy is gone); the 3-minute aim for the first shock is no longer credited to FIFA; Red's card adds handing over at 2 minutes to look for reversible causes; and the strapping order on a spinal board now reads the same everywhere.",
  },
];
