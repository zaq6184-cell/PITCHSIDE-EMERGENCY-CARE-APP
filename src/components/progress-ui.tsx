import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Bone,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  ClipboardCheck,
  Eye,
  Flame,
  Headphones,
  HeartPulse,
  Lock,
  MapPin,
  Monitor,
  Palette,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { Confetti } from "@/components/confetti";
import { Panel, SectionLabel } from "@/components/workshop";
import { arriveAt } from "@/lib/arrival";
import {
  type Badge,
  type BadgeGoal,
  BADGES,
  badgeGoal,
  badgeProgress,
  EMPTY,
  earnedCount,
  getProgress,
  nextBadge,
  onBadge,
  type Progress,
  resetProgress,
  subscribeProgress,
} from "@/lib/progress";
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
  team: Users,
  streak: Flame,
  listen: Headphones,
};

/** Where each badge is earned, by name (the link itself goes to the next thing to do there: lib/progress.ts badgeGoal). */
const WHERE: Record<string, string> = {
  colours: "Role cards",
  modules: "Skill modules",
  arrest: "Arrest drill",
  spine: "Neck injury drill",
  quiz: "Quiz",
  place: "Place the team",
  aed: "AED trainer",
  "aed-fast": "AED trainer",
  cpr: "CPR rhythm trainer",
  cases: "Case simulator",
  mistakes: "Spot the mistake",
  bag: "Pack the bag",
  team: "Team drill",
  streak: "Daily 5",
  listen: "Listen mode",
};

type GoalLinkProps = { goal: BadgeGoal; className?: string; title?: string; children: ReactNode };

/** A link to where a badge is earned. A goal that is a section of a page marks it, so it lights up on arrival. */
function GoalLink({ goal, ...rest }: GoalLinkProps) {
  const props = {
    ...rest,
    onClick: () => {
      haptic(10);
      sfx("whoosh", 0.25);
      const section = goal.page === "roles" ? "roles" : goal.page === "cpr" ? "cpr-trainer" : goal.page === "bag" ? "pack" : null;
      if (section) arriveAt(section);
    },
  };
  switch (goal.page) {
    case "role":
      return <Link to="/role/$id" params={{ id: goal.id }} {...props} />;
    case "module":
      return <Link to="/station/$id" params={{ id: goal.id }} {...props} />;
    case "case":
      return <Link to="/case/$id" params={{ id: goal.id }} {...props} />;
    case "drill": {
      const step = goal.step > 1 ? goal.step : undefined;
      return <Link to="/drill" search={goal.drill === "spine" ? { case: "neck", step } : { step }} {...props} />;
    }
    case "roles":
      return <Link to="/" hash="roles" {...props} />;
    case "modules":
      return <Link to="/stations" {...props} />;
    case "cases":
      return <Link to="/cases" {...props} />;
    case "mistakes":
      return <Link to="/drill" search={{ case: "mistakes" }} {...props} />;
    case "quiz":
      return <Link to="/quiz" {...props} />;
    case "place":
      return <Link to="/quiz" hash="place" {...props} />;
    case "aed":
      return <Link to="/aed" {...props} />;
    case "cpr":
      return <Link to="/timer" hash="cpr-trainer" {...props} />;
    case "bag":
      return <Link to="/bag" hash="pack" {...props} />;
    case "team":
      return <Link to="/team" {...props} />;
    case "daily":
      return <Link to="/daily" {...props} />;
    case "listen":
      return <Link to="/listen" {...props} />;
  }
}

// keyboard focus is an outline: the next badge's breathing ring is a box shadow, and an animated shadow would hide a ring
const TILE =
  "group relative flex h-full min-h-[3.9rem] w-full flex-col items-center justify-center gap-[3px] overflow-hidden rounded-xl px-1.5 pb-2 pt-2.5 text-center transition-[transform,box-shadow,background-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink active:scale-[0.96] motion-safe:hover:-translate-y-0.5";

