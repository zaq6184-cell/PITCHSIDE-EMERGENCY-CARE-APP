import type { CareCard } from "./medical.ts";

/**
 * Cold and altitude: the environmental emergencies of chapter 9 of the FIFA Emergency Care Manual (heat illness has
 * its own page). Cards in the same shape as the medical ones, the S.H.E.L.T.E.R. prevention list, and an altitude
 * planner built on FIFA's altitude bands and its rule for a staged ascent. Plain data and functions, tested with
 * `node --test`; the page is routes/environment.tsx.
 */
export type EnvId = "hypothermia" | "frostbite" | "coldallergy" | "ams" | "hace" | "hape";

/** FIFA's S.H.E.L.T.E.R. mnemonic for avoiding cold injury: the letter, then the line. */
export const SHELTER: { letter: string; text: string }[] = [
  { letter: "S", text: "Shelter the team from cold, wind and rain as far as the venue allows: plan ahead." },
  { letter: "H", text: "Hydrate: the cold makes players pass more urine." },
  { letter: "E", text: "Eliminate alcohol, nicotine and caffeine, which upset the body's protection against the cold." },
  { letter: "L", text: "Layered clothing; swap wet socks, gloves and hats for dry ones." },
  { letter: "T", text: "Thermogenesis: keep moving and eat carbohydrate, above all the goalkeepers and the bench." },
  { letter: "E", text: "Examine exposed players and the bench for signs of cold injury." },
  { letter: "R", text: "Recognise those at risk: asthma, cold urticaria or a previous cold injury." },
];

export const COLD: CareCard<EnvId>[] = [
  {
    id: "hypothermia",
    title: "Hypothermia",
    sub: "A core temperature of 35 °C or lower",
    recognise: [
      "Mild (32–35 °C): intense shivering, pale cold skin and passing a lot of urine; then irritability, apathy, clumsiness, slurred speech and confusion that can look like concussion.",
      "Moderate (28–32 °C): the shivering stops; very cold skin, slurred speech, poor coordination, falling consciousness, stiff muscles, dilated pupils, a slow pulse, low blood pressure and a high risk of dangerous heart rhythms.",
      "Severe (below 28 °C), rare in football: no reflexes and a very slow pulse or none; the player may look dead.",
      "Many thermometers cannot read below 34 °C. An oral or armpit reading above 35 °C makes hypothermia unlikely.",
    ],
    steps: [
      "Out of the wind and wet, into a warm room: the medical centre or the dressing room.",
      "Wet kit off; dry, preferably warm clothing on, and wrap the player in blankets.",
      "Awake and shivering: non-alcoholic hot food and drinks with about 7% carbohydrate, to keep the shivering going, and warmth from a heater (near it, not next to it).",
      "Not shivering, drowsy or confused: life-threatening. Move them gently and as little as possible, as movement can trigger cardiac arrest; keep them flat, have the AED ready and call the ambulance.",
    ],
    trained: [
      "Core temperature: rectal is the standard; a low-reading ear (epitympanic) thermometer will do if the player is breathing.",
      "Not fully awake, not shivering and below 32 °C: full advanced life support and internal rewarming in hospital. IV access, airway care and the transfer with extra care, and the AED ready first.",
      "Unstable (systolic below 90 mmHg, a ventricular arrhythmia, or a core temperature below 30 °C): rewarm by minimally invasive means and, where possible, go straight to a hospital with extracorporeal life support (ECLS) on standby.",
      "Hypothermic cardiac arrest: check for signs of life for a full minute, then CPR as usual. Withhold adrenaline and delay defibrillation until the core temperature reaches 30 °C; then give adrenaline every 6–10 minutes (twice the usual interval), and return to normal protocols at 35 °C.",
      "A mechanical chest-compression device is recommended; consider an ECLS centre early.",
    ],
    call: "Not shivering, confused or drowsy, a core temperature below 32 °C, or any doubt.",
    football: "Goalkeepers and the substitutes on the bench move least and get cold first. Shivering is the most reliable sign and the easiest to spot from the bench. No one on the pitch or the touchline should ever reach moderate hypothermia.",
    source: "FIFA Emergency Care Manual, chapter 9: cold emergencies, which follows the European Resuscitation Council Guidelines 2021.",
  },
  {
    id: "frostbite",
    title: "Frostbite and chilblains",
    sub: "Frozen skin, or skin left cold and wet",
    recognise: [
      "Frostbite (below 0 °C): numbness, tingling or burning, then skin that turns red, waxy white or blue-grey, on the ears, nose, fingers, wrists or toes.",
      "Deep frostbite: hard, waxy skin that may be white, grey, black or purple, with blisters, some of them filled with blood.",
      "Chilblains (cold and wet, below 16 °C, for about an hour): red or bluish, swollen, itchy, painful bumps on the toes or fingers, often from wet socks and boots.",
      "Frostbite comes with a falling core temperature: always measure it to check for hypothermia.",
    ],
    steps: [
      "Out of the cold, wind and wet; wet socks and gloves off.",
      "Rewarm only if it cannot freeze again, as refreezing does more harm than staying frozen: let the player warm up at room temperature.",
      "No rubbing, no creams, no steam or direct dry heat; leave the blisters intact.",
      "Until it can be rewarmed, protect the area without padding it, as padding thaws it.",
      "Chilblains: wash gently in warm water, dry carefully, raise the area, and keep weight off it until healed (pad it if they must walk).",
    ],
    trained: [
      "Rewarm hands or feet in a water bath at 35–40 °C for 15–30 minutes, until the colour, feeling and suppleness return.",
      "Rewarming hurts: give pain relief, such as ibuprofen.",
      "Clear blisters may be drained if needed; blood-filled blisters mean a deep injury and are left for the hospital.",
    ],
    call: "Deep frostbite, blood-filled blisters, frostbite with hypothermia, or skin that stays numb or discoloured after rewarming.",
    football: "In freezing weather cover the ears, nose, hands and wrists; change wet socks, gloves and hats whenever possible; and protect players with a previous cold injury or Raynaud's. With good planning, deep frostbite should not happen in football.",
    source: "FIFA Emergency Care Manual, chapter 9: cold emergencies.",
  },
  {
    id: "coldallergy",
    title: "Cold urticaria and cold-induced asthma",
    sub: "When the cold itself is the trigger",
    recognise: [
      "Hives, often during the warm-up in the cold, which can go on to swelling of the face or throat and, rarely, anaphylaxis: watch for breathing, circulation or stomach symptoms.",
      "Cold air, and exercise in the cold, can trigger bronchospasm: wheeze, cough and a tight chest.",
    ],
    steps: [
      "Hives alone: out of the cold, and an antihistamine by mouth.",
      "Swollen lips, tongue or throat, wheeze or faintness: IM adrenaline, as on the anaphylaxis card.",
      "Wheeze without other signs: the reliever inhaler through a spacer, as on the asthma card.",
      "Watch the player until the symptoms have settled.",
    ],
    trained: ["Severe hives may need oral corticosteroids.", "The anti-doping rules still apply: complete any follow-up after emergency treatment."],
    call: "Any sign of anaphylaxis, or wheeze that the inhaler does not settle.",
    football: "Avoiding the cold is the only prevention for cold urticaria: plan that player's warm-up indoors.",
    source: "FIFA Emergency Care Manual, chapter 9: cold emergencies, with chapters 4 and 5.",
  },
];

