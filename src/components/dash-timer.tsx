import { useEffect, useRef, useState } from "react";
import { DASH_SECONDS } from "@/lib/workshop";
import { cn } from "@/lib/utils";

const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export function DashTimer() {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DASH_SECONDS);
  const startedAt = useRef<number | null>(null);
  const finished = remaining <= 0;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const start = startedAt.current;
      if (start == null) return;
      const left = Math.max(0, DASH_SECONDS - (Date.now() - start) / 1000);
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        vibrate([80, 60, 160]);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const display = finished ? 0 : Math.max(1, Math.ceil(remaining));
  const hot = remaining <= 3;
  const progress = remaining / DASH_SECONDS;

  function start() {
    startedAt.current = Date.now();
    setRemaining(DASH_SECONDS);
    setRunning(true);
    vibrate(30);
  }

  function reset() {
    startedAt.current = null;
    setRunning(false);
    setRemaining(DASH_SECONDS);
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 text-center">
      <div className="relative grid size-52 place-items-center">
        <svg viewBox="0 0 128 128" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            className="stroke-line"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            className={hot ? "stroke-danger" : "stroke-heading"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            style={{
              transition: running ? "none" : "stroke-dashoffset 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
        <p
          className={cn(
            "font-display text-7xl font-bold leading-none tabular-nums tracking-tight",
            hot ? "text-danger" : "text-heading",
          )}
          aria-live="assertive"
          aria-atomic="true"
        >
          {display}
        </p>
      </div>

      <p className="mt-3 min-h-6 font-display text-sm font-semibold tracking-[0.12em] text-heading">
        {finished ? "BOARD DOWN — CPR ON" : running ? "CARRY WINDOW" : "READY"}
      </p>
      <p className="mt-2 max-w-xs text-sm leading-snug text-muted">
        Lift on Black’s command. Green counts. Board down and CPR back on before this hits 0.
      </p>

      <div className="mt-5 flex w-full max-w-xs gap-2">
        <button
          type="button"
          onClick={start}
          className="h-12 flex-1 rounded-md bg-navy font-display text-base font-semibold tracking-[0.08em] text-on-navy transition-transform duration-150 ease-out active:scale-95"
        >
          {running ? "Restart" : "Start"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="h-12 flex-1 rounded-md border border-heading bg-paper font-display text-base font-semibold tracking-[0.08em] text-heading transition-transform duration-150 ease-out active:scale-95"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
