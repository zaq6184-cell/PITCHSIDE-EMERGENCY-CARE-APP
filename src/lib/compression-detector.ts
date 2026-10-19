/**
 * Counts chest compressions from a phone's motion sensor (DeviceMotion), for the CPR rhythm trainer:
 * hold the phone in your hands while you compress on a manikin. It follows the up-and-down push in the
 * total acceleration, so it works whichever way the phone is held. It counts the rhythm only — not
 * depth or recoil. Pure function: feed it samples, it says when a compression lands.
 */
export type CompressionDetector = {
  /** One sensor sample: time in ms and acceleration in m/s² (with gravity). True when a compression lands. */
  push: (t: number, ax: number, ay: number, az: number) => boolean;
  /** How strong the movement is now, 0–1, for a little level meter. */
  level: () => number;
};

export function createCompressionDetector(): CompressionDetector {
  let last = -1;
  let base = 9.81; // gravity and slow drift
  let smooth = 0;
  let env = 0; // recent swing size
  let armed = true;
  let lastHit = -Infinity;
  return {
    push(t, ax, ay, az) {
      const m = Math.hypot(ax, ay, az);
      if (!Number.isFinite(m)) return false;
      const dt = last < 0 ? 1 / 60 : Math.min(0.2, Math.max(0.001, (t - last) / 1000));
      last = t;
      base += (m - base) * (1 - Math.exp(-dt / 0.6));
      smooth += (m - base - smooth) * (1 - Math.exp(-dt / 0.035));
      env = Math.max(Math.abs(smooth), env * Math.exp(-dt / 1.5));
      const high = Math.max(1.0, env * 0.4);
      if (smooth < -high * 0.3) armed = true;
      if (armed && smooth > high && t - lastHit > 270) {
        armed = false;
        lastHit = t;
        return true;
      }
      return false;
    },
    level: () => Math.min(1, env / 6),
  };
}
