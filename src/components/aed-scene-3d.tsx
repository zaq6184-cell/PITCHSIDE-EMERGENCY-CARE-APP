import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CPR_HZ, GOLD, Lights, PLAYER_Y, Player, Stadium, Team } from "@/components/scene-3d";
import { PAD_TARGETS, type PadId, type Tap } from "@/lib/aed-pads";
import { useSceneVisibility } from "@/lib/use-scene-visibility";

/**
 * The AED pads trainer in 3D: a close view over the player's chest from the left, where Green kneels.
 * Red keeps compressing and Orange squeezes the bag on the i-gel while you place the pads; hands come
 * off for the analysis; after "shock advised" they are back on until someone calls everyone clear.
 */
export type AedStage = "idle" | "expose" | "pads" | "analyse" | "advised" | "clear" | "shock" | "done";

export type AedView = {
  stage: AedStage;
  exposed: boolean;
  placed: Record<PadId, boolean>;
  ghosts: Record<PadId, boolean>;
  /** the last wrong tap, marked for a moment */
  miss: { x: number; y: number; z: number; at: number } | null;
  /** performance.now() of the shock, for the flash and the jolt */
  shockAt: number;
};

/** The team's pose for each stage (scene-3d's AED poses): 1 compressing, 2 analysis, 3 hands back on, 4 clear, 5 CPR again. */
const teamStep = (stage: AedStage) =>
  stage === "analyse" ? 2 : stage === "advised" ? 3 : stage === "clear" ? 4 : stage === "shock" || stage === "done" ? 5 : 1;

// Pads lie on the chest surface, in the chest's own space (the chest is centred 0.42 towards the head).
const CHEST_Z = -0.42;
const PAD_POSE: Record<PadId, { pos: [number, number, number]; tilt: number }> = {
  right: { pos: [PAD_TARGETS.right.x, 0.176, PAD_TARGETS.right.z - CHEST_Z], tilt: 0.375 },
  left: { pos: [PAD_TARGETS.left.x, 0.104, PAD_TARGETS.left.z - CHEST_Z], tilt: -0.895 },
};

const AED_POS: [number, number, number] = [0.6, 0, -1.02];
const AED_TURN = 0.45;
const TRACE_POINTS = 64;

function Pad({ id, on, ghost }: { id: PadId; on: boolean; ghost: boolean }) {
  const g = useRef<THREE.Group>(null);
  const ghostMat = useRef<THREE.MeshBasicMaterial>(null);
  const shown = useRef(0);
  useFrame(({ clock }, dt) => {
    shown.current += ((on ? 1 : 0) - shown.current) * (1 - Math.exp(-dt * 12));
    if (g.current) {
      g.current.visible = shown.current > 0.02;
      g.current.scale.setScalar(1.35 - 0.35 * shown.current);
    }
    if (ghostMat.current) ghostMat.current.opacity = ghost && !on ? 0.55 + Math.sin(clock.elapsedTime * 5) * 0.25 : 0;
  });
  const { pos, tilt } = PAD_POSE[id];
  return (
    <group position={pos} rotation={[0, 0, tilt]}>
      <group ref={g} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[0.128, 0.168]} />
          <meshStandardMaterial color="#3a3f46" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 0.16]} />
          <meshStandardMaterial color="#f4f4f1" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* where it should go, shown after two wrong tries */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} renderOrder={3}>
        <planeGeometry args={[0.13, 0.17]} />
        <meshBasicMaterial ref={ghostMat} color={GOLD} transparent opacity={0} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A red ring where the last wrong tap landed. */
function MissMark({ miss }: { miss: AedView["miss"] }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const mesh = m.current;
    if (!mesh) return;
    const age = miss ? (performance.now() - miss.at) / 1000 : 9;
    mesh.visible = age < 1;
    if (!mesh.visible || !miss) return;
    mesh.position.set(miss.x, miss.y + 0.01, miss.z);
    mesh.lookAt(camera.position);
    mesh.scale.setScalar(1 + age * 1.2);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 1 - age;
  });
  return (
    <mesh ref={m} visible={false} renderOrder={2}>
      <ringGeometry args={[0.022, 0.034, 32]} />
      <meshBasicMaterial color="#ff4d3d" transparent depthTest={false} />
    </mesh>
  );
}

