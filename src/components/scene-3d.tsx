import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { useSceneVisibility } from "@/lib/use-scene-visibility";
import { panFrom, voicePan } from "@/lib/view3d";
import { type RoleId, workshop } from "@/lib/workshop";

/**
 * Real-time 3D set piece, built from original shapes: a floodlit stadium, a footballer lying on the
 * back (head away from the default camera) and the six colour roles where FIFA's PEAP poster puts
 * them — Orange directly behind the head, Green at the head on the left, Red / Blue / White down the
 * player's right, Black on the left.
 *
 * Each team member is a jointed figure (hips, knees, shoulders, elbows, head) posed every frame:
 * hands are placed on real targets (the sternum, the head, the AED, the scoop) with two-bone IK, and
 * poses blend smoothly when the drill moves on. Drag to turn, tap a figure to select it.
 *
 * Scenarios: "arrest" plays the cardiac arrest drill (`step` 1–6); "spine" the neck-injury set piece
 * (`step` 1–7, with `phase` moved on by the call-outs: Orange takes the head, the roll, the release,
 * the lift); "aed" is the close-up used by the AED pads trainer (aed-scene-3d.tsx).
 */
export type Scenario = "arrest" | "spine" | "aed";
export type Spot = { id: RoleId; color: string; x: number; z: number; face: number; stand?: boolean };

/** A figure's front is its local -z; rotating by θ about y points it along (-sin θ, -cos θ). */
const facing = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

// Player's right is -x. The player lies along z: head ≈ -1.0, sternum ≈ -0.55, pelvis ≈ 0.1, legs ≈ 0.8.
const SPOTS: Spot[] = [
  { id: "orange", color: "#E36B12", x: 0, z: -1.66, face: facing(0, -1.66, 0, -1.0) },
  { id: "green", color: "#1A7F45", x: 0.7, z: -1.14, face: facing(0.7, -1.14, 0.05, -0.62) },
  { id: "red", color: "#C0392B", x: -0.62, z: -0.54, face: facing(-0.62, -0.54, 0, -0.54) },
  { id: "blue", color: "#1F6AA5", x: -0.64, z: 0.2, face: facing(-0.64, 0.2, 0, 0.14) },
  { id: "white", color: "#F4F4F1", x: -0.62, z: 0.96, face: facing(-0.62, 0.96, 0, 0.88) },
  { id: "black", color: "#1C1C1C", x: 1.18, z: -0.2, face: facing(1.18, -0.2, 0, -0.45), stand: true },
];

const SKIN: Record<RoleId, string> = { black: "#8d5524", orange: "#e0ac69", red: "#c68642", blue: "#a16e4b", white: "#f1c27d", green: "#6b4423" };
const HAIR: Record<RoleId, string> = { black: "#15110e", orange: "#3a2a1e", red: "#120d0a", blue: "#2b1d14", white: "#1a1410", green: "#0d0a08" };
const TOP = "#252e3d";
const TROUSERS = "#1a2130";
const SHOE = "#0f1013";
const KIT = "#5b2d8e"; // the player's shirt: a club colour that is none of the six role colours
const PLAYER_SKIN = "#b07850";
export const GOLD = "#C9A227";
export const CPR_HZ = 110 / 60;

const STERNUM: [number, number, number] = [0, 0.37, -0.55];
export const PLAYER_Y = 0.16;

// ------------------------------------------------------------------ shared drill timing
const ease = (k: number) => k * k * (3 - 2 * k);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
/** 0 → 1, eased, as `s` runs from `a` to `b`. */
const ramp = (s: number, a: number, b: number) => ease(clamp01((s - a) / (b - a)));

/** Seconds since the step (or the cue within it) began, on the scene clock. */
function useSince(step: number, phase: number) {
  const r = useRef({ key: "", t0: 0 });
  return (t: number) => {
    const key = `${step}:${phase}`;
    if (r.current.key !== key) r.current = { key, t0: t };
    return t - r.current.t0;
  };
}

/** Compressions: Red's push and the chest giving way, 110 per minute. Stops for analysis and shock. */
function compression(step: number, t: number) {
  const pushing = step === 2 || step === 4 || (step === 3 && t % 5 < 2.6);
  return pushing ? Math.abs(Math.sin(t * Math.PI * CPR_HZ)) : 0;
}
const handsOff = (step: number, t: number) => step === 3 && t % 5 >= 2.6;

/** The AED trainer: steps 0, 1 and 5 have compressions running; 2 analysis; 3 shock advised; 4 everyone clear. */
const aedCompressing = (step: number) => step <= 1 || step === 5;

/** Log roll on Orange's count (step 5): roll towards the right-side team, hold, roll back. */
function rollAngle(step: number, t: number) {
  if (step !== 5) return 0;
  const p = t % 8;
  if (p < 1) return 0;
  if (p < 2.4) return ease((p - 1) / 1.4) * 0.55;
  if (p < 5) return 0.55;
  if (p < 6.4) return (1 - ease((p - 5) / 1.4)) * 0.55;
  return 0;
}
function rollPoint(x: number, y: number, z: number, a: number): [number, number, number] {
  const yy = y - PLAYER_Y;
  return [x * Math.cos(a) - yy * Math.sin(a), PLAYER_Y + x * Math.sin(a) + yy * Math.cos(a), z];
}

// Stop-and-start carry, shortened for the screen: lift and move, then down for compressions.
const CARRY_LOOP = 9;
function carryLift(t: number) {
  const p = t % CARRY_LOOP;
  if (p < 0.6) return (p / 0.6) * 0.42;
  if (p < 5) return 0.42;
  if (p < 5.6) return (1 - (p - 5) / 0.6) * 0.42;
  return 0;
}
function carryTravel(t: number) {
  const p = t % CARRY_LOOP;
  const moving = Math.min(Math.max(p - 0.6, 0), 4.4) / 4.4;
  return moving * 1.6 - (p > 8.4 ? ((p - 8.4) / 0.6) * 1.6 : 0);
}
const carrying = (t: number) => {
  const p = t % CARRY_LOOP;
  return p > 0.6 && p < 5;
};
const CARRIERS = new Set<RoleId>(["orange", "red", "blue", "white"]);

// ------------------------------------------------------------------ neck-injury timeline
const SPINE_ROLL = 0.5;
const SCOOP_T = 0.05; // the player lies this much higher once on the scoop
const BASKET_FLOOR = 0.04;
const SCOOP_REST: [number, number] = [0, 2.3]; // below the feet, in line with the player (FIFA)
const SCOOP_SIDE = 0.66; // laid alongside on the player's left, ready to slide in

type SpineState = { roll: number; py: number; scoopX: number; scoopZ: number; scoopY: number; basketZ: number; basketY: number; travel: number };

/** Where the player, scoop and basket are at `s` seconds into a step (and its cue `phase`). */
function spineState(step: number, phase: number, s: number): SpineState {
  const st: SpineState = { roll: 0, py: 0, scoopX: SCOOP_REST[0], scoopZ: SCOOP_REST[1], scoopY: 0, basketZ: 5.6, basketY: 0, travel: 0 };
  if (step === 4) {
    const k = ramp(s, 0.4, 2.6);
    st.scoopX = SCOOP_SIDE * k;
    st.scoopZ = SCOOP_REST[1] + (-0.05 - SCOOP_REST[1]) * k;
  } else if (step === 5) {
    st.scoopX = SCOOP_SIDE;
    st.scoopZ = -0.05;
    if (phase >= 1) {
      st.roll = s < 4.6 ? ramp(s, 0, 1.4) * SPINE_ROLL : (1 - ramp(s, 4.6, 6)) * SPINE_ROLL;
      st.scoopX = SCOOP_SIDE * (1 - ramp(s, 1.6, 3.4));
      st.py = SCOOP_T * ramp(s, 4.6, 6);
    }
  } else if (step >= 6) {
    st.scoopX = 0;
    st.scoopZ = -0.05;
    st.py = SCOOP_T;
    if (step === 7) {
      if (phase === 1) {
        st.scoopY = s < 3 ? ramp(s, 0, 1) * 0.3 : 0.3 - ramp(s, 3, 4) * (0.3 - BASKET_FLOOR);
        st.basketZ = 5.6 + (-0.05 - 5.6) * ramp(s, 1, 3);
      } else if (phase >= 2) {
        st.basketZ = -0.05;
        st.basketY = ramp(s, 0, 0.9) * 0.42;
        st.scoopY = BASKET_FLOOR + st.basketY;
        st.travel = ramp(s, 0.9, 4.1) * 1.4;
      }
      st.py = SCOOP_T + st.scoopY;
    }
  }
  return st;
}

