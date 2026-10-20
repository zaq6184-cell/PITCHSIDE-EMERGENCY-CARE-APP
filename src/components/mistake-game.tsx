import { Check, ChevronRight, Eye, Hand, RotateCcw, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Confetti } from "@/components/confetti";
import { Stage } from "@/components/set-piece-3d";
import { RoleChip } from "@/components/workshop";
import { type Mistake, MISTAKES, mistakeRound, whatOptions } from "@/lib/mistakes";
import { EMPTY, getProgress, MISTAKES_FOR_BADGE, record, step as did, subscribeProgress } from "@/lib/progress";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { type RoleId, roleTag, workshop } from "@/lib/workshop";

const ROUND = 6;

/**
 * Spot the mistake: one step of a drill replays in 3D with a single planted error. Tap the person who is
 * wrong (two tries), then say what they are doing wrong.
 */
export function MistakeGame() {
  const [round, setRound] = useState<Mistake[] | null>(null);
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<"who" | "what" | "after">("who");
  const [picked, setPicked] = useState<RoleId | undefined>();
  const [misses, setMisses] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [cue, setCue] = useState(0);
  const [burst, setBurst] = useState(0);
  const p = useSyncExternalStore(subscribeProgress, getProgress, () => EMPTY);
  const m = round?.[i];
  const options = useMemo(() => (m ? whatOptions(m) : []), [m]);

  // the basket-and-lift step moves on by itself: on the rails, into the basket, the lift
  useEffect(() => {
    setCue(0);
    if (!m || m.scenario !== "spine" || m.step !== 7) return;
    const iv = window.setInterval(() => setCue((c) => (c + 1) % 3), 4200);
    return () => window.clearInterval(iv);
  }, [m]);

  const start = () => {
    tap();
    sfx("whistle", 0.4);
    setRound(mistakeRound(ROUND));
    setI(0);
    setScore(0);
    reset();
  };
  const reset = () => {
    setStage("who");
    setPicked(undefined);
    setMisses(0);
    setAnswer(null);
  };

  const who = (id: RoleId) => {
    if (!m || stage !== "who") return;
    setPicked(id);
    if (id === m.who) {
      sfx("correct", 0.4);
      haptic(12);
      setStage("what");
    } else {
      sfx("wrong", 0.35);
      haptic([30, 40, 30]);
      const n = misses + 1;
      setMisses(n);
      if (n >= 2) {
        setPicked(m.who); // shown after two misses
        setStage("what");
      }
    }
  };

  const what = (text: string) => {
    if (!m || stage !== "what") return;
    setAnswer(text);
    setStage("after");
    const ok = text === m.what && misses < 2;
    if (ok) {
      setScore((v) => v + 1);
      setBurst((b) => b + 1);
      record(did.mistake, m.id);
      sfx("correct");
      haptic(15);
    } else {
      sfx("wrong", 0.4);
    }
  };

  const next = () => {
    tap();
    setI((v) => v + 1);
    reset();
  };

  if (!round) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <span className="float-y grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
          <Eye className="size-8" aria-hidden />
        </span>
        <h2 className="font-display text-xl font-bold tracking-wide text-heading">Spot the mistake</h2>
        <p className="max-w-xs text-sm leading-snug text-muted">
          {ROUND} replays from the 3D drills, each with one planted error. Tap the person who is wrong, then say what they are doing.
          Turn the scene to look from every side.
        </p>
        <p className="text-xs text-muted">
          Found so far: {p.mistakes.length} of {MISTAKES.length} · {MISTAKES_FOR_BADGE} for the Eagle eye badge
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy px-6 font-display text-base font-semibold tracking-wide text-gold active:scale-95"
        >
          Start
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    );
  }

  if (i >= round.length) {
    const great = score >= ROUND - 1;
    return (
      <div className="relative flex flex-col items-center gap-3 px-4 py-7 text-center">
        {great ? <Confetti key={`end${burst}`} count={40} spread={1.4} /> : null}
        <span className="grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
          <Trophy className="size-8" aria-hidden />
        </span>
        <p className="font-display text-4xl font-bold text-heading">
          {score}
          <span className="text-xl text-muted"> / {round.length}</span>
        </p>
        <p className="max-w-xs text-sm leading-snug text-muted">
          {great ? "Sharp eyes — you would catch these on match day." : "Watch each colour's job in the drill, then go again."} Found so far: {p.mistakes.length} of{" "}
          {MISTAKES.length}.
        </p>
        <button type="button" onClick={start} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95">
          <RotateCcw className="size-4" aria-hidden />
          Play again
        </button>
      </div>
    );
  }

  const cur = m as Mistake;
  const steps = cur.scenario === "arrest" ? workshop.steps.length : 7;
  return (
    <div>
      <div className="relative">
        <Stage key={cur.id} step={cur.step} phase={cue} scenario={cur.scenario} acting={[]} fault={cur.id} selected={picked} onSelect={who} />
        <p className="pointer-events-none absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-[#0b1f3a]/80 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
          {cur.scenario === "arrest" ? "CARDIAC ARREST" : "NECK INJURY"} · STEP {cur.step} OF {steps} · {cur.title.toUpperCase()}
        </p>
        <p className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-[#0b1f3a]/75 px-2.5 py-1 text-[11px] font-medium text-[#f7f4ee]">
          <Hand className="size-3.5 text-gold" aria-hidden />
          Drag to turn · tap a person
        </p>
      </div>
      <div className="flex flex-col gap-3 px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
            REPLAY {i + 1} OF {round.length}
          </p>
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold-ink">SCORE {score}</p>
        </div>

        {stage === "who" ? (
          <>
            <p className="text-sm font-medium leading-snug text-ink">
              {misses ? "Not them — watch again. " : "One person is doing something wrong. "}Tap them in the scene, or pick a colour:
            </p>
            <div className={cn("flex flex-wrap gap-1.5", misses && "shake")} key={misses}>
              {workshop.roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => who(r.id)}
                  className={cn(
                    "min-h-10 rounded-full px-3.5 font-display text-xs font-bold tracking-wide transition-transform active:scale-95",
                    picked === r.id && "ring-2 ring-danger ring-offset-2 ring-offset-paper",
                    r.id === "black" && "dark:outline dark:outline-1 dark:outline-white/30",
                  )}
                  style={{ backgroundColor: r.color, color: r.text, boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
                >
                  {roleTag(r)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-1.5 text-sm leading-snug">
              {misses < 2 ? <Check className="size-4 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : <X className="size-4 text-danger" strokeWidth={3} aria-hidden />}
              <span className="font-semibold">{misses < 2 ? "Found:" : "It was"}</span>
              <RoleChip id={cur.who} />
              <span className="text-muted">— what are they doing wrong?</span>
            </p>
            <div className="flex flex-col gap-2">
              {options.map((o) => {
                const isRight = o === cur.what;
                const isPicked = answer === o;
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={stage === "after"}
                    onClick={() => what(o)}
                    className={cn(
                      "flex min-h-12 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium leading-snug transition-all active:scale-[0.99]",
                      stage === "what" && "border-line bg-paper shadow-card",
                      stage === "after" && isRight && "border-[#1A7F45] bg-[#1A7F45]/12",
                      stage === "after" && isPicked && !isRight && "shake border-danger bg-danger/10",
                      stage === "after" && !isRight && !isPicked && "border-line opacity-50",
                    )}
                  >
                    {stage === "after" && isRight ? <Check className="mt-0.5 size-4 shrink-0 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : null}
                    {stage === "after" && isPicked && !isRight ? <X className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={3} aria-hidden /> : null}
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            {stage === "after" ? (
              <div className="caption-in flex flex-col gap-2" aria-live="polite">
                <p className="rounded-lg bg-note px-3 py-2 text-sm leading-snug">{cur.why}</p>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
                >
                  {i + 1 >= round.length ? "See your score" : "Next replay"}
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
