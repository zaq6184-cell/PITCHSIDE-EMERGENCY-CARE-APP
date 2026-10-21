import { Link } from "@tanstack/react-router";
import { Box, ChevronRight, Footprints, TriangleAlert } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AR_FALLBACK, type ArDrill, type ArSupport, clampStep, detectAr, fallbackUrl, modelFile, quickLookHref, sceneViewerIntent } from "@/lib/ar";
import { arTitle } from "@/lib/ar-steps";
import { asset } from "@/lib/asset";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

// the 3D parts and the QR code load only where they are used, so the pages with the button stay light
const ArSession = lazy(() => import("@/components/ar-session"));
const QrCode = lazy(() => import("@/components/qr-code").then((m) => ({ default: m.QrCode })));

const absolute = (path: string) => new URL(asset(path), window.location.href).href;

/** AR Quick Look opens only from a tap on a link marked rel="ar" around a picture (as Safari requires). */
function openQuickLook(url: string) {
  const a = document.createElement("a");
  a.rel = "ar";
  a.href = quickLookHref(url);
  a.appendChild(document.createElement("img"));
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const primary =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-3 font-display text-base font-semibold tracking-wide text-gold shadow-card active:scale-[0.98]";

/**
 * "See the team in your room": on Android the step opens in Google's AR viewer, on iPhone and iPad in AR
 * Quick Look — the team at full size on the floor, with each colour's numbered mark. Chrome on phones with
 * Google Play Services for AR can also run the team live here, stepping through the drill. On a computer,
 * a QR code opens the same step on a phone.
 */
export function ArButton({ scenario = "arrest", step = 0, className, help = true }: { scenario?: ArDrill; step?: number; className?: string; help?: boolean }) {
  const drill = scenario;
  const at = clampStep(drill, step);
  const [support, setSupport] = useState<ArSupport | null>(null);
  const [live, setLive] = useState<{ session: XRSession; root: HTMLElement } | null>(null);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void detectAr().then((s) => {
      if (!alive) return;
      setSupport(s);
      if (s.webxr) void import("@/components/ar-session"); // ready before the tap: the browser wants the session asked for at once
    });
    // the browser comes back with this fragment when Google's AR viewer could not open
    const check = () => setFailed(window.location.hash === `#${AR_FALLBACK}`);
    check();
    window.addEventListener("hashchange", check);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", check);
    };
  }, []);

  const startLive = async () => {
    tap();
    setNote("");
    const root = document.createElement("div");
    root.className = "ar-overlay";
    document.body.appendChild(root);
    try {
      const xr = (navigator as Navigator & { xr: XRSystem }).xr;
      const session = await xr.requestSession("immersive-ar", { requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay"], domOverlay: { root } });
      setLive({ session, root });
    } catch {
      root.remove();
      setNote("Live AR could not start: allow the camera when asked, and check Google Play Services for AR is installed and up to date.");
    }
  };

  const end = useCallback(() => {
    setLive((a) => {
      a?.root.remove();
      return null;
    });
  }, []);

  const howTo = help ? (
    <Link to="/ar" search={{ drill, step: at }} hash="ar-how" className="inline-flex min-h-10 items-center gap-1 self-start text-xs font-semibold text-gold-ink">
      How to use AR
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  ) : null;

  if (support === null) return <div className={cn("min-h-12", className)} aria-hidden="true" />;

  // a computer or a phone without either viewer: hand over to a phone
  if (!support.android && !support.quicklook) {
    const url = new URL(asset("/ar"), window.location.href);
    url.searchParams.set("drill", drill);
    url.searchParams.set("step", String(at));
    return (
      <div className={cn("flex items-center gap-3 rounded-xl bg-note px-3 py-2.5", className)}>
        <Suspense fallback={<div className="size-24 shrink-0 rounded-lg bg-paper" />}>
          <QrCode text={url.href} className="size-24 shrink-0 rounded-lg" />
        </Suspense>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-heading">
            <Box className="size-4 text-gold-ink" aria-hidden />
            AR on your phone
          </p>
          <p className="text-xs leading-snug text-muted">
            Scan to put this step on the floor in front of you — Android (Google's AR viewer) or iPhone and iPad (Safari).
          </p>
          {howTo}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {support.android ? (
        <a
          href={sceneViewerIntent(absolute(modelFile(drill, at, "glb")), { title: arTitle(drill, at), fallback: fallbackUrl(window.location.href) })}
          onClick={() => tap()}
          className={primary}
        >
          <Box className="size-5" aria-hidden />
          See the team in your room (AR)
        </a>
      ) : (
        <button
          type="button"
          onClick={() => {
            tap();
            openQuickLook(absolute(modelFile(drill, at, "usdz")));
          }}
          className={primary}
        >
          <Box className="size-5" aria-hidden />
          See the team in your room (AR)
        </button>
      )}
      {support.webxr ? (
        <button
          type="button"
          onClick={() => void startLive()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 font-display text-sm font-semibold tracking-wide text-heading active:scale-[0.98]"
        >
          <Footprints className="size-4 text-gold-ink" aria-hidden />
          Live AR with step controls
        </button>
      ) : null}
      {failed && support.android ? (
        <p className="flex gap-2 rounded-lg border-l-4 border-[#d4a017] bg-[#d4a017]/10 px-3 py-2 text-xs leading-snug text-ink" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#a87c00]" aria-hidden />
          <span>
            Google's AR viewer did not open here. Open this page in Chrome (not inside WhatsApp or Instagram), and update the Google
            app and Google Play Services for AR.{support.webxr ? " Or try Live AR above." : ""}
          </span>
        </p>
      ) : null}
      {note ? (
        <p className="text-xs leading-snug text-muted" aria-live="polite">
          {note}
        </p>
      ) : null}
      {howTo}
      {live ? (
        <Suspense fallback={null}>
          <ArSession session={live.session} root={live.root} scenario={drill} startStep={at} onEnd={end} />
        </Suspense>
      ) : null}
    </div>
  );
}
