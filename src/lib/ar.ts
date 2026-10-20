/**
 * Augmented reality: what this device can do. Android phones with Chrome (ARCore) run the 3D team live in the
 * room through WebXR; iPhone and iPad Safari have no WebXR, but open a still 3D model in AR Quick Look.
 */
export type ArMode = "webxr" | "quicklook" | "none";

export async function detectAr(): Promise<ArMode> {
  try {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (xr && (await xr.isSessionSupported("immersive-ar"))) return "webxr";
  } catch {
    // no WebXR here
  }
  const a = document.createElement("a");
  if (a.relList?.supports?.("ar")) return "quicklook";
  return "none";
}
