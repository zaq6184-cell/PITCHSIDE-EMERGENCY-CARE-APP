/**
 * Augmented reality: the 3D team on the floor in front of you. scripts/build-ar-models.mjs builds one model
 * per drill step from the app's own 3D set piece: GLB for Android, opened in Google's AR viewer (Scene
 * Viewer, part of the Google app), and USDZ for iPhone and iPad, opened in AR Quick Look. Chrome on phones
 * with Google Play Services for AR can also run the team live in the app (WebXR), stepping through the
 * drill. Plain functions, tested with `node --test`.
 */
export type ArDrill = "arrest" | "spine";

/** The steps after "the team in place" (0) that have a model. */
export const AR_STEPS: Record<ArDrill, number> = { arrest: 6, spine: 7 };

export const clampStep = (drill: ArDrill, step: number) => Math.max(0, Math.min(AR_STEPS[drill], Math.round(step) || 0));

/** A model or its preview picture, as a path in public/ (put it through `asset()` for the address). */
export const modelFile = (drill: ArDrill, step: number, ext: "glb" | "usdz" | "webp") => `/ar/${drill}-${clampStep(drill, step)}.${ext}`;

/** The fragment the browser comes back with when Google's AR viewer could not open. */
export const AR_FALLBACK = "ar-unavailable";

/**
 * The link that opens a model in Google's AR viewer: in AR where the phone can, in 3D where it cannot.
 * Without the Google app the browser goes to `fallback` instead (the same approach as Google's
 * <model-viewer>).
 */
export function sceneViewerIntent(modelUrl: string, { title, fallback }: { title: string; fallback: string }) {
  const params = new URLSearchParams({ mode: "ar_preferred", title, disable_occlusion: "true" });
  return (
    `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}&file=${encodeURIComponent(modelUrl)}` +
    `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${encodeURIComponent(fallback)};end;`
  );
}

/** iPhone and iPad: AR Quick Look, with pinch-to-resize allowed. */
export const quickLookHref = (modelUrl: string) => `${modelUrl.replace(/#.*$/, "")}#allowsContentScaling=1`;

/** The page's address with the fallback fragment, for when the AR viewer cannot open. */
export const fallbackUrl = (pageUrl: string) => `${pageUrl.replace(/#.*$/, "")}#${AR_FALLBACK}`;

export type ArSupport = {
  /** Android: Google's AR viewer (it shows the team in 3D where the phone has no AR) */
  android: boolean;
  /** iPhone or iPad Safari: AR Quick Look */
  quicklook: boolean;
  /** Chrome with Google Play Services for AR: live AR inside the app */
  webxr: boolean;
};

/** What this device can do: from the browser's own answers, and the system it says it runs. */
export function arSupportFrom(userAgent: string, quicklook: boolean, webxr: boolean): ArSupport {
  return { android: /Android/i.test(userAgent), quicklook, webxr };
}

export async function detectAr(): Promise<ArSupport> {
  let webxr = false;
  try {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    webxr = Boolean(xr && (await xr.isSessionSupported("immersive-ar")));
  } catch {
    // no WebXR here
  }
  const quicklook = Boolean(document.createElement("a").relList?.supports?.("ar"));
  return arSupportFrom(navigator.userAgent, quicklook, webxr);
}
