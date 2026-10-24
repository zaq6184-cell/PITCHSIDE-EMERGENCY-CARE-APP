/**
 * This release of the app: its version (the same as package.json's — release.test.ts checks), when it came
 * out, and what is new in it, newest first. Shown on the About page.
 */
export const APP_VERSION = "1.3.0";
export const RELEASED = "October 2026";

export type ReleaseNote = { id: string; title: string; text: string };

export const WHATS_NEW: ReleaseNote[] = [
  {
    id: "fifa-recheck",
    title: "Everything new checked against FIFA",
    text: "Each new card and page was checked line by line against the FIFA Emergency Care Manual. Cardiac arrest in the cold now follows FIFA: adrenaline withheld and shocks delayed until 30 °C. Heat stroke can come with cool, sweaty skin, and is treated as heat stroke when no rectal temperature can be taken. The chest pain, women's health, cold, altitude, eye, nose, tooth, chest, abdomen and pelvis cards gained FIFA's details.",
  },
  {
    id: "medical-clips",
    title: "Medical emergency cards come to life",
    text: "Each medical emergency card now plays a short, silent loop of its key action, made with Higgsfield from its picture and labelled AI-generated. It starts when the card is on screen, stops when it scrolls away, and people who ask for reduced motion or data saving keep the still picture.",
  },
  {
    id: "more-topics",
    title: "Medical emergencies moved to More pitchside topics",
    text: "Medical emergencies now sits on the home page under More pitchside topics, with the Injury map, Heat illness and the new Cold and altitude page. The Tools tab keeps the match-day tools.",
  },
  {
    id: "chest-female",
    title: "Chest pain and women's health cards",
    text: "Two new medical cards from the FIFA manual: chest pain (aspirin, GTN and the other causes to rule out) and lower abdominal pain or bleeding in a female player.",
  },
  {
    id: "environment",
    title: "Cold and altitude",
    text: "FIFA's environmental chapter on one page: S.H.E.L.T.E.R., hypothermia, frostbite, cold urticaria, mountain sickness, HACE and HAPE, with an altitude planner that shows the band, the risk and the days to allow for a staged ascent.",
  },
  {
    id: "injury-fifa",
    title: "Injury map checked against FIFA",
    text: "A new hip and pelvis area; the jaw and cheekbone, flail chest, tension pneumothorax, elbow and collarbone dislocations and the fracture-dislocated ankle; a 30-minute clock for a knocked-out tooth; and the bleeding rule correctly cited as Law 5.",
  },
  {
    id: "heat-fifa",
    title: "Heat illness, aligned with FIFA",
    text: "WBGT measured 90 and 60 minutes before kick-off, ice water at 1–17 °C, a blood glucose check, legs raised for heat exhaustion, and a warning about low sodium.",
  },
  {
    id: "language-recheck",
    title: "Languages rechecked",
    text: "Every page was checked again in all five languages: a number and its unit now stay together on one line, and the new pages are translated in full.",
  },
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
