/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.4.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "premium-clips",
    title: "Premium animations for the roles, cases and headers",
    text: "The six role pages, the three practice cases and the heat and handover pages now play short loops made with Higgsfield (Kling 3.0 Pro) from their own pictures. Each was checked for technique: straight-arm compressions, the head held still, the AED pads held ready, the scoop laid beside the legs and the head kept above the iced water. A loop plays only while it is on screen, and reduced motion or data saving keeps the still picture.",
  },
];
