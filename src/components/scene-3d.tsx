import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { getSoundPrefs, startAmbience, stopAmbience, subscribeSound } from "@/lib/sound";
import { type RoleId, workshop } from "@/lib/workshop";

/**
 * Real-time 3D set piece, built from original shapes: a floodlit stadium, a footballer lying on the
 * back (head away from the default camera) and the six colour roles where FIFA's PEAP poster puts
 * them — Orange and Green at the head, Red / Blue / White down the player's right, Black on the left.
 *
 * Each team member is a jointed figure (hips, knees, shoulders, elbows, head) posed every frame:
 * hands are placed on real targets (the sternum, the head, the AED) with two-bone IK, and poses blend
 * smoothly when the drill moves on. Drag to turn, tap a figure to select it. `step` 1–6 plays the drill.
 */
type Spot = { id: RoleId; color: string; x: number; z: number; face: number; stand?: boolean };

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
const GOLD = "#C9A227";
const CPR_HZ = 110 / 60;

const STERNUM: [number, number, number] = [0, 0.37, -0.55];
const PLAYER_Y = 0.16;

// ------------------------------------------------------------------ shared drill timing
const ease = (k: number) => k * k * (3 - 2 * k);

/** Compressions: Red's push and the chest giving way, 110 per minute. Stops for analysis and shock. */
function compression(step: number, t: number) {
  const pushing = step === 2 || step === 4 || (step === 3 && t % 5 < 2.6);
  return pushing ? Math.abs(Math.sin(t * Math.PI * CPR_HZ)) : 0;
}
const handsOff = (step: number, t: number) => step === 3 && t % 5 >= 2.6;

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

/**
 * The target pose for one role at one moment, in the figure's own space (front = -z, right = +x).
 * `L` turns a world point into figure space; `cam` is the camera in figure space.
 */
