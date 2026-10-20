import { useEffect, useRef } from "react";
import type { Vitals } from "@/lib/cases";
import { getSoundPrefs, monitorAlarm, monitorBeep } from "@/lib/sound";
import { cn } from "@/lib/utils";

const SPEED = 110; // CSS px of trace per second (paper speed)
const g = (x: number, mu: number, s: number) => Math.exp(-((x - mu) ** 2) / (2 * s * s));

/** One sinus beat, phase 0–1: P, Q, R, S and T. */
function sinusBeat(p: number) {
  return 0.12 * g(p, 0.16, 0.025) - 0.12 * g(p, 0.27, 0.008) + 1.25 * g(p, 0.29, 0.01) - 0.28 * g(p, 0.31, 0.01) + 0.3 * g(p, 0.52, 0.05);
}

/** Ventricular fibrillation: chaotic, irregular waves of wandering size, mostly 4–8 Hz. */
function vf(t: number) {
  const env = 0.62 + 0.25 * Math.sin(t * 0.55) + 0.13 * Math.sin(t * 1.7 + 1);
  return (
    env *
    (0.34 * Math.sin(2 * Math.PI * 5.3 * t + 1.1 * Math.sin(1.3 * t)) +
      0.24 * Math.sin(2 * Math.PI * 7.4 * t + 0.7 * Math.sin(0.7 * t)) +
      0.15 * Math.sin(2 * Math.PI * 3.6 * t + 0.5) +
      0.07 * Math.sin(2 * Math.PI * 11.2 * t))
  );
}

/** A pulse-oximeter wave: a quick rise and a dicrotic notch. */
function pleth(p: number) {
  return 0.9 * g(p, 0.22, 0.07) + 0.3 * g(p, 0.48, 0.06);
}

const perfusing = (v: Vitals) => v.rhythm === "sinus" || v.rhythm === "sinus-fast";

function ecgAt(v: Vitals, t: number) {
  let y = 0;
  if (perfusing(v)) {
    const period = 60 / (v.hr ?? (v.rhythm === "sinus-fast" ? 140 : 80));
    y = sinusBeat((t % period) / period);
  } else if (v.rhythm === "vf") y = vf(t);
  if (v.cpr) y = y * 0.35 + 1.0 * Math.abs(Math.sin(Math.PI * t * (110 / 60))) - 0.45; // the compressions swamp the trace
  return y + (Math.random() - 0.5) * 0.025;
}

/**
 * A bedside monitor: the ECG sweeps across in real time (with the CPR artefact while compressions run), a
 * pulse-oximeter wave when there is a perfusing rhythm, and the numbers. Beeps on each heartbeat and alarms
 * in VF, when sound effects are on.
 */
