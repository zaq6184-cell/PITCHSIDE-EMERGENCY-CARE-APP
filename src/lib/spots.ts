import type { RoleId } from "@/lib/workshop";

/** Where each colour works around the player, in metres: the 3D drills, the AR models and the PEAP marks. */
export type Spot = { id: RoleId; color: string; x: number; z: number; face: number; stand?: boolean };

/** A figure's front is its local -z; rotating by θ about y points it along (-sin θ, -cos θ). */
export const facing = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

// Player's right is -x. The player lies along z: head ≈ -1.0, sternum ≈ -0.55, pelvis ≈ 0.1, legs ≈ 0.8.
export const SPOTS: Spot[] = [
  { id: "orange", color: "#E36B12", x: 0, z: -1.66, face: facing(0, -1.66, 0, -1.0) },
  { id: "green", color: "#1A7F45", x: 0.7, z: -1.14, face: facing(0.7, -1.14, 0.05, -0.62) },
  { id: "red", color: "#C0392B", x: -0.62, z: -0.54, face: facing(-0.62, -0.54, 0, -0.54) },
  { id: "blue", color: "#1F6AA5", x: -0.64, z: 0.2, face: facing(-0.64, 0.2, 0, 0.14) },
  { id: "white", color: "#F4F4F1", x: -0.62, z: 0.96, face: facing(-0.62, 0.96, 0, 0.88) },
  { id: "black", color: "#1C1C1C", x: 1.18, z: -0.2, face: facing(1.18, -0.2, 0, -0.45), stand: true },
];
