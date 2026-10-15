import { useEffect } from "react";

/**
 * Keeps the screen on while `active` (Screen Wake Lock), so a running timer stays in view at the pitch.
 * The browser drops the lock when the page is hidden; it is taken again when the page comes back.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const take = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const l = await navigator.wakeLock.request("screen");
        if (done) void l.release();
        else lock = l;
      } catch {
        // refused (battery saver, no permission): the timer still works, the screen may dim
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void take();
    };
    void take();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (lock) void lock.release().catch(() => {});
    };
  }, [active]);
}
