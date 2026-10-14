import { Link } from "@tanstack/react-router";
import { ChevronRight, Hand, Pause, Play } from "lucide-react";
import { Component, lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import { PositionDiagram } from "@/components/position-diagram";
import { cn } from "@/lib/utils";
import { type RoleId, workshop } from "@/lib/workshop";

const Scene3D = lazy(() => import("@/components/scene-3d"));

/** The flat diagram stands in while the 3D scene loads, and whenever 3D is not available. */
class Safe extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function canRender3D() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Stage({ selected, onSelect, step }: { selected?: RoleId; onSelect?: (id: RoleId) => void; step?: number }) {
  // 3D only in the browser, and only where the device can draw it
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(canRender3D()), []);
  const flat = <PositionDiagram highlight={selected} />;
  if (!ok) return ok === false ? flat : <div className="aspect-square w-full bg-navy sm:aspect-video" />;
  return (
    <Safe fallback={flat}>
      <Suspense fallback={<div className="aspect-square w-full bg-navy sm:aspect-video" />}>
        <Scene3D selected={selected} onSelect={onSelect} step={step} className="aspect-square w-full bg-navy sm:aspect-video" />
      </Suspense>
    </Safe>
  );
}

/** Home: turn the scene, tap a colour, read what that role does. */
export function RoleExplorer3D() {
  const [sel, setSel] = useState<RoleId | undefined>();
  const role = sel ? workshop.roles.find((r) => r.id === sel) : undefined;
  return (
    <div>
      <div className="relative">
        <Stage selected={sel} onSelect={(id) => setSel((cur) => (cur === id ? undefined : id))} />
        <p className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-navy/75 px-2.5 py-1 text-[11px] font-medium text-on-navy">
          <Hand className="size-3.5 text-gold" aria-hidden />
          Drag to turn · tap a colour
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 pt-3">
        {workshop.roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSel((cur) => (cur === r.id ? undefined : r.id))}
            aria-pressed={sel === r.id}
            className={cn(
              "min-h-9 rounded-full px-3 font-display text-xs font-semibold tracking-wide transition-transform duration-150 active:scale-95",
              sel === r.id ? "ring-2 ring-gold ring-offset-2 ring-offset-paper" : "",
              r.id === "black" && "dark:outline dark:outline-1 dark:outline-white/30",
            )}
            style={{ backgroundColor: r.color, color: r.text, boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div className="px-3.5 pb-3.5 pt-3" aria-live="polite">
        {role ? (
          <div className="rounded-lg bg-note px-3 py-2.5">
            <p className="font-display text-sm font-semibold tracking-wide text-heading">
              {role.name} · {role.role}
            </p>
            <p className="mt-1 text-sm leading-snug">{role.stand}</p>
            <p className="mt-1 text-sm leading-snug text-muted">Brings: {role.bring}</p>
            <Link
              to="/role/$id"
              params={{ id: role.id }}
              className="mt-1 inline-flex min-h-10 items-center gap-1 font-display text-sm font-semibold tracking-wide text-gold"
            >
              Open the {role.name.toLowerCase()} role
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-sm leading-snug text-muted">
            Six people, six colours, one job each. Tap a figure or a colour to see where that role sits and what it does.
          </p>
        )}
      </div>
    </div>
  );
}

/** Drill: the same scene acting out each of the six steps. */
export function DrillPlayer3D({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  const [auto, setAuto] = useState(false);
  const steps = workshop.steps;
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => onStep(step >= steps.length ? 1 : step + 1), 9000);
    return () => window.clearInterval(id);
  }, [auto, step, steps.length, onStep]);
  const cur = steps[step - 1];
  return (
    <div>
      <div className="relative">
        <Stage step={step} />
        <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-navy/75 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
          STEP {cur.n} · {cur.title.toUpperCase()}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-3.5 pt-3">
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => onStep(s.n)}
            aria-label={`Step ${s.n}: ${s.title}`}
            aria-current={s.n === step ? "step" : undefined}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition-transform duration-150 active:scale-95",
              s.n === step ? "bg-navy text-gold" : "bg-note text-heading",
            )}
          >
            {s.n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAuto((v) => !v)}
          aria-pressed={auto}
          className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gold px-3.5 font-display text-xs font-semibold tracking-wide text-on-gold transition-transform duration-150 active:scale-95"
        >
          {auto ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
          {auto ? "Pause" : "Play all"}
        </button>
      </div>
      <p className="px-3.5 pb-3.5 pt-2.5 text-sm leading-snug" aria-live="polite">
        <span className="font-semibold text-heading">{cur.title}. </span>
        {cur.lines[0]}
      </p>
    </div>
  );
}
