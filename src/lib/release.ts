/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what is new in it, newest first. Shown on the About page.
 */
export const APP_VERSION = "1.2.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "medical-fifa",
    title: "Medical cards checked against the FIFA manual",
    text: "The five cards now follow chapters 4 and 5 of the FIFA Emergency Care Manual and its bag list: the 1:10 000 adrenaline warning, inhaler puffs every 60 seconds, glucose rather than sports drinks, midazolam for a long seizure and back blows from behind. The handover can now record glucagon and a benzodiazepine.",
  },
  {
    id: "medical-pictures",
    title: "Pictures for the medical cards and the handover",
    text: "Each medical emergency card shows its key action, such as the auto-injector into the thigh, the inhaler through a spacer and back blows, and the handover page shows the team leader handing over at the ambulance. AI-generated, and labelled as such.",
  },
  {
    id: "medical",
    title: "Medical emergency cards",
    text: "Anaphylaxis, asthma, low blood sugar, seizure and choking: what to recognise, what the team does, the adult doses if trained, and when to call the ambulance, with the points that matter in football.",
  },
  {
    id: "handover",
    title: "Handover to the ambulance crew",
    text: "An ATMIST card (Age, Time, Mechanism, Injuries, Signs, Treatment) that fills in from the arrest timer, ready to read out or share. Nothing is saved.",
  },
  {
    id: "privacy",
    title: "Privacy, in plain words",
    text: "Everything stays on this device. The About page says what the app keeps, the two permissions it may ask for and when it goes online, with a button to delete your data.",
  },
  {
    id: "role-voices",
    title: "Roles speak as they open",
    text: "Open a colour from the Roles tab, the diagram or with a swipe, and you hear its call-out. Phones allow sound only after a first tap: until then, the speaker at the top pulses gently.",
  },
  {
    id: "music",
    title: "Background music starts reliably",
    text: "On by default, it starts with your first tap, or as the app opens where the phone allows. It now comes back after a phone call or another app, plays offline once heard, and an old saved setting no longer keeps it off.",
  },
  {
    id: "live-timer",
    title: "Live arrest timer on every page",
    text: "Leave the arrest timer running and look up a dose or a step: the clock, the shocks and the countdown to the rhythm check stay above the tab bar, and the 2-minute call still sounds. Tap it to go back to the timer.",
  },
  {
    id: "languages",
    title: "Five languages",
    text: "English, Spanish, French, Portuguese and Bahasa Malaysia. English is the default and the reference version; choose another in the top bar. The voices stay in English, with captions.",
  },
  {
    id: "kit",
    title: "Real 3D kit",
    text: "The emergency bag, AED, oxygen cylinder, bag-valve mask, scoop, basket stretcher, long spinal board and collar, in the 3D drills and in AR.",
  },
  {
    id: "ar",
    title: "AR that moves",
    text: "Put the team on the floor or a table and watch each step played out with its call-outs, or the whole drill: Google's AR viewer on Android, AR Quick Look on iPhone and iPad.",
  },
  {
    id: "pictures",
    title: "Scene pictures",
    text: "AI-generated pictures of the scene for the three cases, the heat page, the live quiz and the practical scorer.",
  },
  {
    id: "tools",
    title: "Tools for trainees and instructors",
    text: "The case simulator, spot the mistake, heat illness, the injury map, the lightning 30/30 tool, the practical scorer and the live class quiz.",
  },
  {
    id: "recheck",
    title: "A full recheck",
    text: "Every page checked in every language, at phone size and in dark mode, and the problems found fixed.",
  },
];
