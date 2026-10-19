import { HeartPulse, MessageCircle, RotateCcw, Smartphone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSoundPrefs } from "@/components/sound-control";
import { createCompressionDetector } from "@/lib/compression-detector";
import { record, step as did } from "@/lib/progress";
import { haptic, say, startMetronome, stopMetronome, tapClick } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/lib/wake-lock";

type Mode = "30:2" | "igel";
type Status = "idle" | "slow" | "fast" | "good";
type Motion = "off" | "starting" | "on" | "none" | "denied";

/** The AED's coaching voice (aed-5 … aed-8). */
const COACH = { faster: "aed-5", slower: "aed-6", good: "aed-7", breaths: "aed-8" } as const;

/**
 * Tap-along CPR rhythm trainer: shows the compression rate live against 100–120/min and counts
 * compressions the way the team does — 30:2 until the i-gel is in, then continuous with one
 * breath every tenth compression. It measures rhythm only, never depth or recoil.
 *
 * Optional: a voice coach (the AED's voice: faster, slower, good compressions, two breaths) and
 * motion counting, where the phone's motion sensor counts each push while you compress on a manikin.
 */
export function CprTrainer() {
  const prefs = useSoundPrefs();
  const [taps, setTaps] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<Mode>("30:2");
  const [beat, setBeat] = useState(0);
  const [guide, setGuide] = useState(false);
  const [idle, setIdle] = useState(true);
  const [coachOn, setCoachOn] = useState(true);
  const [motion, setMotion] = useState<Motion>("off");
  const [level, setLevel] = useState(0);
  const lastPress = useRef(0);
  const pressRef = useRef<() => void>(() => {});
  useWakeLock(guide || !idle || motion === "on");

  // the steady 110/min guide click (plays even with effects off — it was switched on here)
  useEffect(() => {
    if (!guide) return;
    startMetronome(110, true);
    return () => stopMetronome();
  }, [guide]);

  // the rate fades out if tapping stops
  useEffect(() => {
    if (!taps.length) return;
    const id = window.setTimeout(() => setIdle(true), 2200);
    return () => window.clearTimeout(id);
  }, [taps]);

  const rate = useMemo(() => {
    if (taps.length < 3 || idle) return null;
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return Math.round(60000 / avg);
  }, [taps, idle]);

  const inCycle = mode === "30:2" ? ((count - 1) % 30) + 1 : count;
  const breathsDue = mode === "30:2" && count > 0 && count % 30 === 0;
  const breathNow = mode === "igel" && count > 0 && count % 10 === 0;
  const status: Status = rate == null ? "idle" : rate < 100 ? "slow" : rate > 120 ? "fast" : "good";

  const press = () => {
    const now = performance.now();
    lastPress.current = now;
    setIdle(false);
    setTaps((t) => {
      const last = t[t.length - 1];
      const fresh = last && now - last > 2000 ? [] : t;
      return [...fresh.slice(-7), now];
    });
    setCount((c) => c + 1);
    setBeat((b) => b + 1);
    haptic(8);
    if (prefs.sfx && !guide) tapClick();
  };
  useEffect(() => {
    pressRef.current = press;
  });

  // the coach: says what to fix after a few seconds off the target, praises once it is fixed,
  // calls the two breaths in 30:2 — and never talks more often than every few seconds
  const coach = useRef({ last: 0, offKind: "" as Status | "", offSince: 0, goodSince: 0, fixed: false, streak: 0, seen: 0 });
  useEffect(() => {
    const c = coach.current;
    // only a new compression moves the coach on (not the rate fading, nor a switch being flipped)
    if (!count || count === c.seen) return;
    c.seen = count;
    const now = performance.now();
    c.streak = status === "good" ? c.streak + 1 : 0;
    if (c.streak >= 30) record(did.cpr);
    if (!coachOn || !prefs.sfx) return;
    const talk = (id: string) => {
      c.last = now;
      void say(id);
    };
    if (mode === "30:2" && count % 30 === 0) return talk(COACH.breaths);
    if (status === "slow" || status === "fast") {
      if (c.offKind !== status) {
        c.offKind = status;
        c.offSince = now;
      }
      c.goodSince = 0;
      if (now - c.offSince > 2500 && now - c.last > 5000) {
        c.fixed = true;
        talk(status === "slow" ? COACH.faster : COACH.slower);
      }
    } else if (status === "good") {
      c.offKind = "";
      if (!c.goodSince) c.goodSince = now;
      const settled = now - c.goodSince;
      if ((c.fixed && settled > 3000 && now - c.last > 4000) || (settled > 15000 && now - c.last > 20000)) {
        c.fixed = false;
        talk(COACH.good);
      }
    }
  }, [count, status, mode, coachOn, prefs.sfx]);

  // motion counting: each push the phone feels counts as a compression
  useEffect(() => {
    if (motion !== "starting" && motion !== "on") return;
    const d = createCompressionDetector();
    let seen = false;
    let shown = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a?.x == null || a.y == null || a.z == null) return;
      if (!seen) {
        seen = true;
        setMotion("on");
      }
      if (d.push(e.timeStamp || performance.now(), a.x, a.y, a.z)) pressRef.current();
      const now = performance.now();
      if (now - shown > 120) {
        shown = now;
        setLevel(d.level());
      }
    };
    window.addEventListener("devicemotion", onMotion);
    // no sensor (most computers): say so instead of waiting for nothing
    const none = window.setTimeout(() => {
      if (!seen) setMotion("none");
    }, 1800);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.clearTimeout(none);
    };
  }, [motion]);

  const toggleMotion = async () => {
    if (motion === "on" || motion === "starting") {
      setMotion("off");
      return;
    }
    // iPhone and iPad ask for permission, and only inside a tap
    const DM = typeof DeviceMotionEvent === "undefined" ? undefined : (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> });
    if (!DM) return setMotion("none");
    if (DM.requestPermission) {
      try {
        if ((await DM.requestPermission()) !== "granted") return setMotion("denied");
      } catch {
        return setMotion("denied");
      }
    }
    setMotion("starting");
  };

  const reset = () => {
    setTaps([]);
    setCount(0);
    setIdle(true);
    coach.current = { last: 0, offKind: "", offSince: 0, goodSince: 0, fixed: false, streak: 0, seen: 0 };
  };

  const tone = status === "good" ? "text-[#1A7F45] dark:text-[#4cc47f]" : status === "idle" ? "text-heading" : "text-danger";
  const motionOn = motion === "on" || motion === "starting";

  return (
    <div className="flex flex-col items-center gap-3 px-3.5 pb-4 pt-1 text-center">
      <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl bg-note p-1" role="radiogroup" aria-label="Airway">
        {(
          [
            ["30:2", "30:2 — no i-gel yet"],
            ["igel", "i-gel in — continuous"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={cn(
              "min-h-10 rounded-lg px-2 font-display text-xs font-semibold tracking-wide transition-colors",
              mode === m ? "bg-navy text-gold shadow-card" : "text-heading",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-xs leading-snug text-muted">
        {mode === "igel"
          ? "i-gel in, bag valve attached and oxygen at 15 L/min on the reservoir: continuous compressions, one squeeze of the bag every 10th compression (FIFA's PEAP). If the i-gel leaks — poor chest rise or gurgling — go back to 30:2."
          : "No i-gel yet, a face mask only, or a leaking i-gel: 30 compressions, then 2 breaths."}
      </p>

      <div className="flex w-full items-end justify-around">
        <div>
          <p className={cn("font-display text-5xl font-bold leading-none tabular-nums", tone)} aria-live="polite">
            {rate ?? "—"}
          </p>
          <p className="mt-1 font-display text-[11px] font-semibold tracking-[0.14em] text-muted">PER MINUTE</p>
        </div>
        <div>
          <p className="font-display text-5xl font-bold leading-none tabular-nums text-heading">
            {mode === "30:2" ? inCycle || 0 : count}
            {mode === "30:2" ? <span className="text-xl text-muted">/30</span> : null}
          </p>
          <p className="mt-1 font-display text-[11px] font-semibold tracking-[0.14em] text-muted">COMPRESSIONS</p>
        </div>
      </div>

      <p className={cn("min-h-6 font-display text-sm font-semibold tracking-[0.1em]", tone)}>
        {breathsDue
          ? "PAUSE — 2 BREATHS, THEN CARRY ON"
          : breathNow
            ? "BREATH — ORANGE SQUEEZES THE BAG ONCE"
            : status === "good"
              ? "GOOD RATE — KEEP IT THERE"
              : status === "slow"
                ? "FASTER — AIM FOR 100–120"
                : status === "fast"
                  ? "SLOWER — AIM FOR 100–120"
                  : motionOn
                    ? "COMPRESS — THE PHONE IS COUNTING"
                    : "TAP IN A STEADY RHYTHM"}
      </p>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!e.repeat) press();
          }
        }}
        onClick={() => {
          // screen readers activate with a click and no pointer press
          if (performance.now() - lastPress.current > 1000) press();
        }}
        aria-label="Compress — tap in rhythm"
        className="relative grid size-44 touch-manipulation select-none place-items-center rounded-full bg-gradient-to-br from-[#d8443a] to-[#a32a20] text-white shadow-[0_18px_36px_-14px_rgba(192,57,43,0.75)] outline-none ring-gold/60 focus-visible:ring-4"
      >
        <span key={beat} className="cpr-press absolute inset-0 rounded-full" aria-hidden="true" />
        {motionOn ? (
          // how hard the phone is moving: a ring that swells with each push
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-gold/70 transition-transform duration-100"
            style={{ transform: `scale(${1 + level * 0.12})`, opacity: 0.35 + level * 0.65 }}
            aria-hidden="true"
          />
        ) : null}
        <span className="flex flex-col items-center gap-1">
          {motionOn ? <Smartphone className="size-12" strokeWidth={1.8} aria-hidden /> : <HeartPulse className="size-12" strokeWidth={1.8} aria-hidden />}
          <span className="font-display text-sm font-bold tracking-[0.14em]">{motionOn ? "MOTION" : "TAP"}</span>
        </span>
      </button>

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void toggleMotion()}
          aria-pressed={motionOn}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 font-display text-xs font-semibold tracking-wide active:scale-95",
            motionOn ? "bg-navy text-gold" : "border border-line bg-paper text-heading",
          )}
        >
          <Smartphone className="size-4" aria-hidden />
          {motionOn ? "Motion: on" : "Count by motion"}
        </button>
        <button
          type="button"
          onClick={() => setCoachOn((v) => !v)}
          aria-pressed={coachOn}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 font-display text-xs font-semibold tracking-wide active:scale-95",
            coachOn ? "bg-navy text-gold" : "border border-line bg-paper text-heading",
          )}
        >
          <MessageCircle className="size-4" aria-hidden />
          {coachOn ? "Voice coach: on" : "Voice coach: off"}
        </button>
      </div>
      {motion !== "off" ? (
        <p className="-mt-1 text-xs leading-snug text-muted" aria-live="polite">
          {motion === "none"
            ? "No motion sensor here (most computers have none) — tap instead."
            : motion === "denied"
              ? "Motion access was not allowed. Allow it in the browser's settings, or tap instead."
              : "Hold the phone flat between your hands, screen up, and compress on a manikin. Each push counts. Never press a phone onto a real chest."}
        </p>
      ) : null}
      {coachOn && !prefs.sfx ? <p className="-mt-1 text-xs leading-snug text-muted">The voice coach needs sound effects on (the speaker button at the top).</p> : null}

      <div className="flex w-full items-center gap-2">
        <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-3 text-left text-sm">
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} className="size-4 accent-[#c9a227]" />
          Guide beat at 110/min
        </label>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
        >
          <RotateCcw className="size-4" aria-hidden />
          Reset
        </button>
      </div>
      <p className="text-xs leading-snug text-muted">
        Rhythm only: 100–120 per minute. It cannot judge depth (5–6 cm) or full recoil — practise those on a manikin. Space bar works on a keyboard.
      </p>
    </div>
  );
}
