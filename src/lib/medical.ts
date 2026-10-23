/**
 * Medical emergencies on match day: the ones the FIFA emergency bag carries drugs for (Station 5), as pitchside
 * cards for an adult player. Steps first for everyone, then what a trained clinician adds, with the adult doses of
 * the current UK guidelines named on each card. Every card starts from the same rule as the rest of the app: a
 * collapsed player who is not breathing normally is in cardiac arrest.
 */
export type MedicalId = "anaphylaxis" | "asthma" | "hypo" | "seizure" | "choking";

export type MedicalCard = {
  id: MedicalId;
  title: string;
  sub: string;
  recognise: string[];
  steps: string[];
  trained: string[];
  call: string;
  football: string;
  source: string;
};

export const MEDICAL_INTRO =
  "Not every collapse is cardiac or trauma. These cards cover the medical emergencies the FIFA emergency bag carries drugs for. Doses are for adults: give drugs only within your training, and follow your local protocols.";

export const MEDICAL_RULE = "First, every time: a collapsed player who is not breathing normally is in cardiac arrest. Start CPR and get the AED on.";

export const MEDICAL_TEAM =
  "The set piece still applies: Black makes sure the ambulance is called and leads; Blue brings the oxygen, Green the bag and the AED.";

export const MEDICAL: MedicalCard[] = [
  {
    id: "anaphylaxis",
    title: "Anaphylaxis",
    sub: "A severe allergic reaction: a sting, a food or a medicine",
    recognise: [
      "Sudden trouble breathing (wheeze, a hoarse voice, noisy breathing, a swollen tongue or throat) or with the circulation (pale, clammy, faint, collapse).",
      "Usually with hives, flushing or swelling of the skin, but these can be missing.",
      "Often within minutes of a sting, a food or a medicine.",
    ],
    steps: [
      "Call the ambulance at once and say “anaphylaxis”.",
      "Adrenaline into the outer thigh straight away, through clothing if need be: the player's own auto-injector, or the bag's.",
      "Lie the player flat, legs raised if faint; sit them up if breathing is the problem. Do not let them stand or walk.",
      "Remove the trigger if you can: scrape out a sting.",
      "Repeat the adrenaline after 5 minutes if there is no improvement. If they stop breathing normally, start CPR.",
    ],
    trained: [
      "Adrenaline 1 mg/mL (1:1000): 0.5 mL (500 micrograms) IM into the anterolateral thigh. Adult auto-injectors give 300 or 500 micrograms.",
      "High-flow oxygen. No better after two doses: refractory anaphylaxis, which needs advanced care urgently.",
      "Antihistamines are not emergency treatment: give them only once the player is stable.",
    ],
    call: "Always. Even after a good response the player goes to hospital: the reaction can come back hours later.",
    football: "Bee and wasp stings on the pitch, nuts in team food, painkillers taken before a match. Players with known allergies carry their auto-injector to every match and training session.",
    source: "Resuscitation Council UK, Emergency treatment of anaphylaxis (2021).",
  },
  {
    id: "asthma",
    title: "Asthma attack",
    sub: "Wheeze and breathlessness the usual inhaler does not settle",
    recognise: [
      "Breathless, wheezy, coughing, a tight chest: often during or just after hard exercise, or in cold air or pollen.",
      "Severe: cannot finish a sentence, breathing 25 or more a minute, pulse 110 or more.",
      "Life-threatening: SpO₂ below 92%, a quiet (silent) chest, blue lips, exhaustion or confusion.",
    ],
    steps: [
      "Sit the player up and keep them calm.",
      "Reliever inhaler (salbutamol) through a spacer: 1 puff every 30–60 seconds, up to 10 puffs.",
      "No better after 10 puffs, or any severe sign: call the ambulance, and repeat the 10 puffs while you wait.",
      "If they collapse or stop breathing normally, start CPR.",
    ],
    trained: [
      "Oxygen to keep SpO₂ at 94–98%.",
      "Nebulised salbutamol 5 mg, driven by oxygen; add ipratropium 500 micrograms if severe.",
      "Prednisolone 40–50 mg by mouth, or hydrocortisone 100 mg IV if they cannot swallow.",
      "Wheeze with swelling, hives or a falling blood pressure after a trigger: treat it as anaphylaxis, with IM adrenaline.",
    ],
    call: "Any severe or life-threatening sign, no relief from the inhaler, or any doubt.",
    football: "Exercise-induced asthma is common in footballers: check that each player who needs one has a reliever and spacer in the bench bag.",
    source: "BTS/SIGN British guideline on the management of asthma (2019); Asthma + Lung UK first aid for an asthma attack.",
  },
  {
    id: "hypo",
    title: "Low blood sugar (hypoglycaemia)",
    sub: "A player with diabetes, or a long session without food",
    recognise: [
      "Shaky, sweaty, pale, hungry, irritable or confused. Slurred speech or odd behaviour can look like drunkenness or a head injury.",
      "Blood glucose below 4 mmol/L (72 mg/dL).",
      "It can lead to a seizure or unconsciousness.",
    ],
    steps: [
      "Check the blood glucose if you can, but do not delay treatment.",
      "Awake and able to swallow: 15–20 g of fast sugar, such as glucose tablets or gel, or 150–200 mL of fruit juice or a non-diet sports drink.",
      "Recheck after 10–15 minutes, and repeat the sugar up to three times while it is below 4 mmol/L.",
      "Once better, give a longer-acting carbohydrate: a sandwich, a banana or the next meal.",
      "Drowsy or unconscious: nothing by mouth. Recovery position, keep the airway open, and call the ambulance.",
    ],
    trained: [
      "Glucagon 1 mg IM, or a nasal glucagon device, if the player cannot swallow.",
      "IV glucose by a doctor: 75–80 mL of 20% or 150–160 mL of 10% over 10–15 minutes.",
    ],
    call: "Unconscious, fitting, no better after three treatments, or any doubt about the cause.",
    football: "Players on insulin carry fast sugar and their meter. A low can come hours after a match or training. Check the glucose of any confused or collapsed player.",
    source: "Joint British Diabetes Societies, The hospital management of hypoglycaemia in adults with diabetes mellitus.",
  },
  {
    id: "seizure",
    title: "Seizure (fit)",
    sub: "Stiffening and jerking, with loss of awareness",
    recognise: [
      "Stiffening, then rhythmic jerking. The player may cry out, go blue, bite their tongue or wet themselves.",
      "Afterwards drowsy and confused for a while.",
      "A collapse with brief jerking can be the start of a cardiac arrest: check the breathing as soon as you can.",
    ],
    steps: [
      "Note the time it started.",
      "Protect, do not restrain: clear the space and cushion the head. Nothing in the mouth.",
      "When it stops, check the airway and breathing. Not breathing normally: start CPR and get the AED on.",
      "Breathing normally: recovery position (log roll with the head held if the neck may be injured).",
      "Check the blood glucose, and stay with the player until fully awake.",
    ],
    trained: [
      "A seizure lasting 5 minutes or more, or repeated without waking: buccal midazolam 10 mg, or IV lorazepam 4 mg (repeated once after 5–10 minutes if needed), following your local protocol.",
      "Oxygen, and treat a low blood sugar as on its card.",
    ],
    call: "A first seizure, one lasting 5 minutes or more, a repeat, an injury, trouble breathing, or not waking normally.",
    football: "A seizure straight after a head impact (an impact seizure) is a visible sign of concussion: the player comes off and does not return that day.",
    source: "Resuscitation Council UK; NICE Epilepsies guideline NG217 (2022); FIFA concussion protocol.",
  },
  {
    id: "choking",
    title: "Choking",
    sub: "Something stuck in the airway: food, gum, a mouthguard",
    recognise: [
      "Mild: can speak, cough and breathe. Encourage coughing.",
      "Severe: cannot speak, cough or breathe; may clutch the throat and turn blue.",
    ],
    steps: [
      "Severe, still conscious: lean the player forward and give up to 5 back blows between the shoulder blades.",
      "Not cleared: up to 5 abdominal thrusts, a fist above the navel, pulling sharply in and up.",
      "Keep alternating 5 back blows and 5 abdominal thrusts.",
      "Unresponsive: lower them to the ground, call the ambulance and start CPR. Look in the mouth before each breath and remove anything you can see; no blind finger sweeps.",
    ],
    trained: [
      "Look with a laryngoscope and remove the object with Magill forceps.",
      "Anyone who needed abdominal thrusts is checked by a doctor afterwards for internal injury.",
    ],
    call: "Severe choking, any unresponsiveness, and whenever abdominal thrusts were needed.",
    football: "A player cannot swallow their tongue. In a collapsed player, open the airway (a jaw thrust if the neck may be injured) instead of reaching into the mouth, and lift out a loose mouthguard you can see.",
    source: "Resuscitation Council UK, adult basic life support guidelines.",
  },
];