/** How far each piece of kit is on (0–1): trauma mask, collar, the three straps, head blocks, tape. */
function spineGear(step: number, phase: number, s: number) {
  const done6 = step > 6 || (step === 6 && phase >= 2);
  const strap = (i: number) => (step > 6 || (step === 6 && phase >= 1) ? 1 : step === 6 ? ramp(s, 0.3 + i, 1.1 + i) : 0);
  return {
    mask: step > 2 ? 1 : step === 2 ? ramp(s, 0.6, 1.4) : 0,
    collar: step > 4 ? 1 : step === 4 ? ramp(s, 0.3, 2.6) : 0,
    straps: [strap(0), strap(1), strap(2)],
    blocks: done6 ? 1 : step === 6 && phase === 1 ? ramp(s, 0.2, 1.2) : 0,
    tape: done6 ? 1 : step === 6 && phase === 1 ? ramp(s, 1.2, 2.4) : 0,
  };
}

/** Where Green and Black kneel in the neck-injury drill when they leave their PEAP marks. */
function spinePlace(id: RoleId, step: number): [number, number] | null {
  if (id === "green") {
    if (step === 7) return [0.64, -0.42];
    if (step >= 4) return [1.02, 0.02];
  }
  if (id === "black" && step === 7) return [0.64, 0.62];
  return null;
}

// ------------------------------------------------------------------ pose
type Pose = {
  hip: THREE.Vector3;
  lean: number;
  stand: number;
  handL: THREE.Vector3;
  handR: THREE.Vector3;
  look: THREE.Vector3;
  walk: number;
};
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function clonePose(p: Pose): Pose {
  return { ...p, hip: p.hip.clone(), handL: p.handL.clone(), handR: p.handR.clone(), look: p.look.clone() };
}

type PoseCtx = {
  id: RoleId;
  standing: boolean;
  /** where the figure is now (it can move in the neck-injury drill) */
  x: number;
  z: number;
  spotZ: number;
  step: number;
  phase: number;
  /** seconds since the step / cue began */
  s: number;
  t: number;
  selected: boolean;
  scenario: Scenario;
  /** world point → figure space (front = -z, right = +x) */
  L: (x: number, y: number, z: number) => THREE.Vector3;
  /** the camera in figure space */
  cam: THREE.Vector3;
  /** spot the mistake: the planted error being shown (lib/mistakes.ts) */
  fault?: string;
};

const holdPose = (p: Pose, l: THREE.Vector3, r: THREE.Vector3, lean: number, hipZ = -0.06): Pose => ({ ...p, handL: l, handR: r, lean, hip: v(0, 0.62, hipZ) });
const clearPose = (p: Pose): Pose => ({ ...p, lean: 0.06, hip: v(0, 0.64, 0.06), handL: v(-0.3, 1.18, -0.1), handR: v(0.3, 1.18, -0.1) });
/** Arms straight, shoulders over the sternum, the whole body pushing from the hips. */
const pushPose = (p: Pose, chest: THREE.Vector3, c: number): Pose => ({
  ...p,
  hip: v(0, 0.68 - c * 0.035, -0.12),
  lean: 0.94 + c * 0.04,
  handL: chest.clone().add(v(0, 0.045 - c * 0.035, 0)),
  handR: chest.clone().add(v(0, 0.01 - c * 0.035, 0)),
  look: chest,
});

/** The target pose for one role at one moment, in the figure's own space. */
function poseFor(ctx: PoseCtx): Pose {
  const { id, standing, spotZ, step, t, selected, L, cam } = ctx;
  const seed = id.length * 1.7;
  const breathe = Math.sin(t * 1.5 + seed) * 0.015;
  const chest = L(...STERNUM);
  const kneel: Pose = {
    hip: v(0, 0.57, 0.1),
    lean: 0.18 + breathe,
    stand: 0,
    handL: v(-0.15, 0.5, -0.14),
    handR: v(0.15, 0.5, -0.14),
    look: chest.clone().add(v(Math.sin(t * 0.45 + seed) * 0.25, 0, 0)),
    walk: 0,
  };
  const upright: Pose = {
    hip: v(0, 1.0, 0.02),
    lean: 0.05 + breathe,
    stand: 1,
    handL: v(-0.27, 0.9, 0.03),
    handR: v(0.27, 0.9, 0.03),
    look: chest.clone().add(v(Math.sin(t * 0.4 + seed) * 0.4, 0, 0)),
    walk: 0,
  };
  const p = standing ? upright : kneel;
  const wrong = ctx.fault ? faultPose(ctx, kneel, chest) : null;
  if (wrong) return wrong;
  if (ctx.scenario === "spine") return spinePose(ctx, p, upright);
  if (ctx.scenario === "aed") return aedPose(ctx, p, chest);

  const c = compression(step, t);
  const roll = rollAngle(step, t);
  const R = (x: number, y: number, z: number) => L(...rollPoint(x, y, z, roll));
  const hold = (l: THREE.Vector3, r: THREE.Vector3, lean: number, hipZ = -0.06) => holdPose(p, l, r, lean, hipZ);
  const clear = () => clearPose(p);

  // step 6: carriers lift the board and walk with it; Black and Green walk alongside
  if (step === 6) {
    const lift = carryLift(t);
    const walk = carrying(t) ? 1 : 0;
    if (CARRIERS.has(id)) {
      // Orange takes the head end of the board; the others take the near rail level with themselves
      const end = id === "orange";
      const y = 0.12 + lift + 0.03;
      const hl = end ? L(-0.22, y, -1.42) : L(-0.27, y, spotZ - 0.12);
      const hr = end ? L(0.22, y, -1.42) : L(-0.27, y, spotZ + 0.12);
      return { ...p, stand: 0.25 + lift * 1.4, hip: v(0, 0.62 + lift * 0.62, 0.05), lean: 0.55 - lift * 0.4, handL: hl, handR: hr, look: chest, walk };
    }
    if (id === "black") return { ...upright, handR: v(0.22, 1.9, -0.12), look: chest, walk };
    if (id === "green") return { ...upright, handR: v(0.24, 1.55, -0.3), look: chest, walk };
  }

  // the person tapped on Home looks at you and waves
  if (selected && step === 0) {
    const wave = Math.sin(t * 7) * 0.09;
    const top = standing ? 1.95 : 1.32;
    return { ...p, handR: v(0.32 + wave, top, -0.08), look: cam };
  }

  switch (id) {
    case "red":
      if (step === 1) return hold(R(-0.1, 0.3, -1.04), R(-0.08, 0.25, -0.8), 0.78); // forehead + carotid, eyes on the chest
      if (step === 5) return hold(R(0.2, 0.3, -0.72), R(0.2, 0.3, -0.42), 0.82, -0.1); // far shoulder and chest
      if (step >= 2 && step <= 4) {
        if (handsOff(step, t)) return clear();
        return pushPose(p, chest, c);
      }
      return p;
    case "orange": {
      const head = L(0, 0.2, -1.02);
      if (step === 4) {
        const beat = (t * CPR_HZ) % 10 < 0.9 ? 1 : 0; // one squeeze every tenth compression
        return hold(L(-0.03, 0.3, -0.9), L(0.2 - beat * 0.06, 0.34 - beat * 0.05, -1.24), 0.62);
      }
      if (step === 5) return { ...hold(R(-0.17, 0.2, -1.02), R(0.17, 0.2, -1.02), 0.72), look: head };
      if (step === 3 && handsOff(step, t)) return clear();
      return { ...p, look: head.clone().add(v(0, 0, -0.1)) };
    }
    case "green": {
      if (step === 2) return hold(L(1.02, 0.18, -0.6), L(0.98, 0.18, -0.52), 0.55); // AED out and open
      if (step === 3) {
        const q = t % 5;
        if (q < 2.2) return hold(L(0.2, 0.31, -0.42), L(-0.12, 0.37, -0.72), 0.8, -0.1); // pads on
        if (q < 3.8) return { ...clear(), look: L(Math.sin(t * 2.4) * 1.2, 0.8, -0.5) }; // "everyone clear" — scanning the team
        return { ...hold(v(-0.3, 1.15, -0.1), L(1.0, 0.22, -0.6), 0.35), look: L(-0.4, 0.6, -0.6) }; // presses shock
      }
      if (step === 5) return { ...p, look: L(0, 0.3, 0) };
      return p;
    }
    case "blue":
      if (step === 4) return { ...hold(L(-0.33, 0.2, 0.24), L(-0.27, 0.22, 0.3), 0.62), look: L(-0.3, 0.15, 0.27) }; // opens the oxygen: 15 L/min
      if (step === 5) return hold(R(0.18, 0.32, 0.0), R(0.18, 0.3, 0.26), 0.8, -0.08); // far hip and thigh
      if (step === 3 && handsOff(step, t)) return clear();
      return p;
    case "white":
      if (step === 5) return hold(R(0.14, 0.26, 0.66), R(0.12, 0.24, 1.0), 0.8, -0.08); // far knee and ankle
      if (step === 3 && handsOff(step, t)) return clear();
      return p;
    case "black":
      if (step === 1) return { ...upright, handR: v(0.1, 1.62, -0.02), handL: v(-0.2, 1.0, 0.02), look: L(0, 0.5, -0.4) }; // ambulance on the radio
      if (step === 3) {
        const toGreen = L(0.7, 0, -1.14).setY(0).setLength(0.6);
        return { ...upright, handR: v(0.22, 1.38, 0).add(toGreen), look: L(0.7, 0.6, -1.14) }; // points to Green
      }
      if (step === 5) return { ...upright, handR: v(0.26, 1.34, -0.28), look: L(0, 0.4, -1.4) };
      return upright;
  }
  return p;
}

