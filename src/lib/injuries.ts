/**
 * "Tap where it hurts": pitchside cards for common football injuries, checked against chapter 6 of the FIFA Emergency
 * Care Manual (trauma emergencies), and the Ottawa ankle, foot and knee rules (Stiell et al.; validated in sports
 * medicine — Leddy et al. 1998). The rules say who needs an X-ray, not who can play on. Plain data and functions,
 * tested with `node --test`; the page is routes/injuries.tsx.
 */
export type RegionId = "head" | "neck" | "chest" | "abdomen" | "hip" | "shoulder" | "arm" | "thigh" | "knee" | "leg" | "ankle";

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
  /** the region has the knocked-out tooth clock */
  toothClock?: boolean;
};

export const REGIONS: Region[] = [
  {
    id: "head",
    name: "Head and face",
    sub: "Concussion first · eye · nose · jaw and cheekbone · teeth · wounds",
    link: { to: "/focus", label: "Concussion: the FOCUS assessment" },
    toothClock: true,
    cards: [
      { title: "Any blow to the head", lines: ["Think concussion first. Any sign from the FOCUS domains: off, and not back on today."], urgent: true },
      {
        title: "Eye",
        lines: [
          "Check and note the vision, eye movements and pupils before swelling closes the eye.",
          "Double or blurred vision, trouble looking up, unequal pupils, blood in the front of the eye or a numb cheek: off, and to hospital urgently. Keep them sitting up, with no nose-blowing and no pressure on the eye.",
          "A possibly burst eyeball, or something stuck in the eye: leave it, keep them sitting upright and calm, and tape a shield or a cup over the eye without touching it (no eye pad). Stop any straining or vomiting: an anti-sickness drug (ondansetron) if trained.",
          "Severe pain, failing vision or a bulging eye after a blow: bleeding behind the eye, which is time-critical. Sit them up, hospital now.",
          "Grit in the eye: rinse it out with saline from a 20 mL syringe and look under the upper lid. Playing on depends on how the eye is.",
        ],
      },
      {
        title: "Nose",
        lines: [
          "Bleeding: gloves on. Blow the clots into a swab, facing away from everyone, then pinch the soft part for up to 15 minutes; ice on the bridge helps. Do not tip the head back.",
          "Back on only when the bleeding has completely stopped, with any blood-stained kit changed.",
          "Clear fluid from the nose after a blow: a possible skull-base fracture, hospital now.",
          "Broken nose: playing on depends on the pain, the bleeding and other injuries; a specialist check after 5–7 days. Look inside: a cherry-red swelling of the septum, usually on both sides, is a septal haematoma, which must be drained within 24 hours.",
        ],
      },
      {
        title: "Jaw and cheekbone",
        lines: [
          "Broken jaw: the teeth no longer meet properly, pain on opening, a numb chin, cuts inside the mouth, perhaps a lost tooth. The airway is at risk: protect the neck too, have suction ready, and refer urgently.",
          "Broken cheekbone: double vision, blood in the white of the eye, bruising around the eye, a flattened cheek: pain relief and hospital.",
          "Unconscious with facial injuries: jaw thrust, suction and oxygen, with the neck protected.",
        ],
        urgent: true,
      },
      {
        title: "Knocked-out tooth",
        lines: [
          "Find it and hold it by the crown (the white part), never the root. Do not scrub it or let it dry: rinse it in milk, saline or saliva.",
          "Press it firmly back into its socket within 30 minutes (you should feel a click), then bite on gauze. Never if the upper or lower jaw may be broken. Start the tooth clock below.",
          "Playing on instead: explain what that means for the tooth, keep it in cold milk or iced salt water, and replant it after the match.",
          "Cannot replant: keep it in the player's cheek or under the tongue (saliva is best), or in cold milk, which is better than water; never let it dry. A tooth that cannot be found may have been inhaled.",
          "Chipped tooth: keep the piece in milk, saline or saliva; the player may play on and sees a dentist after the match.",
          "Loose or pushed out of line: gauze for the bleeding; a clinician may ease it back into place. Still loose: splint it to its neighbours with a mouthguard or sugar-free gum, no return today, and a dentist straight after the match. A tender, bleeding gum line can mean a broken socket: leave it alone, dental care now.",
        ],
      },
      {
        title: "Wounds",
        lines: [
          "Gloves on. Firm pressure right on the bleeding point: scalp and face wounds bleed a lot.",
          "Clean it, then clean it again, with plenty of water (a 500 mL bottle is a good start); close or dress it only within your skills. No tissue glue near the eye.",
          "The player leaves the pitch and comes back only on the referee's signal, once the bleeding has stopped and there is no blood on the kit (Law 5).",
          "A wound from someone's tooth: clean it again and again, leave it open, and antibiotics are almost always needed. A wound over a possible fracture: hospital, with early antibiotics. A photo on the player's phone saves unwrapping it again.",
        ],
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
    sub: "Winded · ribs · pneumothorax · ball to the chest",
    link: { to: "/fifa", label: "Sudden cardiac arrest: FIFA's key points" },
    cards: [
      { title: "Ball to the chest, then collapse", lines: ["Commotio cordis: the blow has stopped the heart. CPR and the AED at once."], urgent: true },
      { title: "Winded", lines: ["Brief; breathing settles within a minute or two. If it does not, look for something more."] },
      {
        title: "Ribs",
        lines: [
          "Count the breathing rate, then feel the neck, the front and the sides of the chest: tenderness, crackling under the skin, uneven movement.",
          "Fast breathing, or less movement or air entry on one side: think pneumothorax — oxygen, pain relief and hospital. No Entonox (gas and air) for a possible rib fracture or pneumothorax: it can enlarge a pneumothorax.",
          "Broken lower ribs can hide a torn liver or spleen. Check again: chest problems can take time to show.",
        ],
      },
      {
        title: "Flail chest",
        lines: ["Part of the chest wall sinks in as they breathe in: several ribs broken in more than one place. Oxygen, pain relief, hospital now."],
        urgent: true,
      },
      {
        title: "Tension pneumothorax",
        lines: [
          "A chest injury with breathlessness and shock (a fast pulse, low blood pressure, collapse): air trapped under pressure. A calm, well player does not have one.",
          "Oxygen at 15 L/min through a non-rebreather mask, and the ambulance. If trained, and only with shock, collapse or a peri-arrest state: needle decompression in the 4th or 5th space between the ribs, just above the rib, in the front-to-mid armpit line.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "abdomen",
    name: "Abdomen",
    sub: "Spleen · liver · kidney",
    cards: [
      {
        title: "A knee or collision to the belly, lower ribs or back",
        lines: [
          "It can tear the spleen, liver or kidney.",
          "Red flags: pain getting worse, shoulder-tip pain, pale and sweaty, a pulse that stays fast, a fall in blood pressure, dizziness on standing, blood in the urine.",
          "Signs can take hours to appear: examine again and again, and if in doubt, hospital. Suspected bleeding: off, lie down, oxygen, pain relief, hospital — no return.",
          "If trained and the blood pressure falls: a large-bore IV and crystalloid to keep the systolic at 90 mmHg, no higher, as more can restart the bleeding.",
          "A player recovering from glandular fever may have an enlarged spleen that tears easily: no contact until a doctor confirms it is back to normal size.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "hip",
    name: "Hip and pelvis",
    sub: "Pelvic fracture · hip dislocation",
    cards: [
      {
        title: "Possible pelvic fracture",
        lines: [
          "A fall from a height onto the side, or pain in the pelvis or groin with a fast pulse: it can bleed a lot inside.",
          "Never press or spring the pelvis to test it. Move the player as little as possible: a scoop stretcher, not a log roll onto a long board.",
          "If you are worried, especially with signs of shock: a pelvic binder around the hips, or a sheet or jersey tied round. Reassess after: if they get worse, the binder itself may be the cause.",
        ],
        urgent: true,
      },
      {
        title: "Dislocated hip",
        lines: [
          "Rare: the leg held bent, turned in and across the body, after a fall onto a bent knee.",
          "Strong pain relief, check feeling and movement in the foot, and no attempt to put it back: hospital now, moving the hip as little as possible, as it should be back in within 6 hours.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "shoulder",
    name: "Shoulder and collarbone",
    sub: "Dislocation · fracture · collarbone",
    cards: [
      {
        title: "Dislocated shoulder",
        lines: [
          "Arm held away from the body, squared-off shoulder, cannot move it.",
          "Support it in the position of comfort (the jersey folded up makes a sling); check feeling over the outer upper arm and the pulse; hospital.",
          "Relocation only by a trained clinician, by gentle traction, under your local protocol.",
        ],
      },
      { title: "Collarbone", lines: ["Tender bump over the clavicle: sling and refer. Skin tented over a bone end: urgent."] },
      {
        title: "Collarbone driven in at the breastbone",
        lines: [
          "A blow can push the inner end of the collarbone backwards (a posterior sternoclavicular dislocation) onto the windpipe and the great vessels.",
          "Hard to diagnose on the pitch, so any suspicion means ABC first, pain relief, a sling if tolerated and hospital now. Watch for trouble breathing or swallowing, a hoarse voice, or a pale, cold or numb arm.",
        ],
        urgent: true,
      },
    ],
  },
  {
    id: "arm",
    name: "Arm, wrist and hand",
    sub: "Fracture · elbow and finger dislocation",
    cards: [
      {
        title: "Suspected fracture",
        lines: [
          "Splint in the position found, including the joints above and below.",
          "Check pulse, sensation and movement before and after splinting.",
        ],
      },
      {
        title: "Dislocated elbow",
        lines: [
          "Obvious deformity and swelling after a fall on the hand. Check the pulse and the feeling in the hand.",
          "Support it as found, in a collar and cuff (a broad sling may not fit the arm's position): it is put back in hospital, under sedation.",
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
          "Pain relief, then splint the whole leg, knee and ankle included; check the foot pulses and sensation.",
          "Open fracture: remove gross dirt, cover with saline-soaked gauze (a photo first saves unwrapping it), do not push the bone back in, hospital; antibiotics early.",
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
    sub: "Ottawa ankle and foot rules · sprain · fracture-dislocation",
    ottawa: "ankle",
    cards: [
      { title: "Deformity, or no weight at all", lines: ["Splint, off, and X-ray."] },
      {
        title: "Fracture-dislocated ankle",
        lines: [
          "The foot points the wrong way: pain relief, and check its colour, pulses and feeling at once.",
          "A cold, pale or pulseless foot cannot wait: a trained clinician realigns it with gentle traction, then splint and hospital.",
        ],
        urgent: true,
      },
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
    "Firm direct pressure with a dressing, right on the bleeding point; pack a deep wound.",
    "Limb bleeding that pressure cannot stop: a tourniquet high and tight — note the time.",
    "A bleeding player leaves the pitch and comes back only on the referee's signal, once the bleeding has stopped and there is no blood on the kit (Law 5).",
  ],
  urgent: true,
};

// ------------------------------------------------------------------ the tooth clock
/** The aim for a knocked-out tooth: back in its socket within 30 minutes (FIFA, after the IADT). */
export const TOOTH_MINUTES = 30;

/**
 * Where the tooth clock stands `ms` after the tooth came out: time to replant, hurry in the last 10 minutes,
 * then late — still worth replanting or storing in saliva or milk, but the outlook falls.
 */
export function toothClock(ms: number) {
  const elapsed = Math.max(0, Math.floor(ms / 1000));
  const left = Math.max(0, TOOTH_MINUTES * 60 - elapsed);
  const stage: "replant" | "hurry" | "late" = left === 0 ? "late" : left <= 10 * 60 ? "hurry" : "replant";
  return { elapsed, left, stage };
}

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