/**
 * One badge, and the way to it: earned (gold, a tick), the next to go for (a breathing gold ring, an arrow), or still
 * locked (its own icon dimmed, a lock). Every tile opens the place it is earned; a badge that builds up shows how far
 * along it is.
 */
function BadgeTile({ b, p, next }: { b: Badge; p: Progress; next: boolean }) {
  const on = b.done(p);
  const Icon = ICONS[b.id] ?? Trophy;
  const steps = on ? null : badgeProgress(b.id, p);
  const best = !on && b.id === "aed-fast" && p.aedBest !== null ? p.aedBest : null;
  const Corner = on ? Check : next ? ArrowUpRight : Lock;
  return (
    <li>
      <GoalLink
        goal={badgeGoal(b.id, p)}
        title={b.how}
        className={cn(
          TILE,
          on
            ? "badge-earned bg-gradient-to-br from-[#f6e7b4] to-[#e2c25c] text-[#3b2f05] hover:shadow-[0_12px_22px_-12px_rgba(201,162,39,1)]"
            : next
              ? "badge-next bg-paper text-heading"
              : "bg-note text-muted shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-paper hover:text-heading hover:shadow-card",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full",
            on ? "bg-white/70 text-[#5a4708]" : next ? "text-gold-ink" : "opacity-70",
          )}
        >
          <Corner className={on ? "size-2.5" : "size-3"} strokeWidth={on ? 3.2 : 2.4} />
        </span>
        <Icon className={cn("size-[18px] transition-transform duration-200 group-hover:scale-110", next ? "text-gold-ink" : "")} aria-hidden />
        <span className="font-display text-[10.5px] font-semibold leading-tight tracking-wide">{b.title}</span>
        {steps && steps.have > 0 ? (
          <span className="mt-0.5 flex w-full max-w-[5.75rem] items-center gap-1">
            <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-current/15">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${(steps.have / steps.need) * 100}%` }} />
            </span>
            <span className="text-[9.5px] font-semibold leading-none tabular-nums">
              {steps.have}/{steps.need}
            </span>
          </span>
        ) : null}
        {/* the best clean time so far: seconds as "s" in every language */}
        {best !== null ? (
          <span translate="no" className="text-[9.5px] font-semibold leading-none tabular-nums">
            {`${best} s`}
          </span>
        ) : null}
        <span className="sr-only">{on ? `Earned. Open ${WHERE[b.id]}` : `Not yet: ${b.how}. Open ${WHERE[b.id]}`}</span>
      </GoalLink>
    </li>
  );
}

const R = 26;
const CIRC = 2 * Math.PI * R;
const go = "whitespace-nowrap font-display font-semibold tracking-wide text-gold-ink";

/** Home: badges earned so far, the next one to go for, and every badge a link straight to where it is earned. */
export function TrainingCard() {
  const p = useProgress();
  const done = earnedCount(p);
  const next = nextBadge(p);
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
          {next ? (
            <p className="mt-1.5 text-sm leading-snug">
              <span className="font-semibold text-heading">Next: {next.title}. </span>
              {next.how}.{" "}
              <GoalLink goal={badgeGoal(next.id, p)} className={go}>
                {WHERE[next.id]} →
              </GoalLink>
            </p>
          ) : (
            <p className="mt-1.5 text-sm font-semibold leading-snug text-heading">Every badge earned — ready for match day.</p>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2 px-3.5 pb-3.5 pt-2">
        {BADGES.map((b) => (
          <BadgeTile key={b.id} b={b} p={p} next={b.id === next?.id} />
        ))}
      </ul>
      <Link to="/record" className="flex min-h-11 items-center gap-2 border-t border-line px-3.5 font-display text-sm font-semibold tracking-wide text-gold-ink">
        <ClipboardCheck className="size-4" aria-hidden />
        Training record · print, save or share
      </Link>
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
