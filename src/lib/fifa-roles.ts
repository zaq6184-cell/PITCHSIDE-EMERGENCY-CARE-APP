import type { RoleId } from "@/lib/workshop";

/**
 * FIFA Medical Set Piece — "Roles within the Pre-Match Emergency Action Plan" (2025 role cards).
 * Wording condensed from FIFA's card for each colour. © FIFA.
 */
export const FIFA_ROLE_CARDS_PDF =
  "https://digitalhub.fifa.com/m/6ba55c14845ba5b8/original/FIFA-Medical-Set-Piece-Roles-within-the-Pre-Match-Emergency-Action-Plan.pdf";

export type FifaRoleCard = {
  who: string;
  general?: string[];
  trauma?: string[];
  logRoll?: string[];
  arrest?: string[];
};

export const fifaRoleCards: Partial<Record<RoleId, FifaRoleCard>> = {
  black: {
    who: "The overall team leader, in charge of decision-making for the player (usually the FIFA Match Doctor).",
    general: [
      "Stay hands-off — leave assessments and interventions to the team unless exceptional circumstances require it.",
      "Lead every member and make sure each is doing their role.",
      "Decide when to involve the extrication team.",
      "Own monitoring for deterioration during extrication.",
    ],
  },
  orange: {
    who: "The person at the head of the player.",
    trauma: [
      "Immobilise the cervical spine (jaw thrust at the same time if needed).",
      "Speak to the player to reassure them and explain what is happening.",
    ],
    logRoll: [
      "Take the head.",
      "Take the lead: give clear instructions and ask each member to confirm they understood.",
    ],
    arrest: [
      "Initial airway-opening manoeuvres.",
      "Insert the LMA and attach the bag/valve.",
      "One ventilation every ten compressions with the LMA.",
      "Face mask instead of LMA: apply and hold the mask; the compressor gives 2 breaths after every 30.",
    ],
  },
  red: {
    who: "The person at the chest (usually the player's right) — a senior clinician able to assess and treat.",
    trauma: [
      "All structured assessments (Hands On 1, 2, 3).",
      "Interventions: airway adjuncts, non-rebreathing trauma mask, cervical collar.",
    ],
    logRoll: ["Take the chest, following Orange's lead.", "Help apply the straps for extrication."],
    arrest: [
      "Assess for signs of life.",
      "Start chest compressions at once and make sure the AED has been called for.",
      "Swap out after two minutes and assess for reversible causes.",
      "Face mask instead of LMA: also squeeze the bag for 2 breaths after every 30 compressions.",
    ],
  },
  blue: {
    who: "The person who brings the oxygen cylinder onto the pitch.",
    trauma: ["Oxygen to the non-rebreathing trauma mask at 15 L/min."],
    logRoll: ["Take the pelvis, following Orange's lead.", "Help apply the straps for extrication."],
    arrest: [
      "Oxygen to the bag/valve reservoir at 15 L/min.",
      "Be prepared to take over chest compressions from Red after two minutes (with a face mask, also give the 2 breaths after every 30).",
      "May be asked by the team leader to help with IV/IO access and medications.",
    ],
  },
  green: {
    who: "The person who brings the emergency care bag and AED — usually on the left side of the player's head.",
    trauma: ["Hand Red the equipment: airway adjuncts, trauma mask, cervical collar."],
    logRoll: ["Help apply the extrication device."],
    arrest: [
      "Attach the AED and ensure safe defibrillation when directed.",
      "Then supply equipment as needed — but timely defibrillation is always the priority.",
    ],
  },
  white: {
    who: "The person who brings on the extrication devices and splints and sets them up as per the FIFA Medical Set Piece.",
    trauma: ["Make sure splints are available and applied as needed."],
    logRoll: ["Take the feet, following Orange's lead.", "Help apply the straps for extrication."],
    arrest: [
      "Assist as directed by the team leader — this may include IV/IO access and medications.",
      "If you don't have that skill set, tell the team leader at the pre-match briefing.",
    ],
  },
};
