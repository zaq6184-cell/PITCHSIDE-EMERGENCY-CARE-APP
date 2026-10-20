import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Lights, Stadium } from "@/components/scene-3d";
import type { SignId } from "@/lib/concussion-signs";
import { useSceneVisibility } from "@/lib/use-scene-visibility";

/**
 * Spot the sign: one footballer acting out a visible sign of concussion from FIFA FOCUS, in a loop — a stiff
 * fall with no protective action, tonic posturing, an impact seizure, staggering, lying motionless, or a blank
 * look while a medic waves. The body is a jointed figure posed every frame from simple keyframes.
 */
type JointName = "head" | "nose" | "neck" | "chest" | "pelvis" | "shL" | "elL" | "haL" | "shR" | "elR" | "haR" | "hipL" | "knL" | "ftL" | "hipR" | "knR" | "ftR";
type Skel = Record<JointName, THREE.Vector3>;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Standing, facing +z (the player's left is +x). */
const STAND: Record<JointName, [number, number, number]> = {
  head: [0, 1.68, 0],
  nose: [0, 1.68, 0.14],
  neck: [0, 1.52, 0],
  chest: [0, 1.3, 0],
  pelvis: [0, 0.95, 0],
  shL: [0.2, 1.46, 0],
  elL: [0.25, 1.18, 0.02],
  haL: [0.27, 0.92, 0.05],
  shR: [-0.2, 1.46, 0],
  elR: [-0.25, 1.18, 0.02],
  haR: [-0.27, 0.92, 0.05],
  hipL: [0.1, 0.92, 0],
  knL: [0.11, 0.5, 0.03],
  ftL: [0.12, 0.07, 0.03],
  hipR: [-0.1, 0.92, 0],
  knR: [-0.11, 0.5, 0.03],
  ftR: [-0.12, 0.07, 0.03],
};
const stand = (): Skel => Object.fromEntries(Object.entries(STAND).map(([k, p]) => [k, v(...p)])) as Skel;

const ease = (k: number) => k * k * (3 - 2 * k);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
const X = new THREE.Vector3(1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);

function rotate(s: Skel, axis: THREE.Vector3, angle: number, pivot: THREE.Vector3) {
  const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  for (const k of Object.keys(s) as JointName[]) s[k].sub(pivot).applyQuaternion(q).add(pivot);
}

/** From standing (k = 0) to lying on the back (k = 1): a backward fall about the feet, face up. */
function lie(s: Skel, k: number) {
  rotate(s, X, -k * (Math.PI / 2), v(0, 0.06, 0));
  for (const j of Object.values(s)) j.y += k * 0.09;
}

/** Arms set in the standing frame: forward is +z, so once lying they point up. */
function arm(s: Skel, side: 1 | -1, el: [number, number, number], ha: [number, number, number]) {
  const sh = side === 1 ? s.shL : s.shR;
  (side === 1 ? s.elL : s.elR).copy(sh).add(v(el[0] * side, el[1], el[2]));
  (side === 1 ? s.haL : s.haR).copy(sh).add(v(ha[0] * side, ha[1], ha[2]));
}

/** The player's skeleton for a sign at time t (seconds), in world space. */
function playerPose(sign: SignId, t: number): Skel {
  const s = stand();
  switch (sign) {
    case "motionless": {
      arm(s, 1, [0.08, -0.27, 0.02], [0.12, -0.53, 0.04]);
      arm(s, -1, [0.08, -0.27, 0.02], [0.12, -0.53, 0.04]);
      lie(s, 1);
      return s;
    }
    case "no-protect": {
      const p = t % 6;
      // stands, then goes over backwards like a plank — arms stay at the sides — and lies still
      const k = p < 1.4 ? 0 : p < 2.15 ? clamp01((p - 1.4) / 0.75) ** 2 : p < 5.6 ? 1 : 0;
      if (p < 1.4) rotate(s, Z, Math.sin(t * 3) * 0.02, v(0, 0, 0));
      lie(s, k);
      return s;
    }
    case "tonic": {
      const p = t % 5.5;
      const up = p < 1 ? 0 : p < 1.5 ? ease((p - 1) / 0.5) : p < 4.6 ? 1 : 1 - ease((p - 4.6) / 0.6);
      const tremor = up > 0.9 ? Math.sin(t * 38) * 0.008 : 0;
      // fencing-style: the left arm straight up, the right bent; legs stiff
      arm(s, 1, [0.06 - up * 0.04, -0.27 + up * 0.25, 0.02 + up * 0.26 + tremor], [0.1 - up * 0.06, -0.53 + up * 0.5, 0.04 + up * 0.5 + tremor]);
      arm(s, -1, [0.08, -0.27 + up * 0.12, 0.02 + up * 0.2], [0.12 - up * 0.02, -0.53 + up * 0.52, 0.04 + up * 0.18 + tremor]);
      s.ftL.z -= up * 0.04;
      s.ftR.z -= up * 0.04;
      lie(s, 1);
      return s;
    }
    case "seizure": {
      // rhythmic jerking: elbows bent, hands jerking in across the chest; knees jerking; the head moving side to side
      const j = Math.sin(t * Math.PI * 2 * 2.6);
      const j2 = Math.sin(t * Math.PI * 2 * 2.6 + 1.1);
      arm(s, 1, [0.17, -0.2, 0.06], [0.03 - j * 0.06, -0.1 + j * 0.03, 0.18 + j * 0.05]);
      arm(s, -1, [0.17, -0.2, 0.06], [0.03 - j2 * 0.06, -0.1 + j2 * 0.03, 0.18 + j2 * 0.05]);
      s.knL.z += 0.09 + j * 0.07;
      s.knR.z += 0.09 + j2 * 0.07;
      s.ftL.z += 0.02 + j * 0.03;
      s.ftR.z += 0.02 + j2 * 0.03;
      s.head.x += j * 0.012;
      s.nose.x += j * 0.05;
      lie(s, 1);
      return s;
    }
    case "incoordination": {
      // trying to stay up: sways and lurches, feet cross, arms out for balance
      const sway = Math.sin(t * 2.1) * 0.16 + Math.sin(t * 5.3) * 0.05;
      s.ftL.x += Math.sin(t * 2.1) * 0.14;
      s.ftR.x += Math.sin(t * 2.1 + 0.6) * 0.14;
      s.knL.x += Math.sin(t * 2.1) * 0.08;
      s.knR.x += Math.sin(t * 2.1 + 0.6) * 0.08;
      s.knL.z += 0.05;
      s.knR.z += 0.05;
      arm(s, 1, [0.22, -0.16, 0.02], [0.42, -0.24, 0.06]);
      arm(s, -1, [0.22, -0.16, 0.02], [0.42, -0.24, 0.06]);
      rotate(s, Z, sway, v((s.ftL.x + s.ftR.x) / 2, 0, 0));
      rotate(s, X, 0.08 + Math.sin(t * 1.3) * 0.05, v(0, 0, 0));
      return s;
    }
    case "blank": {
      // standing, still, staring ahead — not following the medic's hand
      rotate(s, Z, Math.sin(t * 0.7) * 0.01, v(0, 0, 0));
      return s;
    }
  }
}

/** The medic for the blank-look sign: facing the player, waving a hand in front of the eyes. */
function medicPose(t: number): Skel {
  const s = stand();
  arm(s, -1, [0.02, -0.06, 0.26], [0.02 + Math.sin(t * 7) * 0.12, 0.2, 0.5]);
  // in front of the player on the far side from the camera, turned to face them, so both stay in view
  rotate(s, Y, 2.14, v(0, 0, 0));
  for (const j of Object.values(s)) j.add(v(-0.55, 0, 0.35));
  return s;
}

// ------------------------------------------------------------------ drawing a figure
const GEO = { cyl: new THREE.CylinderGeometry(1, 1, 1, 12), sphere: new THREE.SphereGeometry(1, 18, 14) };
const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
function segment(m: THREE.Mesh | null, a: THREE.Vector3, b: THREE.Vector3, r: number) {
  if (!m) return;
  tmp.subVectors(b, a);
  const len = Math.max(tmp.length(), 0.001);
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.scale.set(r, len, r);
  m.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len));
}