/** Spot the mistake: where a figure kneels when the planted error moves it off its PEAP mark. */
function faultPlace(fault: string | undefined, id: RoleId, scenario: Scenario, step: number): [number, number] | null {
  if (!fault || scenario !== "arrest") return null;
  if (fault === "orange-side" && id === "orange" && step === 4) return [-0.52, -1.16];
  if (fault === "black-hands-on" && id === "black" && step === 2) return [0.6, -0.34];
  if (fault === "green-right" && id === "green" && step === 3) return [-0.6, -1.12];
  return null;
}

/** Spot the mistake: the pose that shows the planted error, or null where the figure acts as usual. */
function faultPose(ctx: PoseCtx, kneel: Pose, chest: THREE.Vector3): Pose | null {
  const { fault, id, step, t, L, scenario } = ctx;
  const hold = (l: THREE.Vector3, r: THREE.Vector3, lean: number, hipZ = -0.06) => holdPose(kneel, l, r, lean, hipZ);
  if (scenario === "arrest") {
    if (fault === "pads-pause" && id === "red" && step === 3 && t % 5 < 2.2) return clearPose(kneel); // sits back while the pads go on
    if (fault === "touch-shock" && id === "blue" && step === 3 && handsOff(step, t)) return { ...hold(L(-0.22, 0.2, 0.05), L(-0.2, 0.2, 0.28), 0.78), look: L(-0.2, 0.2, 0.15) };
    if (fault === "black-hands-on" && id === "black" && step === 2) return { ...hold(L(0.22, 0.34, -0.62), L(0.2, 0.32, -0.38), 0.72), look: chest };
    if (fault === "white-reach" && id === "white" && step === 4) return { ...hold(L(-0.1, 0.36, -0.52), L(-0.04, 0.34, -0.66), 0.98, -0.16), look: chest };
  }
  if (scenario === "spine" && fault === "orange-release" && id === "orange" && step === 4) return { ...kneel, look: L(0, 0.3, -0.8) }; // hands off the head
  return null;
}

/** Red's compressions stop in the "pads-pause" mistake while the pads go on. */
const compressionWith = (fault: string | undefined, step: number, t: number) => (fault === "pads-pause" && step === 3 && t % 5 < 2.2 ? 0 : compression(step, t));

/** Neck injury: MILS from directly behind the head, A-c-B-C-D-E, collar, roll onto the scoop, straps, basket. */
function spinePose(ctx: PoseCtx, p: Pose, upright: Pose): Pose {
  const { id, step, phase, s, t, L } = ctx;
  const st = spineState(step, phase, s);
  // a point on the player: follows the roll, the lift onto the scoop and into the basket, and the carry
  const R = (x: number, y: number, z: number) => {
    const [rx, ry, rz] = rollPoint(x, y, z, st.roll);
    return L(rx, ry + st.py, rz + st.travel);
  };
  const hold = (l: THREE.Vector3, r: THREE.Vector3, lean: number, hipZ = -0.06) => holdPose(p, l, r, lean, hipZ);
  const head = R(0, 0.2, -1.02);
  const chestPt = R(0, 0.34, -0.55);
  const mils = (): Pose => ({ ...hold(R(-0.17, 0.2, -1.02), R(0.17, 0.2, -1.02), 0.72), look: head });
  /** a strap pulled across the body at `z`, between `a` and `b` seconds */
  const strap = (z: number, y: number, a: number, b: number): Pose => {
    const k = ramp(s, a, b);
    const x = -0.26 + k * 0.52;
    return { ...hold(R(-0.26, y, z - 0.03), R(x, y + 0.02, z + 0.03), 0.8), look: R(x, y, z) };
  };

  // step 7: everyone on the scoop rails, then the basket rim — kneel, then stand with it on Black's count
  if (step === 7) {
    const inBasket = phase >= 2;
    const railX = inBasket ? 0.36 : 0.24;
    const railY = inBasket ? 0.17 + st.basketY : 0.055 + st.scoopY;
    const up = inBasket ? st.basketY : st.scoopY * 0.4;
    const walk = inBasket && s > 0.9 && s < 4.1 ? 1 : 0;
    const body = { stand: 0.12 + up * 1.7, hip: v(0, 0.6 + up * 0.75, 0.05), lean: 0.62 - up * 0.6, walk };
    if (id === "orange") {
      const endZ = (inBasket ? -1.1 : -1.0) + st.travel;
      return { ...p, ...body, handL: L(-0.2, railY, endZ), handR: L(0.2, railY, endZ), look: head };
    }
    const side = ctx.x > 0 ? 1 : -1;
    const z = ctx.z;
    // hands either side of the figure's own position; a left-side figure's right hand is towards the head
    const [za, zb] = side > 0 ? [z + 0.13, z - 0.13] : [z - 0.13, z + 0.13];
    return { ...p, ...body, handL: L(side * railX, railY, za), handR: L(side * railX, railY, zb), look: L(0, 0.3, z) };
  }

  switch (id) {
    case "orange":
      if (step === 1) return phase >= 1 ? mils() : { ...hold(R(-0.21, 0.33, -1.15), R(0.21, 0.33, -1.15), 0.6), look: head };
      if (step === 2) return { ...hold(R(-0.12, 0.17, -0.92), R(0.12, 0.17, -0.92), 0.78), look: head }; // jaw thrust
      if (step === 6 && phase >= 2) return { ...p, look: head }; // blocks and tape on: hands off
      return mils();
    case "red":
      if (step === 1) return phase >= 1 ? { ...hold(R(-0.24, 0.3, -0.7), R(-0.1, 0.34, -0.62), 0.5), look: head } : { ...p, look: head };
      if (step === 2) {
        if (s < 2.2) return { ...hold(R(-0.06, 0.31, -0.98), R(-0.14, 0.36, -0.62), 0.82), look: head }; // trauma mask on
        return { ...hold(R(-0.17, 0.35, -0.6), R(0.15, 0.36, -0.6), 0.78), look: chestPt }; // feels the chest rise
      }
      if (step === 3) {
        // Hands On 1, 2, 3: two hands on three places, then pulse, pupils and the neck
        if (s < 1.2) return { ...hold(R(-0.13, 0.36, -0.7), R(0.13, 0.36, -0.7), 0.8), look: chestPt };
        if (s < 2.4) return { ...hold(R(-0.18, 0.34, -0.5), R(0.18, 0.34, -0.5), 0.8), look: chestPt };
        if (s < 3.6) return { ...hold(R(-0.15, 0.3, -0.3), R(0.15, 0.3, -0.3), 0.8), look: chestPt };
        if (s < 5) return { ...hold(L(-0.34, 0.14 + st.py, -0.16), L(-0.35, 0.13 + st.py, -0.06), 0.66), look: L(-0.34, 0.1, -0.08) }; // radial pulse
        if (s < 6.2) return { ...hold(R(-0.05, 0.33, -1.0), R(-0.12, 0.34, -0.9), 0.86), look: head }; // pupils
        return { ...hold(R(-0.03, 0.22, -0.8), R(-0.2, 0.3, -0.66), 0.82), look: R(0, 0.2, -0.8) }; // midline of the neck
      }
      if (step === 4) {
        if (s < 2.6) return { ...hold(R(-0.11, 0.26, -0.84), R(0.1, 0.26, -0.8), 0.86), look: R(0, 0.2, -0.8) }; // collar round the neck
        return { ...hold(R(-0.04, 0.31, -0.97), R(-0.12, 0.28, -0.84), 0.82), look: head }; // mouth still opens
      }
      if (step === 5) return { ...hold(R(0.2, 0.3, -0.72), R(0.2, 0.28, -0.05), 0.82, -0.1), look: chestPt }; // far shoulder and hip
      if (step === 6) {
        if (phase === 0) return s < 1.4 ? strap(-0.5, 0.42, 0.3, 1.3) : { ...hold(R(-0.15, 0.4, -0.5), R(0.12, 0.4, -0.5), 0.72), look: chestPt };
        if (phase === 1) {
          if (s < 1.2) return { ...hold(R(-0.21, 0.22, -1.0), R(0.2, 0.24, -1.0), 0.9), look: head }; // head blocks
          const k = ramp(s, 1.2, 2.4);
          return { ...hold(R(-0.18, 0.34, -1.06), R(-0.18 + k * 0.36, 0.35, -1.06), 0.88), look: head }; // tape
        }
        return { ...hold(R(-0.14, 0.38, -0.6), R(0.13, 0.38, -0.6), 0.74), look: head }; // reassess
      }
      return p;
    case "blue":
      if (step === 2 && s > 3.4 && s < 6.6) return { ...hold(L(-0.33, 0.2, 0.24), L(-0.27, 0.22, 0.3), 0.62), look: L(-0.3, 0.15, 0.27) }; // oxygen 15 L/min
      if (step === 5) return { ...hold(R(0.18, 0.3, 0.05), R(0.14, 0.2, 0.55), 0.8, -0.08), look: R(0, 0.2, 0.2) }; // far waist, under the knee
      if (step === 6 && phase === 0) return s > 1.2 && s < 2.5 ? strap(0.08, 0.38, 1.3, 2.3) : p;
      return p;
    case "white":
      if (step === 5) return { ...hold(R(0.12, 0.24, 0.72), R(0.12, 0.2, 1.0), 0.8, -0.08), look: R(0, 0.2, 0.85) }; // under the lower leg and ankle
      if (step === 6 && phase === 0) return s > 2.2 && s < 3.5 ? strap(0.75, 0.22, 2.3, 3.3) : p;
      return p;
    case "green": {
      if (step === 2 && s < 2.2) return { ...hold(L(1.12, 0.3, -1.42), L(1.0, 0.28, -1.36), 0.6), look: L(1.3, 0.2, -1.6) }; // trauma mask out of the bag
      // on the player's left with the scoop: hands on its far rail, pushing it under on the roll
      const railX = st.scoopX + 0.24;
      const rail = (lean: number) => ({ ...hold(L(railX, 0.07, -0.16), L(railX, 0.07, 0.2), lean), look: L(st.scoopX, 0.1, 0) });
      if (step === 4) return st.scoopZ < 0.7 ? rail(0.55) : p;
      if (step === 5) return rail(phase >= 1 && s > 1.4 && s < 3.6 ? 0.85 : 0.6);
      if (step === 6 && phase === 0) {
        const z = s < 1.3 ? -0.5 : s < 2.3 ? 0.08 : 0.75; // holds each strap end on the far side
        return { ...hold(R(0.3, 0.32, z - 0.05), R(0.3, 0.32, z + 0.05), 0.75), look: R(0.2, 0.3, z) };
      }
      return p;
    }
    case "black":
      if (step === 1) {
        if (phase === 0) {
          const toHead = L(0, 0, -1.6).setY(0).setLength(0.6);
          return { ...upright, handR: v(0.22, 1.38, 0).add(toHead), look: L(0, 0.6, -1.4) }; // "Orange, hold the head"
        }
        return { ...upright, handR: v(0.1, 1.62, -0.02), handL: v(-0.2, 1.0, 0.02), look: L(0, 0.5, -0.4) }; // ambulance on the radio
      }
      if (step === 5) return { ...upright, look: L(0, 0.4, -1.4) };
      return { ...upright, look: L(0, 0.4, -0.5 + Math.sin(t * 0.4) * 0.4) };
  }
  return p;
}

