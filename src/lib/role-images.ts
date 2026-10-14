import { asset } from "@/lib/asset";
import type { RoleId } from "@/lib/workshop";

/**
 * AI-generated header pictures, one per role, each showing that colour's job on FIFA's PEAP
 * positions: Black hands-off on the player's left; Orange at the head; Red, Blue, White on the
 * right at the chest, hips and legs; Green at the head on the left with the bag and AED.
 * Checked for technique (e.g. straight-arm compressions, both hands on the head for stabilisation).
 */
const alts: Record<RoleId, string> = {
  black: "Team leader in a black bib standing on the player's left, radio to the ear, directing the team without touching the player",
  orange: "Medic in an orange bib kneeling at the player's head, holding it still with one hand on each side",
  red: "Medic in a red bib on the player's right giving chest compressions: arms straight, shoulders over the hands, hands on the centre of the chest",
  blue: "Medic in a blue bib on the player's right, level with the hips, opening the oxygen cylinder",
  white: "Medic in a white bib on the player's right at the legs, readying one half of a scoop stretcher, with splints beside",
  green: "Medic in a green bib at the player's head with the emergency bag open and the AED and pads ready",
};

export function roleImage(id: RoleId) {
  return { src: asset(`/img/roles/role-${id}.webp`), small: asset(`/img/roles/role-${id}-sm.webp`), alt: alts[id] };
}
