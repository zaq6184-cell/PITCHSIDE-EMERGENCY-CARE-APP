import { asset } from "@/lib/asset";
import type { RoleId } from "@/lib/workshop";

/**
 * AI-generated header pictures, one per role, each showing that colour's job in its position:
 * Black hands-off on the player's left; Orange kneeling directly behind the head, in line with the
 * body; Red, Blue, White on the right at the chest, hips and legs; Green at the head on the left
 * with the bag and AED. Checked for technique (e.g. straight-arm compressions, both hands on the
 * head for stabilisation).
 */
const alts: Record<RoleId, string> = {
  black: "Team leader in a black bib standing on the player's left, radio to the ear, directing the team without touching the player",
  orange: "Medic in an orange bib kneeling directly behind the player's head, in line with the body, holding the head still with one hand on each side",
  red: "Medic in a red bib on the player's right giving chest compressions: arms straight, shoulders over the hands, hands on the centre of the chest",
  blue: "Medic in a blue bib on the player's right, level with the hips, opening the oxygen cylinder",
  white: "Medic in a white bib on the player's right at the legs, readying one half of a scoop stretcher, with splints beside",
  green: "Medic in a green bib kneeling at the player's head on his left side, holding the AED pads, with the emergency bag and AED open beside her",
};

export function roleImage(id: RoleId) {
  return { src: asset(`/img/roles/role-${id}.webp`), small: asset(`/img/roles/role-${id}-sm.webp`), alt: alts[id] };
}