function poseFor(id: RoleId, standing: boolean, spotZ: number, step: number, t: number, selected: boolean, L: (x: number, y: number, z: number) => THREE.Vector3, cam: THREE.Vector3): Pose {
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
  const c = compression(step, t);
  const roll = rollAngle(step, t);
  const R = (x: number, y: number, z: number) => L(...rollPoint(x, y, z, roll));
  const hold = (l: THREE.Vector3, r: THREE.Vector3, lean: number, hipZ = -0.06): Pose => ({ ...p, handL: l, handR: r, lean, hip: v(0, 0.62, hipZ) });
  const clear = (): Pose => ({ ...p, lean: 0.06, hip: v(0, 0.64, 0.06), handL: v(-0.3, 1.18, -0.1), handR: v(0.3, 1.18, -0.1) });

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
        // arms straight, shoulders over the sternum, the whole body pushing from the hips
        return {
          ...p,
          hip: v(0, 0.68 - c * 0.035, -0.12),
          lean: 0.94 + c * 0.04,
          handL: chest.clone().add(v(0, 0.045 - c * 0.035, 0)),
          handR: chest.clone().add(v(0, 0.01 - c * 0.035, 0)),
          look: chest,
        };
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

// ------------------------------------------------------------------ a team member
const UPPER = 0.36;
const FORE = 0.34;

function Figure({ spot, selected, dim, step, onSelect }: { spot: Spot; selected: boolean; dim: boolean; step: number; onSelect?: (id: RoleId) => void }) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const m = useRef<Record<string, THREE.Mesh | null>>({});
  const cur = useRef<Pose | null>(null);
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

  // the colours tagged on this drill step (the same chips as the step list under the scene)
  const acting = step > 0 && (workshop.steps[step - 1]?.who ?? []).includes(spot.id);

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
    const moving = step === 6 && (CARRIERS.has(spot.id) || spot.id === "black" || spot.id === "green");
    const travel = moving ? carryTravel(t) : 0;
    g.position.set(spot.x, 0, spot.z + travel);
    g.rotation.y = spot.face;
    g.updateMatrixWorld();

    const cf = Math.cos(spot.face);
    const sf = Math.sin(spot.face);
    const L = (x: number, y: number, z: number) => {
      const dx = x - spot.x;
      const dz = z - (spot.z + travel);
      return new THREE.Vector3(dx * cf - dz * sf, y, dx * sf + dz * cf);
    };
    camL.copy(L(camera.position.x, camera.position.y, camera.position.z));
    // world targets that move with the board in step 6
    const Lw = (x: number, y: number, z: number) => L(x, y, z + (step === 6 ? carryTravel(t) : 0));
    const target = poseFor(spot.id, Boolean(spot.stand), spot.z, step, t, selected, step === 6 ? Lw : L, camL);

    // blend towards the target pose, so changes of step look like movement, not jumps
    if (!cur.current) cur.current = clonePose(target);
    const p = cur.current;
    const k = 1 - Math.exp(-dt * (step === 2 || step === 4 ? 14 : 6));
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
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      ik(shoulder[s], targets[s], UPPER, FORE, pole.set(side * 0.7, -0.5, 0.6).normalize(), elbow[s], hand[s]);
      segment(m.current[`ua${s}`], shoulder[s], elbow[s], 0.058);
      segment(m.current[`fa${s}`], elbow[s], hand[s], 0.048);
      m.current[`el${s}`]?.position.copy(elbow[s]);
      m.current[`sh${s}`]?.position.copy(shoulder[s]);
      m.current[`hd${s}`]?.position.copy(hand[s]);
    }

    // legs: kneeling (shins flat behind) blends to standing; a small step when walking
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const stride = p.walk * Math.sin(t * 8 + s * Math.PI) * 0.14;
      hipJ[s].set(side * 0.1, p.hip.y - 0.04, p.hip.z);
      knee[s].set(side * 0.11, 0.07 + p.stand * 0.43, -0.08 + p.stand * 0.04 + stride);
      foot[s].set(side * 0.11, 0.05, 0.42 - p.stand * 0.42 + stride * 1.3);
      segment(m.current[`th${s}`], hipJ[s], knee[s], 0.085);
      segment(m.current[`sn${s}`], knee[s], foot[s], 0.068);
      m.current[`kn${s}`]?.position.copy(knee[s]);
      const shoe = m.current[`so${s}`];
      if (shoe) shoe.position.set(foot[s].x, 0.045, foot[s].z + 0.06 - p.stand * 0.12);
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
    e.stopPropagation();
    onSelect?.(spot.id);
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
        {[0, 1].map((s) => (
          <group key={s}>
            <mesh ref={set(`sh${s}`)} geometry={GEO.sphere} material={mats.vest} scale={0.072} />
            <mesh ref={set(`ua${s}`)} geometry={GEO.cyl} material={mats.top} castShadow />
            <mesh ref={set(`el${s}`)} geometry={GEO.sphere} material={mats.top} scale={0.054} />
            <mesh ref={set(`fa${s}`)} geometry={GEO.cyl} material={mats.top} castShadow />
            <mesh ref={set(`hd${s}`)} geometry={GEO.sphere} material={mats.skin} scale={[0.05, 0.042, 0.065]} />
            <mesh ref={set(`th${s}`)} geometry={GEO.cyl} material={mats.legs} castShadow />
            <mesh ref={set(`kn${s}`)} geometry={GEO.sphere} material={mats.legs} scale={0.082} />
            <mesh ref={set(`sn${s}`)} geometry={GEO.cyl} material={mats.legs} castShadow />
            <mesh ref={set(`so${s}`)} geometry={GEO.sphere} material={mats.shoe} scale={[0.055, 0.045, 0.12]} castShadow />
          </group>
        ))}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ the player
