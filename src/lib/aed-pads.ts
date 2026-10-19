/**
 * Where the AED pads go, for the pads trainer: anterolateral — one below the right collarbone beside
 * the breastbone, the other below the left armpit in the mid-axillary line (the app's Module 2 and
 * Green's role card). Positions are on the 3D player seen from above: x across the body (the player's
 * right is negative), z along it (the head is negative). The flat diagram uses the same numbers.
 */
export type PadId = "right" | "left";
export type Tap = { x: number; z: number };

export const PAD_TARGETS: Record<PadId, Tap> = {
  right: { x: -0.12, z: -0.66 },
  left: { x: 0.22, z: -0.47 },
};
/** How close a tap must be to count, in scene units (the chest is about 0.51 wide). */
export const PAD_RADIUS = 0.1;

const CHEST = { halfWidth: 0.27, top: -0.86, bottom: -0.02 };

export type Verdict = { pad: PadId } | { miss: string };

/** A tap on the player: which pad it places, or why it is in the wrong place. */
export function judgeTap(tap: Tap, placed: Record<PadId, boolean>): Verdict {
  for (const id of ["right", "left"] as const) {
    if (placed[id]) continue;
    const t = PAD_TARGETS[id];
    if (Math.hypot(tap.x - t.x, tap.z - t.z) <= PAD_RADIUS) return { pad: id };
  }
  return { miss: missHint(tap, placed) };
}

function missHint(tap: Tap, placed: Record<PadId, boolean>): string {
  const onChest = Math.abs(tap.x) <= CHEST.halfWidth && tap.z >= CHEST.top && tap.z <= CHEST.bottom;
  if (!onChest) return "That is off the chest. Both pads go on the bare chest.";
  if (Math.abs(tap.x) < 0.06) return "Not on the breastbone. The shock has to cross the heart: right upper chest to the left side.";
  if (tap.x < 0) {
    if (placed.right) return "The right pad is already on. The other one goes below the LEFT armpit, in the mid-axillary line.";
    if (tap.z < -0.78) return "Just below the right collarbone — not on it.";
    if (tap.z > -0.56) return "Higher — just below the right collarbone, beside the breastbone.";
    return "Close. Just below the right collarbone, beside the breastbone.";
  }
  if (placed.left) return "The left pad is already on. The other one goes below the RIGHT collarbone, beside the breastbone.";
  if (tap.x < 0.14) return "Further round to the side — below the armpit, in line with its middle, not on the front of the chest.";
  return tap.z < PAD_TARGETS.left.z
    ? "Lower — below the left armpit, about level with the nipple."
    : "Higher — below the left armpit, about level with the nipple.";
}

/** Choices for anyone who cannot tap the picture: each stands for a tap at that place. */
export const PAD_CHOICES: { label: string; tap: Tap }[] = [
  { label: "Below the right collarbone, beside the breastbone", tap: PAD_TARGETS.right },
  { label: "Over the breastbone, in the centre of the chest", tap: { x: 0, z: -0.55 } },
  { label: "Below the left armpit, in the mid-axillary line", tap: PAD_TARGETS.left },
  { label: "On the front of the left chest, over the nipple", tap: { x: 0.1, z: -0.47 } },
];