/** The AED trainer: compressions while the pads go on, hands off for analysis, everyone clear for the shock. */
function aedPose(ctx: PoseCtx, p: Pose, chest: THREE.Vector3): Pose {
  const { id, step, t, L } = ctx;
  if (id === "red") {
    if (step === 2 || step === 4) return clearPose(p);
    return pushPose(p, chest, step === 3 ? 0 : Math.abs(Math.sin(t * Math.PI * CPR_HZ))); // step 3: hands still on the chest
  }
  if (id === "orange") {
    if (step === 2 || step === 4) return clearPose(p);
    const beat = step !== 3 && (t * CPR_HZ) % 10 < 0.9 ? 1 : 0;
    return holdPose(p, L(-0.03, 0.3, -0.9), L(0.2 - beat * 0.06, 0.34 - beat * 0.05, -1.24), 0.62);
  }
  return p;
}

// ------------------------------------------------------------------ shared geometry
const GEO = {
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  sphere: new THREE.SphereGeometry(1, 18, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  torso: new THREE.CapsuleGeometry(0.17, 0.3, 8, 16),
  band: new THREE.CylinderGeometry(1, 1, 1, 20, 1, true),
};
const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpW = new THREE.Vector3();

/** Stretch a unit cylinder between two points. */
function segment(m: THREE.Mesh | null, a: THREE.Vector3, b: THREE.Vector3, r: number) {
  if (!m) return;
  tmpA.subVectors(b, a);
  const len = Math.max(tmpA.length(), 0.001);
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.scale.set(r, len, r);
  m.quaternion.setFromUnitVectors(UP, tmpA.divideScalar(len));
}

/** Two-bone IK: elbow (or knee) position for a limb from `a` reaching `target`, bending towards `pole`. */
function ik(a: THREE.Vector3, target: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3, out: THREE.Vector3, hand: THREE.Vector3) {
  const d = tmpB.subVectors(target, a);
  const dist = Math.min(Math.max(d.length(), 0.05), l1 + l2 - 0.002);
  const dir = d.normalize();
  hand.copy(a).addScaledVector(dir, dist);
  const cos = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const bend = tmpW.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  out.copy(a).addScaledVector(dir, l1 * cos).addScaledVector(bend, l1 * sin);
}

/** Turn by the shortest way round. */
function angleLerp(a: number, b: number, k: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

// ------------------------------------------------------------------ a team member
const UPPER = 0.36;
const FORE = 0.34;

export function Figure({
  spot,
  selected,
  dim,
  step,
  phase = 0,
  scenario = "arrest",
  acting = false,
  fault,
  onSelect,
}: {
  spot: Spot;
  selected: boolean;
  dim: boolean;
  step: number;
  phase?: number;
  scenario?: Scenario;
  acting?: boolean;
  fault?: string;
  onSelect?: (id: RoleId) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const m = useRef<Record<string, THREE.Mesh | null>>({});
  const cur = useRef<Pose | null>(null);
  const place = useRef({ x: spot.x, z: spot.z, face: spot.face });
  const since = useSince(step, phase);
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: SKIN[spot.id], roughness: 0.7, transparent: true }),
      hair: new THREE.MeshStandardMaterial({ color: HAIR[spot.id], roughness: 0.9, transparent: true }),
      top: new THREE.MeshStandardMaterial({ color: TOP, roughness: 0.85, transparent: true }),
      vest: new THREE.MeshStandardMaterial({ color: spot.color, roughness: 0.55, transparent: true }),
      band: new THREE.MeshStandardMaterial({ color: "#d9dee5", roughness: 0.3, metalness: 0.2, emissive: "#3a3f46", transparent: true }),
      legs: new THREE.MeshStandardMaterial({ color: TROUSERS, roughness: 0.9, transparent: true }),
      shoe: new THREE.MeshStandardMaterial({ color: SHOE, roughness: 0.6, transparent: true }),
    }),
    [spot.id, spot.color],
  );
  useEffect(() => {
    for (const mat of Object.values(mats)) mat.opacity = dim ? 0.3 : 1;
  }, [dim, mats]);

  const set = (k: string) => (el: THREE.Mesh | null) => {
    m.current[k] = el;
  };

  const shoulder = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const elbow = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const hand = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const hipJ = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const knee = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const foot = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const headPos = useMemo(() => new THREE.Vector3(), []);
  const lookW = useMemo(() => new THREE.Vector3(), []);
  const camL = useMemo(() => new THREE.Vector3(), []);
  const pole = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }, dt) => {
    const g = root.current;
    const tg = torso.current;
    const hg = head.current;
    if (!g || !tg || !hg) return;
    const t = clock.elapsedTime;
    const s = since(t);

    // where the figure kneels: its PEAP mark, or (neck injury) where the job takes it
    const pl = place.current;
    const moveTo = faultPlace(fault, spot.id, scenario, step) ?? (scenario === "spine" ? spinePlace(spot.id, step) : null);
    const [tx, tz] = moveTo ?? [spot.x, spot.z];
    const away = Math.hypot(tx - pl.x, tz - pl.z);
    const km = 1 - Math.exp(-dt * 2.6);
    pl.x += (tx - pl.x) * km;
    pl.z += (tz - pl.z) * km;
    pl.face = angleLerp(pl.face, moveTo ? facing(tx, tz, 0, tz) : spot.face, 1 - Math.exp(-dt * 5));

    let travel = 0;
    if (scenario === "arrest") {
      const moving = step === 6 && (CARRIERS.has(spot.id) || spot.id === "black" || spot.id === "green");
      travel = moving ? carryTravel(t) : 0;
    } else if (scenario === "spine" && step === 7) {
      travel = spineState(step, phase, s).travel;
    }
    g.position.set(pl.x, 0, pl.z + travel);
    g.rotation.y = pl.face;
    g.updateMatrixWorld();

    const cf = Math.cos(pl.face);
    const sf = Math.sin(pl.face);
    const L = (x: number, y: number, z: number) => {
      const dx = x - pl.x;
      const dz = z - (pl.z + travel);
      return new THREE.Vector3(dx * cf - dz * sf, y, dx * sf + dz * cf);
    };
    camL.copy(L(camera.position.x, camera.position.y, camera.position.z));
    // world targets that move with the board in the arrest drill's step 6
    const Lw = (x: number, y: number, z: number) => L(x, y, z + (step === 6 ? carryTravel(t) : 0));
    const target = poseFor({
      id: spot.id,
      standing: Boolean(spot.stand),
      x: pl.x,
      z: pl.z + travel,
      spotZ: spot.z,
      step,
      phase,
      s,
      t,
      selected,
      scenario,
      L: scenario === "arrest" && step === 6 ? Lw : L,
      cam: camL,
      fault,
    });
    if (away > 0.06) target.walk = 1; // walking over to a new place

    // blend towards the target pose, so changes of step look like movement, not jumps
    if (!cur.current) cur.current = clonePose(target);
    const p = cur.current;
    const fast = scenario === "aed" ? aedCompressing(step) : scenario === "arrest" && (step === 2 || step === 4);
    const k = 1 - Math.exp(-dt * (fast ? 14 : 6));
    p.hip.lerp(target.hip, k);
    p.lean += (target.lean - p.lean) * k;
    p.stand += (target.stand - p.stand) * k;
    p.handL.lerp(target.handL, k);
    p.handR.lerp(target.handR, k);
    p.look.lerp(target.look, 1 - Math.exp(-dt * 4));
    p.walk += (target.walk - p.walk) * k;

    // torso: pivots at the hips and leans forward
    tg.position.copy(p.hip);
    tg.rotation.set(-p.lean, 0, 0);
    tg.updateMatrix();
    shoulder[0].set(-0.2, 0.58, 0).applyMatrix4(tg.matrix);
    shoulder[1].set(0.2, 0.58, 0).applyMatrix4(tg.matrix);
    headPos.set(0, 0.8, 0).applyMatrix4(tg.matrix);
    hg.position.copy(headPos);
    lookW.copy(p.look);
    g.localToWorld(lookW);
    hg.lookAt(lookW);

    // arms: elbows bend out and back
    const targets = [p.handL, p.handR];
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      ik(shoulder[i], targets[i], UPPER, FORE, pole.set(side * 0.7, -0.5, 0.6).normalize(), elbow[i], hand[i]);
      segment(m.current[`ua${i}`], shoulder[i], elbow[i], 0.058);
      segment(m.current[`fa${i}`], elbow[i], hand[i], 0.048);
      m.current[`el${i}`]?.position.copy(elbow[i]);
      m.current[`sh${i}`]?.position.copy(shoulder[i]);
      m.current[`hd${i}`]?.position.copy(hand[i]);
    }

    // legs: kneeling (shins flat behind) blends to standing; a small step when walking
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const stride = p.walk * Math.sin(t * 8 + i * Math.PI) * 0.14;
      hipJ[i].set(side * 0.1, p.hip.y - 0.04, p.hip.z);
      knee[i].set(side * 0.11, 0.07 + p.stand * 0.43, -0.08 + p.stand * 0.04 + stride);
      foot[i].set(side * 0.11, 0.05, 0.42 - p.stand * 0.42 + stride * 1.3);
      segment(m.current[`th${i}`], hipJ[i], knee[i], 0.085);
      segment(m.current[`sn${i}`], knee[i], foot[i], 0.068);
      m.current[`kn${i}`]?.position.copy(knee[i]);
      const shoe = m.current[`so${i}`];
      if (shoe) shoe.position.set(foot[i].x, 0.045, foot[i].z + 0.06 - p.stand * 0.12);
    }
    const pel = m.current.pelvis;
    if (pel) pel.position.set(0, p.hip.y - 0.02, p.hip.z);

    // selection ring and a gentle pulse
    if (ring.current) {
      ring.current.rotation.z = t * 0.8;
      (ring.current.material as THREE.MeshBasicMaterial).opacity = selected ? 0.95 : acting ? 0.5 + Math.sin(t * 4) * 0.25 : 0;
    }
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!onSelect) return;
    e.stopPropagation();
    onSelect(spot.id);
  };

  return (
    <group ref={root}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.5, 0.6, 48]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group
        onClick={click}
        onPointerOver={() => (document.body.style.cursor = onSelect ? "pointer" : "")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {/* torso in a dark training top, the role bib over it with a reflective band */}
        <group ref={torso} rotation-order="YXZ" matrixAutoUpdate>
          <mesh geometry={GEO.torso} material={mats.vest} position={[0, 0.34, 0]} scale={[1.18, 1, 0.82]} castShadow />
          <mesh geometry={GEO.band} material={mats.band} position={[0, 0.25, 0]} scale={[0.203, 0.04, 0.142]} />
          <mesh geometry={GEO.sphere} material={mats.top} position={[0, 0.6, 0]} scale={[0.1, 0.05, 0.09]} />
          <mesh geometry={GEO.cyl} material={mats.skin} position={[0, 0.67, 0]} scale={[0.055, 0.12, 0.055]} />
        </group>
        <group ref={head}>
          <mesh geometry={GEO.sphere} material={mats.skin} scale={[0.125, 0.14, 0.13]} castShadow />
          <mesh geometry={GEO.sphere} material={mats.hair} position={[0, 0.03, -0.02]} scale={[0.131, 0.122, 0.127]} />
          <mesh geometry={GEO.box} material={mats.skin} position={[0, -0.01, 0.12]} scale={[0.03, 0.045, 0.04]} />
        </group>
        <mesh ref={set("pelvis")} geometry={GEO.sphere} material={mats.legs} scale={[0.17, 0.1, 0.12]} castShadow />
        {[0, 1].map((i) => (
          <group key={i}>
            <mesh ref={set(`sh${i}`)} geometry={GEO.sphere} material={mats.vest} scale={0.072} />
            <mesh ref={set(`ua${i}`)} geometry={GEO.cyl} material={mats.top} castShadow />
            <mesh ref={set(`el${i}`)} geometry={GEO.sphere} material={mats.top} scale={0.054} />
            <mesh ref={set(`fa${i}`)} geometry={GEO.cyl} material={mats.top} castShadow />
            <mesh ref={set(`hd${i}`)} geometry={GEO.sphere} material={mats.skin} scale={[0.05, 0.042, 0.065]} />
            <mesh ref={set(`th${i}`)} geometry={GEO.cyl} material={mats.legs} castShadow />
            <mesh ref={set(`kn${i}`)} geometry={GEO.sphere} material={mats.legs} scale={0.082} />
            <mesh ref={set(`sn${i}`)} geometry={GEO.cyl} material={mats.legs} castShadow />
            <mesh ref={set(`so${i}`)} geometry={GEO.sphere} material={mats.shoe} scale={[0.055, 0.045, 0.12]} castShadow />
          </group>
        ))}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ the player
/**
 * The player on the back. `chest` and `body` slot extra pieces onto the chest (which gives with each
 * compression) and onto the body (which rolls and lifts with the player).
 */
export function Player({
  step,
  phase = 0,
  scenario = "arrest",
  shirt,
  chest: chestExtra,
  body: bodyExtra,
  shockAt,
  onTap,
  fault,
}: {
  step: number;
  phase?: number;
  scenario?: Scenario;
  /** spot the mistake: the planted error being shown */
  fault?: string;
  /** AED trainer: the shirt fades away once the chest is exposed */
  shirt?: "on" | "off";
  chest?: ReactNode;
  body?: ReactNode;
  /** AED trainer: performance.now() of the last shock, for the jolt */
  shockAt?: number;
  onTap?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const g = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const shirtMat = useRef<THREE.MeshStandardMaterial>(null);
  const panelMat = useRef<THREE.MeshStandardMaterial>(null);
  const since = useSince(step, phase);
  const trainer = scenario === "aed";
  useFrame(({ clock }, dt) => {
    const grp = g.current;
    if (!grp) return;
    const t = clock.elapsedTime;
    if (scenario === "spine") {
      const st = spineState(step, phase, since(t));
      const k = 1 - Math.exp(-dt * 8);
      grp.position.y += (PLAYER_Y + st.py - grp.position.y) * k;
      grp.position.z += (st.travel - grp.position.z) * k;
      grp.rotation.z += (st.roll - grp.rotation.z) * k;
      if (chest.current) chest.current.scale.y = 1;
      return;
    }
    if (trainer) {
      const jolt = shockAt && performance.now() - shockAt < 160 ? 0.05 : 0;
      grp.position.y = PLAYER_Y + jolt;
      const c = aedCompressing(step) ? Math.abs(Math.sin(t * Math.PI * CPR_HZ)) : 0;
      if (chest.current) chest.current.scale.y = 1 - c * 0.16;
      // the shirt is cut away once the chest is exposed
      const want = shirt === "off" ? 0 : 1;
      for (const mat of [shirtMat.current, panelMat.current]) {
        if (!mat) continue;
        mat.opacity += (want - mat.opacity) * (1 - Math.exp(-dt * 6));
        mat.visible = mat.opacity > 0.02;
      }
      return;
    }
    const c = compressionWith(fault, step, t);
    const shock = step === 3 && t % 5 > 4.72 ? 0.05 : 0;
    grp.position.y = PLAYER_Y + shock + (step === 6 ? carryLift(t) : 0);
    grp.position.z = step === 6 ? carryTravel(t) : 0;
    grp.rotation.z = rollAngle(step, t);
    if (chest.current) chest.current.scale.y = 1 - c * 0.16;
  });
  return (
    <group ref={g} position={[0, PLAYER_Y, 0]} onClick={onTap}>
      <group ref={chest} position={[0, 0, -0.42]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.28, 1, 0.95]} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 6, 16]} />
          <meshStandardMaterial color={trainer ? PLAYER_SKIN : KIT} roughness={trainer ? 0.7 : 0.65} />
        </mesh>
        {trainer ? (
          // the shirt over the bare chest, so it can be cut away
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.31, 1.01, 0.98]}>
            <capsuleGeometry args={[0.2, 0.42, 6, 16]} />
            <meshStandardMaterial ref={shirtMat} color={KIT} roughness={0.65} transparent />
          </mesh>
        ) : null}
        {/* shirt number panel: plain, no text */}
        <mesh position={[0, trainer ? 0.196 : 0.19, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 0.2]} />
          <meshStandardMaterial ref={panelMat} color="#e9e4f2" roughness={0.6} transparent={trainer} />
        </mesh>
        {chestExtra}
      </group>
      <mesh position={[0, -0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1, 0.9]} castShadow>
        <capsuleGeometry args={[0.19, 0.12, 6, 14]} />
        <meshStandardMaterial color="#14161c" roughness={0.8} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.04, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.075, 0.4, 12]} />
            <meshStandardMaterial color={PLAYER_SKIN} roughness={0.7} />
          </mesh>
          <mesh position={[x, -0.05, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.058, 0.44, 12]} />
            <meshStandardMaterial color={KIT} roughness={0.75} />
          </mesh>
          <mesh position={[x, 0.0, 1.06]} castShadow>
            <boxGeometry args={[0.1, 0.16, 0.12]} />
            <meshStandardMaterial color="#0d0d10" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {[-0.31, 0.31].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.03, -0.52]} rotation={[Math.PI / 2, 0, x > 0 ? -0.1 : 0.1]} castShadow>
            <cylinderGeometry args={[0.062, 0.055, 0.3, 10]} />
            <meshStandardMaterial color={KIT} roughness={0.65} />
          </mesh>
          <mesh position={[x * 1.08, -0.05, -0.22]} rotation={[Math.PI / 2, 0, x > 0 ? -0.06 : 0.06]} castShadow>
            <cylinderGeometry args={[0.05, 0.044, 0.3, 10]} />
            <meshStandardMaterial color={PLAYER_SKIN} roughness={0.7} />
          </mesh>
          <mesh position={[x * 1.1, -0.06, -0.04]} scale={[0.05, 0.035, 0.065]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={PLAYER_SKIN} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.0, -0.79]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.065, 0.12, 10]} />
        <meshStandardMaterial color={PLAYER_SKIN} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, -1.0]} scale={[0.13, 0.13, 0.145]} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color={PLAYER_SKIN} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.02, -1.03]} scale={[0.135, 0.12, 0.14]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#1a120d" roughness={0.9} />
      </mesh>
      {scenario === "spine" ? <SpineGear step={step} phase={phase} fault={fault} /> : null}
      {bodyExtra}
    </group>
  );
}

