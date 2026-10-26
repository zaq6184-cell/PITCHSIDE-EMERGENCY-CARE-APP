/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.3.2";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "medical-clips",
    title: "Medical cards animated again",
    text: "Each of the seven medical emergency cards plays its short, silent loop of the key action again, made with Higgsfield from its picture and labelled AI-generated. It starts when the card is on screen and stops when it scrolls away; people who ask for reduced motion or data saving keep the still picture.",
  },
  {
    id: "recheck",
    title: "The whole app checked again",
    text: "Every page was checked again in all five languages, with every button pressed. The emergency bag list now writes mL like the rest of the app, the 3D team's link to a role reads naturally in every language, and the install card's second button says How to install.",
  },
];