/** The AED, open beside the player's left shoulder: screen with the rhythm, the flashing shock button, the pads. */
function Aed({ stage, placed, shockAt }: { stage: AedStage; placed: Record<PadId, boolean>; shockAt: number }) {
  const button = useRef<THREE.MeshStandardMaterial>(null);
  const flash = useRef<THREE.PointLight>(null);
  const trace = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRACE_POINTS * 3), 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#7CFFB2" }));
  }, []);
  useEffect(
    () => () => {
      trace.geometry.dispose();
      (trace.material as THREE.Material).dispose();
    },
    [trace],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const since = performance.now() - shockAt;
    const armed = stage === "advised" || stage === "clear";
    if (button.current) button.current.emissiveIntensity = since < 220 ? 3 : armed ? 0.7 + Math.sin(t * 9) * 0.55 : 0.05;
    if (flash.current) flash.current.intensity = since < 140 ? 16 : 0;
    // the rhythm: flat until both pads are on, coarse VF until the shock, then compression artefact
    const on = placed.right && placed.left;
    const pos = trace.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRACE_POINTS; i++) {
      const k = i / (TRACE_POINTS - 1);
      const u = k * 6 + t * 3;
      let y = 0;
      if (on && stage !== "shock" && stage !== "done") y = (Math.sin(u * 4.1) * 0.5 + Math.sin(u * 6.7 + 1.3) * 0.35 + Math.sin(u * 2.3) * 0.25) * 0.02;
      else if (on) y = Math.sin(u * 9.4) * 0.016 * (0.6 + 0.4 * Math.sin(u));
      pos.setXYZ(i, -0.1 + k * 0.2, y, 0);
    }
    pos.needsUpdate = true;
  });
  return (
    <group position={AED_POS} rotation={[0, AED_TURN, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.34, 0.14, 0.28]} />
        <meshStandardMaterial color="#F2C811" roughness={0.5} />
      </mesh>
      {/* the lid stands open behind, with the screen */}
      <group position={[0, 0.2, -0.13]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.26, 0.03]} />
          <meshStandardMaterial color="#d6ad10" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.01, 0.016]}>
          <planeGeometry args={[0.24, 0.15]} />
          <meshStandardMaterial color="#0d1b16" emissive="#0f3a2a" emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
        <primitive object={trace} position={[0, 0.01, 0.018]} />
      </group>
      {/* the shock button */}
      <mesh position={[0.08, 0.145, 0.05]}>
        <cylinderGeometry args={[0.034, 0.034, 0.014, 24]} />
        <meshStandardMaterial ref={button} color="#e8541c" emissive="#ff7a2e" emissiveIntensity={0.05} roughness={0.35} />
      </mesh>
      {/* the pads in their packet until they go on */}
      {(["right", "left"] as const).map((id, i) =>
        placed[id] ? null : (
          <mesh key={id} position={[-0.075 + i * 0.012, 0.142 + i * 0.004, 0.02 - i * 0.01]} rotation={[-Math.PI / 2, 0, 0.2]}>
            <planeGeometry args={[0.1, 0.13]} />
            <meshStandardMaterial color="#f4f4f1" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        ),
      )}
      <pointLight ref={flash} position={[-0.3, 0.8, 0.2]} color="#FFF3B0" intensity={0} distance={6} />
    </group>
  );
}

