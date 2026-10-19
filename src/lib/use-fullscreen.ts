import { useEffect, useRef, useState } from "react";

type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };

/**
 * Presenter mode: puts one element (a 3D player with its controls) full screen, for showing a drill on
 * a projector or a tablet. `supported` is false where a page element cannot go full screen (iPhone).
 */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const d = document as FsDoc;
    setSupported(Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled));
    const sync = () => {
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      setActive(Boolean(el) && el === ref.current);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);
  const toggle = async () => {
    const d = document as FsDoc;
    const el = ref.current as FsEl | null;
    if (!el) return;
    try {
      if (d.fullscreenElement ?? d.webkitFullscreenElement) {
        if (d.exitFullscreen) await d.exitFullscreen();
        else d.webkitExitFullscreen?.();
      } else if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else el.webkitRequestFullscreen?.();
    } catch {
      // refused (not from a tap, or not allowed here)
    }
  };
  return { ref, supported, active, toggle };
}
