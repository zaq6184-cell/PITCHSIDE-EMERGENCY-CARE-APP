/* eslint-disable react-refresh/only-export-components -- a dev tool run by a script, never hot-reloaded */
/**
 * AR model export, run inside the browser by scripts/build-ar-models.mjs through the Vite dev server: poses
 * the app's own 3D set piece at one drill step and returns it as GLB (Android: Google's Scene Viewer), USDZ
 * (iPhone and iPad: AR Quick Look) and a preview picture, so the AR team is the same team as in the drills.
 * recordDrill → exportSegment → finishDrill records a whole drill on its timeline and exports each step,
 * and the drill end to end, with the team moving (glTF animation; USD time samples).
 */
import { createRoot, extend, type RootState, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import { PeapMarks } from "../../src/components/peap-marks";
import { SetPiece } from "../../src/components/scene-3d";
import { type DrillSegment, drillTimeline, stateAt, type TimelineEvent } from "../../src/lib/drill-timeline";
import { KIT_FOR, preloadKit } from "../../src/lib/kit-models";
import { spineCallouts, spineSteps } from "../../src/lib/spine-drill";
import { drillCallouts } from "../../src/lib/voice";
import { workshop } from "../../src/lib/workshop";
import { USDZExporter as AnimatedUSDZExporter } from "./usdz-animated.js";

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

/**
 * The team's materials are see-through only so the app can dim a role: at full opacity they go out solid, as Google's
 * AR viewer draws a see-through (glTF BLEND) part without depth and limbs show through bodies. The parts that are
 * meant to be see-through (the mask, the oxygen tubing) stay so. Returns the undo.
 */
function solid(root: THREE.Object3D) {
  const made = new Set<THREE.MeshStandardMaterial>();
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if ((o as THREE.Mesh).isMesh && mat?.transparent && mat.opacity === 1 && !mat.map && !mat.alphaMap) made.add(mat);
  });
  made.forEach((m) => (m.transparent = false));
  return () => made.forEach((m) => (m.transparent = true));
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
  await preloadKit(KIT_FOR[scenario]); // the real kit, not its stand-ins
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
  const undo = solid(g);
  const glb = (await new GLTFExporter().parseAsync(g, { binary: true, onlyVisible: true })) as ArrayBuffer;
  const usdz = await new USDZExporter().parseAsync(g, { quickLookCompatible: true });
  undo();
  hidden.forEach((o) => (o.visible = true));
  root.unmount();
  canvas.remove();
  return { glb: base64(new Uint8Array(glb)), usdz: base64(usdz), picture };
}

// ------------------------------------------------------------------ the drill in motion
/** A hidden moment is the part shrunk to almost nothing (a zero scale would be singular). */
const HIDDEN = 1e-4;
/** Keyframes at least every 24 frames, so thinning stays quick. */
const MAX_SPAN = 24;
const flush = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));
const isStandard = (o: THREE.Object3D) => Boolean((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material as THREE.MeshStandardMaterial)?.isMeshStandardMaterial);

/**
 * The frames that linear interpolation cannot stand in for (within `eps`), and those either side of a
 * hide or show; null when the value never changes.
 */
