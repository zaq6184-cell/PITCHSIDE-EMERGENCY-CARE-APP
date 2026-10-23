import { Link } from "@tanstack/react-router";
import { Activity, Bone, BookOpen, Brain, Briefcase, Eye, HeartPulse, Lock, MapPin, Monitor, Palette, Timer, Trophy, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Confetti } from "@/components/confetti";
import { Panel, SectionLabel } from "@/components/workshop";
import { type Badge, BADGES, EMPTY, earnedCount, getProgress, nextBadge, onBadge, type Progress, resetProgress, subscribeProgress } from "@/lib/progress";
import { haptic, sfx } from "@/lib/sound";
import { translateText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function useProgress(): Progress {
  return useSyncExternalStore(subscribeProgress, getProgress, () => EMPTY);
}

const ICONS: Record<string, LucideIcon> = {
  colours: Palette,
  modules: BookOpen,
  arrest: HeartPulse,
  spine: Bone,
  quiz: Brain,
  place: MapPin,
  aed: Zap,
  "aed-fast": Timer,
  cpr: Activity,
  cases: Monitor,
  mistakes: Eye,
  bag: Briefcase,
};

/** Where to go to earn each badge. */
const WHERE: Record<string, { to: "/" | "/stations" | "/drill" | "/quiz" | "/aed" | "/timer" | "/cases" | "/bag"; label: string; neck?: boolean; mistakes?: boolean; hash?: string }> = {
  colours: { to: "/", label: "Role cards" },
  modules: { to: "/stations", label: "Skill modules" },
  arrest: { to: "/drill", label: "Arrest drill" },
  spine: { to: "/drill", label: "Neck injury drill", neck: true },
  quiz: { to: "/quiz", label: "Quiz" },
  place: { to: "/quiz", label: "Place the team", hash: "place" },
  aed: { to: "/aed", label: "AED trainer" },
  "aed-fast": { to: "/aed", label: "AED trainer" },
  cpr: { to: "/timer", label: "CPR rhythm trainer", hash: "cpr-trainer" },
  cases: { to: "/cases", label: "Case simulator" },
  mistakes: { to: "/drill", label: "Spot the mistake", mistakes: true },
  bag: { to: "/bag", label: "Pack the bag", hash: "pack" },
};

const R = 26;
const CIRC = 2 * Math.PI * R;
const go = "whitespace-nowrap font-display font-semibold tracking-wide text-gold-ink";

/** Home: badges earned so far, the next one to go for, and a link straight to it. */
export function TrainingCard() {
  const p = useProgress();
  const done = earnedCount(p);
  const next = nextBadge(p);
  const where = next ? WHERE[next.id] : undefined;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shown = mounted ? done : 0;
  return (
    <Panel>
      <div className="flex items-center gap-3.5 px-3.5 pb-2 pt-3.5">
        <div className="relative grid size-[4.25rem] shrink-0 place-items-center" role="img" aria-label={`${done} of ${BADGES.length} badges earned`}>
          <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={R} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - shown / BADGES.length)}
              className="transition-[stroke-dashoffset] duration-1000 ease-out"
            />
          </svg>
          <span className="font-display text-lg font-bold leading-none tabular-nums text-heading">
            {done}
            <span className="text-xs text-muted">/{BADGES.length}</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <SectionLabel>YOUR TRAINING</SectionLabel>
          {next && where ? (
            <p className="mt-1.5 text-sm leading-snug">
              <span className="font-semibold text-heading">Next: {next.title}. </span>
              {next.how}.{" "}
              {where.neck || where.mistakes ? (
                <Link to="/drill" search={{ case: where.neck ? "neck" : "mistakes" }} className={go}>
                  {where.label} →
                </Link>
              ) : (
                <Link to={where.to} hash={where.hash} className={go}>
                  {where.label} →
                </Link>
              )}
            </p>
          ) : (
            <p className="mt-1.5 text-sm font-semibold leading-snug text-heading">Every badge earned — ready for match day.</p>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-1.5 px-3.5 pb-3 pt-1.5">
        {BADGES.map((b) => {
          const on = b.done(p);
          const Icon = on ? (ICONS[b.id] ?? Trophy) : Lock;
          return (
            <li
              key={b.id}
              title={b.how}
              className={cn(
                "flex min-h-[3.4rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center",
                on ? "badge-earned bg-gradient-to-br from-[#f6e7b4] to-[#e2c25c] text-[#3b2f05]" : "bg-note text-muted",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="font-display text-[10.5px] font-semibold leading-tight tracking-wide">{b.title}</span>
              <span className="sr-only">{on ? "earned" : `not yet — ${b.how}`}</span>
            </li>
          );
        })}
      </ul>
      <p className="flex items-center justify-between gap-2 border-t border-line px-3.5 py-1.5 text-[11px] text-muted">
        Kept on this device only.
        {done || p.roles.length || p.modules.length ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(translateText("Clear your badges and progress on this device?"))) resetProgress();
            }}
            className="min-h-8 px-1 underline underline-offset-2"
          >
            Reset
          </button>
        ) : null}
      </p>
    </Panel>
  );
}

/** A toast and a burst of confetti whenever a badge is earned, on any page. */
export function BadgeToaster() {
  const [queue, setQueue] = useState<Badge[]>([]);
  const current = queue[0];
  useEffect(() => onBadge((b) => setQueue((q) => [...q, b])), []);
  useEffect(() => {
    if (!current) return;
    sfx("cheer", 0.4);
    haptic([20, 40, 20]);
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), 3800);
    return () => window.clearTimeout(id);
  }, [current]);
  if (!current) return null;
  const Icon = ICONS[current.id] ?? Trophy;
  return (
    <div className="badge-toast pointer-events-none fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3.5">
      <div
        key={current.id}
        role="status"
        className="toast-in pointer-events-auto relative flex max-w-sm items-center gap-3 rounded-2xl bg-navy px-3.5 py-3 text-on-navy shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-gold/50"
        onClick={() => setQueue((q) => q.slice(1))}
      >
        <Confetti count={30} spread={1.1} />
        <span className="badge-earned grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f6e7b4] to-[#c9a227] text-[#3b2f05]">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[11px] font-semibold tracking-[0.16em] text-gold">BADGE EARNED</span>
          <span className="block font-display text-base font-bold leading-tight">{current.title}</span>
          <span className="block text-xs text-gold-soft">{current.how}</span>
        </span>
      </div>
    </div>
  );
}
