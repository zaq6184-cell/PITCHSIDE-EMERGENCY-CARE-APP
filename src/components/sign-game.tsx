import { Brain, Check, ChevronRight, Hand, RotateCcw, Trophy, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/confetti";
import { Loading3D, Safe } from "@/components/set-piece-3d";
import { OUTCOME_TEXT, type Sign, signOptions, signRound } from "@/lib/concussion-signs";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { canRender3D } from "@/lib/webgl";

const ConcussionScene3D = lazy(() => import("@/components/concussion-scene-3d"));

/**
 * Spot the sign: a 3D player acts out a visible sign of concussion from FIFA FOCUS; name it, then see what
 * FOCUS asks for. FIFA's own films are linked on this page; this practises the recognition.
 */
export function SignGame() {
  const [ok3d, setOk3d] = useState<boolean | null>(null);
  const [round, setRound] = useState<Sign[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(0);
  useEffect(() => setOk3d(canRender3D()), []);
  const cur = round?.[i];
  const options = useMemo(() => (cur ? signOptions(cur.id) : []), [cur]);

  const start = () => {
    tap();
    sfx("whistle", 0.4);
    setRound(signRound());
    setI(0);
    setPicked(null);
    setScore(0);
  };

  const choose = (id: string) => {
    if (!cur || picked) return;
    setPicked(id);
    if (id === cur.id) {
      setScore((s) => s + 1);
      setBurst((b) => b + 1);
      sfx("correct");
      haptic(15);
    } else {
      sfx("wrong", 0.4);
      haptic([30, 40, 30]);
    }
  };

  if (ok3d === false) {
    return <p className="px-3.5 py-4 text-sm leading-snug text-muted">This device cannot draw the 3D scene. The signs are listed in the 11 domains above, and FIFA's FOCUS film shows them.</p>;
  }

  if (!round) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <span className="float-y grid size-16 place-items-center rounded-2xl bg-[#6B3FA0] text-white shadow-card">
          <Brain className="size-8" aria-hidden />
        </span>
        <h3 className="font-display text-xl font-bold tracking-wide text-heading">Spot the sign</h3>
        <p className="max-w-xs text-sm leading-snug text-muted">
          A player in 3D shows a visible sign of concussion. Name it — then see whether FOCUS says substitute, or lower your threshold
          and keep assessing. Six signs.
        </p>
        <button type="button" onClick={start} className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy px-6 font-display text-base font-semibold tracking-wide text-gold active:scale-95">
          Start
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    );
  }

  if (i >= round.length) {
    const great = score >= 5;
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
        <p className="max-w-xs text-sm leading-snug text-muted">{great ? "You would see it from the touchline." : "Watch FIFA's FOCUS film above, then go again."}</p>
        <button type="button" onClick={start} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95">
          <RotateCcw className="size-4" aria-hidden />
          Play again
        </button>
      </div>
    );
  }

  const sign = cur as Sign;
  const answered = picked != null;
  const right = picked === sign.id;
  return (
    <div>
      <div className="relative">
        {ok3d ? (
          <Safe fallback={<Loading3D />}>
            <Suspense fallback={<Loading3D />}>
              <ConcussionScene3D sign={sign.id} className="aspect-square w-full bg-navy sm:aspect-video" />
            </Suspense>
          </Safe>
        ) : (
          <Loading3D />
        )}
        <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#0b1f3a]/80 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
          SIGN {i + 1} OF {round.length}
        </p>
        <p className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-[#0b1f3a]/75 px-2.5 py-1 text-[11px] font-medium text-[#f7f4ee]">
          <Hand className="size-3.5 text-gold" aria-hidden />
          Drag to turn
        </p>
      </div>
      <div className="relative flex flex-col gap-2 px-3.5 py-3.5">
        {answered && right ? <Confetti key={burst} /> : null}
        <div className="flex items-center justify-between">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-heading">WHAT DO YOU SEE?</p>
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold-ink">SCORE {score}</p>
        </div>
        <div className={cn("grid grid-cols-2 gap-2", answered && !right && "shake")}>
          {options.map((o) => {
            const isAnswer = answered && o.id === sign.id;
            const isWrong = answered && o.id === picked && !right;
            return (
              <button
                key={o.id}
                type="button"
                disabled={answered}
                onClick={() => choose(o.id)}
                className={cn(
                  "relative min-h-14 rounded-xl border px-3 py-2 text-left font-display text-sm font-semibold leading-tight tracking-wide transition-all active:scale-[0.98]",
                  !answered && "border-line bg-paper text-heading shadow-card",
                  isAnswer && "border-[#1A7F45] bg-[#1A7F45]/12 text-heading",
                  isWrong && "border-danger bg-danger/10 text-heading",
                  answered && !isAnswer && !isWrong && "border-line text-muted opacity-50",
                )}
              >
                {o.name}
                {isAnswer ? <Check className="absolute right-1.5 top-1.5 size-4 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : null}
                {isWrong ? <X className="absolute right-1.5 top-1.5 size-4 text-danger" strokeWidth={3} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        {answered ? (
          <div className="caption-in flex flex-col gap-2" aria-live="polite">
            <p className="rounded-lg bg-note px-3 py-2 text-sm leading-snug">
              <span className="font-semibold">{right ? "Right — " : "It was "}
                {sign.name.toLowerCase()}. </span>
              {sign.what}
            </p>
            <p className={cn("rounded-lg border-l-4 px-3 py-2 text-sm font-semibold leading-snug", sign.outcome === "sub" ? "border-danger bg-danger/8 text-ink" : "border-gold bg-gold/12 text-ink")}>
              FOCUS: {OUTCOME_TEXT[sign.outcome]}
            </p>
            <button
              type="button"
              onClick={() => {
                tap();
                setPicked(null);
                setI((v) => v + 1);
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
            >
              {i + 1 >= round.length ? "See your score" : "Next sign"}
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
