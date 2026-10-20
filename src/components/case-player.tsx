import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Clock, Maximize2, Minimize2, RotateCcw, Siren, Trophy, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Confetti } from "@/components/confetti";
import { PatientMonitor } from "@/components/patient-monitor";
import { type CaseDef, CASES, choose, finished, outcome, type Run, startRun } from "@/lib/cases";
import { record, step as did } from "@/lib/progress";
import { haptic, sfx, tap } from "@/lib/sound";
import { useFullscreen } from "@/lib/use-fullscreen";
import { cn } from "@/lib/utils";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const matchTime = (minute: number, s: number) => clock(minute * 60 + s);

/** The choices in a fresh order each time a stage is shown, so the right one is never always first. */
function order(n: number, seed: string) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * One case, played stage by stage: the monitor at the top, what you see, and the choices. Each choice costs
 * time on the case clock; the debrief shows the timeline and what each decision meant.
 */
export function CasePlayer({ c }: { c: CaseDef }) {
  const [run, setRun] = useState<Run>(() => startRun(c));
  const [picked, setPicked] = useState<number | null>(null);
  // the first run's order comes from the case id, so the built page and the browser agree (no hydration
  // mismatch); "Run it again" shuffles afresh
  const [nonce, setNonce] = useState<string>(c.id);
  const [burst, setBurst] = useState(0);
  const present = useFullscreen<HTMLDivElement>();
  const stage = c.stages.find((s) => s.id === run.stage);
  const done = finished(run);
  const result = done ? outcome(c, run) : null;
  const shuffled = useMemo(() => (stage ? order(stage.choices.length, `${nonce}:${stage.id}`) : []), [stage, nonce]);

  useEffect(() => {
    if (!result) return;
    if (result.good) {
      record(did.caseSolved, c.id);
      sfx("cheer", 0.45);
      setBurst((b) => b + 1);
    }
    // once per finished run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const restart = () => {
    tap();
    setRun(startRun(c));
    setPicked(null);
    setNonce(String(Math.random()));
  };

  const pick = (i: number) => {
    if (picked != null || !stage) return;
    const ch = stage.choices[i];
    setPicked(i);
    if (ch.ok) {
      sfx("correct", 0.45);
      haptic(12);
    } else {
      sfx("wrong", 0.4);
      haptic(ch.critical ? [60, 40, 60] : [30, 40, 30]);
    }
  };

  const next = () => {
    if (picked == null) return;
    tap();
    setRun((r) => choose(c, r, picked));
    setPicked(null);
  };

  const vitals = done ? c.ending.vitals : (stage?.vitals ?? c.ending.vitals);
  const chosen = picked != null && stage ? stage.choices[picked] : null;
  const shownClock = run.clock + (chosen?.seconds ?? 0);
  const nextCase = CASES[(CASES.findIndex((x) => x.id === c.id) + 1) % CASES.length];

  return (
    <div ref={present.ref} className="present flex flex-col gap-3 bg-bg">
      {/* min height: the full-screen button only appears once the page knows full screen works */}
      <div className="flex min-h-9 items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-display text-xs font-semibold tracking-[0.14em] text-muted">
          <Clock className="size-3.5" aria-hidden />
          CASE CLOCK {clock(shownClock)} · MATCH {matchTime(c.minute, shownClock)}
        </p>
        {present.supported ? (
          <button
            type="button"
            onClick={() => void present.toggle()}
            aria-label={present.active ? "Leave full screen" : "Full screen — presenter mode"}
            className="grid size-9 place-items-center rounded-full bg-navy text-gold active:scale-95"
          >
            {present.active ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
          </button>
        ) : null}
      </div>

      <PatientMonitor vitals={vitals} />

      {done && result ? (
        <div className="relative flex flex-col gap-3">
          {result.good ? <Confetti key={burst} count={44} spread={1.4} /> : null}
          <div className={cn("caption-in rounded-xl px-3.5 py-3", result.good ? "bg-[#1A7F45]/12" : "bg-danger/10")}>
            <p className="flex items-center gap-2 font-display text-lg font-bold leading-tight text-heading">
              {result.good ? <Trophy className="size-5 text-gold-ink" aria-hidden /> : <TriangleAlert className="size-5 text-danger" aria-hidden />}
              {result.headline}
            </p>
            <p className="mt-1 text-sm leading-snug">{result.detail}</p>
            <p className="mt-1.5 text-sm leading-snug text-muted">{c.ending.text}</p>
            <p className="mt-2 font-display text-xs font-semibold tracking-[0.14em] text-muted">
              {result.right} OF {result.total} DECISIONS RIGHT{result.criticals ? ` · ${result.criticals} DANGEROUS` : ""}
            </p>
          </div>
          <ol className="flex flex-col gap-1.5" aria-label="Your decisions">
            {run.steps.map((s) => (
              <li key={s.stage} className="flex gap-2.5 rounded-lg bg-paper px-3 py-2 shadow-card">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", s.ok ? "bg-[#1A7F45] text-white" : s.critical ? "bg-danger-fill text-white" : "bg-gold text-on-gold")}>
                  {s.ok ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <X className="size-3.5" strokeWidth={3} aria-hidden />}
                </span>
                <span className="min-w-0 text-sm leading-snug">
                  <span className="font-display text-[11px] font-semibold tracking-wider text-muted">{clock(s.at)} · </span>
                  <span className="font-semibold text-heading">{s.label}</span>
                  {s.ok ? null : <span className="block text-muted">{s.feedback}</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-note px-3.5 py-3">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-heading">TAKE-HOME POINTS</p>
            <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug">
              {c.teaching.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={restart} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-95">
              <RotateCcw className="size-4" aria-hidden />
              Run it again
            </button>
            <Link
              to="/case/$id"
              params={{ id: nextCase.id }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
            >
              Next case
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : stage ? (
        <div className="flex flex-col gap-3">
          <div key={stage.id} className="caption-in flex gap-2.5 rounded-xl bg-paper px-3.5 py-3 shadow-card">
            <Siren className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <p className="text-[15px] font-medium leading-snug text-ink">{stage.text}</p>
          </div>
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-heading">WHAT DO YOU DO?</p>
          <div className="flex flex-col gap-2">
            {shuffled.map((i) => {
              const ch = stage.choices[i];
              const isPicked = picked === i;
              const reveal = picked != null && ch.ok;
              return (
                <button
                  key={`${stage.id}-${i}`}
                  type="button"
                  disabled={picked != null}
                  onClick={() => pick(i)}
                  className={cn(
                    "flex min-h-12 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium leading-snug transition-all duration-200 active:scale-[0.99]",
                    picked == null && "border-line bg-paper text-ink shadow-card",
                    isPicked && ch.ok && "border-[#1A7F45] bg-[#1A7F45]/12 text-ink",
                    isPicked && !ch.ok && "shake border-danger bg-danger/10 text-ink",
                    !isPicked && reveal && "border-[#1A7F45] bg-paper text-ink",
                    picked != null && !isPicked && !reveal && "border-line bg-paper text-muted opacity-50",
                  )}
                >
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", isPicked || reveal ? "border-transparent" : "border-line")}>
                    {isPicked || reveal ? (
                      ch.ok ? <Check className="size-4 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : <X className="size-4 text-danger" strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>
          {chosen ? (
            <div className="caption-in flex flex-col gap-2" aria-live="polite">
              <p className={cn("rounded-lg px-3 py-2 text-sm leading-snug", chosen.ok ? "bg-[#1A7F45]/12" : "bg-danger/10")}>
                <span className="font-semibold">{chosen.ok ? "Right. " : chosen.critical ? "Dangerous. " : "Not the best choice. "}</span>
                {chosen.feedback}
                <span className="mt-0.5 block text-xs text-muted">That took {clock(chosen.seconds)} on the case clock.</span>
              </p>
              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy font-display text-base font-semibold tracking-wide text-gold active:scale-[0.98]"
              >
                Continue
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
