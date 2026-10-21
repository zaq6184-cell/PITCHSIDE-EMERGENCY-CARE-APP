/* eslint-disable react-refresh/only-export-components -- a dev tool run by a script, never hot-reloaded */
/**
 * AR model export, run inside the browser by scripts/build-ar-models.mjs through the Vite dev server: poses
 * the app's own 3D set piece at one drill step and returns it as GLB (Android: Google's Scene Viewer), USDZ
 * (iPhone and iPad: AR Quick Look) and a preview picture, so the AR team is the same team as in the drills.
 */
import { createRoot, extend, type RootState, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import { PeapMarks } from "../../src/components/peap-marks";
import { SetPiece } from "../../src/components/scene-3d";

// createRoot, unlike <Canvas>, starts with an empty catalogue of three.js objects
extend(THREE as unknown as Parameters<typeof extend>[0]);

type Scenario = "arrest" | "spine";

function base64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** The bounds of what is shown: hidden parts and the invisible selection rings do not count. */
function visibleBox(root: THREE.Object3D) {
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  root.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    const mat = mesh.material as (THREE.Material & { opacity: number }) | undefined;
    if (!mesh.isMesh || !mat || (mat.transparent && mat.opacity === 0)) return;
    mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) box.union(part.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
  });
  return box;
}

/** Hands the renderer's state out of the React tree, and frames the team for the preview picture. */
function Grab({ onState }: { onState: (s: RootState) => void }) {
  const state = useThree();
  useEffect(() => {
    state.camera.lookAt(0.05, 0.15, 0.05);
    onState(state);
  }, [state, onState]);
  return null;
}

type View = { width: number; height: number; dir: [number, number, number]; fit: number; png?: boolean };

export async function exportStep(
  scenario: Scenario,
  step: number,
  { phase = 0, settleMs = 2200, view = { width: 720, height: 480, dir: [0.32, 0.62, 0.72], fit: 0.62 } }: { phase?: number; settleMs?: number; view?: View } = {},
) {
  const W = view.width;
  const H = view.height;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px`;
  document.body.appendChild(canvas);
  const root = createRoot(canvas);
  await root.configure({
    size: { width: W, height: H, top: 0, left: 0 },
    dpr: 1,
    gl: { alpha: true, antialias: true, preserveDrawingBuffer: true },
    camera: { fov: 40, position: [1.7, 4.3, 5.6] },
    frameloop: "always",
  });
  let state: RootState | null = null;
  let team: THREE.Group | null = null;
  root.render(
    <>
      <Grab onState={(s) => (state = s)} />
      <hemisphereLight args={["#ffffff", "#8a8f99", 1.2]} />
      <directionalLight position={[2.5, 5, 3.5]} intensity={1.7} />
      <group
        ref={(g) => {
          team = g;
        }}
      >
        <PeapMarks />
        <SetPiece step={step} phase={phase} scenario={scenario} />
      </group>
    </>,
  );
  // the figures move into the step's pose over the first second or so
  await new Promise((r) => setTimeout(r, settleMs));
  const s = state as RootState | null;
  const g = team as THREE.Group | null;
  if (!s || !g) throw new Error("the scene did not start");
  s.setFrameloop("never");
  g.updateMatrixWorld(true);
  // kit parked more than a metre below the feet (the scoop, the basket 2–3 lengths away) stays out of the
  // room: the AR scene is the team at work, about 4 × 4.5 m at full size
  // (a piece of kit goes as a whole: a mesh beyond the line, or one whose group is)
  const at = new THREE.Vector3();
  const beyond = (o: THREE.Object3D) => o.getWorldPosition(at).z > 2.0;
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.visible && (beyond(o) || (o.parent && o.parent !== g && beyond(o.parent)))) o.visible = false;
  });
  // frame the whole pose (team, player and kit) from the feet end, a little to the side and high
  const box = visibleBox(g);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const cam = s.camera as THREE.PerspectiveCamera;
  const dist = (radius / Math.sin((cam.fov * Math.PI) / 360)) * view.fit;
  cam.aspect = W / H;
  cam.position.copy(centre).addScaledVector(new THREE.Vector3(...view.dir).normalize(), dist);
  cam.lookAt(centre);
  cam.updateProjectionMatrix();
  s.gl.render(s.scene, s.camera);
  const picture = canvas.toDataURL(view.png ? "image/png" : "image/webp", 0.86);

  g.updateMatrixWorld(true);
  // only the standard (lit) materials go out: the invisible selection rings stay behind
  const hidden: THREE.Object3D[] = [];
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    const mat = mesh.material as THREE.Material | undefined;
    if (mesh.isMesh && mat && !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial && o.visible) {
      o.visible = false;
      hidden.push(o);
    }
  });
  const glb = (await new GLTFExporter().parseAsync(g, { binary: true, onlyVisible: true })) as ArrayBuffer;
  const usdz = await new USDZExporter().parseAsync(g, { quickLookCompatible: true });
  hidden.forEach((o) => (o.visible = true));
  root.unmount();
  canvas.remove();
  return { glb: base64(new Uint8Array(glb)), usdz: base64(usdz), picture };
}
