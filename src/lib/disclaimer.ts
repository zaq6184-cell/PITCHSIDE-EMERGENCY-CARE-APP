/** About text, developers, disclaimer, copyright and AI statement shown on Home and the About page. */
export const about =
  "A free study guide to pitchside emergency care in football, built around FIFA's medical set piece: the six colour roles, sudden cardiac arrest, the primary survey, cervical spine injury, concussion assessment and the emergency care bag — with team drills in 3D and in augmented reality, a case simulator, an AED pads trainer, heat-illness and injury tools, instructor tools and match-day tools. It summarises FIFA's published guidance in plain language and links to FIFA's own documents and films.";

export const disclaimer = {
  short: "For education only. FIFA materials belong to FIFA.",
  paragraphs: [
    "This app was created for educational purposes only.",
    "The content is a study aid. It does not replace formal training, clinical judgement, or your local protocols and guidelines. Where this app and FIFA's current documents differ, follow FIFA's documents.",
    "This app is not affiliated with, endorsed by or produced by FIFA.",
    "The developers accept no responsibility or liability for any misuse of this app or its content, or for any loss, injury or damage arising from its use.",
  ],
};

export const aboutApp = {
  purpose: [
    about,
    "It is meant for doctors, paramedics, physiotherapists, first aiders and anyone else who may be part of a pitchside medical team, to learn the roles and rehearse them before they are needed.",
  ],
  developers: [
    "Developed by the Sports-Emergency Football Medicine team, HKL.",
  ],
  copyright: [
    "FIFA's protocols, documents, images and films are the property of FIFA and remain under FIFA's copyright. FIFA's films and documents are linked to on FIFA's own website; they are not copied into this app.",
    "Films from other publishers play in YouTube's player and remain the property of their owners. Photographs from open-licence sources are credited where they appear.",
    "The original material in this app — the plain-language summaries, the position diagram, the 3D scenes and AR models, trainers, cases and games, and the logo — is © 2026 the developers. It may be used free of charge for non-commercial teaching, with credit to the developers. Please ask before any commercial use, and do not alter the logo.",
  ],
  ai: [
    "AI tools helped to make this app, including its software, illustrations, voices and music. The content was checked against FIFA's published documents; if anything here differs, follow FIFA's documents.",
    "The Spanish, French, Portuguese and Malay versions were translated from the English with AI tools. English is the reference version: where a translation is unclear or seems to differ, follow the English and FIFA's documents.",
  ],
};

/**
 * The Privacy section on the About page. Checked on 23 October 2026: opening any page contacts no other website, the
 * app sets no cookies, and everything it keeps is in this browser's storage on the device, under "pec-" keys (see
 * lib/privacy.ts). Keep this true when a feature changes what is kept or what goes online.
 */
export const privacy = {
  intro:
    "Everything you do in this app is confidential and stays on this device. There is no account and no sign-in, and nothing is sent to the developers or to anyone else: no cookies, no tracking, no adverts.",
  kept: [
    { lead: "Settings:", text: "language, dark mode and sound." },
    { lead: "Progress:", text: "badges, best scores and times, and the roles, modules, drills and cases you have opened." },
    { lead: "What you enter:", text: "the arrest timer log, the match plan, the practical scorer's sessions and the lightning countdown." },
    { lead: "Offline copies:", text: "the app's own pages, pictures, sounds and films, saved so it works at the pitch without a signal. They hold nothing about you." },
  ],
  keptNote:
    "All of it stays in this browser's storage on this device. Something leaves it only when you share it yourself, such as a debrief or a plan, through your phone's share sheet.",
  permissions: [
    {
      id: "motion",
      name: "Motion sensors",
      when: "CPR trainer, counting by motion on a manikin",
      why: "Counts your compressions from the phone's movement. iPhones and iPads ask first. Nothing is recorded.",
    },
    {
      id: "camera",
      name: "Camera",
      when: "Live AR in Chrome on Android",
      why: "Places the 3D team on your floor. The picture stays on the phone and nothing is recorded.",
    },
  ],
  optional: "Both are optional: say no and everything else still works.",
  noPermission: "Keeping the screen on (timers and drills), vibration, full screen, sharing, copying and installing the app need no permission.",
  never: "The app never asks for your microphone, location, contacts, photos or notifications.",
  online: [
    { lead: "Films:", text: "YouTube's films play in its privacy-enhanced mode when you tap one, and FIFA's open on FIFA's website. Those sites follow their own privacy policies." },
    { lead: "Links:", text: "FIFA's documents and the medical journals open on their own websites." },
    {
      lead: "Live class quiz:",
      text: "phones connect straight to the instructor's screen. Public relays only introduce them, encrypted with the room code. The nickname you type and your answers go only to that screen, for that quiz, and nothing is stored.",
    },
    { lead: "AR viewers:", text: "Google's AR viewer on Android and AR Quick Look on iPhone open the app's own 3D models." },
  ],
  deleteText:
    "Removes your settings, progress, logs, plans and scorer sessions from this device. The offline copies hold nothing about you and stay, so the app still works without a signal; clear this site's data in your browser's settings to remove those too.",
};
