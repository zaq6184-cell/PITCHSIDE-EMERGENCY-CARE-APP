import { Check, ChevronRight, Hand, RotateCcw, Timer, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/confetti";
import { Panel } from "@/components/workshop";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { type Role, type RoleId, roleTag, workshop } from "@/lib/workshop";

const ROUND = 10;
const LIMIT_MS = 6000;

/** Which fingers are up for each count on one hand: thumb, index, middle, ring, little. */
const UP: Record<number, boolean[]> = {
  0: [false, false, false, false, false],
  1: [false, true, false, false, false],
  2: [false, true, true, false, false],
  3: [false, true, true, true, false],
  4: [false, true, true, true, true],
  5: [true, true, true, true, true],
};

/** One hand, palm towards you; `flip` mirrors it into a left hand. */
function OneHand({ count, flip = false }: { count: number; flip?: boolean }) {
  const up = UP[count];
  // finger x positions, heights when raised, and widths
  const fingers = [
    { x: 30, h: 46, w: 15 },
    { x: 47, h: 54, w: 15 },
    { x: 64, h: 50, w: 15 },
    { x: 81, h: 40, w: 14 },
  ];
  return (
    <g transform={flip ? "translate(120 0) scale(-1 1)" : undefined}>
      {/* fingers: raised, or folded down onto the palm */}
      {fingers.map((f, i) => {
        const raised = up[i + 1];
        const h = raised ? f.h : 14;
        return (
          <rect
            key={f.x}
            x={f.x}
            y={86 - h}
            width={f.w}
            height={h + 14}
            rx={f.w / 2}
            className={cn("transition-all duration-300 ease-out", raised ? "fill-[#e0ac69]" : "fill-[#c98f4f]")}
            stroke="#7a4a1e"
            strokeWidth={2}
          />
        );
      })}
      {/* palm */}
      <rect x={26} y={74} width={74} height={64} rx={22} fill="#e0ac69" stroke="#7a4a1e" strokeWidth={2} />
      {/* the thumb: raised, it leaves the palm's lower edge angled away; folded, it lies across the palm */}
      {up[0] ? (
        <rect x={31} y={74} width={16} height={54} rx={8} transform="rotate(-34 39 128)" fill="#e0ac69" stroke="#7a4a1e" strokeWidth={2} />
      ) : (
        <rect x={20} y={104} width={50} height={15} rx={7.5} transform="rotate(-12 44 112)" fill="#c98f4f" stroke="#7a4a1e" strokeWidth={2} />
      )}
      {/* sleeve: the team leader's black bib */}
      <rect x={34} y={134} width={58} height={22} rx={4} fill="#1c1c1c" />
    </g>
  );
}

/** A number from 1 to 6 as hands: five on one hand plus one on the other for six. */
export function HandSignal({ n, className }: { n: number; className?: string }) {
  const two = n > 5;
  return (
    <svg viewBox={two ? "0 0 250 160" : "0 0 120 160"} className={className} role="img" aria-label={`Hand signal: ${n} ${n === 1 ? "finger" : "fingers"}`}>
      {two ? (
        <>
          <OneHand count={5} flip />
          <g transform="translate(130 0)">
            <OneHand count={n - 5} />
          </g>
        </>
      ) : (
        <OneHand count={n} />
      )}
    </svg>
  );
}

type Q = { kind: "read"; role: Role } | { kind: "give"; role: Role };

function makeRound(): Q[] {
  const roles = workshop.roles;
  return Array.from({ length: ROUND }, (_, i) => {
    const role = roles[Math.floor(Math.random() * roles.length)];
    return { kind: i % 3 === 2 ? "give" : "read", role } as Q;
  });
}

/**
 * Hand signals: when the crowd is too loud, the team leader signals a role by its number (Black 1 … Green 6).
 * A hand shows a number — tap the colour; or a colour is named — show its number. Against the clock.
 */
export function HandSignalGame() {
  const [round, setRound] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; pick: RoleId | number | null } | null>(null);
  const [score, setScore] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [left, setLeft] = useState(LIMIT_MS);
  const [burst, setBurst] = useState(0);
  const shownAt = useRef(0);

  const q = round?.[i];

  // the clock for each question; running out counts as a miss
  useEffect(() => {
    if (!q || answer) return;
    shownAt.current = performance.now();
    setLeft(LIMIT_MS);
    const iv = window.setInterval(() => {
      const l = LIMIT_MS - (performance.now() - shownAt.current);
      setLeft(Math.max(0, l));
      if (l <= 0) {
        window.clearInterval(iv);
        setAnswer({ ok: false, pick: null });
        sfx("wrong", 0.4);
      }
    }, 50);
    return () => window.clearInterval(iv);
  }, [q, answer]);

  const start = () => {
    tap();
    sfx("whistle", 0.4);
    setRound(makeRound());
    setI(0);
    setAnswer(null);
    setScore(0);
    setTimes([]);
  };

  const choose = (pick: RoleId | number) => {
    if (!q || answer) return;
    const ok = q.kind === "read" ? pick === q.role.id : pick === q.role.num;
    setAnswer({ ok, pick });
    if (ok) {
      setScore((s) => s + 1);
      setTimes((t) => [...t, performance.now() - shownAt.current]);
      setBurst((b) => b + 1);
      sfx("correct");
      haptic(15);
    } else {
      sfx("wrong", 0.45);
      haptic([30, 40, 30]);
    }
  };

  const next = () => {
    tap();
    setAnswer(null);
    setI((v) => v + 1);
  };

  if (!round) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <HandSignal n={3} className="float-y h-24 w-auto" />
          <h2 className="font-display text-xl font-bold tracking-wide text-heading">Hand signals</h2>
          <p className="max-w-xs text-sm leading-snug text-muted">
            When the crowd is too loud, the team leader calls a role by its number. A hand shows a number — tap the colour. Or a
            colour is named — show its number. {ROUND} signals, six seconds each.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy px-6 font-display text-base font-semibold tracking-wide text-gold transition-transform duration-150 active:scale-95"
          >
            Start
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </Panel>
    );
  }

  if (i >= round.length) {
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : null;
    const great = score >= 9;
    return (
      <Panel>
        <div className="relative flex flex-col items-center gap-3 px-4 py-7 text-center">
          {great ? <Confetti key={`end${burst}`} count={40} spread={1.4} /> : null}
          <span className="grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
            <Trophy className="size-8" aria-hidden />
          </span>
          <p className="font-display text-4xl font-bold text-heading">
            {score}
            <span className="text-xl text-muted"> / {round.length}</span>
          </p>
          {avg != null ? (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Timer className="size-4" aria-hidden />
              Average answer {avg.toFixed(1)} s
            </p>
          ) : null}
          <p className="max-w-xs text-sm leading-snug text-muted">
            {great ? "Fast and sure — the team can hear you without a word." : "Say the numbers through: Black 1, Orange 2, Red 3, Blue 4, White 5, Green 6. Then go again."}
          </p>
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
          >
            <RotateCcw className="size-4" aria-hidden />
            Play again
          </button>
        </div>
      </Panel>
    );
  }

  const cur = round[i];
  const k = left / LIMIT_MS;
  return (
    <Panel>
      <div className="relative flex flex-col gap-3 px-3.5 py-3.5">
        {answer?.ok ? <Confetti key={burst} /> : null}
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
            SIGNAL {i + 1} OF {round.length}
          </p>
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold-ink">SCORE {score}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className={cn("h-full rounded-full", k < 0.3 ? "bg-danger" : "bg-gold")} style={{ width: `${(answer ? 0 : k) * 100}%` }} />
        </div>

        {cur.kind === "read" ? (
          <>
            <div key={i} className="caption-in grid place-items-center rounded-xl bg-note py-3">
              <p className="mb-1 font-display text-[11px] font-semibold tracking-[0.14em] text-heading">WHICH COLOUR IS CALLED?</p>
              <HandSignal n={cur.role.num} className="h-36 w-auto max-w-full" />
            </div>
            <div className={cn("grid grid-cols-3 gap-2", answer && !answer.ok && "shake")}>
              {workshop.roles.map((r) => {
                const isAnswer = answer && r.id === cur.role.id;
                const isWrong = answer && answer.pick === r.id && !answer.ok;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={Boolean(answer)}
                    onClick={() => choose(r.id)}
                    aria-label={roleTag(r)}
                    className={cn(
                      "relative min-h-12 rounded-xl font-display text-sm font-bold tracking-wide transition-all duration-200 active:scale-95",
                      answer && !isAnswer && !isWrong && "opacity-40",
                      isAnswer && "ring-4 ring-gold",
                      r.id === "black" && "dark:outline dark:outline-1 dark:outline-white/25",
                    )}
                    style={{ backgroundColor: r.color, color: r.text, boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
                  >
                    {r.name}
                    {isAnswer ? <Check className="absolute right-1 top-1 size-4" strokeWidth={3} aria-hidden /> : null}
                    {isWrong ? <X className="absolute right-1 top-1 size-4" strokeWidth={3} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div
              key={i}
              className="caption-in flex flex-col items-center gap-1 rounded-xl py-4"
              style={{ backgroundColor: cur.role.color, color: cur.role.text, boxShadow: cur.role.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
            >
              <p className="font-display text-xs font-semibold tracking-[0.14em]">SIGNAL THIS COLOUR</p>
              <p className="font-display text-3xl font-bold tracking-[0.12em]">{cur.role.name}</p>
              <p className="text-xs font-medium">{cur.role.role}</p>
            </div>
            <div className={cn("grid grid-cols-3 gap-2", answer && !answer.ok && "shake")}>
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const isAnswer = answer && n === cur.role.num;
                const isWrong = answer && answer.pick === n && !answer.ok;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={Boolean(answer)}
                    onClick={() => choose(n)}
                    aria-label={`${n} ${n === 1 ? "finger" : "fingers"}`}
                    className={cn(
                      "relative grid min-h-20 place-items-center rounded-xl border border-line bg-paper transition-all duration-200 active:scale-95",
                      answer && !isAnswer && !isWrong && "opacity-40",
                      isAnswer && "ring-4 ring-gold",
                    )}
                  >
                    <HandSignal n={n} className="h-14 w-auto max-w-[90%]" />
                    {isAnswer ? <Check className="absolute right-1 top-1 size-4 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : null}
                    {isWrong ? <X className="absolute right-1 top-1 size-4 text-danger" strokeWidth={3} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {answer ? (
          <div className="caption-in flex flex-col gap-2" aria-live="polite">
            <p className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm leading-snug", answer.ok ? "bg-[#1A7F45]/12" : "bg-danger/10")}>
              <Hand className="size-4 shrink-0 text-heading" aria-hidden />
              <span>
                <span className="font-semibold">{answer.ok ? "Correct. " : answer.pick == null ? "Too slow. " : "Not quite. "}</span>
                {roleTag(cur.role)} — {cur.role.role}.
              </span>
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
            >
              {i + 1 >= round.length ? "See your score" : "Next signal"}
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
