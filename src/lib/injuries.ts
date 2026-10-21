/**
 * "Tap where it hurts": pitchside cards for common football injuries, and the Ottawa ankle, foot and knee
 * rules (Stiell et al.; validated in sports medicine — Leddy et al. 1998). The rules say who needs an X-ray,
 * not who can play on. Plain data and functions, tested with `node --test`; the page is routes/injuries.tsx.
 */
export type RegionId = "head" | "neck" | "chest" | "abdomen" | "shoulder" | "arm" | "thigh" | "knee" | "leg" | "ankle";

export type Card = { title: string; lines: string[]; urgent?: boolean };
export type Region = {
  id: RegionId;
  name: string;
  /** shown under the name */
  sub: string;
  cards: Card[];
  link?: { to: "/focus" | "/cspine" | "/fifa"; label: string };
  /** the region has an Ottawa rule tool */
  ottawa?: "knee" | "ankle";
};

export const REGIONS: Region[] = [
  {
    id: "head",
    name: "Head and face",
    sub: "Concussion first · eye · nose · teeth · wounds",
    link: { to: "/focus", label: "Concussion: the FOCUS assessment" },
    cards: [
      { title: "Any blow to the head", lines: ["Think concussion first. Any sign from the FOCUS domains: off, and not back on today."], urgent: true },
      {
        title: "Eye",
        lines: [
          "Check vision, eye movements and the pupil.",
          "Blurred or double vision, blood in the front of the eye, or pain on moving the eye: off, a shield over the eye with no pressure, same-day eye referral.",
          "Something stuck in the eye: leave it in, shield, refer.",
        ],
      },
      {
        title: "Nose",
        lines: [
          "Bleeding: sit forward and pinch the soft part for 10–15 minutes — do not tip the head back.",
          "Deformity, a swollen blocked side (septal haematoma) or clear fluid: off and refer.",
        ],
      },
      {
        title: "Knocked-out tooth",
        lines: [
          "Hold it by the crown, never the root. If dirty, rinse briefly in milk or saline.",
          "Put it straight back in its socket and bite on gauze — or keep it in milk, saline or saliva. A dentist within the hour.",
        ],
      },
      {
        title: "Wounds",
        lines: ["Firm pressure: scalp and face wounds bleed a lot. The player leaves the pitch until the bleeding stops, and blood-stained kit is changed (Law 4)."],
      },
    ],
  },
  {
    id: "neck",
    name: "Neck",
    sub: "Possible spinal injury",
    link: { to: "/cspine", label: "The neck injury set piece in 3D" },
    cards: [
      {
        title: "Possible neck injury",
        lines: [
          "Neck pain or midline tenderness after a collision, numbness, tingling or weakness, or an unconscious player.",
          "Orange holds the head in line (MILS) and the team runs the neck injury set piece.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "chest",
    name: "Chest",
    sub: "Winded · ribs · ball to the chest",
    link: { to: "/fifa", label: "Sudden cardiac arrest: FIFA's key points" },
    cards: [
      { title: "Ball to the chest, then collapse", lines: ["Commotio cordis: the blow has stopped the heart. CPR and the AED at once."], urgent: true },
      { title: "Winded", lines: ["Brief; breathing settles within a minute or two. If it does not, look for something more."] },
      {
        title: "Ribs",
        lines: [
          "Check breathing, chest movement and air entry on both sides.",
          "Breathless, coughing blood or falling oxygen saturation: think pneumothorax — oxygen and hospital.",
        ],
      },
    ],
  },
  {
    id: "abdomen",
    name: "Abdomen",
    sub: "Spleen · liver · kidney",
    cards: [
      {
        title: "A knee or collision to the belly or lower ribs",
        lines: [
          "It can tear the spleen, liver or kidney.",
          "Red flags: pain getting worse, left shoulder-tip pain, pale and sweaty, a fast pulse, blood in the urine.",
          "Off, lie down, oxygen, hospital — no return.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "shoulder",
    name: "Shoulder and collarbone",
    sub: "Dislocation · fracture",
    cards: [
      {
        title: "Dislocated shoulder",
        lines: [
          "Arm held away from the body, squared-off shoulder, cannot move it.",
          "Support it in the position of comfort and sling it; check sensation over the outer upper arm and the pulse; hospital.",
          "Relocation only by a trained clinician, under your local protocol.",
        ],
      },
      { title: "Collarbone", lines: ["Tender bump over the clavicle: sling and refer. Skin tented over a bone end: urgent."] },
    ],
  },
  {
    id: "arm",
    name: "Arm, wrist and hand",
    sub: "Fracture · finger dislocation",
    cards: [
      {
        title: "Suspected fracture",
        lines: [
          "Splint in the position found, including the joints above and below.",
          "Check pulse, sensation and movement before and after splinting.",
        ],
      },
      {
        title: "Finger dislocation",
        lines: ["A trained clinician may relocate a simple one; then buddy-strap and X-ray. An open wound, or it will not go back: splint and hospital."],
      },
    ],
  },
  {
    id: "thigh",
    name: "Thigh",
    sub: "Muscle injury · femur fracture",
    cards: [
      { title: "Sudden pain while sprinting", lines: ["A muscle injury: off, compression, no return today."] },
      {
        title: "Deformity after a big impact",
        lines: ["Possible femur fracture: severe bleeding risk. Splint (a traction splint if trained), pain relief, ambulance."],
        urgent: true,
      },
    ],
  },
  {
    id: "knee",
    name: "Knee",
    sub: "Ottawa knee rule · ligaments · dislocation",
    ottawa: "knee",
    cards: [
      {
        title: "Off and refer",
        lines: ["A locked knee, big swelling within a couple of hours (blood in the joint, often a ligament tear), or the knee gives way."],
      },
      { title: "Knee dislocation", lines: ["Rare but limb-threatening: check the foot pulses, splint, hospital now."], urgent: true },
    ],
  },
  {
    id: "leg",
    name: "Lower leg",
    sub: "Tibia and fibula · open fracture",
    cards: [
      {
        title: "Fractured shin",
        lines: [
          "Splint the whole leg, knee and ankle included; check the foot pulses and sensation.",
          "Open fracture: cover with a sterile dressing, do not push the bone back in, hospital.",
        ],
        urgent: true,
      },
      {
        title: "Watch for compartment syndrome",
        lines: ["Pain out of proportion, pain on stretching the toes, a tight swollen calf: hospital, urgently."],
      },
    ],
  },
  {
    id: "ankle",
    name: "Ankle and foot",
    sub: "Ottawa ankle and foot rules · sprain",
    ottawa: "ankle",
    cards: [
      { title: "Deformity, or no weight at all", lines: ["Splint, off, and X-ray."] },
      {
        title: "Ankle sprain that passes the rules",
        lines: ["No X-ray needed — but the player stays off until they can run, hop and cut without pain."],
      },
    ],
  },
];

export const getRegion = (id: RegionId) => REGIONS.find((r) => r.id === id);

/** Life-threatening bleeding, from anywhere. */
export const BLEEDING: Card = {
  title: "Severe bleeding",
  lines: [
    "Firm direct pressure with a dressing; pack a deep wound.",
    "Limb bleeding that pressure cannot stop: a tourniquet high and tight — note the time.",
    "A bleeding player leaves the pitch until it stops, and blood-stained kit is changed (Law 4).",
  ],
  urgent: true,
};

// ------------------------------------------------------------------ Ottawa rules
export type AnkleFindings = {
  /** pain in the malleolar zone, around the ankle bones */
  malleolarPain: boolean;
  /** pain in the midfoot zone */
  midfootPain: boolean;
  /** bone tenderness at the posterior edge or tip of the lateral malleolus (distal 6 cm) */
  lateralMalleolus: boolean;
  /** bone tenderness at the posterior edge or tip of the medial malleolus (distal 6 cm) */
  medialMalleolus: boolean;
  /** bone tenderness at the base of the fifth metatarsal */
  fifthMetatarsal: boolean;
  /** bone tenderness at the navicular */
  navicular: boolean;
  /** able to take four steps, now and when assessed again */
  fourSteps: boolean;
};

/**
 * Ottawa ankle and foot rules: an ankle X-ray series for pain in the malleolar zone with tenderness at A or B,
 * or unable to take four steps; a foot series for pain in the midfoot zone with tenderness at C or D, or
 * unable to take four steps. Tenderness at a point counts as pain in its zone.
 */
export function ottawaAnkle(f: AnkleFindings) {
  const ankleZone = f.malleolarPain || f.lateralMalleolus || f.medialMalleolus;
  const footZone = f.midfootPain || f.fifthMetatarsal || f.navicular;
  const ankle = ankleZone && (f.lateralMalleolus || f.medialMalleolus || !f.fourSteps);
  const foot = footZone && (f.fifthMetatarsal || f.navicular || !f.fourSteps);
  return { ankle, foot, ankleZone, footZone };
}

export type KneeFindings = {
  age55: boolean;
  /** tenderness of the patella with no other bony tenderness of the knee */
  patella: boolean;
  fibularHead: boolean;
  /** can bend the knee to 90° */
  flex90: boolean;
  fourSteps: boolean;
};

/** Ottawa knee rule: an X-ray if any one criterion is met. Returns the criteria that were. */
export function ottawaKnee(f: KneeFindings) {
  const reasons: string[] = [];
  if (f.age55) reasons.push("aged 55 or over");
  if (f.patella) reasons.push("tenderness of the kneecap alone");
  if (f.fibularHead) reasons.push("tenderness at the head of the fibula");
  if (!f.flex90) reasons.push("cannot bend the knee to 90°");
  if (!f.fourSteps) reasons.push("cannot take four steps");
  return { xray: reasons.length > 0, reasons };
}
