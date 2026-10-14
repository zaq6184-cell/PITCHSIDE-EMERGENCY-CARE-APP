import { useEffect, useRef } from "react";

/**
 * Page transitions: which way the next page slides in. Set just before navigating; read by the
 * view-transition CSS in styles.css (html[data-vt="forward" | "back"]).
 */
let clear: number | undefined;
export function setTransitionDirection(dir: "forward" | "back") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.vt = dir;
  window.clearTimeout(clear);
  clear = window.setTimeout(() => {
    delete document.documentElement.dataset.vt;
  }, 800);
}

/** True when the touch started inside something that scrolls sideways (a table, the jump chips). */
function inSideScroller(target: Element, stop: Element) {
  for (let el: Element | null = target; el && el !== stop; el = el.parentElement) {
    const ox = getComputedStyle(el).overflowX;
    if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 2) return true;
  }
  return false;
}

/**
 * Swipe left / right with a finger (not the mouse). Ignores the 3D scene (which turns on drag),
 * form fields, sideways scrollers and the screen edges (the phone's own back gesture).
 */
export function useSwipe<T extends HTMLElement>(onSwipe: (dir: "left" | "right") => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onSwipe);
  useEffect(() => {
    cb.current = onSwipe;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x0 = 0;
    let y0 = 0;
    let t0 = 0;
    let active = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const target = e.target as Element;
      const edge = e.clientX < 24 || e.clientX > window.innerWidth - 24;
      if (edge || target.closest("canvas, input, textarea, select, [data-no-swipe]") || inSideScroller(target, el)) return;
      active = true;
      x0 = e.clientX;
      y0 = e.clientY;
      t0 = performance.now();
    };
    const up = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && performance.now() - t0 < 700) cb.current(dx < 0 ? "left" : "right");
    };
    const cancel = () => {
      active = false;
    };
    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointerup", up, { passive: true });
    el.addEventListener("pointercancel", cancel);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
    };
  }, []);
  return ref;
}
