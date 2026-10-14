import { Link } from "@tanstack/react-router";
import { ChevronRight, Hand, HeartPulse, Pause, Play, Volume2 } from "lucide-react";
import { Component, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { PositionDiagram } from "@/components/position-diagram";
import { useSoundPrefs } from "@/components/sound-control";
import { RoleChip } from "@/components/workshop";
import { haptic, say, setSoundPrefs, sfx, type SfxName, startMetronome, stopMetronome, stopVoice, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { useSwipe } from "@/lib/gestures";
import { type Callout, callouts, drillCallouts } from "@/lib/voice";
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

/** While the 3D team loads: a shimmer and the six colours bouncing. */
function Loading3D() {
  const dots = ["#1C1C1C", "#E36B12", "#C0392B", "#1F6AA5", "#F4F4F1", "#1A7F45"];
  return (
    <div className="relative grid aspect-square w-full place-items-center overflow-hidden bg-navy sm:aspect-video" role="status" aria-label="Loading the 3D scene">
      <div className="shimmer absolute inset-0" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex gap-2" aria-hidden="true">
          {dots.map((d, i) => (
            <span key={d} className="dot-bounce size-3 rounded-full ring-1 ring-white/30" style={{ background: d, "--d": `${i * 0.1}s` } as React.CSSProperties} />
          ))}
        </div>
        <p className="font-display text-xs font-semibold tracking-[0.16em] text-gold">LOADING THE 3D TEAM</p>
      </div>
    </div>
  );
}

function Stage({ selected, onSelect, step }: { selected?: RoleId; onSelect?: (id: RoleId) => void; step?: number }) {
  // 3D only in the browser, only where the device can draw it, and only once it is near the screen
  const box = useRef<HTMLDivElement>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [near, setNear] = useState(false);
  useEffect(() => setOk(canRender3D()), []);
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return setNear(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const flat = <PositionDiagram highlight={selected} />;
  return (
    <div ref={box}>
      {ok === false ? (
        flat
      ) : !ok || !near ? (
        <Loading3D />
      ) : (
        <Safe fallback={flat}>
          <Suspense fallback={<Loading3D />}>
            <Scene3D selected={selected} onSelect={onSelect} step={step} className="aspect-square w-full bg-navy sm:aspect-video" />
          </Suspense>
        </Safe>
      )}
    </div>
  );
}

/** What someone just said, over the bottom of the 3D scene. */
function Caption({ c }: { c: Callout | null }) {
  if (!c) return null;
  return (
    <div
      key={c.id}
      className="caption-in pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-[#0b1f3a]/85 px-2.5 py-2 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      aria-live="polite"
    >
      <RoleChip id={c.role} />
      <p className="min-w-0 text-[13px] font-medium italic leading-snug text-[#f7f4ee]">“{c.text}”</p>
    </div>
  );
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Home: turn the scene, tap a colour, read what that role does — and hear what they say. */
export function RoleExplorer3D() {
  const [sel, setSel] = useState<RoleId | undefined>();
  const [caption, setCaption] = useState<Callout | null>(null);
  const role = sel ? workshop.roles.find((r) => r.id === sel) : undefined;
  const pick = (id: RoleId) => {
    tap();
    const next = sel === id ? undefined : id;
    setSel(next);
    if (next) {
      const c = callouts[`${next}-1`];
      setCaption(c);
      void say(c.id);
      window.setTimeout(() => setCaption((now) => (now?.id === c.id ? null : now)), 3200);
    } else {
      setCaption(null);
    }
  };
  return (
    <div>
      <div className="relative">
        <Stage selected={sel} onSelect={pick} />
        <p className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-[#0b1f3a]/75 px-2.5 py-1 text-[11px] font-medium text-[#f7f4ee]">
          <Hand className="size-3.5 text-gold" aria-hidden />
          Drag to turn · tap a colour
        </p>
        <Caption c={caption} />
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 pt-3">
        {workshop.roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => pick(r.id)}
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
          <div key={role.id} className="caption-in rounded-lg bg-note px-3 py-2.5">
            <p className="font-display text-sm font-semibold tracking-wide text-heading">
              {role.name} · {role.role}
            </p>
            <p className="mt-1 text-sm leading-snug">{role.stand}</p>
            <p className="mt-1 text-sm leading-snug text-muted">Brings: {role.bring}</p>
            <Link
              to="/role/$id"
              params={{ id: role.id }}
              className="mt-1 inline-flex min-h-10 items-center gap-1 font-display text-sm font-semibold tracking-wide text-gold-ink"
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

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Drill: the same scene acting out each of the six steps, with the team's call-outs. */
export function DrillPlayer3D({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  const [auto, setAuto] = useState(false);
  const [caption, setCaption] = useState<Callout | null>(null);
  const prefs = useSoundPrefs();
  const [box, inView] = useInView<HTMLDivElement>();
  const steps = workshop.steps;
  const cur = steps[step - 1];
  const autoRef = useRef(auto);
  const onStepRef = useRef(onStep);
  const firstRun = useRef(true);
  useEffect(() => {
    autoRef.current = auto;
    onStepRef.current = onStep;
  });
  const swipe = useSwipe<HTMLDivElement>((dir) => {
    const next = dir === "left" ? Math.min(steps.length, step + 1) : Math.max(1, step - 1);
    if (next !== step) {
      haptic(10);
      onStep(next);
    }
  });

  // each step: a whoosh, then the call-outs in order (spoken if sound is on, always captioned)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!firstRun.current) sfx("whoosh", 0.3);
      firstRun.current = false;
      const t0 = Date.now();
      await wait(400);
      for (const id of drillCallouts[step] ?? []) {
        if (cancelled) return;
        if (id.startsWith("sfx:")) {
          sfx(id.slice(4) as SfxName, 0.6);
          await wait(1400);
          continue;
        }
        const c = callouts[id];
        setCaption(c);
        const started = Date.now();
        await say(id);
        const left = 2300 - (Date.now() - started); // keep each caption up long enough to read
        if (left > 0) await wait(left);
        await wait(200);
      }
      if (cancelled) return;
      setCaption(null);
      if (autoRef.current) {
        const rest = 9000 - (Date.now() - t0);
        if (rest > 0) await wait(rest);
        if (!cancelled && autoRef.current) onStepRef.current(step >= steps.length ? 1 : step + 1);
      }
    };
    void run();
    return () => {
      cancelled = true;
      stopVoice();
      setCaption(null);
    };
  }, [step, auto, steps.length]);

  // the CPR rhythm at 110 per minute while compressions run (steps 2–4), only on screen and with sound on
  const compressing = step >= 2 && step <= 4;
  useEffect(() => {
    if (!(compressing && prefs.sfx && inView)) return;
    startMetronome(110);
    return () => stopMetronome();
  }, [compressing, prefs.sfx, inView]);

  return (
    <div ref={box}>
      <div className="relative">
        <Stage step={step} />
        <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#0b1f3a]/75 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
          STEP {cur.n} · {cur.title.toUpperCase()}
        </p>
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {compressing ? (
            <span className="flex items-center gap-1 rounded-full bg-[#0b1f3a]/75 px-2 py-1 font-display text-[11px] font-semibold tracking-wide text-[#f7f4ee]">
              <HeartPulse className="cpr-beat size-3.5 text-[#ff6b5b]" aria-hidden />
              110/min
            </span>
          ) : null}
          {!prefs.sfx ? (
            <button
              type="button"
              onClick={() => {
                setSoundPrefs({ sfx: true });
                const first = drillCallouts[step]?.find((id) => !id.startsWith("sfx:"));
                if (first) void say(first);
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold px-3 font-display text-[11px] font-semibold tracking-wide text-on-gold shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)] active:scale-95"
            >
              <Volume2 className="size-3.5" aria-hidden />
              Hear the team
            </button>
          ) : null}
        </div>
        <Caption c={caption} />
      </div>
      <div ref={swipe}>
      <div className="flex items-center gap-1 px-3.5 pt-3 min-[400px]:gap-1.5">
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => {
              tap();
              onStep(s.n);
            }}
            aria-label={`Step ${s.n}: ${s.title}`}
            aria-current={s.n === step ? "step" : undefined}
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition-all duration-200 active:scale-95 min-[360px]:size-9 min-[400px]:size-10",
              s.n === step ? "scale-110 bg-navy text-gold shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]" : "bg-note text-heading",
            )}
          >
            {s.n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!auto) sfx("whistle", 0.5);
            setAuto((v) => !v);
          }}
          aria-pressed={auto}
          aria-label={auto ? "Pause" : "Play all steps"}
          className="ml-auto inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gold px-2.5 font-display text-xs font-semibold tracking-wide text-on-gold transition-transform duration-150 active:scale-95 min-[400px]:px-3.5"
        >
          {auto ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
          <span className="max-[399px]:sr-only">{auto ? "Pause" : "Play all"}</span>
        </button>
      </div>
      <div className="mx-3.5 mt-2.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out" style={{ width: `${(step / steps.length) * 100}%` }} />
      </div>
      <p key={step} className="caption-in px-3.5 pb-1 pt-2.5 text-sm leading-snug" aria-live="polite">
        <span className="font-semibold text-heading">{cur.title}. </span>
        {cur.lines[0]}
      </p>
      <p className="px-3.5 pb-3.5 text-[11px] text-muted pointer-fine:hidden">Swipe here for the next step.</p>
      </div>
    </div>
  );
}