function Player({ step }: { step: number }) {
  const g = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    const c = compression(step, t);
    const shock = step === 3 && t % 5 > 4.72 ? 0.05 : 0;
    g.current.position.y = PLAYER_Y + shock + (step === 6 ? carryLift(t) : 0);
    g.current.position.z = step === 6 ? carryTravel(t) : 0;
    g.current.rotation.z = rollAngle(step, t);
    if (chest.current) chest.current.scale.y = 1 - c * 0.16;
  });
  const skin = "#b07850";
  return (
    <group ref={g} position={[0, PLAYER_Y, 0]}>
      <group ref={chest} position={[0, 0, -0.42]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.28, 1, 0.95]} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 6, 16]} />
          <meshStandardMaterial color={KIT} roughness={0.65} />
        </mesh>
        {/* shirt number panel: plain, no text */}
        <mesh position={[0, 0.19, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 0.2]} />
          <meshStandardMaterial color="#e9e4f2" roughness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, -0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1, 0.9]} castShadow>
        <capsuleGeometry args={[0.19, 0.12, 6, 14]} />
        <meshStandardMaterial color="#14161c" roughness={0.8} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.04, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.075, 0.4, 12]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
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
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <mesh position={[x * 1.1, -0.06, -0.04]} scale={[0.05, 0.035, 0.065]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.0, -0.79]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.065, 0.12, 10]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, -1.0]} scale={[0.13, 0.13, 0.145]} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.02, -1.03]} scale={[0.135, 0.12, 0.14]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#1a120d" roughness={0.9} />
      </mesh>
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
      <mesh position={[-0.3, 0.1, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.62, 18]} />
        <meshStandardMaterial ref={cyl} color="#f2f2f2" emissive="#9AD0FF" emissiveIntensity={0.03} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[-0.3, 0.1, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.08, 10]} />
        <meshStandardMaterial color="#9aa3ad" roughness={0.3} metalness={0.8} />
      </mesh>
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

/** The ambulance drives onto the pitch for the transfer (FIFA: best if it comes to the player). */
function Ambulance({ step }: { step: number }) {
  const g = useRef<THREE.Group>(null);
  const blue = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (g.current) {
      const target = step >= 5 ? 2.9 : 13;
      g.current.position.x += (target - g.current.position.x) * Math.min(1, dt * 0.8);
    }
    if (blue.current) blue.current.emissiveIntensity = step >= 5 ? (Math.sin(t * 14) > 0 ? 3 : 0.2) : 0.1;
  });
  return (
    <group ref={g} position={[13, 0, -3.1]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.78, 0.35]} castShadow>
        <boxGeometry args={[1.25, 1.2, 2.3]} />
        <meshStandardMaterial color="#f5f6f8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, -1.15]} castShadow>
        <boxGeometry args={[1.2, 0.85, 0.85]} />
        <meshStandardMaterial color="#f5f6f8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, -1.58]}>
        <boxGeometry args={[1.05, 0.38, 0.02]} />
        <meshStandardMaterial color="#1b2633" roughness={0.1} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0.35]}>
        <boxGeometry args={[1.27, 0.14, 2.32]} />
        <meshStandardMaterial color="#E36B12" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.42, 0.0]}>
        <boxGeometry args={[0.7, 0.08, 0.2]} />
        <meshStandardMaterial ref={blue} color="#2f6bff" emissive="#4d7dff" emissiveIntensity={0.1} />
      </mesh>
      {[
        [-0.62, -0.9],
        [0.62, -0.9],
        [-0.62, 0.95],
        [0.62, 0.95],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
          <meshStandardMaterial color="#121316" roughness={0.8} />
        </mesh>
      ))}
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

function Stadium() {
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
  });
  return null;
}

export default function Scene3D({
  selected,
  onSelect,
  step = 0,
  className,
}: {
  selected?: RoleId;
  onSelect?: (id: RoleId) => void;
  step?: number;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const dragging = useRef(false);
  const last = useRef(0);
  const moved = useRef(0);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // soft stadium ambience while the scene is on screen and sound is on
  useEffect(() => {
    const apply = () => (visible && getSoundPrefs().sfx ? startAmbience() : stopAmbience());
    apply();
    const off = subscribeSound(apply);
    return () => {
      off();
      stopAmbience();
    };
  }, [visible]);

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
        <Rig autoRotate={!still} angle={angle} dragging={dragging} />
        <Stadium />
        <Ambulance step={step} />
        <Player step={step} />
        <Kit step={step} />
        {SPOTS.map((s) => (
          <Figure
            key={s.id}
            spot={s}
            step={step}
            selected={selected === s.id}
            dim={Boolean(selected) && selected !== s.id && step === 0}
            onSelect={(id) => {
              // a drag that ends on a figure is a turn of the scene, not a tap
              if (moved.current < 8) onSelect?.(id);
            }}
          />
        ))}
      </Canvas>
    </div>
  );
}
