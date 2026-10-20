import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { SetPiece } from "@/components/scene-3d";

type Scenario = "arrest" | "spine";

/** iPhone and iPad: pose the team off screen for a moment, export it as USDZ and open AR Quick Look. */
export default function QuickLookExport({ scenario, step, onDone }: { scenario: Scenario; step: number; onDone: (blob: Blob | null) => void }) {
  const group = useRef<THREE.Group>(null);
  return (
    <div style={{ position: "fixed", left: 0, top: 0, width: 320, height: 320, opacity: 0, pointerEvents: "none" }} aria-hidden="true">
      <Canvas dpr={1} camera={{ position: [0, 4, 6] }} gl={{ antialias: false, powerPreference: "low-power" }}>
        <ExportWhenPosed target={group} onDone={onDone} />
        <group ref={group}>
          <SetPiece step={step} scenario={scenario} />
        </group>
      </Canvas>
    </div>
  );
}

function ExportWhenPosed({ target, onDone }: { target: React.RefObject<THREE.Group | null>; onDone: (blob: Blob | null) => void }) {
  const frames = useRef(0);
  const started = useRef(false);
  useFrame(({ clock }) => {
    frames.current += 1;
    // let the figures settle into their poses: a few frames and most of a second (slow devices take bigger steps)
    if (frames.current < 3 || clock.elapsedTime < 0.8 || started.current) return;
    started.current = true;
    const g = target.current;
    if (!g) return onDone(null);
    void (async () => {
      try {
        const { USDZExporter } = await import("three/examples/jsm/exporters/USDZExporter.js");
        g.updateMatrixWorld(true);
        // only standard materials go into USDZ: the selection rings stay behind
        const hidden: THREE.Object3D[] = [];
        g.traverse((o) => {
          const mesh = o as THREE.Mesh;
          const mat = mesh.material as THREE.Material | undefined;
          if (mesh.isMesh && mat && !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial && o.visible) {
            o.visible = false;
            hidden.push(o);
          }
        });
        const data = await new USDZExporter().parseAsync(g, { quickLookCompatible: true });
        hidden.forEach((o) => (o.visible = true));
        onDone(new Blob([data as BlobPart], { type: "model/vnd.usdz+zip" }));
      } catch {
        onDone(null);
      }
    })();
  });
  return null;
}
