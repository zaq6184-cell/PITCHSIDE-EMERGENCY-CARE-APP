import { Pause, Play, Timer } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { bandText, DECLINE, FIFA_SDR, matchClock, survivalBand, survivalMid, TARGET_MINUTES } from "@/lib/survival";
import { countTick, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

// chart geometry (SVG units)
const W = 320;
const H = 196;
const X0 = 34;
const X1 = 310;
const Y0 = 14;
const Y1 = 166;
const MAX = 12;
const xs = (m: number) => X0 + (m / MAX) * (X1 - X0);
const ys = (p: number) => Y1 - (p / 100) * (Y1 - Y0);
const STEP = 0.25;

function bandPath(cpr: boolean) {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let m = 0; m <= MAX + 1e-9; m += STEP) {
    const [lo, hi] = survivalBand(m, cpr);
    top.push(`${xs(m).toFixed(1)} ${ys(hi).toFixed(1)}`);
    bottom.unshift(`${xs(m).toFixed(1)} ${ys(lo).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bottom.join(" L")} Z`;
}

function midPath(cpr: boolean) {
  const pts: string[] = [];
  for (let m = 0; m <= MAX + 1e-9; m += STEP) pts.push(`${xs(m).toFixed(1)} ${ys(survivalMid(m, cpr)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
}

const SERIES = [
  { cpr: false, label: "No CPR", rate: `${DECLINE.none[0]}–${DECLINE.none[1]}% a minute`, tone: "chart-1" },
  { cpr: true, label: "CPR from the start", rate: `${DECLINE.cpr[0]}–${DECLINE.cpr[1]}% a minute`, tone: "chart-2" },
] as const;

/**
 * Every minute counts: drag the time from collapse to the first shock and watch the chance of survival
 * fall — fast without CPR, slowly with it. Hover (or drag on) the chart to read any minute; the table
 * under it holds every value.
 */
export function SurvivalSlider() {
  const [min, setMin] = useState(TARGET_MINUTES);
  const [hover, setHover] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const shown = hover ?? min;
  const none = survivalBand(shown, false);
  const cpr = survivalBand(shown, true);
  const paths = useMemo(() => SERIES.map((s) => ({ band: bandPath(s.cpr), mid: midPath(s.cpr) })), []);
  const late = shown > TARGET_MINUTES;

  // play: the clock runs from the collapse, about a minute every 0.6 s, ticking each whole minute
  useEffect(() => {
    if (!playing) return;
    if (min >= MAX) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setMin((m) => Math.min(MAX, m + STEP)), 150);
    return () => window.clearTimeout(t);
  }, [playing, min]);
  useEffect(() => {
    if (playing && min > 0 && Number.isInteger(min)) countTick(min === MAX);
  }, [playing, min]);

  const fromPointer = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return null;
    const px = ((clientX - r.left) / r.width) * W;
    const m = ((px - X0) / (X1 - X0)) * MAX;
    return Math.min(MAX, Math.max(0, Math.round(m / STEP) * STEP));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("h-0.5 w-5 rounded-full", s.cpr ? "bg-chart-2" : "bg-chart-1")} />
            <span className="font-semibold text-ink">{s.label}</span> · {s.rate}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-pan-y select-none"
          role="img"
          aria-label={`At ${shown} minutes to the first shock: about ${bandText(none)} of the chance left without CPR, ${bandText(cpr)} with CPR from the start.`}
          onPointerMove={(e) => {
            const m = fromPointer(e.clientX);
            if (m == null) return;
            if (e.pointerType === "mouse" && e.buttons === 0) setHover(m);
            else if (e.buttons) setMin(m);
          }}
          onPointerDown={(e) => {
            const m = fromPointer(e.clientX);
            if (m != null) {
              setPlaying(false);
              setMin(m);
            }
          }}
          onPointerLeave={() => setHover(null)}
        >
          {/* recessive grid: 0, 25, 50, 75, 100% */}
          {[0, 25, 50, 75, 100].map((p) => (
            <g key={p}>
              <line x1={X0} x2={X1} y1={ys(p)} y2={ys(p)} className="stroke-line" strokeWidth={1} />
              <text x={X0 - 6} y={ys(p) + 3.5} textAnchor="end" className="fill-muted text-[10.5px] tabular-nums">
                {p}%
              </text>
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10, 12].map((m) => (
            <text key={m} x={xs(m)} y={Y1 + 14} textAnchor="middle" className="fill-muted text-[10.5px] tabular-nums">
              {m}
            </text>
          ))}
          <text x={X1} y={H - 1} textAnchor="end" className="fill-muted text-[10.5px]">
            minutes to the first shock
          </text>

          {/* FIFA's target: the first shock within 3 minutes */}
          <rect x={xs(0)} y={Y0} width={xs(TARGET_MINUTES) - xs(0)} height={Y1 - Y0} className="fill-gold" opacity={0.12} />
          <text textAnchor="middle" className="fill-heading text-[10px] font-semibold">
            <tspan x={xs(TARGET_MINUTES / 2)} y={Y1 - 19}>
              TARGET
            </tspan>
            <tspan x={xs(TARGET_MINUTES / 2)} y={Y1 - 7}>
              ≤ 3 MIN
            </tspan>
          </text>

          {/* the two bands, a wash with a 2px line through the middle */}
          {SERIES.map((s, i) => (
            <g key={s.label}>
              <path d={paths[i].band} className={s.cpr ? "fill-chart-2" : "fill-chart-1"} opacity={0.12} />
              <path d={paths[i].mid} className={s.cpr ? "stroke-chart-2" : "stroke-chart-1"} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {/* direct labels where the lines are well apart */}
          <text x={xs(6.6)} y={ys(survivalMid(6.6, true)) - 7} className="chart-halo fill-ink text-[10.5px] font-semibold">
            With CPR
          </text>
          <text x={xs(9.2)} y={ys(survivalMid(9.2, false)) - 9} className="chart-halo fill-ink text-[10.5px] font-semibold">
            No CPR
          </text>

          {/* crosshair at the chosen minute, with a ringed dot on each line */}
          <line x1={xs(shown)} x2={xs(shown)} y1={Y0} y2={Y1} className="stroke-heading" strokeWidth={1} />
          {SERIES.map((s) => (
            <circle
              key={s.label}
              cx={xs(shown)}
              cy={ys(survivalMid(shown, s.cpr))}
              r={4.5}
              className={cn(s.cpr ? "fill-chart-2" : "fill-chart-1", "stroke-paper")}
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        {SERIES.map((s) => {
          const b = s.cpr ? cpr : none;
          return (
            <div key={s.label} className="rounded-xl bg-note px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <span className={cn("h-0.5 w-4 rounded-full", s.cpr ? "bg-chart-2" : "bg-chart-1")} aria-hidden="true" />
                {s.label}
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold leading-none text-heading">{bandText(b)}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted">of the chance an immediate shock gives</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            tap();
            if (!playing && min >= MAX) setMin(0);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? "Pause the clock" : "Run the clock from the collapse"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-gold shadow-card active:scale-95"
        >
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-min`} className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>Minutes from collapse to the first shock</span>
            <span className={cn("font-display text-sm font-bold tabular-nums", late ? "text-danger" : "text-heading")}>{shown} min</span>
          </label>
          <input
            id={`${id}-min`}
            name="minutes-to-shock"
            type="range"
            min={0}
            max={MAX}
            step={STEP}
            value={min}
            aria-valuetext={`${min} minutes`}
            onChange={(e) => {
              setPlaying(false);
              setMin(Number(e.target.value));
            }}
            className="range-gold mt-1 w-full"
            style={{ "--fill": `${(min / MAX) * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>

      <p className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-xs leading-snug text-ink">
        <Timer className="size-4 shrink-0 text-gold-ink" aria-hidden />
        <span>
          Collapse at <span className="font-semibold tabular-nums">63:00</span> → first shock at{" "}
          <span className={cn("font-semibold tabular-nums", late && "text-danger")}>{matchClock(63, shown)}</span>
          {late ? " — later than FIFA's 3-minute target." : " — inside FIFA's 3-minute target."}
        </span>
      </p>

      <SdrBars />

      <details className="rounded-lg border border-line px-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold text-heading">Show the numbers as a table</summary>
        <table className="mb-3 w-full text-left text-xs tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-semibold">Minutes</th>
              <th className="py-1 font-semibold">No CPR</th>
              <th className="py-1 font-semibold">CPR from the start</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map((m) => (
              <tr key={m} className="border-t border-line">
                <td className="py-1">{m}</td>
                <td className="py-1">{bandText(survivalBand(m, false))}</td>
                <td className="py-1">{bandText(survivalBand(m, true))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="text-[11px] leading-snug text-muted">
        Teaching estimate from the American Heart Association's figures for witnessed VF arrest: survival falls about 7–10% for
        each minute without CPR and defibrillation, about 3–4% a minute with bystander CPR. Real outcomes depend on much more.
      </p>
    </div>
  );
}

/** FIFA Sudden Death Registry: survival of footballers who received CPR, with and without an AED. */
function SdrBars() {
  const rows = [
    { label: "AED used", value: FIFA_SDR.withAed },
    { label: "No AED", value: FIFA_SDR.withoutAed },
  ];
  return (
    <figure className="rounded-xl border border-line px-3 py-2.5">
      <figcaption className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        FIFA Sudden Death Registry · {FIFA_SDR.players} footballers · {FIFA_SDR.years}
      </figcaption>
      <p className="mt-0.5 text-xs leading-snug text-muted">Players who received CPR: how many survived.</p>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
            <span className="text-xs font-semibold text-ink">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-5 rounded-r-[4px] bg-chart-2" style={{ width: `${r.value * 0.82}%` }} aria-hidden="true" />
              <span className="font-display text-base font-bold text-heading">{r.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