const BONES: [JointName, JointName, number, "shirt" | "skin" | "shorts" | "socks"][] = [
  ["pelvis", "neck", 0.165, "shirt"],
  ["shL", "shR", 0.085, "shirt"],
  ["hipL", "hipR", 0.12, "shorts"],
  ["neck", "head", 0.055, "skin"],
  ["shL", "elL", 0.055, "shirt"],
  ["elL", "haL", 0.045, "skin"],
  ["shR", "elR", 0.055, "shirt"],
  ["elR", "haR", 0.045, "skin"],
  ["hipL", "knL", 0.08, "shorts"],
  ["knL", "ftL", 0.064, "socks"],
  ["hipR", "knR", 0.08, "shorts"],
  ["knR", "ftR", 0.064, "socks"],
];

function Actor({ pose, shirt, socks }: { pose: (t: number) => Skel; shirt: string; socks: string }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const head = useRef<THREE.Mesh>(null);
  const eyes = useRef<(THREE.Mesh | null)[]>([]);
  const feet = useRef<(THREE.Mesh | null)[]>([]);
  const hands = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () => ({
      shirt: new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.65 }),
      skin: new THREE.MeshStandardMaterial({ color: "#b07850", roughness: 0.7 }),
      shorts: new THREE.MeshStandardMaterial({ color: "#16181d", roughness: 0.8 }),
      socks: new THREE.MeshStandardMaterial({ color: socks, roughness: 0.75 }),
      boot: new THREE.MeshStandardMaterial({ color: "#0d0d10", roughness: 0.5 }),
      eye: new THREE.MeshStandardMaterial({ color: "#16110d", roughness: 0.25 }),
    }),
    [shirt, socks],
  );
  const front = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const s = pose(clock.elapsedTime);
    BONES.forEach(([a, b, r], i) => segment(meshes.current[i], s[a], s[b], r));
    head.current?.position.copy(s.head);
    front.subVectors(s.nose, s.head).normalize();
    side.subVectors(s.shL, s.shR).normalize();
    up.subVectors(s.head, s.neck).normalize();
    eyes.current.forEach((e, i) => e?.position.copy(s.head).addScaledVector(front, 0.112).addScaledVector(side, i ? 0.045 : -0.045).addScaledVector(up, 0.02));
    feet.current.forEach((f, i) => f?.position.copy(i ? s.ftR : s.ftL));
    hands.current.forEach((h, i) => h?.position.copy(i ? s.haR : s.haL));
  });
  return (
    <group>
      {BONES.map(([, , , m], i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={GEO.cyl}
          material={mats[m]}
          castShadow
        />
      ))}
      <mesh ref={head} geometry={GEO.sphere} material={mats.skin} scale={[0.12, 0.135, 0.125]} castShadow />
      {[0, 1].map((i) => (
        <mesh
          key={`e${i}`}
          ref={(el) => {
            eyes.current[i] = el;
          }}
          geometry={GEO.sphere}
          material={mats.eye}
          scale={0.016}
        />
      ))}
      {[0, 1].map((i) => (
        <mesh
          key={`f${i}`}
          ref={(el) => {
            feet.current[i] = el;
          }}
          geometry={GEO.sphere}
          material={mats.boot}
          scale={[0.06, 0.05, 0.12]}
          castShadow
        />
      ))}
      {[0, 1].map((i) => (
        <mesh
          key={`h${i}`}
          ref={(el) => {
            hands.current[i] = el;
          }}
          geometry={GEO.sphere}
          material={mats.skin}
          scale={0.05}
        />
      ))}
    </group>
  );
}

