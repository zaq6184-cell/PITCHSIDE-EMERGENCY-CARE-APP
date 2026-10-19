/** True when this device can draw WebGL (the 3D scenes); otherwise the flat diagrams stand in. */
export function canRender3D() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