function thin(values: Float32Array, stride: number, eps: number, shown: Uint8Array) {
  const n = values.length / stride;
  const keep = [0];
  let a = 0;
  for (let b = 2; b < n; b++) {
    let ok = b - a <= MAX_SPAN && shown[b] === shown[b - 1];
    for (let i = a + 1; i < b && ok; i++) {
      const u = (i - a) / (b - a);
      for (let c = 0; c < stride; c++) {
        const va = values[a * stride + c];
        if (Math.abs(va + (values[b * stride + c] - va) * u - values[i * stride + c]) > eps) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) {
      keep.push(b - 1);
      a = b - 1;
    }
  }
  if (n > 1) keep.push(n - 1);
  const still = keep.every((f) => Array.from({ length: stride }, (_, c) => Math.abs(values[f * stride + c] - values[c]) <= eps).every(Boolean));
  return still ? null : [...new Set(keep)];
}

type Recording = {
  scenario: Scenario;
  fps: number;
  frames: number;
  segments: DrillSegment[];
  length: number;
  root: ReturnType<typeof createRoot>;
  canvas: HTMLCanvasElement;
  state: RootState;
  team: THREE.Group;
  draw: (scene: THREE.Object3D, camera: THREE.Camera) => void;
  nodes: THREE.Object3D[];
  meshes: THREE.Mesh[];
  pos: Float32Array;
  quat: Float32Array;
  scl: Float32Array;
  shown: Uint8Array;
  world: Float32Array;
  meshShown: Uint8Array;
};
let rec: Recording | null = null;

/**
 * Plays a drill on its own timeline (lib/drill-timeline.ts — the pacing of the 3D drill player) and
 * records every part of the scene, frame by frame on a manual clock: position, rotation, scale, whether
 * it shows (its own switch, and not parked more than a metre below the feet), and each mesh's place.
 */
export async function recordDrill(scenario: Scenario, { fps = 15, durations, lead = 3000 }: { fps?: number; durations: Record<string, number>; lead?: number }) {
  const script = scenario === "spine" ? spineCallouts : drillCallouts;
  const steps = scenario === "spine" ? spineSteps : workshop.steps;
  const { segments, length } = drillTimeline(script, steps, durations, lead);
  const frames = Math.floor((length / 1000) * fps) + 1;
  await preloadKit(KIT_FOR[scenario]); // the real kit, not its stand-ins
  const W = 720;
  const H = 480;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px`;
  document.body.appendChild(canvas);
  const root = createRoot(canvas);
  await root.configure({
    size: { width: W, height: H, top: 0, left: 0 },
    dpr: 1,
    gl: { alpha: true, antialias: true, preserveDrawingBuffer: true },
    camera: { fov: 40, position: [1.7, 4.3, 5.6] },
    frameloop: "never",
  });
  let state: RootState | null = null;
  let team: THREE.Group | null = null;
  const scene = (step: number, phase: number) => (
    <>
      <Grab onState={(st) => (state = st)} />
      <hemisphereLight args={["#ffffff", "#8a8f99", 1.2]} />
      <directionalLight position={[2.5, 5, 3.5]} intensity={1.7} />
      <group
        ref={(grp) => {
          if (grp) team = grp;
        }}
      >
        <PeapMarks />
        <SetPiece step={step} phase={phase} scenario={scenario} />
      </group>
    </>
  );
  root.render(scene(0, 0));
  for (let i = 0; i < 30 && !(state && team); i++) await flush();
  const s = state as RootState | null;
  const g = team as THREE.Group | null;
  if (!s || !g) throw new Error("the scene did not start");
  const draw = s.gl.render.bind(s.gl);
  s.gl.render = () => {}; // nothing is drawn while recording: only the poses are needed
  const dt = 1 / fps;
  let clock = 0;
  // the team settles into place first
  for (let i = 0; i < 2.5 * fps; i++) s.advance((clock += dt));

  const nodes: THREE.Object3D[] = [];
  g.traverse((o) => {
    if (o !== g) nodes.push(o);
  });
  nodes.forEach((o, i) => (o.name = `n${i}`)); // the animation finds each part by name
  const index = new Map(nodes.map((o, i) => [o, i]));
  const meshes = nodes.filter(isStandard) as THREE.Mesh[];
  const N = nodes.length;
  const M = meshes.length;
  const pos = new Float32Array(frames * N * 3);
  const quat = new Float32Array(frames * N * 4);
  const scl = new Float32Array(frames * N * 3);
  const shown = new Uint8Array(frames * N);
  const world = new Float32Array(frames * M * 16);
  const meshShown = new Uint8Array(frames * M);
  const at = new THREE.Vector3();
  const own = new Uint8Array(N);
  let cur = { step: 0, phase: 0 };
  for (let f = 0; f < frames; f++) {
    const want = stateAt(segments, (f / fps) * 1000);
    if (want.step !== cur.step || want.phase !== cur.phase) {
      cur = want;
      root.render(scene(cur.step, cur.phase));
      await flush();
    }
    s.advance((clock += dt));
    g.updateMatrixWorld(true);
    nodes.forEach((o, i) => {
      const p = f * N + i;
      pos[p * 3] = o.position.x;
      pos[p * 3 + 1] = o.position.y;
      pos[p * 3 + 2] = o.position.z;
      // keep each rotation on the same side as the last, so interpolation takes the short way round
      let { x, y, z, w } = o.quaternion;
      if (f > 0) {
        const q = (p - N) * 4;
        if (x * quat[q] + y * quat[q + 1] + z * quat[q + 2] + w * quat[q + 3] < 0) [x, y, z, w] = [-x, -y, -z, -w];
      }
      quat.set([x, y, z, w], p * 4);
      scl[p * 3] = o.scale.x;
      scl[p * 3 + 1] = o.scale.y;
      scl[p * 3 + 2] = o.scale.z;
      own[i] = o.visible && o.getWorldPosition(at).z <= 2.0 ? 1 : 0;
      shown[p] = own[i];
    });
    meshes.forEach((m, j) => {
      world.set(m.matrixWorld.elements, (f * M + j) * 16);
      let ok = 1;
      for (let o: THREE.Object3D | null = m; o && o !== g && ok; o = o.parent) ok = own[index.get(o) as number];
      meshShown[f * M + j] = ok;
    });
  }
  rec = { scenario, fps, frames, segments, length, root, canvas, state: s, team: g, draw, nodes, meshes, pos, quat, scl, shown, world, meshShown };
  return {
    frames,
    length,
    segments: [...segments.map((x) => ({ name: String(x.step), start: x.start, length: x.length })), { name: "all", start: 0, length }],
  };
}

/** Puts the scene in a recorded frame. */
function pose(r: Recording, f: number) {
  r.nodes.forEach((o, i) => {
    const p = f * r.nodes.length + i;
    o.position.fromArray(r.pos, p * 3);
    o.quaternion.fromArray(r.quat, p * 4);
    o.scale.fromArray(r.scl, p * 3);
    o.visible = r.shown[p] === 1;
  });
  r.team.updateMatrixWorld(true);
}

/**
 * One stretch of the recording — a step ("0" … "7") or the whole drill ("all") — as an animated GLB and
 * USDZ, and its call-outs with times from its start (for the narration track).
 */
export async function exportSegment(name: string) {
  const r = rec;
  if (!r) throw new Error("record a drill first");
  const { fps, nodes, meshes } = r;
  const N = nodes.length;
  const M = meshes.length;
  const seg = name === "all" ? { start: 0, length: r.length, events: r.segments.flatMap((x) => x.events) } : r.segments.find((x) => String(x.step) === name);
  if (!seg) throw new Error(`no segment ${name}`);
  const f0 = Math.round((seg.start / 1000) * fps);
  const f1 = Math.min(r.frames - 1, Math.round(((seg.start + seg.length) / 1000) * fps));
  const count = f1 - f0 + 1;
  const animated = name !== "0";

  // the parts that show at some moment of the stretch go out; the rest (and the selection rings) stay behind
  const ever = new Uint8Array(N);
  for (let f = f0; f <= f1; f++) for (let i = 0; i < N; i++) if (r.shown[f * N + i]) ever[i] = 1;
  pose(r, f0);
  nodes.forEach((o, i) => {
    o.visible = ever[i] === 1 && (!(o as THREE.Mesh).isMesh || isStandard(o));
    if (o.visible && animated && !r.shown[f0 * N + i]) o.scale.setScalar(HIDDEN);
  });

  const tracks: THREE.KeyframeTrack[] = [];
  if (animated) {
    nodes.forEach((o, i) => {
      if (!o.visible) return;
      const P = new Float32Array(count * 3);
      const Q = new Float32Array(count * 4);
      const S = new Float32Array(count * 3);
      const vis = new Uint8Array(count);
      for (let k = 0; k < count; k++) {
        const p = (f0 + k) * N + i;
        P.set(r.pos.subarray(p * 3, p * 3 + 3), k * 3);
        Q.set(r.quat.subarray(p * 4, p * 4 + 4), k * 4);
        vis[k] = r.shown[p];
        for (let c = 0; c < 3; c++) S[k * 3 + c] = vis[k] ? r.scl[p * 3 + c] : HIDDEN;
      }
      const add = (prop: string, values: Float32Array, stride: number, eps: number, Track: typeof THREE.VectorKeyframeTrack) => {
        const keep = thin(values, stride, eps, vis);
        if (!keep) return;
        const times = keep.map((k) => k / fps);
        const out = keep.flatMap((k) => Array.from(values.subarray(k * stride, k * stride + stride)));
        tracks.push(new Track(`${o.name}.${prop}`, times, out));
      };
      add("position", P, 3, 0.001, THREE.VectorKeyframeTrack);
      add("quaternion", Q, 4, 0.002, THREE.QuaternionKeyframeTrack);
      add("scale", S, 3, 0.002, THREE.VectorKeyframeTrack);
    });
  }
  const clip = tracks.length ? new THREE.AnimationClip(`${r.scenario}-${name}`, (count - 1) / fps, tracks) : null;
  const undo = solid(r.team);
  const glb =(await new GLTFExporter().parseAsync(r.team, { binary: true, onlyVisible: true, animations: clip ? [clip] : [] })) as ArrayBuffer;

  // USDZ: each mesh's place over time (or, for the team in place, as it stands)
  let usdz: Uint8Array;
  if (animated) {
    const list: THREE.Mesh[] = [];
    const samples = new Map<THREE.Mesh, { matrices: Float32Array; visible: Uint8Array }>();
    meshes.forEach((m, j) => {
      const visible = new Uint8Array(count);
      const matrices = new Float32Array(count * 16);
      for (let k = 0; k < count; k++) {
        const f = f0 + k;
        visible[k] = r.meshShown[f * M + j];
        matrices.set(r.world.subarray((f * M + j) * 16, (f * M + j) * 16 + 16), k * 16);
      }
      if (visible.some(Boolean)) {
        list.push(m);
        samples.set(m, { matrices, visible });
      }
    });
    usdz = await new AnimatedUSDZExporter().parseAsync(r.team, { quickLookCompatible: true, animation: { fps, frames: count, meshes: list, samples } });
  } else {
    nodes.forEach((o, i) => (o.visible = r.shown[f0 * N + i] === 1 && (!(o as THREE.Mesh).isMesh || isStandard(o))));
    usdz = await new AnimatedUSDZExporter().parseAsync(r.team, { quickLookCompatible: true });
  }
  undo();
  const events: TimelineEvent[] = seg.events.map((e) => ({ ...e, at: e.at - seg.start }));
  return { glb: base64(new Uint8Array(glb)), usdz: base64(usdz), lengthMs: Math.round(((count - 1) / fps) * 1000), tracks: tracks.length, events };
}

// ------------------------------------------------------------------ moving cards (the AR page's previews)
type CardView = { width: number; height: number; dir: [number, number, number]; fit: number };
const CARD_VIEW: CardView = { width: 720, height: 480, dir: [0.32, 0.62, 0.72], fit: 0.62 };
let cardView: { centre: THREE.Vector3; dir: THREE.Vector3; dist: number; width: number; height: number } | null = null;

/**
 * Frames a stretch for scripts/build-ar-cards.mjs: the team as it shows at a moment well into the stretch (the preview
 * moment), seen from the feet end, a little to the side and high, or with another view (the AR page's phone picture is
 * portrait, from further round); returns the stretch's frames and the preview frame, where its loop starts.
 */
export function cardFraming(name: string, view: CardView = CARD_VIEW) {
  const r = rec;
  if (!r) throw new Error("record a drill first");
  const seg = name === "all" ? { start: 0, length: r.length } : r.segments.find((x) => String(x.step) === name);
  if (!seg) throw new Error(`no segment ${name}`);
  const f0 = Math.round((seg.start / 1000) * r.fps);
  const f1 = Math.min(r.frames - 1, Math.round(((seg.start + seg.length) / 1000) * r.fps));
  const preview = f0 + Math.round((f1 - f0) * (name === "all" ? 0.3 : 0.55));
  pose(r, preview);
  const box = visibleBox(r.team);
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const fov = (r.state.camera as THREE.PerspectiveCamera).fov;
  cardView = {
    centre: box.getCenter(new THREE.Vector3()),
    dir: new THREE.Vector3(...view.dir).normalize(),
    dist: (radius / Math.sin((fov * Math.PI) / 360)) * view.fit,
    width: view.width,
    height: view.height,
  };
  return { f0, f1, preview };
}

/** Recorded frames as WebP pictures (transparent background) with cardFraming's view; `sway` turns the camera round the team (degrees, one per frame). */
export function renderCardFrames(frames: number[], sway?: number[]) {
  const r = rec;
  const v = cardView;
  if (!r || !v) throw new Error("frame a stretch first");
  const gl = r.state.gl;
  if (r.canvas.width !== v.width || r.canvas.height !== v.height) gl.setSize(v.width, v.height, false);
  const cam = r.state.camera as THREE.PerspectiveCamera;
  const up = new THREE.Vector3(0, 1, 0);
  return frames.map((f, i) => {
    pose(r, f);
    const d = v.dir.clone();
    if (sway) d.applyAxisAngle(up, (sway[i] * Math.PI) / 180);
    cam.aspect = v.width / v.height;
    cam.position.copy(v.centre).addScaledVector(d, v.dist);
    cam.lookAt(v.centre);
    cam.updateProjectionMatrix();
    r.draw(r.state.scene, cam);
    return r.canvas.toDataURL("image/webp", 0.92);
  });
}

export function finishDrill() {
  if (!rec) return;
  rec.root.unmount();
  rec.canvas.remove();
  rec = null;
  cardView = null;
}
