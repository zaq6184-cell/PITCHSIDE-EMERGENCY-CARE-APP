import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { type KitName, kitModel, loadKit } from "@/lib/kit-models";

/**
 * One piece of kit in the 3D set piece: the real model (lib/kit-models.ts) once it has loaded, the simple
 * shape (`children`) until then, or if it cannot load. `glow` (on the scene's frame loop) lights it up in
 * `glowColor`, as the AED does when it shocks.
 */
export function KitModel({ name, children, glow, glowColor = "#FFD34D" }: { name: KitName; children?: ReactNode; glow?: React.RefObject<number>; glowColor?: string }) {
  const [source, setSource] = useState(() => kitModel(name));
  useEffect(() => {
    if (source) return;
    let alive = true;
    void loadKit(name).then(() => {
      if (alive) setSource(kitModel(name));
    });
    return () => {
      alive = false;
    };
  }, [name, source]);
  // each copy has its own materials, so one glowing AED does not light up another
  const { object, materials } = useMemo(() => {
    if (!source) return { object: null, materials: [] as THREE.MeshStandardMaterial[] };
    const copy = source.clone(true);
    const mats: THREE.MeshStandardMaterial[] = [];
    copy.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const own = (mesh.material as THREE.MeshStandardMaterial).clone();
      mesh.material = own;
      mats.push(own);
    });
    return { object: copy, materials: mats };
  }, [source]);
  const tint = useMemo(() => new THREE.Color(glowColor), [glowColor]);
  useFrame(() => {
    if (!glow || !materials.length) return;
    const g = glow.current;
    for (const m of materials) {
      if (g > 0.06) {
        m.emissive.copy(tint);
        m.emissiveIntensity = g;
      } else m.emissive.set(0x000000);
    }
  });
  // the geometry and pictures are shared with the loaded original: never dispose them here
  return object ? <primitive object={object} dispose={null} /> : <>{children}</>;
}
