import { Box, LoaderCircle } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { type ArMode, detectAr } from "@/lib/ar";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

// the 3D parts load only when AR is used, so the pages that show the button stay light
const ArSession = lazy(() => import("@/components/ar-session"));
const QuickLookExport = lazy(() => import("@/components/ar-quicklook"));

type Scenario = "arrest" | "spine";

function openQuickLook(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.rel = "ar";
  a.href = `${url}#allowsContentScaling=1`;
  a.download = "pitchside-team.usdz";
  a.appendChild(document.createElement("img")); // Safari opens Quick Look only for an anchor around an image
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * "See the team in your room": on Android (Chrome with ARCore) the 3D set piece runs live in augmented
 * reality, placed on the floor at full size; on iPhone and iPad a still model opens in AR Quick Look.
 */
export function ArButton({ scenario = "arrest", step = 0, className }: { scenario?: Scenario; step?: number; className?: string }) {
  const [mode, setMode] = useState<ArMode | null>(null);
  const [active, setActive] = useState<{ session: XRSession; root: HTMLElement } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    void detectAr().then((m) => {
      if (!alive) return;
      setMode(m);
      if (m === "webxr") void import("@/components/ar-session"); // ready before the tap
    });
    return () => {
      alive = false;
    };
  }, []);

  const startXr = async () => {
    tap();
    setNote("");
    const root = document.createElement("div");
    root.className = "ar-overlay";
    document.body.appendChild(root);
    try {
      const xr = (navigator as Navigator & { xr: XRSystem }).xr;
      const session = await xr.requestSession("immersive-ar", { requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay"], domOverlay: { root } });
      setActive({ session, root });
    } catch {
      root.remove();
      setNote("AR could not start here — allow the camera, and check that Google Play Services for AR is installed.");
    }
  };

  const end = useCallback(() => {
    setActive((a) => {
      a?.root.remove();
      return null;
    });
  }, []);

  if (mode === null) return <div className={cn("min-h-11", className)} aria-hidden="true" />;
  if (mode === "none")
    return (
      <p className={cn("flex min-h-11 items-center gap-2 text-xs leading-snug text-muted", className)}>
        <Box className="size-4 shrink-0 text-gold-ink" aria-hidden />
        Open this page on an Android phone (Chrome) or an iPhone or iPad to put the team in your room in AR.
      </p>
    );
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        disabled={exporting}
        onClick={() => {
          if (mode === "webxr") void startXr();
          else {
            tap();
            setNote("");
            setExporting(true);
          }
        }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-[0.98] disabled:opacity-70"
      >
        {exporting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Box className="size-4" aria-hidden />}
        {exporting ? "Building the 3D model…" : mode === "webxr" ? "See the team in your room (AR)" : "See the team in your room (AR Quick Look)"}
      </button>
      {note ? (
        <p className="text-xs leading-snug text-muted" aria-live="polite">
          {note}
        </p>
      ) : null}
      {active ? (
        <Suspense fallback={null}>
          <ArSession session={active.session} root={active.root} scenario={scenario} startStep={step} onEnd={end} />
        </Suspense>
      ) : null}
      {exporting ? (
        <Suspense fallback={null}>
          <QuickLookExport
            scenario={scenario}
            step={step}
            onDone={(blob) => {
              setExporting(false);
              if (blob) openQuickLook(blob);
              else setNote("The 3D model could not be built on this device.");
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
