import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { RoleId } from "@/lib/workshop";

/**
 * Real-time 3D set piece, drawn from simple original shapes: a floodlit pitch, a player lying on the
 * back (head away from the default camera) and the six colour roles where FIFA's PEAP poster puts
 * them — Orange and Green at the head, Red / Blue / White down the player's right, Black on the left.
 * Drag to turn, tap a figure to select it. `step` (1–6) plays the cardiac arrest drill.
 */
type Spot = { id: RoleId; color: string; x: number; z: number; face: number };

/**
 * Turn a figure so it faces a point on the player. A figure's front (arms, lean) is its local -z;
 * rotating by θ about y points that front along (-sin θ, -cos θ), so θ = atan2(-dx, -dz).
 */
const facing = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

// Player's right is -x (viewer's left when looking from the feet towards the head).
// Player lies along z: head at z ≈ -1.0, chest ≈ -0.5, pelvis ≈ 0.1, legs ≈ 0.8.
const SPOTS: Spot[] = [
  { id: "orange", color: "#E36B12", x: -0.05, z: -1.8, face: facing(-0.05, -1.8, 0, -1.02) }, // holds the head
  { id: "green", color: "#1E8A4C", x: 1.0, z: -1.55, face: facing(1.0, -1.55, 0.2, -0.75) }, // bag and AED, towards the chest
  { id: "red", color: "#C0392B", x: -1.15, z: -0.55, face: facing(-1.15, -0.55, 0, -0.5) }, // chest
  { id: "blue", color: "#1F6AA5", x: -1.2, z: 0.35, face: facing(-1.2, 0.35, 0, 0.15) }, // pelvis
  { id: "white", color: "#F4F4F1", x: -1.15, z: 1.3, face: facing(-1.15, 1.3, 0, 0.9) }, // lower legs
  { id: "black", color: "#1C1C1C", x: 1.35, z: -0.3, face: facing(1.35, -0.3, 0, -0.4) }, // level with the chest
];

const SKIN = "#C68E6A";
const GOLD = "#C9A227";
const CPR_HZ = 110 / 60;

function Figure({
  spot,
  selected,
  dim,
  step,
  onSelect,
}: {
  spot: Spot;
  selected: boolean;
  dim: boolean;
  step: number;
  onSelect?: (id: RoleId) => void;
}) {
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const acting =
    (step === 1 && (spot.id === "red" || spot.id === "black")) ||
    (step === 2 && spot.id === "red") ||
    (step === 3 && (spot.id === "green" || spot.id === "red")) ||
    (step === 4 && (spot.id === "orange" || spot.id === "blue" || spot.id === "red")) ||
    (step === 5 && (spot.id === "white" || spot.id === "orange" || spot.id === "blue" || spot.id === "black")) ||
    (step === 6 && (spot.id === "black" || spot.id === "green"));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = body.current;
    if (!g) return;
    // idle breathing; Red pumps the chest during compressions
    const compress = spot.id === "red" && (step === 2 || step === 3 || step === 4);
    const lean = compress ? Math.abs(Math.sin(t * Math.PI * CPR_HZ)) * 0.16 : 0;
    g.position.y = Math.sin(t * 1.4 + spot.x) * 0.012 - lean * 0.5;
    g.rotation.x = compress ? 0.35 + lean : selected || acting ? 0.22 : 0.12;
    const s = selected ? 1.08 + Math.sin(t * 5) * 0.02 : 1;
    g.scale.setScalar(s);
    if (ring.current) {
      ring.current.rotation.z = t * 0.8;
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = selected ? 0.95 : acting ? 0.55 + Math.sin(t * 4) * 0.25 : 0;
    }
  });

  const opacity = dim ? 0.35 : 1;
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.(spot.id);
  };

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.face, 0]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.46, 0.56, 40]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group
        ref={body}
        onClick={click}
        onPointerOver={() => (document.body.style.cursor = onSelect ? "pointer" : "")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {/* kneeling legs */}
        <mesh position={[0, 0.14, 0.12]} castShadow>
          <boxGeometry args={[0.42, 0.22, 0.6]} />
          <meshStandardMaterial color="#1B2333" transparent opacity={opacity} />
        </mesh>
        {/* bib / torso in the role colour */}
        <mesh position={[0, 0.58, -0.02]} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 6, 14]} />
          <meshStandardMaterial color={spot.color} roughness={0.55} transparent opacity={opacity} />
        </mesh>
        {/* arms reaching forward */}
        {[-0.24, 0.24].map((ax) => (
          <mesh key={ax} position={[ax, 0.56, -0.26]} rotation={[1.05, 0, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.36, 4, 10]} />
            <meshStandardMaterial color={spot.color} roughness={0.6} transparent opacity={opacity} />
          </mesh>
        ))}
        <mesh position={[0, 1.02, -0.04]} castShadow>
          <sphereGeometry args={[0.15, 20, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  );
}

