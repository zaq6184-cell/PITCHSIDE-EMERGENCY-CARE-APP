import { useEffect, useState } from "react";
import { getSoundPrefs, startAmbience, stopAmbience, subscribeSound } from "@/lib/sound";

/** Keeps a 3D scene cheap: draws only while on screen and the page is visible; honours reduced motion. */
export function useSceneVisibility(wrap: React.RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);
  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [wrap]);

  // soft stadium ambience while the scene is on screen and sound is on
  useEffect(() => {
    const apply = () => (visible && getSoundPrefs().sfx ? startAmbience() : stopAmbience());
    apply();
    const off = subscribeSound(apply);
    return () => {
      off();
      stopAmbience();
    };
  }, [visible]);
  return { visible, still };
}

