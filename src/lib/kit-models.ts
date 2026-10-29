import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { asset } from "@/lib/asset";

/**
 * Real kit for the 3D set piece and the AR models: low-poly models built in Blender from clean shapes
 * (scripts/blender/build-kit.py; plain coloured materials, no pictures), each already the way round it sits in the
 * scene. Each one is scaled evenly into the box it should fill; components/kit-model.tsx shows it in place of the
 * simple shape.
 */
export type KitName = "bag" | "aed" | "oxygen" | "bvm" | "scoop" | "basket" | "board" | "collar";

type Fit = {
  /** the box to fill, in metres: x across, y up, z along the player */
  size: [number, number, number];
  /** turn the model first (radians, XYZ) so its long side runs the right way */
  turn?: [number, number, number];
  /** sit on the floor (default), or centre on the origin */
  centre?: boolean;
};

// in proportion with the models (scripts/blender/build-kit.py prints their sizes), so none is stretched
const FIT: Record<KitName, Fit> = {
  // handles over the top, along the bag
  bag: { size: [0.6, 0.428, 0.376] },
  // lying flat, the handle away from the player
  aed: { size: [0.3, 0.13, 0.25] },
  // valve towards the head
  oxygen: { size: [0.167, 0.167, 0.72], centre: true },
  // the bag upright, the patient valve at the top: its group lays it across behind the head, the valve on the right
  bvm: { size: [0.12, 0.588, 0.12], centre: true },
  scoop: { size: [0.63, 0.062, 1.95] },
  basket: { size: [0.704, 0.202, 2.104] },
  board: { size: [0.475, 0.062, 1.9] },
  // round the neck, the chin cup towards the head and the airway opening on top (the player lies on the back)
  collar: { size: [0.2, 0.164, 0.117], centre: true },
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
  // evenly, so nothing is squashed out of shape
  const scale = new THREE.Vector3().setScalar(Math.min(...k));
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