function Rig({ angle, dragging, lying }: { angle: React.RefObject<number>; dragging: React.RefObject<boolean>; lying: boolean }) {
  const { camera, size } = useThree();
  const sway = useRef(0);
  useFrame((_, dt) => {
    if (!dragging.current) sway.current += dt;
    const a = angle.current + 0.85 + Math.sin(sway.current * 0.25) * 0.3;
    const narrow = size.width / size.height < 0.95;
    const r = (lying ? 3.7 : 4.6) * (narrow ? 1.12 : 1);
    camera.position.set(Math.sin(a) * r, lying ? 2.3 : 1.7, Math.cos(a) * r - (lying ? 0.7 : 0));
    camera.lookAt(0, lying ? 0.25 : 0.9, lying ? -0.75 : 0);
  });
  return null;
}

export default function ConcussionScene3D({ sign, className }: { sign: SignId; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const dragging = useRef(false);
  const last = useRef(0);
  const { visible } = useSceneVisibility(wrap);
  const lying = sign !== "incoordination" && sign !== "blank";
  const pose = useMemo(() => (t: number) => playerPose(sign, t), [sign]);
  return (
    <div
      ref={wrap}
      className={className}
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        dragging.current = true;
        last.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        angle.current -= (e.clientX - last.current) * 0.012;
        last.current = e.clientX;
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 40, near: 0.1, far: 140, position: [3, 1.6, 2] }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0B1F3A");
          scene.fog = new THREE.Fog("#0B1F3A", 22, 60);
        }}
      >
        <Lights />
        <Rig angle={angle} dragging={dragging} lying={lying} />
        <Stadium />
        <Actor key={sign} pose={pose} shirt="#5b2d8e" socks="#5b2d8e" />
        {sign === "blank" ? <Actor pose={medicPose} shirt="#C0392B" socks="#1a2130" /> : null}
      </Canvas>
    </div>
  );
}
