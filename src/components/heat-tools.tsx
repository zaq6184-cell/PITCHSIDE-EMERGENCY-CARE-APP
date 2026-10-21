import { CheckCircle2, Droplets, Play, RotateCcw, Thermometer, TriangleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CRITICAL_TEMP,
  GOAL_MINUTES,
  GOOD_RATE,
  METHODS,
  type MethodId,
  minutesAboveCritical,
  minutesToTarget,
  PLANS,
  type Plan,
  START_TEMP,
  TARGET_TEMP,
  tempAt,
  WORLD_CUP_2026,
  zoneFor,
  ZONES,
} from "@/lib/heat";
import { countTick, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ heat risk dial
const DIAL_MIN = 18;
const DIAL_MAX = 36;
/** Risk colours carry a label and an icon wherever they appear, never colour alone. */
const ZONE_TONE: Record<string, string> = { low: "#1A7F45", high: "#C99A06", very: "#D9661A", extreme: "#C0392B" };

/**
 * Heat risk from a WBGT reading: drag the reading, the needle moves through the football bodies' thresholds
 * and the actions for that zone appear underneath.
 */
export function WbgtDial() {
  const [wbgt, setWbgt] = useState(27);
  const id = useId();
  const zone = zoneFor(wbgt);
  const cx = 160;
  const cy = 150;
  const r = 118;
  const ang = (v: number) => Math.PI + ((Math.min(DIAL_MAX, Math.max(DIAL_MIN, v)) - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * Math.PI;
  // rounded: the built page and the browser can differ in the last digits of a cosine (a hydration mismatch)
  const pt = (v: number, rr: number) => [Math.round((cx + Math.cos(ang(v)) * rr) * 100) / 100, Math.round((cy + Math.sin(ang(v)) * rr) * 100) / 100] as const;
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a, r);
    const [x2, y2] = pt(b, r);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const bounds = ZONES.map((z, i) => [Math.max(DIAL_MIN, z.from), i + 1 < ZONES.length ? ZONES[i + 1].from : DIAL_MAX] as const);
  const [nx, ny] = pt(wbgt, r);
  const [ix, iy] = pt(wbgt, r - 22);
  const tone = ZONE_TONE[zone.id];
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox="0 0 320 172" className="mx-auto block h-auto w-full max-w-sm" role="img" aria-label={`WBGT ${wbgt} °C: ${zone.label} risk. ${zone.who}.`}>
        {ZONES.map((z, i) => (
          <path key={z.id} d={arc(bounds[i][0] + (i ? 0.12 : 0), bounds[i][1] - (i + 1 < ZONES.length ? 0.12 : 0))} stroke={ZONE_TONE[z.id]} strokeWidth={18} fill="none" opacity={z.id === zone.id ? 1 : 0.32} />
        ))}
        {[18, 22, 26, 28, 32, 36].map((v) => {
          const [tx, ty] = pt(v, r + 17);
          return (
            <text key={v} x={tx} y={ty + 3} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
              {v}
            </text>
          );
        })}
        {/* the reading: a ringed marker riding on the arc, with a short pointer inwards */}
        <line x1={ix} y1={iy} x2={nx} y2={ny} className="stroke-heading" strokeWidth={3} strokeLinecap="round" />
        <circle cx={nx} cy={ny} r={12} fill={tone} className="stroke-paper" strokeWidth={3} />
        <text x={cx} y={cy - 22} textAnchor="middle" className="fill-heading font-display text-[34px] font-bold tabular-nums">
          {wbgt.toFixed(1)}°
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-muted text-[10px] font-semibold tracking-[0.12em]">
          WBGT °C · {zone.label.toUpperCase()}
        </text>
      </svg>

      <div>
        <label htmlFor={`${id}-wbgt`} className="text-xs text-muted">
          WBGT reading from the meter at the pitch
        </label>
        <input
          id={`${id}-wbgt`}
          name="wbgt"
          type="range"
          min={DIAL_MIN}
          max={DIAL_MAX}
          step={0.5}
          value={wbgt}
          aria-valuetext={`${wbgt} degrees, ${zone.label} risk`}
          onChange={(e) => setWbgt(Number(e.target.value))}
          className="range-gold w-full"
          style={{ "--fill": `${((wbgt - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * 100}%` } as React.CSSProperties}
        />
      </div>

      <div className="rounded-xl border-l-4 bg-note px-3 py-2.5" style={{ borderColor: tone }} aria-live="polite">
        <p className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-heading">
          {zone.id === "low" ? <CheckCircle2 className="size-4" style={{ color: tone }} aria-hidden /> : <TriangleAlert className="size-4" style={{ color: tone }} aria-hidden />}
          {zone.label.toUpperCase()} RISK
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{zone.who}</p>
        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug">
          {zone.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-cream px-3 py-2 text-xs leading-snug text-ink">
        <Droplets className="mt-0.5 size-4 shrink-0 text-chart-2" aria-hidden />
        <span>
          <span className="font-semibold">World Cup 2026: </span>every match stopped for a {WORLD_CUP_2026.length}-minute hydration break{" "}
          {WORLD_CUP_2026.minute} minutes into each half, whatever the temperature. Your competition's own heat rules always decide.
        </span>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ cooling simulator
// about as wide as the chart is drawn beside the thermometer on a 360 px phone, so its labels read at ~10 px
const W = 256;
const H = 196;
const X0 = 28;
const X1 = 250;
const Y0 = 14;
const Y1 = 160;
const T_MAX = 60;
const LO = 38;
const HI = 42;
const xs = (t: number) => X0 + (t / T_MAX) * (X1 - X0);
const ys = (c: number) => Y1 - ((c - LO) / (HI - LO)) * (Y1 - Y0);

function curve(rate: number, delay: number, until = T_MAX) {
  const pts: string[] = [];
  for (let t = 0; t <= until + 1e-9; t += 0.5) pts.push(`${xs(t).toFixed(1)} ${ys(tempAt(t, rate, delay)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
}

/** The area above 40.5 °C under the curve: the exposure that matters. */
function exposure(rate: number, delay: number) {
  const end = minutesAboveCritical(rate, delay);
  const pts: string[] = [`${xs(0)} ${ys(CRITICAL_TEMP)}`];
  for (let t = 0; t <= end + 1e-9; t += 0.5) pts.push(`${xs(t).toFixed(1)} ${ys(Math.max(CRITICAL_TEMP, tempAt(t, rate, delay))).toFixed(1)}`);
  pts.push(`${xs(end).toFixed(1)} ${ys(CRITICAL_TEMP)}`);
  return `M${pts.join(" L")} Z`;
}

/**
 * Cool first, transport second: pick a cooling method and where cooling starts, then run the clock — the
 * rectal temperature falls at that method's typical rate. The faint lines are the other methods.
 */
export function CoolingSimulator() {
  const [method, setMethod] = useState<MethodId>("cwi");
  const [planId, setPlanId] = useState<Plan["id"]>("site");
  const [shown, setShown] = useState(T_MAX); // minutes of the curve drawn
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const raf = useRef(0);
  const clipId = `cool-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const m = METHODS.find((x) => x.id === method) ?? METHODS[0];
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const target = minutesToTarget(m.rate, plan.delay);
  const above = minutesAboveCritical(m.rate, plan.delay);
  const inTime = target <= GOAL_MINUTES;
  const now = Math.min(shown, T_MAX);
  const tempNow = tempAt(now, m.rate, plan.delay);
  const others = useMemo(() => METHODS.filter((x) => x.id !== method).map((x) => ({ id: x.id, d: curve(x.rate, plan.delay) })), [method, plan.delay]);

  // run: 60 minutes in about 7 seconds, a tick every 5 minutes
  const run = () => {
    tap();
    cancelAnimationFrame(raf.current);
    setRunning(true);
    setRan(true);
    const t0 = performance.now();
    let lastFive = 0;
    const loop = () => {
      const t = ((performance.now() - t0) / 7000) * T_MAX;
      setShown(Math.min(T_MAX, t));
      const five = Math.floor(t / 5);
      if (five > lastFive) {
        lastFive = five;
        countTick(false);
      }
      if (t < T_MAX) raf.current = requestAnimationFrame(loop);
      else {
        setRunning(false);
        sfx(inTime ? "correct" : "wrong", 0.4);
      }
    };
    raf.current = requestAnimationFrame(loop);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  // a new choice shows the whole curve straight away
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setRan(false);
    setShown(T_MAX);
  }, [method, planId]);

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Where cooling starts" className="grid grid-cols-2 gap-1 rounded-full bg-note p-1">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={planId === p.id}
            onClick={() => {
              tap();
              setPlanId(p.id);
            }}
            className={cn("min-h-10 rounded-full px-2 font-display text-[13px] font-semibold tracking-wide transition-colors", planId === p.id ? "bg-navy text-gold" : "text-heading")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Cooling method" className="flex flex-wrap gap-1.5">
        {METHODS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={method === x.id}
            onClick={() => {
              tap();
              setMethod(x.id);
            }}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors",
              // dark mode's lighter blue needs navy letters
              method === x.id ? "border-chart-2 bg-chart-2 text-white dark:text-on-gold" : "border-line bg-paper text-heading",
            )}
          >
            {x.short}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto min-w-0 flex-1" role="img" aria-label={`${m.name}, ${plan.label.toLowerCase()}: below ${TARGET_TEMP} °C at ${target.toFixed(0)} minutes after the collapse; ${above.toFixed(0)} minutes above ${CRITICAL_TEMP} °C.`}>
          {[38, 39, 40, 41, 42].map((c) => (
            <g key={c}>
              <line x1={X0} x2={X1} y1={ys(c)} y2={ys(c)} className="stroke-line" strokeWidth={1} />
              <text x={X0 - 5} y={ys(c) + 3.5} textAnchor="end" className="fill-muted text-[10px] tabular-nums">
                {c}°
              </text>
            </g>
          ))}
          {[0, 10, 20, 30, 40, 50, 60].map((t) => (
            <text key={t} x={xs(t)} y={Y1 + 14} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
              {t}
            </text>
          ))}
          <text x={X1} y={H - 3} textAnchor="end" className="fill-muted text-[10px]">
            minutes after the collapse
          </text>
          {/* the 30-minute window */}
          <rect x={xs(0)} y={Y0} width={xs(GOAL_MINUTES) - xs(0)} height={Y1 - Y0} className="fill-gold" opacity={0.1} />
          <text x={xs(GOAL_MINUTES) - 3} y={Y1 - 5} textAnchor="end" className="fill-heading text-[10px] font-semibold">
            30-MIN WINDOW
          </text>
          {/* thresholds (their labels go on top of the curves, further down) */}
          <line x1={X0} x2={X1} y1={ys(CRITICAL_TEMP)} y2={ys(CRITICAL_TEMP)} className="stroke-chart-1" strokeWidth={1} />
          <line x1={X0} x2={X1} y1={ys(TARGET_TEMP)} y2={ys(TARGET_TEMP)} className="stroke-chart-2" strokeWidth={1} />
          {/* the other methods, faint */}
          {others.map((o) => (
            <path key={o.id} d={o.d} fill="none" className="stroke-muted" strokeWidth={1.25} opacity={0.35} />
          ))}
          {/* exposure above 40.5 and the chosen curve, drawn as far as the clock has run */}
          <clipPath id={clipId}>
            <rect x={0} y={0} width={xs(now)} height={H} />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <path d={exposure(m.rate, plan.delay)} className="fill-chart-1" opacity={0.18} />
            <path d={curve(m.rate, plan.delay)} fill="none" className="stroke-chart-2" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x={X1} y={ys(CRITICAL_TEMP) - 4} textAnchor="end" className="chart-halo fill-ink text-[10px] font-semibold">
            40.5° · organ damage risk rises
          </text>
          <text x={X1} y={ys(TARGET_TEMP) - 4} textAnchor="end" className="chart-halo fill-ink text-[10px] font-semibold">
            target: below 39°
          </text>
          {running ? (
            <circle cx={xs(now)} cy={ys(tempNow)} r={5} className="fill-chart-2 stroke-paper" strokeWidth={2} />
          ) : (
            <circle cx={xs(Math.min(target, T_MAX))} cy={ys(TARGET_TEMP)} r={5} className={cn(inTime ? "fill-[#1A7F45]" : "fill-chart-1", "stroke-paper")} strokeWidth={2} />
          )}
        </svg>
        <Thermometer3 temp={running || ran ? tempNow : START_TEMP} />
      </div>

      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <div className={cn("rounded-xl px-3 py-2.5", inTime ? "bg-[#1A7F45]/12" : "bg-danger/10")}>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {inTime ? <CheckCircle2 className="size-3.5 text-[#1A7F45]" aria-hidden /> : <TriangleAlert className="size-3.5 text-danger" aria-hidden />}
            Below 39 °C
          </p>
          <p className="mt-0.5 font-display text-2xl font-bold leading-none text-heading">{target > T_MAX ? `${Math.round(target)} min` : `${target.toFixed(0)} min`}</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{inTime ? "Inside the 30-minute window." : "Outside the 30-minute window."}</p>
        </div>
        <div className="rounded-xl bg-note px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Above 40.5 °C</p>
          <p className="mt-0.5 font-display text-2xl font-bold leading-none text-heading">{above.toFixed(0)} min</p>
          <p className="mt-1 text-[11px] leading-snug text-muted">The shorter, the better the outcome.</p>
        </div>
      </div>
      <p className="text-xs leading-snug text-muted">
        <span className="font-semibold text-ink">{m.name}: </span>about {m.rate.toFixed(2)} °C a minute
        {m.range ? ` (studies: ${m.range[0]}–${m.range[1]})` : ""}.{" "}
        {m.rate >= GOOD_RATE ? "Fast enough — experts ask for at least 0.155 °C a minute." : "Too slow on its own — experts ask for at least 0.155 °C a minute."} {plan.note}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-95 disabled:opacity-60"
        >
          {shown < T_MAX && !running ? <RotateCcw className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {running ? `${Math.floor(now)} min · ${tempNow.toFixed(1)} °C` : "Run the clock"}
        </button>
      </div>
      <details className="rounded-lg border border-line px-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold text-heading">Compare every method as a table</summary>
        <table className="mb-3 w-full text-left text-xs tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-semibold">Method</th>
              <th className="py-1 font-semibold">°C/min</th>
              <th className="py-1 font-semibold">Below 39 °C · at the pitch</th>
              <th className="py-1 font-semibold">· transport first</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((x) => (
              <tr key={x.id} className="border-t border-line">
                <td className="py-1 pr-2">{x.short}</td>
                <td className="py-1">{x.rate.toFixed(2)}</td>
                <td className="py-1">{Math.round(minutesToTarget(x.rate, PLANS[0].delay))} min</td>
                <td className="py-1">{Math.round(minutesToTarget(x.rate, PLANS[1].delay))} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** A tall thermometer whose column follows the temperature, red above 40.5 °C. */
function Thermometer3({ temp }: { temp: number }) {
  const k = (Math.min(HI, Math.max(LO, temp)) - LO) / (HI - LO);
  const hot = temp > CRITICAL_TEMP;
  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1" aria-hidden="true">
      <Thermometer className={cn("size-4", hot ? "text-chart-1" : "text-chart-2")} />
      <div className="relative h-36 w-3.5 overflow-hidden rounded-full bg-line">
        <div className={cn("absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-150", hot ? "bg-chart-1" : "bg-chart-2")} style={{ height: `${Math.max(8, k * 100)}%` }} />
      </div>
      <div className={cn("size-6 rounded-full", hot ? "bg-chart-1" : "bg-chart-2")} />
      <p className="font-display text-sm font-bold tabular-nums text-heading">{temp.toFixed(1)}°</p>
    </div>
  );
}
