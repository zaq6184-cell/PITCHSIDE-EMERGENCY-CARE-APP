/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what changed in it. Shown on the About page. Only this version's changes are listed: for the next release,
 * replace the notes rather than adding to them.
 */
export const APP_VERSION = "1.6.1";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "ar-live-161",
    title: "AR opens again on Android",
    text: "Since an update to the Google app in October, Google's AR viewer has been closing as soon as it opens on many Android phones, so the AR buttons seemed to do nothing. On phones where Chrome can run AR itself, the AR buttons now start Live AR here in the app: find the floor, tap to place the team, and play each step with the call-outs, captions, pause and slow motion. Google's AR viewer is still a link under the button, and if it closes straight away the page now says why and what to do.",
  },
];
