export type RoleId = "black" | "orange" | "red" | "blue" | "white" | "green";

export type Role = {
  id: RoleId;
  name: string;
  role: string;
  color: string;
  text: string;
  stand: string;
  bring: string;
  fifa: string;
  do: string[];
  say: string[];
};

export type Step = {
  n: number;
  title: string;
  time: string;
  who: RoleId[];
  lines: string[];
};

export const DASH_SECONDS = 10;

/**
 * Content is a plain-language study summary of FIFA's published material: the Pre-Match Emergency
 * Action Plan (PEAP) poster and role colours, and the FIFA Emergency Care Manual — Ch.1 roles and
 * set piece, Ch.2 primary survey, Ch.3 cardiac arrest. It is not FIFA's own text.
 */
export const workshop = {
  event: "PITCHSIDE EMERGENCY CARE",
  title: "FIFA medical set piece · study guide",
  rule: "Non-contact collapse = sudden cardiac arrest until proven otherwise.",
  sources: [
    "FIFA Pre-Match Emergency Action Plan (PEAP) — poster and role colours",
    "FIFA Emergency Care Manual — Ch.1 roles & set piece, Ch.2 primary survey, Ch.3 cardiac arrest, Ch.10 FIFA Emergency Care Bag",
    "FIFA Medical Set Piece — Protocols for on-field interventions during matches (Version 3, March 2025), with the sudden cardiac arrest and cervical spine protocols",
    "ERC 2021 Basic & Advanced Life Support guidelines (as reproduced in the FIFA manual)",
  ],
  timings: [
    { tag: "Immediately", text: "Non-contact collapse: enter the pitch at once. Do not wait for the ball to go out of play." },
    { tag: "≤ 10 s", text: "Signs of life: look for chest movement and feel the carotid pulse together." },
    { tag: "5–6 cm", text: "Compressions mid-chest, 100–120/min, full recoil." },
    { tag: "AED now", text: "Apply the AED the moment it arrives — do not wait for the current 30-count to end." },
    { tag: "Hands-off", text: "Everyone clear for analysis and shock. Oxygen removed before the shock — unless it is on a closed loop such as an LMA (i-gel)." },
    { tag: "No pulse check", text: "After a shock, restart compressions at once." },
    { tag: "30:2", text: "Until an i-gel is in. Face mask + OPA/NPA is a two-person technique." },
    { tag: "Every 10th", text: "With an i-gel: continuous compressions, one breath every 10th compression (~10/min)." },
    { tag: "15 L/min", text: "Oxygen to the bag reservoir." },
    { tag: "2 min", text: "Rhythm check every 2 minutes. Rotate the person doing compressions." },
    { tag: "≤ 10 s", text: "Maximum CPR interruption for any carry." },
    { tag: "≥ 2 min", text: "After each carry: player down and at least 2 minutes of compressions." },
  ],
  roles: [
    {
      id: "black",
      name: "BLACK",
      role: "Team leader",
      color: "#1C1C1C",
      text: "#FFFFFF",
      stand: "Player's LEFT side, level with the chest (PEAP black mark). Hands-off where possible.",
      bring: "Phone or radio, and the completed PEAP sheet with the contact numbers.",
      fifa: "Leads the team and keeps the overview. Ideally hands-off, or with one very limited task. Ensures the ambulance is called.",
      do: [
        "Lead the team. Stay hands-off so you keep the overview and do not fix on one task.",
        "Ensure the ambulance is called.",
        "Check that compressions are running and that the AED goes on the moment it arrives.",
        "Use closed-loop communication: name the person, give the task, hear it confirmed.",
        "Decide when and how the player is moved, and call each lift.",
      ],
      say: [
        "Cardiac arrest. Ambulance is being called now.",
        "Green, AED on as soon as it is here.",
        "Ready to lift. On three. One, two, three, LIFT.",
      ],
    },
    {
      id: "orange",
      name: "ORANGE",
      role: "Head · airway & cervical spine",
      color: "#E36B12",
      text: "#FFFFFF",
      stand: "At the player's HEAD (PEAP orange mark). Hands stay on the head until the neck is cleared or fully immobilised.",
      bring: "Laryngeal mask airway (i-gel) and bag-valve with reservoir.",
      fifa: "Trauma: immobilise the cervical spine. Cardiac arrest: insert the laryngeal mask airway, attach the bag valve, squeeze the bag once every 10 compressions.",
      do: [
        "Trauma: hold the head in line with both hands and talk to the player. Jaw thrust only if you are experienced.",
        "Cardiac arrest: once compressions and the AED are running, insert the i-gel and attach the bag valve.",
        "Squeeze the bag ONCE EVERY 10 COMPRESSIONS. If the i-gel leaks, or you only have a face mask: pause for 30:2.",
        "Control the log roll from the head — you give the count.",
      ],
      say: ["Airway open. i-gel in.", "Holding the head. Ready to roll.", "Roll on three. One, two, three, ROLL."],
    },
    {
      id: "red",
      name: "RED",
      role: "Chest",
      color: "#C0392B",
      text: "#FFFFFF",
      stand: "Player's RIGHT side, level with the chest (PEAP red mark).",
      bring: "Nothing. First hands on the player.",
      fifa: "Trauma: assess the player with A-c-B-C-D-E and apply treatment. Cardiac arrest: commence chest compressions.",
      do: [
        "Check for signs of life: breathing and carotid pulse together, no more than 10 seconds.",
        "Cardiac arrest: start chest compressions at once — 5–6 cm, 100–120/min, full recoil. 30:2 until the i-gel is in, then continuous.",
        "Do not stop compressions while the AED pads go on.",
        "Trauma: run the primary survey (A-c-B-C-D-E) and treat what you find: trauma mask, airway adjuncts, cervical collar.",
        "Take the CHEST in the log roll. If there is no team leader, you lead.",
      ],
      say: ["Player is unresponsive!", "No breathing, no pulse. Starting compressions."],
    },
    {
      id: "blue",
      name: "BLUE",
      role: "Oxygen",
      color: "#1F6AA5",
      text: "#FFFFFF",
      stand: "Player's RIGHT side, level with the pelvis (PEAP blue mark), next to Red.",
      bring: "Oxygen cylinder.",
      fifa: "Bring oxygen. Trauma: attach to the trauma mask at 15 L/min. Cardiac arrest: attach to the bag-valve reservoir at 15 L/min.",
      do: [
        "Bring the oxygen cylinder onto the pitch.",
        "Oxygen at 15 L/min: to the trauma mask (trauma) or to the bag-valve reservoir (cardiac arrest).",
        "Before a shock: with an i-gel / LMA in place (a closed loop) the oxygen can stay connected. With a face mask only, take the mask and oxygen away for the shock and replace them straight after.",
        "Take the PELVIS in the log roll and help with the straps.",
        "Be ready to take over chest compressions from Red at the 2-minute rhythm check.",
      ],
      say: ["Oxygen connected, 15 litres.", "Oxygen clear.", "Pelvis ready."],
    },
    {
      id: "white",
      name: "WHITE",
      role: "Scoop & splints",
      color: "#F2F2F0",
      text: "#1C1C1C",
      stand: "Player's RIGHT side, level with the lower legs (PEAP white mark), next to Blue.",
      bring: "Scoop stretcher and splints.",
      fifa: "Bring the scoop and splints. Assist as directed by the team leader.",
      do: [
        "Bring the scoop stretcher and splints.",
        "Set the extrication kit in line with the player's feet, 2–3 basket lengths away: scoop opened out and split, ready to slide in.",
        "Take the LEGS in the log roll and help with the straps.",
        "Keep the kit and anyone carrying it out of the medical team's way.",
        "Otherwise assist as the team leader directs.",
      ],
      say: ["Scoop ready.", "Legs ready.", "Strapped — one unit."],
    },
    {
      id: "green",
      name: "GREEN",
      role: "Equipment · bag & AED",
      color: "#1E8A4C",
      text: "#FFFFFF",
      stand: "At the HEAD on the player's LEFT, with the FIFA bag and AED open beside you (PEAP green mark).",
      bring: "FIFA Emergency Care Bag and AED.",
      fifa: "Bring the FIFA bag and AED. Trauma: assist with equipment. Cardiac arrest: apply the AED and perform safe defibrillation if advised.",
      do: [
        "Bring the FIFA bag and the AED and open them at the head.",
        "Cardiac arrest: apply the AED as soon as it arrives — do not wait for the 30-count. Pads: below the right collarbone, and below the left armpit on the mid-axillary line.",
        "Before every shock: check that everyone is clear and that oxygen is removed — unless it is on a closed loop (i-gel / LMA).",
        "Trauma: hand the right equipment to the right person at the right time. Know where everything is in the bag.",
        "During a carry: count the 10 seconds out loud.",
      ],
      say: ["I'm clear, you're clear, everyone's clear!", "Shock delivered.", "Ten seconds!"],
    },
  ] as Role[],
  steps: [
    {
      n: 1,
      title: "Recognise",
      time: "At once",
      who: ["red", "black"],
      lines: [
        "Non-contact collapse = sudden cardiac arrest. Enter at once — do not wait for the ball to go out of play.",
        "Unresponsive to voice or touch. Gasping, slow breathing or slow seizure-like movements are cardiac arrest, not a fit.",
        "Red checks for signs of life: breathing and carotid pulse together, no more than 10 seconds.",
        "Black ensures the ambulance is called.",
      ],
    },
    {
      n: 2,
      title: "Chest compressions",
      time: "No delay",
      who: ["red"],
      lines: [
        "Red starts compressions in the middle of the chest: 5–6 cm deep, 100–120 per minute, full recoil.",
        "30 compressions to 2 breaths until the i-gel is in.",
        "Airway and breathing are not the first priority in adult cardiac arrest: compressions and the AED come first.",
      ],
    },
    {
      n: 3,
      title: "AED and shock",
      time: "The moment it arrives",
      who: ["green", "red", "blue"],
      lines: [
        "Green applies the AED as soon as it arrives — do not wait for the current 30-count. Red keeps compressing while the pads go on.",
        "Analysis: hands off. Shock advised: Green checks that everyone is clear and that oxygen is removed (it can stay on a closed loop such as an i-gel), then shocks.",
        "After the shock: no pulse check. Restart compressions at once.",
        "Rhythm check every 2 minutes; swap the person compressing.",
      ],
    },
    {
      n: 4,
      title: "Airway and oxygen",
      time: "Once CPR + AED are running",
      who: ["orange", "blue"],
      lines: [
        "Orange inserts the i-gel (FIFA's adjunct of choice in cardiac arrest) and attaches the bag valve.",
        "Blue connects oxygen at 15 L/min to the bag reservoir.",
        "With the i-gel in: continuous compressions, one breath every 10th compression (about 10 per minute). If it leaks: 30:2.",
        "No i-gel: OPA or NPA with a face mask is a two-person technique at 30:2.",
      ],
    },
    {
      n: 5,
      title: "Prepare the transfer",
      time: "Planned before kick-off",
      who: ["black", "orange", "white", "blue"],
      lines: [
        "FIFA's protocol: after the third shock and medications, the team leader considers extricating the player.",
        "Best: the ambulance comes onto the field to the player. Agree this before the match.",
        "Otherwise: log roll on Orange's count — Red chest, Blue pelvis, White legs — onto a long spinal board (a scoop can also be used).",
        "Strap the player, the board and the AED together as one unit.",
        "A mechanical chest-compression device, where available and the team is trained on it, is fitted before the move so compressions are barely interrupted.",
      ],
    },
    {
      n: 6,
      title: "Stop-and-start carry",
      time: "≤ 10 s each",
      who: ["black", "green"],
      lines: [
        "On Black's command, lift and carry for no more than 10 seconds — Green counts out loud.",
        "Then put the player down and give at least 2 minutes of compressions before the next carry.",
        "Repeat until the player is inside the ambulance. Continue CPR en route.",
        "Destination: a hospital with 24/7 coronary angiography, agreed before the match.",
        "ALS if trained: adrenaline 1 mg IV after the 3rd shock (as soon as possible if non-shockable), then every 3–5 min; amiodarone 300 mg after the 3rd shock, 150 mg after the 5th.",
      ],
    },
  ] as Step[],
  fifaNotes: [
    "Recognition: any non-contact collapse is cardiac arrest. Enter at once. Gasping and slow seizure-like movement are cardiac arrest, not a fit.",
    "Three things decide the outcome: recognising the arrest, early good-quality chest compressions, and early safe defibrillation.",
    "Airway is not the first priority in adult cardiac arrest: compressions and the AED first, then the i-gel (FIFA's adjunct of choice).",
    "With an i-gel: continuous compressions, ~10 breaths/min (every 10th compression). Face mask + OPA/NPA: 30:2, two people.",
    "Before a shock the person shocking checks that everyone is clear and that oxygen is removed — unless it is on a closed loop such as an LMA (FIFA on-field protocols, 2025). The 2022 manual's older advice was to turn the oxygen off or disconnect it.",
    "After a shock: no pulse check — restart CPR immediately. Rhythm check every 2 minutes.",
    "Transfer: player, long spinal board (or scoop) and AED strapped as one unit. CPR interrupted no more than 10 s per carry, then at least 2 minutes of compressions. An ambulance coming to the player is always preferable. Extrication is considered after the third shock and medications, at the team leader's discretion.",
    "ALS if trained: adrenaline 1 mg IV after the 3rd shock (shockable) or as soon as possible (non-shockable), every 3–5 min; amiodarone 300 mg after the 3rd shock, 150 mg after the 5th.",
    "Reversible causes (4 Hs & 4 Ts) — only once compressions, AED and airway are running: hypoxia, hypovolaemia, hypo/hyperthermia and tension pneumothorax are the pitchside ones.",
    "Destination: a hospital with 24/7 coronary angiography, agreed before the match.",
  ],
  dashRules: [
    "Extrication is considered after the third shock and medications; the team leader decides.",
    "Carry only on the team leader's command, and never for more than 10 seconds — count out loud.",
    "At “Ten seconds!”: player down, compressions at once.",
    "At least 2 minutes of compressions before the next carry.",
    "Repeat until the player is inside the ambulance.",
    "An ambulance coming onto the field to the player is always preferable to carrying.",
  ],
  /** The current PEAP poster has six roles and no separate stretcher team. */
  stretcherNote:
    "The current FIFA PEAP shows six roles: Black, Orange, Red, Green, Blue and White. Earlier versions also marked a separate stretcher team in yellow, usually four bearers provided by the stadium. Some venues and teaching centres still use one. If yours does, include them in the pre-match plan: they wait beside the scoop and basket, facing the player, and join only when the team leader calls them — to help with a log roll or to carry.",
  disclaimer:
    "Study aid summarising FIFA's published emergency care guidance. Not a substitute for formal training, current life support certification or your local protocols.",
} as const;

const ROLE_IDS: RoleId[] = ["black", "orange", "red", "blue", "white", "green"];

export function isRoleId(id: string): id is RoleId {
  return (ROLE_IDS as string[]).includes(id);
}

export function getRole(id: string): Role | undefined {
  return workshop.roles.find((r) => r.id === id);
}
