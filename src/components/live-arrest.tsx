import { Link, useRouterState } from "@tanstack/react-router";
import { BellRing, ChevronRight, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ARREST_KEY, ARREST_VOICE_KEY, type ArrestSession, checksDue, clock, count, CYCLE_MS, nextCheckIn, parseSession } from "@/lib/arrest-log";
import { say, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/lib/wake-lock";

/** The saved arrest timer run, if one is still going. */
function runningSession(): ArrestSession | null {
  try {
    const s = parseSession(localStorage.getItem(ARREST_KEY), Date.now());
    return s && !s.endedAt ? s : null;
  } catch {
    return null; // storage blocked: nothing was kept
  }
}

function voiceOn() {
  try {
    return localStorage.getItem(ARREST_VOICE_KEY) !== "off";
  } catch {
    return true;
  }
}

function buzz() {
  // browsers refuse (and log an error) before the first tap on the page
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // not supported
  }
}

/**
 * A running arrest timer, on every page but its own: the time since the collapse, the countdown to the next
 * rhythm check and the shocks so far. The 2-minute rhythm check still sounds and the screen stays on, so the
 * team leader can look up a dose or a step mid-arrest without losing the clock. Tap it to go back to the timer.
 */
export function LiveArrestBar() {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const onTimer = pathname.startsWith("/arrest");
  const [s, setS] = useState<ArrestSession | null>(null);
  const [now, setNow] = useState(0);
  const [alarm, setAlarm] = useState(false);
  const cued = useRef<number | null>(null);

  // read again on every page change (the timer page saves the run) and when another tab changes it
  useEffect(() => {
    const read = () => {
      setS(runningSession());
      setNow(Date.now());
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [pathname]);

  const live = Boolean(s) && !onTimer;
  useWakeLock(live);

  useEffect(() => {
    if (!live) return;
    // room under the page's last lines for the bar (styles.css)
    document.documentElement.setAttribute("data-arrest-live", "");
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => {
      window.clearInterval(id);
      document.documentElement.removeAttribute("data-arrest-live");
    };
  }, [live]);

  // every 2 minutes, here too: the whistle, a buzz, the gold banner and Black calling the rhythm check.
  // A check already due when the bar appeared was called on the timer page, so it is not repeated.
  useEffect(() => {
    if (!s || !live) {
      cued.current = null;
      return;
    }
    const due = checksDue(s, now);
    if (cued.current !== null && due > cued.current) {
      sfx("whistle", 0.6);
      buzz();
      setAlarm(true);
      if (voiceOn()) window.setTimeout(() => void say("black-s2"), 900);
    }
    cued.current = due;
  }, [s, now, live]);

  useEffect(() => {
    if (!alarm) return;
    const id = window.setTimeout(() => setAlarm(false), 12_000);
    return () => window.clearTimeout(id);
  }, [alarm]);

  if (!live || !s) return null;
  const left = nextCheckIn(s, now);
  const shocks = count(s, "shock");
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-30 px-3">
      <Link
        to="/arrest"
        onClick={() => tap()}
        aria-label={alarm ? "Rhythm check now — open the arrest timer" : "Arrest timer running — open the timer"}
        className={cn(
          "pointer-events-auto relative mx-auto flex min-h-14 w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl px-3.5 pb-2.5 pt-2 shadow-[0_12px_30px_-12px_rgba(11,31,58,0.6)] ring-1 ring-black/10 transition-colors duration-300 active:scale-[0.98]",
          alarm ? "bg-gold text-on-gold" : "bg-danger-fill text-white",
        )}
      >
        <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex size-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2.5 rounded-full bg-current" />
        </span>
        {alarm ? (
          <span role="alert" className="flex min-w-0 flex-1 items-center gap-2 font-display text-sm font-bold leading-tight tracking-wide">
            <BellRing className="size-5 shrink-0" aria-hidden />
            Rhythm check — swap the person compressing
          </span>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-none">
              <span className="truncate font-display text-[10px] font-semibold uppercase tracking-[0.14em] opacity-90">Arrest timer</span>
              <span className="mt-1 font-display text-2xl font-bold tabular-nums">{clock(now - s.startedAt)}</span>
            </span>
            {shocks ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-black/20 px-2 py-0.5 font-display text-sm font-bold tabular-nums">
                <Zap className="size-3.5" aria-hidden />
                {shocks}
              </span>
            ) : null}
            <span className="flex shrink-0 flex-col items-end leading-none">
              <span className="font-display text-lg font-bold tabular-nums">{clock(left)}</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider opacity-90">to check</span>
            </span>
          </>
        )}
        <ChevronRight className="size-5 shrink-0" aria-hidden />
        {/* the 2-minute cycle, filling up to the rhythm check */}
        <span className="absolute inset-x-3.5 bottom-1 h-1 overflow-hidden rounded-full bg-black/20" aria-hidden="true">
          <span className="block h-full rounded-full bg-current" style={{ width: `${(1 - left / CYCLE_MS) * 100}%` }} />
        </span>
      </Link>
    </div>
  );
}