export const ALTITUDE: CareCard<EnvId>[] = [
  {
    id: "ams",
    title: "Acute mountain sickness (AMS)",
    sub: "From about 2,000 m, within hours of arriving",
    recognise: [
      "A throbbing headache, like a hangover, worse at night or after sleep, with at least one of: poor appetite, nausea or vomiting; tiredness or weakness; dizziness or light-headedness.",
      "No neurological signs: unsteadiness or confusion means HACE.",
      "Concussion, hypothermia, low blood sugar and infection can look the same: rule them out.",
    ],
    steps: [
      "Rest, and go no higher until better.",
      "Pain relief: paracetamol 500–1000 mg, ibuprofen 400–800 mg or aspirin 500 mg.",
      "No alcohol, and nothing that slows the breathing, such as sleeping tablets.",
      "Any unsteadiness or confusion means HACE: treat it as an emergency. Getting worse: call for medical help, as AMS can turn into HACE.",
    ],
    trained: [
      "Ondansetron 4 mg melts every 4 hours for nausea and vomiting.",
      "Staff known to get AMS may take acetazolamide 125 mg twice a day, or dexamethasone 2 mg every 6 hours or 4 mg every 12 hours, to prevent it. Players may not: both are on the WADA Prohibited List.",
    ],
    call: "Any unsteadiness, confusion or drowsiness, breathlessness at rest, or symptoms getting worse.",
    football: "Before playing at altitude, plan a staged ascent: about one day for every 300–500 m above 2,000 m. Use the altitude planner.",
    source: "FIFA Emergency Care Manual, chapter 9: altitude illness; Lake Louise criteria (2018).",
  },
  {
    id: "hace",
    title: "High-altitude cerebral oedema (HACE)",
    sub: "Swelling of the brain: an emergency",
    recognise: [
      "Usually 24–72 hours after going higher, in someone with AMS or HAPE: a worsening headache and vomiting, then severe tiredness, an unsteady walk, confusion, drowsiness and coma.",
      "Mild AMS can progress to unconsciousness from HACE within 12 hours, though it usually takes about three days.",
    ],
    steps: [
      "Call for help: it is life-threatening.",
      "Oxygen first: 2–4 L/min, or whatever keeps SpO₂ above 90%.",
      "Descend to an altitude where it reverses, by road or air ambulance, with advanced life support on board.",
      "Rest from all exercise; make sure they drink and eat enough, and check the blood glucose.",
    ],
    trained: [
      "D.R.O.P.: Descend, Rest, Oxygen, Pharmacology.",
      "Dexamethasone 4–8 mg IV, IM or by mouth, then 4 mg every 6 hours.",
      "A loop diuretic (furosemide 40–80 mg) may reduce the swelling, but keep the circulating volume up: these players are often dry.",
      "Unconscious: open and protect the airway; positive-pressure ventilation if severe HAPE is present too.",
      "A clinical diagnosis: do not delay treatment or descent for scans or tests.",
    ],
    call: "Always: descent and hospital care.",
    football: "No team should go to altitude without oxygen, a descent plan and transport arranged in advance.",
    source: "FIFA Emergency Care Manual, chapter 9: altitude illness.",
  },
  {
    id: "hape",
    title: "High-altitude pulmonary oedema (HAPE)",
    sub: "Fluid in the lungs: the commonest killer at altitude",
    recognise: [
      "After a fast ascent without acclimatisation: symptoms of AMS, a persistent dry cough, breathlessness on exertion, poor performance, slow recovery and tiredness.",
      "Blue lips and nail beds, a fast pulse and breathing, crackles in the chest, a low SpO₂, and later pink frothy sputum.",
      "Signs of HACE may come with it, and can dominate.",
    ],
    steps: [
      "Stop all exercise; sit the player up and keep them warm.",
      "Oxygen, to keep SpO₂ above 90%.",
      "Descend: oxygen and descent are the treatment.",
      "Call for help and arrange the transport.",
    ],
    trained: [
      "Medicines only when oxygen or descent is impossible, which should never happen on a football trip: nifedipine 30 mg slow-release every 12 hours, furosemide 80 mg every 12 hours, or morphine 15 mg titrated IV.",
    ],
    call: "Always.",
    football: "Oxygen should be available wherever the team stays, trains and plays at altitude.",
    source: "FIFA Emergency Care Manual, chapter 9: altitude illness.",
  },
];

