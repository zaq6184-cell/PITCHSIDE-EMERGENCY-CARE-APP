import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SPOTS } from "@/lib/spots";
import { workshop } from "@/lib/workshop";

/** A round floor mark in the colour, with its number in the colour's own text colour. */
function markTexture(num: number, fill: string, ink: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = fill;
  x.fillRect(0, 0, 128, 128);
  x.fillStyle = ink;
  x.font = `700 86px "Barlow Condensed", "Arial Narrow", sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(String(num), 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// the middle of the player, lying along z; each mark sits a step back from its colour, away from the player
const MID_Z = -0.15;
const BACK = 0.95; // clear of a kneeling colour's shins

/**
 * The PEAP marks for augmented reality: each colour's numbered spot on the floor (Black 1 … Green 6),
 * a step behind where that colour works, so a trainee walking round the team in the room can find their
 * place and their hand-signal number. Client only (it draws its numbers on a canvas).
 */
export function PeapMarks() {
  const marks = useMemo(
    () =>
      SPOTS.map((s) => {
        const role = workshop.roles.find((r) => r.id === s.id);
        const dx = s.x;
        const dz = s.z - MID_Z;
        const k = BACK / (Math.hypot(dx, dz) || 1);
        return { id: s.id, x: s.x + dx * k, z: s.z + dz * k, tex: role ? markTexture(role.num, s.color, role.text) : null };
      }),
    [],
  );
  useEffect(() => () => marks.forEach((m) => m.tex?.dispose()), [marks]);
  return (
    <group name="peap-marks">
      {marks.map((m) => (
        <group key={m.id} position={[m.x, 0, m.z]}>
          {/* a navy rim keeps the White mark visible on a pale floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
            <circleGeometry args={[0.17, 40]} />
            <meshStandardMaterial color="#0b1f3a" roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <circleGeometry args={[0.148, 40]} />
            <meshStandardMaterial map={m.tex} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
