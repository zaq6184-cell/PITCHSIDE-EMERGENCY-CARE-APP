import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, ClipboardCheck, Flame, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/confetti";
import { roleIcons } from "@/components/role-icon";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { type Question, questionPool } from "@/lib/quiz-questions";
import { DAILY, doneToday, getReview, noteAnswer, pick, questionId, startToday, streakNow } from "@/lib/review";
import { haptic, say, sfx, tap } from "@/lib/sound";
import { useDay, useReview } from "@/lib/use-review";
import { cn } from "@/lib/utils";
import { type RoleId, roleTag, workshop } from "@/lib/workshop";

export const Route = createFileRoute("/daily")({
  component: DailyPage,
  head: () => ({ meta: [{ title: "Daily 5 · Pitchside Emergency Care" }] }),
});

const POOL = questionPool();
const BY_ID = new Map(POOL.map((q) => [questionId(q), q]));
const IDS = [...BY_ID.keys()];

function DailyPage() {
  const r = useReview();
  const day = useDay();
  const [showing, setShowing] = useState<{ id: string; picked: RoleId } | null>(null);
  const [extra, setExtra] = useState<{ ids: string[]; answers: Record<string, boolean> } | null>(null);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (day) startToday(IDS);
  }, [day]);

  const today = day && r.today?.day === day ? r.today : null;
  const done = day ? doneToday(r, day) : false;
  const streak = day ? streakNow(r, day) : 0;
  const ids = extra ? extra.ids : (today?.ids ?? []);
  const answers = extra ? extra.answers : (today?.answers ?? {});
  const currentId = showing?.id ?? ids.find((id) => !(id in answers));
  const q = currentId ? BY_ID.get(currentId) : undefined;
  const right = Object.values(answers).filter(Boolean).length;

  const choose = (id: RoleId) => {
    if (!q || !currentId || showing) return;
    const ok = id === q.answer;
    noteAnswer(q, ok, !extra);
    if (extra) setExtra({ ...extra, answers: { ...extra.answers, [currentId]: ok } });
    setShowing({ id: currentId, picked: id });
    if (ok) {
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
    const last = ids.filter((id) => !(id in answers)).length === 0;
    if (last) sfx("cheer", 0.45);
    setShowing(null);
  };
  const more = () => {
    if (!day) return;
    tap();
    sfx("whistle", 0.4);
    setShowing(null);
    setExtra({ ids: pick(getReview(), IDS, day, DAILY, today?.ids ?? []), answers: {} });
  };

  return (
    <AppShell tab="home" heading="Daily 5">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="flex items-center gap-3.5 px-3.5 py-3.5">
            <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-card", streak ? "bg-gradient-to-br from-[#f59e0b] to-[#c2410c]" : "bg-navy")}>
              <Flame className="size-7" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <SectionLabel>DAILY 5</SectionLabel>
              <span className="mt-1 block font-display text-xl font-bold leading-tight text-heading">
                {streak === 1 ? "1 day in a row" : streak ? `${streak} days in a row` : "Start a streak today"}
              </span>
              <span className="mt-1.5 flex gap-1.5" aria-label={`${Object.keys(today?.answers ?? {}).length} of ${DAILY} done today`}>
                {(today?.ids ?? Array.from({ length: DAILY }, (_, i) => `slot${i}`)).map((id) => {
                  const a = today?.answers[id];
                  return <span key={id} className={cn("h-2 flex-1 rounded-full", a === true ? "bg-[#1A7F45]" : a === false ? "bg-danger" : "bg-line")} />;
                })}
              </span>
            </span>
          </div>
        </Panel>

        {q && currentId ? (
          <QuestionCard
            key={currentId}
            q={q}
            n={ids.indexOf(currentId) + 1}
            total={ids.length}
            label={extra ? "PRACTICE" : "TODAY"}
            picked={showing?.id === currentId ? showing.picked : null}
            burst={burst}
            onChoose={choose}
            onNext={next}
            last={ids.filter((id) => !(id in answers) && id !== currentId).length === 0}
          />
        ) : extra ? (
          <Finished
            title={`${right} / ${extra.ids.length}`}
            text="Practice round done. These answers count towards when each question comes back."
            onMore={more}
            great={right === extra.ids.length}
          />
        ) : done && today ? (
          <Finished
            title={`${right} / ${today.ids.length}`}
            text={right === today.ids.length ? "All five right. Come back tomorrow for the next five." : "Today's five are done. The ones you missed come back tomorrow."}
            onMore={more}
            great={right === today.ids.length}
          />
        ) : (
          <div className="h-72 animate-pulse rounded-xl bg-paper shadow-card" aria-label="Loading" />
        )}

        <Note>
          <span className="font-semibold text-heading">How it works. </span>
          Five questions a day from the role cards. A question you miss comes back tomorrow; one you know comes back after a longer
          gap each time, so the time goes on what you have not learnt yet. Answers in Who does what? and the live class quiz count
          too. Kept on this device only.
        </Note>
      </div>
    </AppShell>
  );
}

function QuestionCard({
  q,
  n,
  total,
  label,
  picked,
  burst,
  onChoose,
  onNext,
  last,
}: {
  q: Question;
  n: number;
  total: number;
  label: string;
  picked: RoleId | null;
  burst: number;
  onChoose: (id: RoleId) => void;
  onNext: () => void;
  last: boolean;
}) {
  const answered = picked != null;
  const right = picked === q.answer;
  const role = workshop.roles.find((r) => r.id === q.answer);
  return (
    <Panel>
      <div className="relative flex flex-col gap-3 px-3.5 py-3.5">
        {answered && right ? <Confetti key={burst} /> : null}
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
          {label} · QUESTION {n} OF {total}
        </p>
        <div className="caption-in rounded-xl bg-note px-3.5 py-3">
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
                onClick={() => onChoose(r.id)}
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
                  <span className="block font-display text-sm font-bold tracking-[0.08em]">{roleTag(r)}</span>
                  <span className="block truncate text-[10.5px] font-medium leading-tight">{r.role}</span>
                </span>
                {isAnswer ? <Check className="absolute right-2 top-2 size-5" strokeWidth={3} aria-hidden /> : null}
                {isWrongPick ? <X className="absolute right-2 top-2 size-5" strokeWidth={3} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        {answered && role ? (
          <div className="caption-in flex flex-col gap-2" aria-live="polite">
            <p className={cn("rounded-lg px-3 py-2 text-sm leading-snug", right ? "bg-[#1A7F45]/12 text-ink" : "bg-danger/10 text-ink")}>
              <span className="font-semibold">{right ? "Correct. " : "Not quite. "}</span>
              {right ? "" : "The right colour: "}
              <span className="font-semibold">{roleTag(role)}</span> — {role.role}.{" "}
              <Link to="/role/$id" params={{ id: role.id }} className="font-medium text-heading underline underline-offset-2">
                Open the role
              </Link>
            </p>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
            >
              {last ? "See how you did" : "Next question"}
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function Finished({ title, text, onMore, great }: { title: string; text: string; onMore: () => void; great: boolean }) {
  return (
    <Panel>
      <div className="relative flex flex-col items-center gap-3 px-4 py-7 text-center">
        {great ? <Confetti count={40} spread={1.4} /> : null}
        <span className="grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
          <Trophy className="size-8" aria-hidden />
        </span>
        <p className="font-display text-4xl font-bold tabular-nums text-heading">{title}</p>
        <p className="max-w-xs text-sm leading-snug text-muted">{text}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onMore}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
          >
            <RotateCcw className="size-4" aria-hidden />
            Five more for practice
          </button>
          <Link
            to="/record"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
          >
            <ClipboardCheck className="size-4" aria-hidden />
            Training record
          </Link>
        </div>
      </div>
    </Panel>
  );
}
