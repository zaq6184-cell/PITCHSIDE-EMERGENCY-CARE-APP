/**
 * Where each voice should come from in the 3D scenes: -1 (left) … 1 (right), kept up to date by the
 * scene's camera every frame. Keys are role ids, plus "aed" for the AED trainer's device.
 */
export const voicePan: Record<string, number> = {};

/**
 * Stereo position of a point seen by a camera at (cx, cz) looking along (fx, fz) on the ground plane.
 * `spread` sets how quickly sound moves to one side as the point moves off the centre of the view.
 */
export function panFrom(px: number, pz: number, cx: number, cz: number, fx: number, fz: number, spread: number) {
  const len = Math.hypot(fx, fz) || 1;
  const ux = fx / len;
  const uz = fz / len;
  const dx = px - cx;
  const dz = pz - cz;
  const lateral = dx * -uz + dz * ux;
  const depth = Math.max(0.3, dx * ux + dz * uz);
  return Math.max(-0.85, Math.min(0.85, (lateral / depth) * spread));
}