/** Scale a piece of kit in as it goes on; hidden while off. */
function showGear(o: THREE.Object3D | null, k: number, from = 0.7) {
  if (!o) return;
  o.visible = k > 0.01;
  o.scale.setScalar(from + (1 - from) * k);
}

/** Neck injury, on the player: trauma mask, collar, straps, head blocks and tape. */
function SpineGear({ step, phase, fault }: { step: number; phase: number; fault?: string }) {
  const mask = useRef<THREE.Group>(null);
  const collar = useRef<THREE.Group>(null);
  const straps = useRef<(THREE.Group | null)[]>([]);
  const blocks = useRef<THREE.Group>(null);
  const tape = useRef<THREE.Group>(null);
  const since = useSince(step, phase);
  useFrame(({ clock }) => {
    const gear = spineGear(step, phase, since(clock.elapsedTime));
    if (fault === "no-straps") gear.straps = [0, 0, 0]; // the planted mistake: lifted unstrapped
    showGear(mask.current, gear.mask);
    showGear(collar.current, gear.collar, 0.55);
    showGear(blocks.current, gear.blocks, 0.4);
    const tp = tape.current;
    if (tp) {
      tp.visible = gear.tape > 0.01;
      tp.scale.set(Math.max(gear.tape, 0.001), 1, 1);
    }
    gear.straps.forEach((k, i) => {
      const o = straps.current[i];
      if (!o) return;
      o.visible = k > 0.01;
      // pulled across from the player's right (the side the team kneels) to the left
      o.scale.set(Math.max(k, 0.001), 1, 1);
      o.position.x = -0.3 * (1 - k);
    });
  });
  const STRAPS: [number, number][] = [
    [-0.5, 0.205],
    [0.08, 0.17],
    [0.75, 0.035],
  ];
  return (
    <group>
      {/* trauma mask over the mouth and nose */}
      <group ref={mask} position={[0, 0.15, -0.985]} visible={false}>
        <mesh scale={[0.062, 0.034, 0.072]}>
          <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a9e2bd" roughness={0.25} transparent opacity={0.78} />
        </mesh>
      </group>
      {/* extrication collar: firm band round the neck with the dark chin support on top */}
      <group ref={collar} position={[0, 0.0, -0.8]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.088, 0.12, 0.082]}>
          <cylinderGeometry args={[1, 1, 1, 20, 1, true]} />
          <meshStandardMaterial color="#ece6d6" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.078, -0.04]} scale={[0.12, 0.024, 0.07]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2b2f36" roughness={0.6} />
        </mesh>
      </group>
      {/* straps over chest, pelvis and legs */}
      {STRAPS.map(([z, y], i) => (
        <group
          key={z}
          ref={(el) => {
            straps.current[i] = el;
          }}
          position={[0, y, z]}
          visible={false}
        >
          <mesh scale={[0.62, 0.012, 0.065]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#1b1d22" roughness={0.7} />
          </mesh>
          <mesh position={[0.1, 0.008, 0]} scale={[0.05, 0.012, 0.075]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#9aa3ad" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* head blocks either side of the head, then tape across the forehead and the chin piece */}
      <group ref={blocks} position={[0, 0.03, -1.0]} visible={false}>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 0, 0]} scale={[0.065, 0.16, 0.2]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cfd6de" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group ref={tape} visible={false}>
        <mesh position={[0, 0.158, -1.07]} scale={[0.4, 0.008, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2b2f36" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.105, -0.87]} scale={[0.4, 0.008, 0.03]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2b2f36" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ equipment
function Kit({ step }: { step: number }) {
  const aed = useRef<THREE.MeshStandardMaterial>(null);
  const cyl = useRef<THREE.MeshStandardMaterial>(null);
  const bag = useRef<THREE.Group>(null);
  const tube = useRef<THREE.Mesh>(null);
  const pads = useRef<THREE.Group>(null);
  const scoop = useRef<THREE.Group>(null);
  const flash = useRef<THREE.PointLight>(null);
  const tubeGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([v(-0.3, 0.12, 0.2), v(-0.34, 0.11, -0.3), v(-0.3, 0.13, -0.9), v(-0.08, 0.24, -1.3), v(0.12, 0.3, -1.3)]),
        40,
        0.012,
        6,
      ),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const shock = step === 3 && t % 5 > 4.7;
    if (aed.current) aed.current.emissiveIntensity = step === 3 ? (shock ? 2.6 : 0.4 + Math.sin(t * 6) * 0.3) : 0.05;
    if (flash.current) flash.current.intensity = shock ? 16 : 0;
    if (cyl.current) cyl.current.emissiveIntensity = step === 4 ? 0.5 + Math.sin(t * 3) * 0.3 : 0.03;
    if (bag.current) {
      const beat = (t * CPR_HZ) % 10 < 0.9;
      bag.current.scale.set(1, step === 4 && beat ? 0.7 : 1, 1);
      bag.current.visible = step >= 4 && step < 6;
    }
    if (tube.current) tube.current.visible = step >= 4 && step < 6;
    if (pads.current) pads.current.visible = step >= 3 && step < 6 && !(step === 3 && t % 5 < 1.2);
    if (scoop.current) {
      // step 6: the board is under the player and moves with the carry
      if (step === 6) scoop.current.position.z = carryTravel(t) - 0.05;
      else scoop.current.position.z += ((step === 5 ? 1.9 : 3.3) - scoop.current.position.z) * 0.06;
      scoop.current.position.y = step === 6 ? 0.03 + carryLift(t) : 0.03;
    }
  });
  return (
    <group>
      {/* emergency bag at the head, the AED open beside Green */}
      <mesh position={[1.3, 0.16, -1.6]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.62, 0.32, 0.42]} />
        <meshStandardMaterial color="#22406e" roughness={0.75} />
      </mesh>
      <group position={[1.02, 0, -0.6]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.34, 0.16, 0.28]} />
          <meshStandardMaterial ref={aed} color="#F2C811" emissive="#FFD34D" emissiveIntensity={0.05} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.22, -0.14]} rotation={[-0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.26, 0.03]} />
          <meshStandardMaterial color="#d6ad10" roughness={0.5} />
        </mesh>
      </group>
      {/* AED pads on the chest: below the right collarbone, and on the left side */}
      <group ref={pads}>
        <mesh position={[-0.12, 0.375, -0.72]} rotation={[-Math.PI / 2, 0, 0.3]}>
          <planeGeometry args={[0.12, 0.16]} />
          <meshStandardMaterial color="#f4f4f1" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.24, 0.31, -0.42]} rotation={[-Math.PI / 2, 0.7, 0]}>
          <planeGeometry args={[0.12, 0.16]} />
          <meshStandardMaterial color="#f4f4f1" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <pointLight ref={flash} position={[0.3, 0.9, -0.5]} color="#FFF3B0" intensity={0} distance={7} />
      {/* bag valve at the head, oxygen tubing back to the cylinder */}
      <group ref={bag} position={[0.2, 0.3, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <mesh scale={[0.09, 0.15, 0.09]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#cfe6ee" roughness={0.3} transparent opacity={0.85} />
        </mesh>
      </group>
      <mesh ref={tube} geometry={tubeGeo}>
        <meshStandardMaterial color="#d6ecf3" roughness={0.3} transparent opacity={0.9} />
      </mesh>
      <Cylinder glow={cyl} />
      {/* scoop below the feet, basket beyond it */}
      <group ref={scoop} position={[0, 0.03, 3.3]}>
        {[-0.24, 0.24].map((sx) => (
          <mesh key={sx} position={[sx, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.05, 1.9]} />
            <meshStandardMaterial color="#F2C811" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.09, 5.6]} castShadow>
        <boxGeometry args={[0.72, 0.16, 2.1]} />
        <meshStandardMaterial color="#E36B12" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** The oxygen cylinder beside Blue. */
function Cylinder({ glow }: { glow?: React.RefObject<THREE.MeshStandardMaterial | null> }) {
  return (
    <group>
      <mesh position={[-0.3, 0.1, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.62, 18]} />
        <meshStandardMaterial ref={glow} color="#f2f2f2" emissive="#9AD0FF" emissiveIntensity={0.03} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[-0.3, 0.1, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.08, 10]} />
        <meshStandardMaterial color="#9aa3ad" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

/** Neck injury kit: bag and closed AED at the head, oxygen to the trauma mask, the scoop and the basket. */
function SpineKit({ step, phase }: { step: number; phase: number }) {
  const scoop = useRef<THREE.Group>(null);
  const basket = useRef<THREE.Group>(null);
  const tube = useRef<THREE.Mesh>(null);
  const cyl = useRef<THREE.MeshStandardMaterial>(null);
  const since = useSince(step, phase);
  const tubeGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([v(-0.3, 0.12, 0.2), v(-0.36, 0.11, -0.3), v(-0.3, 0.13, -0.78), v(-0.12, 0.27, -0.97), v(-0.02, 0.32, -0.985)]),
        40,
        0.011,
        6,
      ),
    [],
  );
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const s = since(t);
    const st = spineState(step, phase, s);
    const k = 1 - Math.exp(-dt * 7);
    const sc = scoop.current;
    if (sc) {
      sc.position.x += (st.scoopX - sc.position.x) * k;
      sc.position.z += (st.scoopZ + st.travel - sc.position.z) * k;
      sc.position.y += (0.03 + st.scoopY - sc.position.y) * k;
    }
    const bk = basket.current;
    if (bk) {
      bk.position.z += (st.basketZ + st.travel - bk.position.z) * k;
      bk.position.y += (st.basketY - bk.position.y) * k;
    }
    const gear = spineGear(step, phase, s);
    if (tube.current) tube.current.visible = gear.mask > 0.5 && step < 7;
    if (cyl.current) cyl.current.emissiveIntensity = step === 2 && s > 3.4 && s < 6.6 ? 0.5 + Math.sin(t * 3) * 0.3 : 0.03;
  });
  return (
    <group>
      <mesh position={[1.3, 0.16, -1.6]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.62, 0.32, 0.42]} />
        <meshStandardMaterial color="#22406e" roughness={0.75} />
      </mesh>
      {/* the AED comes to every incident: here it stays closed */}
      <mesh position={[1.02, 0.08, -0.6]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.34, 0.16, 0.28]} />
        <meshStandardMaterial color="#F2C811" roughness={0.5} />
      </mesh>
      <Cylinder glow={cyl} />
      <mesh ref={tube} geometry={tubeGeo} visible={false}>
        <meshStandardMaterial color="#d6ecf3" roughness={0.3} transparent opacity={0.9} />
      </mesh>
      {/* scoop: two blades joined at the head and foot ends */}
      <group ref={scoop} position={[SCOOP_REST[0], 0.03, SCOOP_REST[1]]}>
        {[-0.24, 0.24].map((sx) => (
          <mesh key={sx} position={[sx, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 0.05, 1.9]} />
            <meshStandardMaterial color="#F2C811" roughness={0.5} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((sz) => (
          <mesh key={sz} position={[0, 0.005, sz]} castShadow>
            <boxGeometry args={[0.7, 0.05, 0.08]} />
            <meshStandardMaterial color="#d9b10e" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* basket stretcher: a tray with low walls, 2–3 lengths below the feet */}
      <group ref={basket} position={[0, 0, 5.6]}>
        <mesh position={[0, 0.015, 0]} receiveShadow>
          <boxGeometry args={[0.72, 0.03, 2.1]} />
          <meshStandardMaterial color="#E36B12" roughness={0.6} />
        </mesh>
        {[-0.36, 0.36].map((sx) => (
          <mesh key={sx} position={[sx, 0.085, 0]} castShadow>
            <boxGeometry args={[0.035, 0.17, 2.1]} />
            <meshStandardMaterial color="#E36B12" roughness={0.6} />
          </mesh>
        ))}
        {[-1.05, 1.05].map((sz) => (
          <mesh key={sz} position={[0, 0.085, sz]} castShadow>
            <boxGeometry args={[0.72, 0.17, 0.035]} />
            <meshStandardMaterial color="#E36B12" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ the stadium
function grassTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const s = 0.78 + Math.random() * 0.22;
    x.fillStyle = `rgb(${Math.round(255 * s)},${Math.round(255 * s)},${Math.round(255 * s)})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 2 + Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Stadium() {
  const stripes = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  const grass = useMemo(() => (typeof document === "undefined" ? null : grassTexture()), []);
  useEffect(() => () => grass?.dispose(), [grass]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#2E7D32" map={grass} roughness={1} />
      </mesh>
      {stripes.map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -26 + i * 4]} receiveShadow>
          <planeGeometry args={[70, 2]} />
          <meshStandardMaterial color="#3A9440" map={grass} roughness={1} />
        </mesh>
      ))}
      {/* halfway line and centre circle behind the scene */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7]}>
        <ringGeometry args={[4.4, 4.52, 64]} />
        <meshBasicMaterial color="#F4F4F1" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7]}>
        <planeGeometry args={[60, 0.12]} />
        <meshBasicMaterial color="#F4F4F1" />
      </mesh>
      <Backdrop />
    </group>
  );
}

/**
 * A night stadium all around (AI-generated photo, mirrored so the join is seamless), on a cylinder
 * far behind the team. The photo's pitch edge sits at ground level, so the real grass meets it.
 */
function Backdrop() {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const t = new THREE.TextureLoader().load(asset("/img/3d/stadium.jpg"));
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.MirroredRepeatWrapping;
    t.repeat.set(2, 1);
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => () => tex?.dispose(), [tex]);
  const R = 30;
  const H = (Math.PI * R * 878) / 2048; // one copy of the photo spans half the circle
  const horizon = 0.86; // how far down the photo the pitch meets the stands
  if (!tex) return null;
  return (
    <mesh position={[0, H / 2 - H * (1 - horizon), 0]}>
      <cylinderGeometry args={[R, R, H, 96, 1, true]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} />
    </mesh>
  );
}

/** Some of the team, in their PEAP places, for a close-up scene (the AED trainer shows Red and Orange). */
export function Team({ ids, step, scenario }: { ids: readonly RoleId[]; step: number; scenario: Scenario }) {
  return (
    <>
      {SPOTS.filter((s) => ids.includes(s.id)).map((s) => (
        <Figure key={s.id} spot={s} step={step} scenario={scenario} selected={false} dim={false} />
      ))}
    </>
  );
}

/** Floodlight key, a cool fill from behind and a warm front fill. */
export function Lights() {
  return (
    <>
      <hemisphereLight args={["#CFE3FF", "#1F3D22", 0.7]} />
      <directionalLight
        position={[6, 12, 5]}
        intensity={2.0}
        color="#FFF4DC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-7, 8, -6]} intensity={0.6} color="#BFD8FF" />
      <directionalLight position={[0, 4, 9]} intensity={0.35} color="#ffe2b8" />
    </>
  );
}

/** The set piece without the stadium: the player, the kit and the six figures (also placed in AR). */
export function SetPiece({
  step,
  phase = 0,
  scenario = "arrest",
  fault,
  acting = [],
  selected,
  onSelect,
}: {
  step: number;
  phase?: number;
  scenario?: Exclude<Scenario, "aed">;
  fault?: string;
  acting?: readonly RoleId[];
  selected?: RoleId;
  onSelect?: (id: RoleId) => void;
}) {
  return (
    <>
      <Player step={step} phase={phase} scenario={scenario} fault={fault} />
      {scenario === "spine" ? <SpineKit step={step} phase={phase} /> : <Kit step={step} />}
      {SPOTS.map((s) => (
        <Figure
          key={s.id}
          spot={s}
          step={step}
          phase={phase}
          scenario={scenario}
          acting={acting.includes(s.id)}
          fault={fault}
          selected={selected === s.id}
          dim={Boolean(selected) && selected !== s.id && step === 0}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function Rig({ autoRotate, angle, dragging }: { autoRotate: boolean; angle: React.RefObject<number>; dragging: React.RefObject<boolean> }) {
  const { camera, size } = useThree();
  const sway = useRef(0);
  // opening shot: starts low and wide on the stadium, then cranes up to the working view
  const intro = useRef(autoRotate ? 0 : 1);
  useFrame((_, dt) => {
    // A slow sway either side of the viewer's angle, so the layout stays readable (player's right on the left).
    if (autoRotate && !dragging.current) sway.current += dt;
    if (intro.current < 1) intro.current = dragging.current ? 1 : Math.min(1, intro.current + dt / 2.6);
    const k = ease(intro.current);
    const a = angle.current + Math.sin(sway.current * 0.22) * 0.42 + (1 - k) * 0.6;
    // pull back on tall, narrow screens so the whole team stays in view
    const narrow = size.width / size.height < 0.95;
    const r = (narrow ? 5.0 : 4.7) + (1 - k) * 4.5;
    const y = (narrow ? 3.3 : 2.6) * k + 1.1 * (1 - k);
    camera.position.set(Math.sin(a) * r, y, Math.cos(a) * r + 0.45);
    camera.lookAt(0, 0.5 + (1 - k) * 2.2, -0.1);
    // each colour's voice comes from their side of the screen
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (const s of SPOTS) voicePan[s.id] = panFrom(s.x, s.z, cx, cz, -cx, -0.1 - cz, 5);
  });
  return null;
}

export default function Scene3D({
  selected,
  onSelect,
  step = 0,
  phase = 0,
  scenario = "arrest",
  acting,
  fault,
  className,
}: {
  selected?: RoleId;
  onSelect?: (id: RoleId) => void;
  step?: number;
  phase?: number;
  scenario?: Exclude<Scenario, "aed">;
  /** the colours that act in this step (gold rings) */
  acting?: readonly RoleId[];
  /** spot the mistake: one planted error (lib/mistakes.ts) */
  fault?: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const dragging = useRef(false);
  const last = useRef(0);
  const moved = useRef(0);
  const { visible, still } = useSceneVisibility(wrap);
  const busy = acting ?? (scenario === "arrest" && step > 0 ? workshop.steps[step - 1]?.who : undefined) ?? [];

  return (
    <div
      ref={wrap}
      className={className}
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        dragging.current = true;
        last.current = e.clientX;
        moved.current = 0;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - last.current;
        last.current = e.clientX;
        moved.current += Math.abs(dx);
        angle.current -= dx * 0.012;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 44, near: 0.1, far: 140, position: [0, 5, 10] }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0B1F3A");
          scene.fog = new THREE.Fog("#0B1F3A", 22, 60);
        }}
      >
        <Lights />
        <Rig autoRotate={!still} angle={angle} dragging={dragging} />
        <Stadium />
        <SetPiece
          step={step}
          phase={phase}
          scenario={scenario}
          fault={fault}
          acting={busy}
          selected={selected}
          onSelect={
            onSelect
              ? (id) => {
                  // a drag that ends on a figure is a turn of the scene, not a tap
                  if (moved.current < 8) onSelect(id);
                }
              : undefined
          }
        />
      </Canvas>
    </div>
  );
}