// ------------------------------------------------------------------ the altitude planner
export type BandId = "sea" | "low" | "moderate" | "high" | "extreme";
export type Band = { id: BandId; from: number; label: string; risk: string };

/** FIFA's altitude bands (metres above sea level), each with what it means for altitude illness. */
export const BANDS: Band[] = [
  { id: "sea", from: 0, label: "Near sea level", risk: "No altitude illness expected." },
  { id: "low", from: 501, label: "Low altitude", risk: "Below the 2,000 m threshold for acute mountain sickness." },
  {
    id: "moderate",
    from: 2001,
    label: "Moderate altitude",
    risk: "The risk of acute mountain sickness is low for healthy players from near sea level, and it is usually mild. Team members with an illness, obesity or prescription medicines can get it worse, and HACE or HAPE, though unlikely, remain possible.",
  },
  {
    id: "high",
    from: 3001,
    label: "High altitude",
    risk: "The risk rises with height: at 4,000 m and above it is considerable for players from near sea level, and without early treatment AMS can progress to HACE and HAPE. Plan a staged ascent.",
  },
  { id: "extreme", from: 5501, label: "Extreme altitude", risk: "FIFA's highest band, far above any football venue." },
];

export function bandFor(metres: number): Band {
  return [...BANDS].reverse().find((b) => metres >= b.from) ?? BANDS[0];
}

/** FIFA: allow one day of acclimatisation for every 300–500 m above 2,000 m. Days, from the 500 m pace to the 300 m one. */
export function acclimatisationDays(metres: number): { min: number; max: number } {
  const above = Math.max(0, metres - 2000);
  return { min: Math.ceil(above / 500), max: Math.ceil(above / 300) };
}

/** Some football cities at altitude, in round figures: a starting point, not a survey. */
export const VENUES: { name: string; metres: number }[] = [
  { name: "Mexico City", metres: 2240 },
  { name: "Bogotá", metres: 2640 },
  { name: "Quito", metres: 2850 },
  { name: "La Paz", metres: 3640 },
];
