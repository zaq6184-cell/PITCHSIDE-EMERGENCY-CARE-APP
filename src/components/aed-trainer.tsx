import { Check, ListChecks, Maximize2, Minimize2, RotateCcw, Volume2, X, Zap } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { AedStage, AedView } from "@/components/aed-scene-3d";
import { Loading3D, Safe } from "@/components/set-piece-3d";
import { useSoundPrefs } from "@/components/sound-control";
import { RoleChip } from "@/components/workshop";
import { judgeTap, PAD_CHOICES, PAD_TARGETS, type PadId, type Tap } from "@/lib/aed-pads";
import { record, step as did } from "@/lib/progress";
import { aedCharge, haptic, say, setSoundPrefs, sfx, startMetronome, stopMetronome, stopVoice, tap as tapSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { aedPrompts, callouts } from "@/lib/voice";
import { useFullscreen } from "@/lib/use-fullscreen";
import { voicePan } from "@/lib/view3d";
import { canRender3D } from "@/lib/webgl";

const AedScene3D = lazy(() => import("@/components/aed-scene-3d"));

type Line = { who: "aed" | "green"; id: string; text: string };
type Result = { seconds: number; wrong: number; unsafe: number };

const NO_PADS: Record<PadId, boolean> = { right: false, left: false };
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const took = (s: number) => (s < 60 ? `${Math.round(s)} seconds` : `${Math.floor(s / 60)} min ${Math.floor(s % 60)} s`);

const STAGE_LABEL: Record<AedStage, string> = {
  idle: "AED PADS TRAINER",
  expose: "EXPOSE THE CHEST",
  pads: "PLACE THE PADS",
  analyse: "ANALYSING · HANDS OFF",
  advised: "SHOCK ADVISED",
  clear: "EVERYONE CLEAR",
  shock: "SHOCK DELIVERED",
  done: "CPR RESTARTED",
};

/**
 * AED pads trainer: you are Green 6 and the AED has just arrived. Expose the chest, tap where each pad
 * goes, keep hands off for the analysis, call everyone clear, then shock. The AED speaks its prompts
 * (and they are captioned); the clock runs from the start to the shock.
 */
export function AedTrainer() {
  const prefs = useSoundPrefs();
  const [mode, setMode] = useState<"3d" | "flat" | null>(null);
  const [stage, setStage] = useState<AedStage>("idle");
  const [exposed, setExposed] = useState(false);
  const [placed, setPlaced] = useState<Record<PadId, boolean>>(NO_PADS);
  const [wrong, setWrong] = useState(0);
  const [unsafe, setUnsafe] = useState(0);
  const [hint, setHint] = useState("");
  const [miss, setMiss] = useState<AedView["miss"]>(null);
  const [line, setLine] = useState<Line | null>(null);
  const [shockAt, setShockAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const present = useFullscreen<HTMLDivElement>();
  const t0 = useRef(0);
  const run = useRef(0);
  const stopCharge = useRef<() => void>(() => {});

  useEffect(() => setMode(canRender3D() ? "3d" : "flat"), []);
  // leaving the page stops the voice, the charging tone and the CPR click
  useEffect(
    () => () => {
      run.current++;
      stopCharge.current();
      stopVoice();
      stopMetronome();
    },
    [],
  );

  // the clock runs from Start until the shock
  const timing = stage === "expose" || stage === "pads" || stage === "analyse" || stage === "advised" || stage === "clear";
  useEffect(() => {
    if (!timing) return;
    const id = window.setInterval(() => setElapsed((Date.now() - t0.current) / 1000), 250);
    return () => window.clearInterval(id);
  }, [timing]);

  const live = (id: number) => run.current === id;

  /** Say a prompt and caption it; resolves once it has been up long enough to read. */
  const speak = async (l: Line, min = 2600) => {
    setLine(l);
    const started = Date.now();
    await say(l.id, false, l.who === "aed" ? (voicePan.aed ?? 0.3) : 0);
    const left = min - (Date.now() - started);
    if (left > 0) await wait(left);
  };
  const unsay = (l: Line) => setLine((cur) => (cur?.id === l.id ? null : cur));

  const start = () => {
    const id = ++run.current;
    stopCharge.current();
    stopCharge.current = () => {};
    stopVoice();
    stopMetronome();
    setExposed(false);
    setPlaced(NO_PADS);
    setWrong(0);
    setUnsafe(0);
    setMiss(null);
    setResult(null);
    setShockAt(0);
    setElapsed(0);
    t0.current = Date.now();
    setStage("expose");
    setHint("First expose the chest: tap the shirt to cut it away.");
    const l: Line = { who: "aed", ...aedPrompts.pads };
    void speak(l, 3000).then(() => live(id) && unsay(l));
  };

  const analyse = async (id: number) => {
    await wait(700);
    if (!live(id)) return;
    setStage("analyse");
    const a: Line = { who: "aed", ...aedPrompts.analyse };
    await speak(a, 3300);
    if (!live(id)) return;
    await wait(1300);
    if (!live(id)) return;
    setStage("advised");
    setHint("");
    stopCharge.current = aedCharge();
    const b: Line = { who: "aed", ...aedPrompts.shock };
    await speak(b, 3200);
    if (!live(id)) return;
    setHint("The AED is charged and the button is flashing. What do you do before you press it?");
  };

  const onTap = (p: Tap & { y?: number }) => {
    if (stage === "expose") {
      tapSound();
      sfx("whoosh", 0.35);
      setExposed(true);
      setStage("pads");
      setHint("Now tap where each pad goes — 0 of 2 on.");
      return;
    }
    if (stage === "analyse" || stage === "advised" || stage === "clear") {
      sfx("wrong", 0.35);
      setHint(stage === "analyse" ? "Hands off — the AED is analysing. Movement can spoil the analysis." : "Do not touch the player — the AED is charged.");
      return;
    }
    if (stage !== "pads") return;
    const verdict = judgeTap(p, placed);
    if ("pad" in verdict) {
      const next = { ...placed, [verdict.pad]: true };
      setPlaced(next);
      sfx("correct", 0.45);
      haptic(15);
      if (!(next.right && next.left)) {
        setHint(`${verdict.pad === "right" ? "Right" : "Left"} pad on — now the other one. 1 of 2 on.`);
        return;
      }
      setHint("Both pads on. Hands off for the analysis.");
      void analyse(run.current);
      return;
    }
    setWrong((w) => w + 1);
    sfx("wrong", 0.4);
    haptic([30, 40, 30]);
    setMiss({ x: p.x, y: p.y ?? 0.3, z: p.z, at: performance.now() });
    setHint(verdict.miss);
  };

  const onMissTap = () => {
    if (stage === "expose" || stage === "pads") setHint("Tap on the player's chest.");
  };

  const callClear = () => {
    if (stage !== "advised") return;
    setStage("clear");
    setHint("Everyone is clear — no one touching the player. Now shock.");
    const l: Line = { who: "green", id: "green-1", text: callouts["green-1"]?.text ?? "I'm clear, you're clear, everyone's clear!" };
    void speak(l, 2400).then(() => unsay(l));
  };

  const shock = () => {
    if (stage === "advised") {
      setUnsafe((n) => n + 1);
      sfx("wrong", 0.5);
      haptic([60, 40, 60]);
      setHint("Stop! Red 3 still has hands on the chest and Orange 2 is holding the airway. Call “Everyone clear!” and look before you shock.");
      return;
    }
    if (stage !== "clear") return;
    const id = run.current;
    stopCharge.current();
    stopCharge.current = () => {};
    sfx("shock", 0.7);
    haptic(220);
    setShockAt(performance.now());
    const seconds = (Date.now() - t0.current) / 1000;
    setElapsed(seconds);
    setStage("shock");
    setHint("");
    const summary = { seconds, wrong, unsafe };
    void (async () => {
      await wait(600);
      if (!live(id)) return;
      await speak({ who: "aed", ...aedPrompts.done }, 3000);
      if (!live(id)) return;
      startMetronome(110);
      await wait(4500);
      stopMetronome();
      if (!live(id)) return;
      setLine(null);
      setStage("done");
      setResult(summary);
      record(did.aed, summary);
    })();
  };

  const ghosts: Record<PadId, boolean> = wrong >= 2 ? { right: !placed.right, left: !placed.left } : NO_PADS;
  const view: AedView = { stage, exposed, placed, ghosts, miss, shockAt };
  const count = Number(placed.right) + Number(placed.left);
  const flat = <AedFlat view={view} onTap={onTap} />;

  return (
    <div ref={present.ref} className="present">
      <div className="stage-box relative">
        {mode === "3d" ? (
          <Safe fallback={flat}>
            <Suspense fallback={<Loading3D />}>
              <AedScene3D view={view} onTap={onTap} onMiss={onMissTap} className="aspect-square w-full bg-navy sm:aspect-video" />
            </Suspense>
          </Safe>
        ) : mode === "flat" ? (
          flat
        ) : (
          <Loading3D />
        )}
        <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#0b1f3a]/90 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
          {STAGE_LABEL[stage]}
          {stage === "pads" ? ` · ${count}/2` : ""}
        </p>
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          {stage !== "idle" ? (
            <p className="pointer-events-none rounded-full bg-[#0b1f3a]/80 px-2.5 py-1 font-display text-[11px] font-semibold tabular-nums tracking-wide text-[#f7f4ee]">
              {clock(elapsed)}
            </p>
          ) : null}
          {present.supported ? (
            <button
              type="button"
              onClick={() => void present.toggle()}
              aria-label={present.active ? "Leave full screen" : "Full screen — presenter mode"}
              title={present.active ? "Leave full screen" : "Full screen"}
              className="relative z-[2] grid size-9 place-items-center rounded-full bg-[#0b1f3a]/80 text-[#f7f4ee] active:scale-95"
            >
              {present.active ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
            </button>
          ) : null}
        </div>
        {line ? <AedCaption line={line} /> : null}
        {stage === "idle" ? (
          <div className="absolute inset-0 grid place-items-center bg-[#0b1f3a]/55 p-4">
            <div className="max-w-xs rounded-xl bg-paper px-4 py-3.5 text-center shadow-card">
              <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold-ink">YOU ARE GREEN 6</p>
              <p className="mt-1 text-sm leading-snug">
                The AED has just arrived. Red is doing compressions, Orange is on the bag. Put the pads on and give a safe shock — the
                clock is running.
              </p>
              <button
                type="button"
                onClick={start}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 font-display text-sm font-semibold tracking-wide text-on-gold active:scale-95"
              >
                <Zap className="size-4" aria-hidden />
                Start
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-3">
        {!prefs.sfx && stage !== "idle" ? (
          <button
            type="button"
            onClick={() => {
              setSoundPrefs({ sfx: true });
              if (line) void say(line.id);
            }}
            className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-gold px-3.5 font-display text-xs font-semibold tracking-wide text-on-gold active:scale-95"
          >
            <Volume2 className="size-3.5" aria-hidden />
            Hear the AED
          </button>
        ) : null}

        {hint ? (
          <p key={hint} className="caption-in text-sm leading-snug" aria-live="polite">
            {hint}
          </p>
        ) : stage === "idle" ? (
          <p className="text-sm leading-snug text-muted">
            Tap the player to place each pad. Drag sideways to turn the view. Best with sound on — the AED talks you through it.
          </p>
        ) : null}

        {stage === "advised" || stage === "clear" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={callClear}
              disabled={stage === "clear"}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-3 font-display text-sm font-semibold tracking-wide transition-transform active:scale-95",
                stage === "clear" ? "bg-note text-muted" : "bg-[#1A7F45] text-white",
              )}
            >
              {stage === "clear" ? <Check className="size-4" aria-hidden /> : null}
              “Everyone clear!”
            </button>
            <button
              type="button"
              onClick={shock}
              className="shock-ready inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-[#e8541c] px-3 font-display text-sm font-bold tracking-[0.08em] text-white active:scale-95"
            >
              <Zap className="size-4" aria-hidden />
              SHOCK
            </button>
          </div>
        ) : null}

        {stage === "expose" || stage === "pads" ? (
          <details className="rounded-lg border border-line px-3">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-display text-xs font-semibold tracking-wide text-heading">
              <ListChecks className="size-4 text-gold-ink" aria-hidden />
              Can't tap the picture? Choose from a list
            </summary>
            <div className="flex flex-col gap-1.5 pb-3">
              {stage === "expose" ? (
                <button type="button" onClick={() => onTap(PAD_TARGETS.right)} className="min-h-10 rounded-lg bg-note px-3 text-left text-sm">
                  Cut away the shirt to expose the chest
                </button>
              ) : (
                PAD_CHOICES.map((c) => (
                  <button key={c.label} type="button" onClick={() => onTap(c.tap)} className="min-h-10 rounded-lg bg-note px-3 py-2 text-left text-sm leading-snug">
                    {c.label}
                  </button>
                ))
              )}
            </div>
          </details>
        ) : null}

        {result ? (
          <div className="caption-in rounded-lg bg-note px-3 py-3">
            <p className="font-display text-base font-bold text-heading">Shock delivered in {took(result.seconds)}</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm leading-snug">
              <Outcome ok={result.wrong === 0}>
                {result.wrong === 0 ? "Both pads in the right place first time." : `Pads: ${result.wrong} wrong ${result.wrong === 1 ? "tap" : "taps"} before both were right.`}
              </Outcome>
              <Outcome ok={result.unsafe === 0}>
                {result.unsafe === 0
                  ? "Everyone clear before the shock."
                  : `${result.unsafe === 1 ? "Once" : `${result.unsafe} times`} you went to shock while the team was still touching the player.`}
              </Outcome>
            </ul>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs leading-snug text-muted marker:text-gold">
              <li>Keep compressions going while the pads go on; stop only for the analysis and the shock.</li>
              <li>With an i-gel (a closed loop) the oxygen can stay connected for the shock; with a face mask, take it away and put it back straight after.</li>
              <li>After the shock: no pulse check — compressions restart at once.</li>
            </ul>
            <button
              type="button"
              onClick={start}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-4 font-display text-sm font-semibold tracking-wide text-on-gold active:scale-95"
            >
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Outcome({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <Check className="mt-0.5 size-4 shrink-0 text-[#1A7F45]" aria-label="Done" /> : <X className="mt-0.5 size-4 shrink-0 text-danger" aria-label="To work on" />}
      <span>{children}</span>
    </li>
  );
}

/** What the AED (or Green) just said, over the bottom of the scene. */
function AedCaption({ line }: { line: Line }) {
  return (
    <div
      key={line.id}
      className="caption-in pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-[#0b1f3a]/85 px-2.5 py-2 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      aria-live="polite"
    >
      {line.who === "green" ? (
        <RoleChip id="green" />
      ) : (
        <span className="shrink-0 rounded-full bg-[#F2C811] px-2 py-0.5 font-display text-[11px] font-bold tracking-wide text-[#0b1f3a]">AED</span>
      )}
      <p className="caption-text min-w-0 text-[13px] font-medium italic leading-snug text-[#f7f4ee]">“{line.text}”</p>
    </div>
  );
}

// ------------------------------------------------------------------ flat version (no 3D on this device)
// the player seen from above, head at the top: svg = (160 + x·270, 40 + (z + 1)·270)
const sx = (x: number) => 160 + x * 270;
const sz = (z: number) => 40 + (z + 1) * 270;
const PAD_RECT: Record<PadId, { w: number; h: number }> = { right: { w: 30, h: 40 }, left: { w: 22, h: 40 } };

function AedFlat({ view, onTap }: { view: AedView; onTap: (p: Tap & { y?: number }) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(m.inverse());
    onTap({ x: (p.x - 160) / 270, z: (p.y - 40) / 270 - 1 });
  };
  const age = view.miss ? (performance.now() - view.miss.at) / 1000 : 9;
  return (
    <svg
      ref={ref}
      viewBox="0 0 320 320"
      onClick={click}
      className="block aspect-square w-full cursor-crosshair bg-[#2E7D32] sm:aspect-video"
      role="img"
      aria-label="The player seen from above, head at the top. Tap where each pad goes."
    >
      {/* arms, torso, neck and head */}
      <rect x={sx(-0.36)} y={sz(-0.84)} width={26} height={180} rx={12} fill="#5b2d8e" />
      <rect x={sx(0.36) - 26} y={sz(-0.84)} width={26} height={180} rx={12} fill="#5b2d8e" />
      <rect x={sx(-0.256)} y={sz(-0.86)} width={0.512 * 270} height={260} rx={46} fill={view.exposed ? "#b07850" : "#5b2d8e"} />
      <rect x={sx(-0.06)} y={sz(-0.9)} width={32} height={20} fill="#b07850" />
      <circle cx={160} cy={sz(-1)} r={34} fill="#b07850" />
      {view.exposed ? (
        <>
          {/* breastbone and collarbones, faintly */}
          <line x1={160} y1={sz(-0.8)} x2={160} y2={sz(-0.36)} stroke="#8a5a3a" strokeWidth={3} strokeLinecap="round" />
          <line x1={sx(-0.2)} y1={sz(-0.79)} x2={sx(-0.02)} y2={sz(-0.82)} stroke="#8a5a3a" strokeWidth={3} strokeLinecap="round" />
          <line x1={sx(0.02)} y1={sz(-0.82)} x2={sx(0.2)} y2={sz(-0.79)} stroke="#8a5a3a" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : null}
      {(["right", "left"] as const).map((id) => {
        const t = PAD_TARGETS[id];
        const { w, h } = PAD_RECT[id];
        const x = sx(t.x) - w / 2;
        const y = sz(t.z) - h / 2;
        if (view.placed[id]) return <rect key={id} x={x} y={y} width={w} height={h} rx={4} fill="#f4f4f1" stroke="#3a3f46" strokeWidth={2} />;
        if (view.ghosts[id]) return <rect key={id} x={x} y={y} width={w} height={h} rx={4} fill="none" stroke="#C9A227" strokeWidth={3} strokeDasharray="6 4" />;
        return null;
      })}
      {view.miss && age < 1.2 ? <circle cx={sx(view.miss.x)} cy={sz(view.miss.z)} r={10} fill="none" stroke="#ff4d3d" strokeWidth={4} /> : null}
      <text x={160} y={312} textAnchor="middle" fontSize={11} fill="#f7f4ee">
        Player's right ← → Player's left
      </text>
    </svg>
  );
}