export function PatientMonitor({ vitals, className }: { vitals: Vitals; className?: string }) {
  const ecg = useRef<HTMLCanvasElement>(null);
  const spo = useRef<HTMLCanvasElement>(null);
  const v = useRef(vitals);
  useEffect(() => {
    v.current = vitals;
  }, [vitals]);

  useEffect(() => {
    const canvases = [ecg.current, spo.current];
    if (canvases.some((c) => !c)) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctxs = canvases.map((c) => (c as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D);
    // match each canvas to its box (again on rotation or full screen), and start the trace on its baseline
    const size = () => {
      canvases.forEach((c, i) => {
        const el = c as HTMLCanvasElement;
        el.width = Math.round(el.clientWidth * dpr);
        el.height = Math.round(el.clientHeight * dpr);
        ctxs[i].setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxs[i].fillStyle = "#04101f";
        ctxs[i].fillRect(0, 0, el.clientWidth, el.clientHeight);
      });
      x = 0;
      prev = [(canvases[0] as HTMLCanvasElement).clientHeight * 0.62, (canvases[1] as HTMLCanvasElement).clientHeight * 0.85];
    };
    const ro = "ResizeObserver" in window ? new ResizeObserver(size) : null;
    let raf = 0;
    let last = performance.now();
    let x = 0;
    let prev: [number, number] = [0, 0];
    size();
    ro?.observe(canvases[0] as HTMLCanvasElement);
    let lastBeat = -1;
    let lastAlarm = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const cur = v.current;
      const steps = Math.max(1, Math.round(dt * SPEED));
      ctxs.forEach((c, i) => {
        const el = canvases[i] as HTMLCanvasElement;
        const w = el.clientWidth;
        const h = el.clientHeight;
        for (let k = 0; k < steps; k++) {
          const xi = (x + k) % w;
          const ti = t - (steps - k) / SPEED;
          // erase a band ahead of the sweep
          c.fillStyle = "#04101f";
          c.fillRect(xi, 0, 14, h);
          if (i === 0) {
            const connected = cur.rhythm !== "none" || cur.cpr;
            const y = connected ? h * 0.62 - ecgAt(cur, ti) * h * 0.34 : h * 0.62;
            c.strokeStyle = connected ? "#3ddc84" : "rgba(61,220,132,0.35)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(xi === 0 ? 0 : xi - 1, xi === 0 ? y : prev[0]);
            c.lineTo(xi, y);
            c.stroke();
            prev[0] = y;
          } else {
            const on = perfusing(cur) && cur.spo2 != null;
            const period = 60 / (cur.hr ?? 80);
            const y = on ? h * 0.85 - pleth(((ti - 0.12) % period) / period) * h * 0.7 : h * 0.85;
            c.strokeStyle = on ? "#38bdf8" : "rgba(56,189,248,0.3)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(xi === 0 ? 0 : xi - 1, xi === 0 ? y : prev[1]);
            c.lineTo(xi, y);
            c.stroke();
            prev[1] = y;
          }
        }
      });
      x = (x + steps) % (canvases[0] as HTMLCanvasElement).clientWidth;
      // a beep on each heartbeat; an alarm every two seconds in VF
      if (perfusing(cur)) {
        const period = 60 / (cur.hr ?? 80);
        const beat = Math.floor((t - 0.29 * period) / period);
        if (beat !== lastBeat) {
          lastBeat = beat;
          if (getSoundPrefs().sfx) monitorBeep(cur.spo2);
        }
      } else if (cur.rhythm === "vf" && !cur.cpr && t - lastAlarm > 2) {
        lastAlarm = t;
        monitorAlarm();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  const hr = perfusing(vitals) ? String(vitals.hr ?? "--") : vitals.rhythm === "vf" ? "VF" : "---";
  const label =
    vitals.rhythm === "none" && !vitals.cpr
      ? "No monitor attached"
      : vitals.cpr
        ? "CPR in progress"
        : vitals.rhythm === "vf"
          ? "Ventricular fibrillation"
          : vitals.rhythm === "sinus-fast"
            ? "Sinus tachycardia"
            : "Sinus rhythm";
  return (
    <div
      className={cn("overflow-hidden rounded-xl bg-[#04101f] text-white shadow-card ring-1 ring-white/10", className)}
      role="img"
      aria-label={`Monitor: ${label}. Heart rate ${hr}${vitals.spo2 ? `, oxygen saturation ${vitals.spo2}%` : ""}${vitals.bp ? `, blood pressure ${vitals.bp}` : ""}${vitals.temp ? `, temperature ${vitals.temp} °C` : ""}.`}
    >
      <div className="grid grid-cols-[1fr_auto]">
        <div className="relative min-w-0">
          <p className="absolute left-2 top-1.5 font-display text-[10px] font-semibold tracking-[0.14em] text-[#3ddc84]">II · {label.toUpperCase()}</p>
          <canvas ref={ecg} className="block h-28 w-full" aria-hidden="true" />
          <p className="absolute left-2 top-[7.2rem] font-display text-[10px] font-semibold tracking-[0.14em] text-[#38bdf8]">PLETH</p>
          <canvas ref={spo} className="block h-12 w-full" aria-hidden="true" />
        </div>
        <div className="flex w-[5.6rem] flex-col justify-between border-l border-white/10 px-2 py-1.5 font-display">
          <Num label="HR" value={hr} tone="text-[#3ddc84]" big />
          <Num label="SpO₂" value={perfusing(vitals) && vitals.spo2 ? `${vitals.spo2}` : "--"} unit="%" tone="text-[#38bdf8]" />
          <Num label="NIBP" value={vitals.bp ?? "--/--"} tone="text-white" small />
          <div className="flex justify-between gap-1">
            <Num label="RR" value={vitals.rr ? String(vitals.rr) : "--"} tone="text-[#facc15]" small />
            {vitals.temp ? <Num label="T °C" value={vitals.temp.toFixed(1)} tone={vitals.temp >= 40.5 ? "text-[#ff6b5b]" : "text-[#fb923c]"} small /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Num({ label, value, unit, tone, big, small }: { label: string; value: string; unit?: string; tone: string; big?: boolean; small?: boolean }) {
  return (
    <div className="leading-none">
      <p className="text-[9px] font-semibold tracking-[0.12em] text-white/55">{label}</p>
      <p className={cn("font-bold tabular-nums", tone, big ? "text-3xl" : small ? "text-sm" : "text-xl")}>
        {value}
        {unit ? <span className="text-[10px]">{unit}</span> : null}
      </p>
    </div>
  );
}
