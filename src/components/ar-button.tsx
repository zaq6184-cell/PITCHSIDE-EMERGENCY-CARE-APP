import { Link } from "@tanstack/react-router";
import { Box, ChevronRight, ExternalLink, TriangleAlert } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AR_FALLBACK, type ArClip, type ArDrill, type ArSupport, arPath, clampClip, closedAtOnce, detectAr, fallbackUrl, hasNarration, modelFile, quickLookHref, sceneViewerIntent } from "@/lib/ar";
import { arTitle } from "@/lib/ar-steps";
import { asset } from "@/lib/asset";
import { useTranslate } from "@/lib/i18n";
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
 * "See the team in your room": where the browser can run AR itself (Chrome on most Android phones), the team runs
 * live here in the app — find the floor, tap to place them at full size, and play each step with the call-outs,
 * captions, pause and slow motion. Other Android phones open the step in Google's AR viewer, the team moving and
 * their call-outs playing; iPhone and iPad open it in AR Quick Look, moving. On Live AR phones Google's AR viewer
 * stays a link under the button, as it has been closing as soon as it opens on many phones (a fault in the Google
 * app): a quick return to the page says so. `step` "all" plays the whole drill end to end. On a computer, a QR
 * code opens the same step on a phone.
 */
export function ArButton({ scenario = "arrest", step = 0, className, help = true }: { scenario?: ArDrill; step?: ArClip; className?: string; help?: boolean }) {
  const drill = scenario;
  const at = clampClip(drill, step);
  const label = at === "all" ? "Play the whole drill in AR" : "See the team in your room (AR)";
  const t = useTranslate(); // the title Google's AR viewer shows travels in the link, past the page
  const [support, setSupport] = useState<ArSupport | null>(null);
  const [live, setLive] = useState<{ session: XRSession; root: HTMLElement } | null>(null);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [closed, setClosed] = useState(false);
  const watching = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;
    void detectAr().then((s) => {
      if (!alive) return;
      setSupport(s);
      if (s.webxr) void import("@/components/ar-session"); // ready before the tap: the browser wants the session asked for at once
    });
    // the browser comes back with this fragment when Google's AR viewer could not open (the latest word wins)
    const check = () => {
      const fell = window.location.hash === `#${AR_FALLBACK}`;
      setFailed(fell);
      if (fell) setClosed(false);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", check);
      watching.current?.();
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

  // Google's AR viewer takes the page out of view while it is open: back within a moment, it closed by itself;
  // never away, the link did nothing (when Chrome knows, it comes back with the fallback fragment instead)
  const openViewer = () => {
    tap();
    setClosed(false);
    watching.current?.();
    let left = 0;
    const away = () => {
      if (left) return;
      left = performance.now();
      setFailed(false);
    };
    const back = () => {
      if (!left || document.visibilityState === "hidden") return;
      stop();
      setClosed(closedAtOnce(performance.now() - left));
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? away() : back());
    const timer = window.setTimeout(() => {
      if (!left) setFailed(true);
    }, 5000);
    const stop = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", away);
      window.removeEventListener("focus", back);
      watching.current = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", away);
    window.addEventListener("focus", back);
    watching.current = stop;
  };

  const howTo = (
    <Link to="/ar" search={{ drill, step: at }} hash="ar-how" className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-gold-ink">
      How to use AR
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  );

  // the same height before and after the page knows the device (a button and a row under it), so nothing
  // below moves when it does
  if (support === null)
    return (
      <div className={className} aria-hidden="true">
        <div className="min-h-[5.875rem]" />
      </div>
    );

  const path = arPath(support);

  // a computer or a phone without either viewer: hand over to a phone
  if (path === "phone") {
    const url = new URL(asset("/ar"), window.location.href);
    url.searchParams.set("drill", drill);
    url.searchParams.set("step", String(at));
    return (
      <div className={className}>
        <div className="flex min-h-[5.875rem] items-center gap-3">
          <Suspense fallback={<div className="size-20 shrink-0 rounded-lg bg-paper" />}>
            <QrCode text={url.href} className="size-20 shrink-0 rounded-lg" />
          </Suspense>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-heading">
              <Box className="size-4 text-gold-ink" aria-hidden />
              AR on your phone
            </p>
            <p className="text-xs leading-snug text-muted">
              {at === "all" ? "Scan with a phone to play the whole drill on the floor in front of you." : "Scan with a phone to put this step on the floor in front of you."}
            </p>
            {help ? howTo : null}
          </div>
        </div>
      </div>
    );
  }

  const viewer = support.android
    ? sceneViewerIntent(absolute(modelFile(drill, at, "glb")), {
        title: t(arTitle(drill, at)),
        fallback: fallbackUrl(window.location.href),
        // the call-outs, looping in time with the team
        sound: hasNarration(at) ? absolute(modelFile(drill, at, "mp3")) : undefined,
      })
    : null;
  const inner = (
    <>
      <Box className="size-5" aria-hidden />
      {label}
    </>
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {path === "live" ? (
        <button type="button" onClick={() => void startLive()} className={primary}>
          {inner}
        </button>
      ) : path === "viewer" && viewer ? (
        <a href={viewer} onClick={openViewer} className={primary}>
          {inner}
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
          {inner}
        </button>
      )}
      <div className="flex min-h-10 items-center justify-between gap-3">
        {help ? (
          howTo
        ) : (
          <span className="text-xs text-muted">{path === "live" ? "Live AR, here in the app" : path === "viewer" ? "Opens Google's AR viewer" : "Opens AR Quick Look"}</span>
        )}
        {path === "live" && viewer ? (
          <a
            href={viewer}
            onClick={openViewer}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-3 font-display text-sm font-semibold tracking-wide text-heading active:scale-[0.98]"
          >
            <ExternalLink className="size-4 text-gold-ink" aria-hidden />
            Google's AR viewer
          </a>
        ) : null}
      </div>
      {support.android && (closed || failed) ? (
        <p className="flex gap-2 rounded-lg border-l-4 border-[#d4a017] bg-[#d4a017]/10 px-3 py-2 text-xs leading-snug text-ink" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#a87c00]" aria-hidden />
          {path === "live" ? (
            <span>
              {closed
                ? "Google's AR viewer closed straight away: a fault in recent versions of the Google app. Use the AR button above — it runs here in the app."
                : "Google's AR viewer did not open. Use the AR button above — it runs here in the app."}
            </span>
          ) : closed ? (
            <span>
              Google's AR viewer closed straight away: a fault in recent versions of the Google app. Clear the Google app's cache (Settings → Apps → Google →
              Storage → Clear cache) and try again.
            </span>
          ) : (
            <span>
              Google's AR viewer did not open here. Open this page in Chrome (not inside WhatsApp or Instagram), and update the Google app and Google Play
              Services for AR.
            </span>
          )}
        </p>
      ) : null}
      {note ? (
        <p className="text-xs leading-snug text-muted" aria-live="polite">
          {note}
        </p>
      ) : null}
      {live ? (
        <Suspense fallback={null}>
          <ArSession session={live.session} root={live.root} scenario={drill} startStep={at === "all" ? 1 : at} autoPlay={at === "all"} onEnd={end} />
        </Suspense>
      ) : null}
    </div>
  );
}
