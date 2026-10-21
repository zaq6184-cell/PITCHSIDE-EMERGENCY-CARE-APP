import type { RoleId } from "@/lib/workshop";

/**
 * Where each PEAP role sits around the player, seen from above with the head at the top.
 * Drawn for this guide from the positions on FIFA's PEAP poster, with Orange kneeling directly behind
 * the head, in line with the body (the team's preference; the poster shows Orange at the head):
 * Green at the head on the player's left, Red / Blue / White down the right, Black on the left.
 */
export const MARKS: { id: RoleId; label: string; x: number; y: number; fill: string; ink: string; where: string }[] = [
  { id: "orange", label: "Orange", x: 160, y: 8, fill: "#E36B12", ink: "#0B1F3A", where: "directly behind the head" },
  { id: "green", label: "Green", x: 216, y: 40, fill: "#1A7F45", ink: "#FFFFFF", where: "at the head on the player's left, by the bag and AED" },
  { id: "red", label: "Red", x: 62, y: 150, fill: "#C0392B", ink: "#FFFFFF", where: "player's right, level with the chest" },
  { id: "blue", label: "Blue", x: 50, y: 226, fill: "#1F6AA5", ink: "#FFFFFF", where: "player's right, level with the pelvis" },
  { id: "white", label: "White", x: 62, y: 304, fill: "#FFFFFF", ink: "#1C1C1C", where: "player's right, level with the lower legs" },
  { id: "black", label: "Black", x: 262, y: 168, fill: "#1C1C1C", ink: "#FFFFFF", where: "player's left, level with the chest" },
];

/** Room above the head for Orange: shared by the diagram and the "place the team" game. */
export const DIAGRAM_VIEWBOX = "0 -30 320 410";
