import { HeartPulse, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSoundPrefs } from "@/components/sound-control";
import { haptic, startMetronome, stopMetronome, tapClick } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Mode = "30:2" | "igel";

/**
 * Tap-along CPR rhythm trainer: shows the compression rate live against 100–120/min and counts
 * compressions the way the team does — 30:2 until the i-gel is in, then continuous with one
 * breath every tenth compression. It measures rhythm only, never depth or recoil.
 */
export function CprTrainer() {
  const prefs = useSoundPrefs();
  const [taps, setTaps] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<Mode>("30:2");
  const [beat, setBeat] = useState(0);
  const [guide, setGuide] = useState(false);
  const [idle, setIdle] = useState(true);
  const lastPress = useRef(0);

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
  const status = rate == null ? "idle" : rate < 100 ? "slow" : rate > 120 ? "fast" : "good";

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

  const reset = () => {
    setTaps([]);
    setCount(0);
    setIdle(true);
  };

  const tone =
    status === "good" ? "text-[#1A7F45] dark:text-[#4cc47f]" : status === "idle" ? "text-heading" : "text-danger";

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
        <span className="flex flex-col items-center gap-1">
          <HeartPulse className="size-12" strokeWidth={1.8} aria-hidden />
          <span className="font-display text-sm font-bold tracking-[0.14em]">TAP</span>
        </span>
      </button>

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
