import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Gamepad2, MapPin, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/confetti";
import { DiagramBase, MARKS, PositionDiagram, RoleDisc } from "@/components/position-diagram";
import { roleIcons } from "@/components/role-icon";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { haptic, say, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { type RoleId, workshop } from "@/lib/workshop";

export const Route = createFileRoute("/quiz")({ component: QuizPage });

type Mode = "who" | "place";

function QuizPage() {
  const [mode, setMode] = useState<Mode>("who");
  useEffect(() => {
    if (window.location.hash === "#place") setMode("place");
  }, []);
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-heading">Test yourself. </span>
          Two quick games built from this guide's role cards. Nothing is saved or sent anywhere.
        </Note>
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Games">
          {(
            [
              ["who", "Who does what?", Gamepad2],
              ["place", "Place the team", MapPin],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                tap();
                setMode(m);
                history.replaceState(null, "", m === "place" ? "#place" : "#who");
              }}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-xl font-display text-sm font-semibold tracking-wide transition-colors duration-200",
                mode === m ? "bg-navy text-gold shadow-card" : "bg-paper text-heading shadow-card",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        {mode === "who" ? <WhoDoesWhat onPlace={() => setMode("place")} /> : <PlaceTheTeam />}
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------------ game 1: who does what?
type Question = { prompt: string; text: string; answer: RoleId; voice?: string };

const NAMES = /\b(black|orange|red|blue|white|green)\b/i;

/** Questions come straight from the role cards: what each colour brings, says and does. */
function questionPool(): Question[] {
  const qs: Question[] = [];
  for (const r of workshop.roles) {
    qs.push({ prompt: "Who brings this onto the pitch?", text: r.bring, answer: r.id });
    r.say.forEach((t, i) => qs.push({ prompt: "Who says this?", text: `“${t}”`, answer: r.id, voice: `${r.id}-${i + 1}` }));
    r.do
      .filter((t) => !NAMES.test(t) && !/^Bring /.test(t))
      .forEach((t) => qs.push({ prompt: "Whose job is this?", text: t, answer: r.id }));
  }
  return qs;
}

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const ROUND = 10;

function WhoDoesWhat({ onPlace }: { onPlace: () => void }) {
  const [round, setRound] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<RoleId | null>(null);
  const [score, setScore] = useState(0);
  const [burst, setBurst] = useState(0);

  const start = () => {
    tap();
    sfx("whistle", 0.4);
    setRound(shuffle(questionPool()).slice(0, ROUND));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  if (!round) {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <span className="float-y grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
            <Gamepad2 className="size-8" aria-hidden />
          </span>
          <h2 className="font-display text-xl font-bold tracking-wide text-heading">Who does what?</h2>
          <p className="max-w-xs text-sm leading-snug text-muted">
            {ROUND} questions. Read what someone brings, says or does — then tap the colour.
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
    const great = score >= 8;
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
          <p className="max-w-xs text-sm leading-snug text-muted">
            {score === round.length
              ? "Perfect — every colour, every job."
              : great
                ? "Strong. Check the roles you missed and go again."
                : "Good start. Open the role cards, then try another round."}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
            >
              <RotateCcw className="size-4" aria-hidden />
              Play again
            </button>
            <button
              type="button"
              onClick={onPlace}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
            >
              <MapPin className="size-4" aria-hidden />
              Place the team
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  const q = round[i];
  const answered = picked != null;
  const right = picked === q.answer;
  const role = workshop.roles.find((r) => r.id === q.answer);

  const choose = (id: RoleId) => {
    if (answered) return;
    setPicked(id);
    if (id === q.answer) {
      setScore((v) => v + 1);
      setBurst((v) => v + 1);
      sfx("correct");
      haptic(15);
    } else {
      sfx("wrong", 0.45);
      haptic([30, 40, 30]);
    }
  };

  const next = () => {
    tap();
    const last = i + 1 >= round.length;
    if (last && score >= 8) sfx("cheer", 0.5);
    setPicked(null);
    setI((v) => v + 1);
  };

  return (
    <Panel>
      <div className="relative flex flex-col gap-3 px-3.5 py-3.5">
        {answered && right ? <Confetti key={burst} /> : null}
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
            QUESTION {i + 1} OF {round.length}
          </p>
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">SCORE {score}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${((i + (answered ? 1 : 0)) / round.length) * 100}%` }} />
        </div>
        <div key={i} className="caption-in rounded-xl bg-note px-3.5 py-3">
          <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-heading">{q.prompt.toUpperCase()}</p>
          <p className="mt-1 text-[15px] font-medium leading-snug text-ink">{q.text}</p>
          {q.voice ? (
            <button
              type="button"
              onClick={() => void say(q.voice as string, true)}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold px-3 font-display text-xs font-semibold tracking-wide text-on-gold active:scale-95"
            >
              <Volume2 className="size-3.5" aria-hidden />
              Hear it
            </button>
          ) : null}
        </div>
        <div className={cn("grid grid-cols-2 gap-2", answered && !right && "shake")}>
          {workshop.roles.map((r) => {
            const Icon = roleIcons[r.id];
            const isAnswer = answered && r.id === q.answer;
            const isWrongPick = answered && r.id === picked && !right;
            return (
              <button
                key={r.id}
                type="button"
                disabled={answered}
                onClick={() => choose(r.id)}
                aria-label={`${r.name}, ${r.role}`}
                className={cn(
                  "relative flex min-h-14 items-center gap-2 overflow-hidden rounded-xl px-3 text-left transition-all duration-200 active:scale-95",
                  answered && !isAnswer && !isWrongPick && "opacity-40",
                  isAnswer && "ring-4 ring-gold",
                  r.id === "black" && "dark:outline dark:outline-1 dark:outline-white/25",
                )}
                style={{
                  backgroundColor: r.color,
                  backgroundImage: "linear-gradient(150deg, rgba(255,255,255,0.16), rgba(0,0,0,0.14))",
                  color: r.text,
                  boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined,
                }}
              >
                <Icon className="size-5 shrink-0 opacity-80" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold tracking-[0.08em]">{r.name}</span>
                  <span className="block truncate text-[10.5px] leading-tight opacity-90">{r.role}</span>
                </span>
                {isAnswer ? <Check className="absolute right-2 top-2 size-5" strokeWidth={3} aria-hidden /> : null}
                {isWrongPick ? <X className="absolute right-2 top-2 size-5" strokeWidth={3} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        {answered && role ? (
          <div className="caption-in flex flex-col gap-2" aria-live="polite">
            <p className={cn("rounded-lg px-3 py-2 text-sm leading-snug", right ? "bg-[#1E8A4C]/12 text-ink" : "bg-danger/10 text-ink")}>
              <span className="font-semibold">{right ? "Correct. " : "Not quite. "}</span>
              {right ? "" : "It's "}
              <span className="font-semibold">{role.name}</span> — {role.role}.{" "}
              <Link to="/role/$id" params={{ id: role.id }} className="font-medium text-heading underline underline-offset-2">
                Open the role
              </Link>
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
            >
              {i + 1 >= round.length ? "See your score" : "Next question"}
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------ game 2: place the team
function PlaceTheTeam() {
  const [order, setOrder] = useState<RoleId[]>(() => MARKS.map((m) => m.id));
  const [placed, setPlaced] = useState<Partial<Record<RoleId, RoleId>>>({}); // spot (true role) -> chip placed there
  const [holding, setHolding] = useState<RoleId | null>(null);
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => setOrder(shuffle(MARKS.map((m) => m.id))), []);

  const used = useMemo(() => new Set(Object.values(placed)), [placed]);
  const allPlaced = MARKS.every((m) => placed[m.id]);
  const correct = MARKS.filter((m) => placed[m.id] === m.id).length;

  const reset = () => {
    tap();
    setOrder(shuffle(MARKS.map((m) => m.id)));
    setPlaced({});
    setHolding(null);
    setChecked(false);
    setShowAnswer(false);
  };

  const drop = (spot: RoleId) => {
    if (checked) return;
    const there = placed[spot];
    if (holding) {
      tap();
      setPlaced((p) => {
        const n = { ...p };
        for (const k of Object.keys(n) as RoleId[]) if (n[k] === holding) delete n[k];
        n[spot] = holding;
        return n;
      });
      setHolding(null);
    } else if (there) {
      // tap a placed colour to pick it up again
      tap();
      setPlaced((p) => {
        const n = { ...p };
        delete n[spot];
        return n;
      });
      setHolding(there);
    }
  };

  const check = () => {
    setChecked(true);
    if (correct === MARKS.length) {
      sfx("cheer", 0.5);
      setBurst((v) => v + 1);
    } else {
      sfx("wrong", 0.4);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <div className="relative px-3 pb-3 pt-3.5">
          {checked && correct === MARKS.length ? <Confetti key={burst} count={40} spread={1.3} /> : null}
          <SectionLabel>PLACE THE TEAM</SectionLabel>
          <p className="mt-2 text-sm leading-snug text-muted">
            {checked
              ? correct === MARKS.length
                ? "All six in the right place."
                : `${correct} of 6 in the right place.`
              : holding
                ? `Now tap the spot where ${MARKS.find((m) => m.id === holding)?.label} kneels.`
                : "Tap a colour below, then tap its spot around the player. Seen from above, head at the top."}
          </p>
          <svg viewBox="0 0 320 380" className="mx-auto mt-2 block h-auto w-full max-w-[19rem] select-none" role="group" aria-label="Spots around the player">
            <DiagramBase />
            {MARKS.map((m) => {
              const chip = placed[m.id];
              const ok = checked && chip === m.id;
              const bad = checked && chip !== m.id;
              return (
                <g
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Spot ${m.where}${chip ? `, holding ${chip}` : ", empty"}`}
                  onClick={() => drop(m.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && drop(m.id)}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r="27"
                    className={cn(
                      "transition-all duration-200",
                      chip ? "fill-transparent" : holding ? "fill-[#C9A227]/20 stroke-gold" : "fill-transparent stroke-muted",
                    )}
                    strokeWidth={chip ? 0 : 2}
                    strokeDasharray={chip ? undefined : "5 4"}
                  />
                  {chip ? <RoleDisc id={chip} x={m.x} y={m.y} /> : null}
                  {ok ? <circle cx={m.x + 19} cy={m.y - 19} r="9" fill="#1E8A4C" /> : null}
                  {ok ? <path d={`M${m.x + 14.5} ${m.y - 19} l3 3 l5.5 -6`} stroke="#fff" strokeWidth="2.4" fill="none" /> : null}
                  {bad ? <circle cx={m.x + 19} cy={m.y - 19} r="9" fill="#C0392B" /> : null}
                  {bad ? <path d={`M${m.x + 15.5} ${m.y - 22.5} l7 7 m0 -7 l-7 7`} stroke="#fff" strokeWidth="2.4" /> : null}
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {order.map((id) => {
              const r = workshop.roles.find((k) => k.id === id);
              if (!r) return null;
              const gone = used.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={checked || gone}
                  onClick={() => {
                    tap();
                    setHolding((h) => (h === id ? null : id));
                  }}
                  aria-pressed={holding === id}
                  className={cn(
                    "min-h-10 rounded-full px-3.5 font-display text-xs font-bold tracking-wide transition-all duration-200 active:scale-95",
                    gone && "scale-90 opacity-25",
                    holding === id && "-translate-y-1 ring-2 ring-gold ring-offset-2 ring-offset-paper",
                    id === "black" && "dark:outline dark:outline-1 dark:outline-white/30",
                  )}
                  style={{ backgroundColor: r.color, color: r.text, boxShadow: id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            {checked ? (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Try again
                </button>
                {correct < MARKS.length ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswer((v) => !v)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
                  >
                    {showAnswer ? "Hide answer" : "Show answer"}
                  </button>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                disabled={!allPlaced}
                onClick={check}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold font-display text-sm font-semibold tracking-wide text-on-gold transition-opacity active:scale-95 disabled:opacity-40"
              >
                <Check className="size-4" aria-hidden />
                Check my team
              </button>
            )}
          </div>
        </div>
      </Panel>
      {showAnswer ? (
        <Panel>
          <PositionDiagram caption="The answer, from FIFA's PEAP poster. Positions may all be flipped depending on the site of injury and hazards." />
        </Panel>
      ) : null}
    </div>
  );
}
