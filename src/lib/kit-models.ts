import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { asset } from "@/lib/asset";

/**
 * Real kit for the 3D set piece and the AR models: low-poly models made with Higgsfield (Tripo text-to-3D),
 * shrunk for phones (public/models/kit: 512 px JPEG textures, simplified and quantised meshes). Each one is
 * fitted to the box it should fill; components/kit-model.tsx shows it in place of the simple shape.
 */
export type KitName = "bag" | "aed" | "oxygen" | "bvm" | "scoop" | "basket" | "board" | "collar";

type Fit = {
  /** the box to fill, in metres: x across, y up, z along the player */
  size: [number, number, number];
  /** turn the model first (radians, XYZ) so its long side runs the right way */
  turn?: [number, number, number];
  /** squeeze to fill the box exactly; otherwise scale evenly to fit inside it */
  stretch?: boolean;
  /** sit on the floor (default), or centre on the origin */
  centre?: boolean;
};

const FIT: Record<KitName, Fit> = {
  bag: { size: [0.55, 0.5, 0.5], turn: [0, Math.PI / 2, 0] },
  // screen towards the player
  aed: { size: [0.3, 0.28, 0.3], turn: [0, Math.PI, 0] },
  // valve towards the head
  oxygen: { size: [0.3, 0.3, 0.72], turn: [0, Math.PI, 0], centre: true },
  // mask down onto the face once its group lays it across the head
  bvm: { size: [0.18, 0.3, 0.18], turn: [0, Math.PI, 0], centre: true },
  scoop: { size: [0.64, 0.07, 1.95], stretch: true },
  basket: { size: [0.7, 0.2, 2.1], stretch: true },
  board: { size: [0.5, 0.06, 1.9], turn: [0, Math.PI / 2, 0], stretch: true },
  // round the neck, the chin support on top (the player lies on the back)
  collar: { size: [0.2, 0.17, 0.11], turn: [0, Math.PI / 2, Math.PI / 2], stretch: true, centre: true },
};

/** Which models each drill shows. */
export const KIT_FOR: Record<"arrest" | "spine", readonly KitName[]> = {
  arrest: ["bag", "aed", "oxygen", "bvm", "board", "basket"],
  spine: ["bag", "aed", "oxygen", "scoop", "basket", "collar"],
};

const models = new Map<KitName, THREE.Object3D>();
const loading = new Map<KitName, Promise<void>>();

/** The model in a wrapper sized and turned to its box, so it can stand in for the simple shape as it is. */
function fitted(name: KitName, scene: THREE.Object3D) {
  const fit = FIT[name];
  const turned = new THREE.Group();
  turned.rotation.set(...(fit.turn ?? [0, 0, 0]));
  turned.add(scene);
  turned.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(turned);
  const size = box.getSize(new THREE.Vector3());
  const k = fit.size.map((v, i) => v / Math.max(size.getComponent(i), 1e-6));
  const scale = fit.stretch ? new THREE.Vector3(k[0], k[1], k[2]) : new THREE.Vector3().setScalar(Math.min(...k));
  const centre = box.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  wrap.name = `kit-${name}`;
  wrap.scale.copy(scale);
  wrap.add(turned);
  turned.position.set(-centre.x, fit.centre ? -centre.y : -box.min.y, -centre.z);
  turned.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // the files store the shapes as small whole numbers; back to plain floats, which the AR exporters need
    const geo = mesh.geometry;
    for (const [key, attr] of Object.entries(geo.attributes) as [string, THREE.BufferAttribute][]) {
      if (attr.array instanceof Float32Array && !attr.normalized) continue;
      const out = new Float32Array(attr.count * attr.itemSize);
      for (let i = 0; i < attr.count; i++) for (let c = 0; c < attr.itemSize; c++) out[i * attr.itemSize + c] = attr.getComponent(i, c);
      geo.setAttribute(key, new THREE.BufferAttribute(out, attr.itemSize));
    }
    for (const m of [mesh.material].flat() as THREE.MeshStandardMaterial[]) {
      // the AR models keep JPEG pictures (much smaller than PNG), and nothing glows unless asked to
      if (m.map) m.map.userData.mimeType = "image/jpeg";
      m.emissive?.set(0x000000);
    }
  });
  return wrap;
}

/** Load one model (once); the promise settles either way, and a failed load leaves the simple shape. */
export function loadKit(name: KitName) {
  let p = loading.get(name);
  if (!p) {
    p = new GLTFLoader()
      .loadAsync(asset(`/models/kit/${name}.glb`))
      .then((gltf) => {
        models.set(name, fitted(name, gltf.scene));
      })
      .catch(() => {
        // the simple shape stays
      });
    loading.set(name, p);
  }
  return p;
}

/** The loaded, fitted model, if it is ready. */
export const kitModel = (name: KitName) => models.get(name);

/** Load a drill's kit (the AR recorder waits for this before it starts). */
export const preloadKit = (names: readonly KitName[]) => Promise.all(names.map(loadKit)).then(() => undefined);