/** The bag valve on the i-gel at the head, squeezed once every 10 compressions while CPR runs. */
function Bag({ step }: { step: number }) {
  const bag = useRef<THREE.Group>(null);
  // the short connector from the bag to the i-gel at the mouth
  const { tube, aim } = useMemo(() => {
    const from = new THREE.Vector3(0.14, 0.3, -1.24);
    const to = new THREE.Vector3(0.0, 0.3, -1.0);
    const dir = to.clone().sub(from);
    return {
      tube: new THREE.CylinderGeometry(0.02, 0.02, dir.length(), 10),
      aim: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()),
    };
  }, []);
  useEffect(() => () => tube.dispose(), [tube]);
  useFrame(({ clock }) => {
    const beat = (step <= 1 || step === 5) && (clock.elapsedTime * CPR_HZ) % 10 < 0.9;
    bag.current?.scale.set(1, beat ? 0.7 : 1, 1);
  });
  return (
    <group>
      <group ref={bag} position={[0.2, 0.3, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <mesh scale={[0.09, 0.15, 0.09]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#cfe6ee" roughness={0.3} transparent opacity={0.85} />
        </mesh>
      </group>
      <mesh geometry={tube} position={[0.07, 0.3, -1.12]} quaternion={aim}>
        <meshStandardMaterial color="#e8eef2" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Cables from the AED to each pad once it is on. */
function Cables({ placed }: { placed: Record<PadId, boolean> }) {
  const geos = useMemo(() => {
    const m = new THREE.Matrix4().makeRotationY(AED_TURN).setPosition(...AED_POS);
    const plug = new THREE.Vector3(-0.17, 0.09, 0.06).applyMatrix4(m);
    const WAY: Record<PadId, [number, number, number][]> = {
      left: [
        [0.46, 0.03, -0.82],
        [0.33, 0.12, -0.58],
        [0.28, 0.21, -0.51],
      ],
      right: [
        [0.46, 0.05, -0.92],
        [0.24, 0.3, -0.85],
        [0.04, 0.35, -0.75],
      ],
    };
    const make = (id: PadId) => {
      const [x, y, z] = PAD_POSE[id].pos;
      const way = WAY[id].map(([a, b, c]) => new THREE.Vector3(a, b, c));
      // ends just under the pad's edge on the side the cable comes from
      const centre = new THREE.Vector3(x, y + PLAYER_Y, z + CHEST_Z);
      const edge = centre.clone().add(way[2].clone().sub(centre).setLength(0.05)).add(new THREE.Vector3(0, -0.006, 0));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([plug, ...way, edge]), 48, 0.006, 5);
    };
    return { right: make("right"), left: make("left") };
  }, []);
  useEffect(
    () => () => {
      geos.right.dispose();
      geos.left.dispose();
    },
    [geos],
  );
  return (
    <>
      {(["right", "left"] as const).map((id) =>
        placed[id] ? (
          <mesh key={id} geometry={geos[id]}>
            <meshStandardMaterial color="#2b2f36" roughness={0.6} />
          </mesh>
        ) : null,
      )}
    </>
  );
}

function AedRig({ angle, dragging, still }: { angle: React.RefObject<number>; dragging: React.RefObject<boolean>; still: boolean }) {
  const { camera, size } = useThree();
  const sway = useRef(0);
  // high over the chest from the left, a little towards the head: Red's arms fall away from the right pad's place
  const target = useMemo(() => new THREE.Vector3(0.1, 0.2, -0.68), []);
  useFrame((_, dt) => {
    if (!still && !dragging.current) sway.current += dt;
    const narrow = size.width / size.height < 0.95;
    const a = -0.12 + angle.current + Math.sin(sway.current * 0.3) * 0.05;
    const r = narrow ? 1.12 : 1.0;
    const h = narrow ? 2.15 : 1.95;
    camera.position.set(target.x + Math.cos(a) * r, target.y + h, target.z + Math.sin(a) * r);
    camera.lookAt(target);
  });
  return null;
}

const TEAM = ["red", "orange"] as const;

export default function AedScene3D({
  view,
  onTap,
  onMiss,
  className,
}: {
  view: AedView;
  onTap: (tap: Tap & { y: number }) => void;
  /** a tap that hit nothing at all */
  onMiss?: () => void;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const dragging = useRef(false);
  const last = useRef(0);
  const { visible, still } = useSceneVisibility(wrap);
  const step = teamStep(view.stage);

  const tap = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return; // a drag that ended on the player turns the view; it is not a tap
    onTap({ x: e.point.x, y: e.point.y, z: e.point.z });
  };

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
        const dx = e.clientX - last.current;
        last.current = e.clientX;
        angle.current = Math.max(-0.7, Math.min(0.7, angle.current - dx * 0.008));
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 42, near: 0.05, far: 140, position: [1, 1.4, -0.2] }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0B1F3A");
          scene.fog = new THREE.Fog("#0B1F3A", 22, 60);
        }}
        onPointerMissed={(e) => {
          if (e.type === "click") onMiss?.();
        }}
      >
        <Lights />
        <AedRig angle={angle} dragging={dragging} still={still} />
        <Stadium />
        <Player
          step={step}
          scenario="aed"
          shirt={view.exposed ? "off" : "on"}
          shockAt={view.shockAt}
          onTap={tap}
          chest={(["right", "left"] as const).map((id) => (
            <Pad key={id} id={id} on={view.placed[id]} ghost={view.ghosts[id]} />
          ))}
        />
        <Aed stage={view.stage} placed={view.placed} shockAt={view.shockAt} />
        <Cables placed={view.placed} />
        <Bag step={step} />
        <MissMark miss={view.miss} />
        <Team ids={TEAM} step={step} scenario="aed" />
      </Canvas>
    </div>
  );
}