function Player({ step }: { step: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    // chest gives under compressions; a small jolt marks the shock; a tilt marks the log roll
    const compress = step === 2 || step === 3 || step === 4 ? Math.abs(Math.sin(t * Math.PI * CPR_HZ)) * 0.03 : 0;
    const shock = step === 3 && t % 5 > 4.75 ? 0.06 : 0;
    g.current.position.y = 0.16 - compress + shock + (step === 6 ? carryLift(t) : 0);
    g.current.position.z = step === 6 ? carryTravel(t) : 0;
    g.current.rotation.z = step === 5 ? Math.sin(t * 0.9) * 0.22 : 0;
  });
  const kit = "#F7F7F5";
  return (
    <group ref={g} position={[0, 0.16, 0]}>
      <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.62, 6, 14]} />
        <meshStandardMaterial color={kit} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, -1.02]} castShadow>
        <sphereGeometry args={[0.17, 20, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {[-0.36, 0.36].map((ax) => (
        <mesh key={ax} position={[ax, -0.04, -0.3]} rotation={[Math.PI / 2, 0, ax > 0 ? -0.12 : 0.12]} castShadow>
          <capsuleGeometry args={[0.07, 0.62, 4, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      ))}
      {[-0.13, 0.13].map((lx) => (
        <mesh key={lx} position={[lx, -0.04, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.95, 4, 10]} />
          <meshStandardMaterial color={kit} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Stop-and-start carry, shortened for the screen: lift and move, then down for compressions.
const CARRY_LOOP = 9;
function carryLift(t: number) {
  const p = t % CARRY_LOOP;
  if (p < 0.6) return (p / 0.6) * 0.45;
  if (p < 5) return 0.45;
  if (p < 5.6) return (1 - (p - 5) / 0.6) * 0.45;
  return 0;
}
function carryTravel(t: number) {
  const p = t % CARRY_LOOP;
  const moving = Math.min(Math.max(p - 0.6, 0), 4.4) / 4.4;
  return moving * 1.6 - (p > 8.4 ? ((p - 8.4) / 0.6) * 1.6 : 0);
}

function Kit({ step }: { step: number }) {
  const aed = useRef<THREE.MeshStandardMaterial>(null);
  const cyl = useRef<THREE.MeshStandardMaterial>(null);
  const bag = useRef<THREE.Mesh>(null);
  const scoop = useRef<THREE.Group>(null);
  const flash = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const shock = step === 3 && t % 5 > 4.7;
    if (aed.current) aed.current.emissiveIntensity = step === 3 ? (shock ? 2.4 : 0.5 + Math.sin(t * 6) * 0.3) : 0.05;
    if (flash.current) flash.current.intensity = shock ? 14 : 0;
    if (cyl.current) cyl.current.emissiveIntensity = step === 4 ? 0.6 + Math.sin(t * 3) * 0.3 : 0.05;
    // one squeeze of the bag for every tenth compression
    if (bag.current) {
      const beat = (t * CPR_HZ) % 10;
      bag.current.scale.setScalar(step === 4 && beat < 0.9 ? 0.72 : 1);
      bag.current.visible = step >= 4 || step === 0;
    }
    if (scoop.current) {
      const target = step === 5 ? 1.9 : step === 6 ? 0.2 + carryTravel(t) : 3.3;
      scoop.current.position.z += (target - scoop.current.position.z) * 0.06;
      scoop.current.position.y = step === 6 ? 0.03 + carryLift(t) : 0.03;
    }
  });
  return (
    <group>
      {/* emergency bag and AED at the head, beside Green */}
      <mesh position={[1.75, 0.16, -1.75]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.62, 0.32, 0.42]} />
        <meshStandardMaterial color="#F2C811" roughness={0.6} />
      </mesh>
      <mesh position={[1.45, 0.1, -1.05]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.36, 0.2, 0.3]} />
        <meshStandardMaterial ref={aed} color="#3FA9B8" emissive="#FFD34D" emissiveIntensity={0.05} roughness={0.5} />
      </mesh>
      <pointLight ref={flash} position={[0.4, 0.9, -0.4]} color="#FFF3B0" intensity={0} distance={7} />
      {/* bag-valve at the head */}
      <mesh ref={bag} position={[-0.42, 0.2, -1.42]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color="#7FB8C9" roughness={0.4} />
      </mesh>
      {/* oxygen cylinder beside Blue */}
      <mesh position={[-1.9, 0.14, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.7, 18]} />
        <meshStandardMaterial ref={cyl} color="#2F6FB0" emissive="#9AD0FF" emissiveIntensity={0.05} roughness={0.35} metalness={0.3} />
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

function Stadium() {
  const stripes = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#2E7D32" roughness={1} />
      </mesh>
      {stripes.map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -26 + i * 4]} receiveShadow>
          <planeGeometry args={[70, 2]} />
          <meshStandardMaterial color="#388E3C" roughness={1} />
        </mesh>
      ))}
      {/* touchline and a centre circle behind the scene */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7]}>
        <ringGeometry args={[4.4, 4.52, 64]} />
        <meshBasicMaterial color="#F4F4F1" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -7]}>
        <planeGeometry args={[60, 0.12]} />
        <meshBasicMaterial color="#F4F4F1" />
      </mesh>
      {/* stands on three sides */}
      {[
        { p: [0, 2.2, -24], r: 0, w: 60 },
        { p: [-27, 2.2, -2], r: Math.PI / 2, w: 44 },
        { p: [27, 2.2, -2], r: -Math.PI / 2, w: 44 },
      ].map((s, i) => (
        <group key={i} position={s.p as [number, number, number]} rotation={[0, s.r, 0]}>
          {[0, 1, 2, 3].map((row) => (
            <mesh key={row} position={[0, row * 1.3 - 1.4, -row * 1.5]}>
              <boxGeometry args={[s.w, 1.3, 1.6]} />
              <meshStandardMaterial color={row % 2 ? "#17335C" : "#0F2747"} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* floodlights */}
      {[
        [-22, -22],
        [22, -22],
        [-22, 14],
        [22, 14],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 12, 8]} />
            <meshStandardMaterial color="#5B6470" />
          </mesh>
          <mesh position={[0, 12.3, 0]} rotation={[0.5, Math.atan2(-x, -z), 0]}>
            <boxGeometry args={[2.6, 1.2, 0.3]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFF6D6" emissiveIntensity={2.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rig({ autoRotate, angle, dragging }: { autoRotate: boolean; angle: React.RefObject<number>; dragging: React.RefObject<boolean> }) {
  const { camera, size } = useThree();
  const sway = useRef(0);
  useFrame((_, dt) => {
    // A slow sway either side of the viewer's angle, so the layout stays readable (player's right on the left).
    if (autoRotate && !dragging.current) sway.current += dt;
    const a = angle.current + Math.sin(sway.current * 0.22) * 0.42;
    // pull back on tall, narrow screens so the whole team stays in view
    const narrow = size.width / size.height < 0.95;
    const r = narrow ? 7.6 : 6.6;
    camera.position.set(Math.sin(a) * r, narrow ? 5.0 : 3.9, Math.cos(a) * r + 0.6);
    camera.lookAt(0, 0.45, 0.25);
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
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ fov: 44, near: 0.1, far: 140, position: [0, 5, 10] }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#0B1F3A");
          scene.fog = new THREE.Fog("#0B1F3A", 22, 60);
        }}
      >
        <hemisphereLight args={["#CFE3FF", "#1F3D22", 0.75]} />
        <directionalLight
          position={[6, 12, 5]}
          intensity={1.9}
          color="#FFF4DC"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-7, 8, -6]} intensity={0.55} color="#BFD8FF" />
        <Rig autoRotate={!still} angle={angle} dragging={dragging} />
        <Stadium />
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
