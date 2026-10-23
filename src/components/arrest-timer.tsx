import {
  Activity,
  Ambulance,
  Ban,
  BellRing,
  ChevronRight,
  CircleStop,
  HandHeart,
  HeartPulse,
  type LucideIcon,
  MessageCircle,
  Play,
  RotateCcw,
  Share2,
  Syringe,
  Timer,
  Undo2,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Panel, SectionLabel } from "@/components/workshop";
import {
  ADRENALINE_EVERY_MS,
  amiodaroneDose,
  ARREST_KEY as KEY,
  ARREST_VOICE_KEY as VOICE_KEY,
  type ArrestEventKind,
  type ArrestSession,
  checksDue,
  clock,
  count,
  CYCLE_MS,
  eventLabel,
  first,
  latest,
  logText,
  nextCheckIn,
  ONCE,
  parseSession,
  prompts,
  summary,
} from "@/lib/arrest-log";
import { shareOrCopy } from "@/lib/share";
import { say, sfx, startMetronome, stopMetronome, tap } from "@/lib/sound";
import { translateText } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/lib/wake-lock";

type Tone = "red" | "navy" | "gold" | "plain";
const BUTTONS: { kind: ArrestEventKind; label: (s: ArrestSession) => string; icon: LucideIcon; tone: Tone }[] = [
  { kind: "cpr", label: () => "CPR started", icon: HandHeart, tone: "navy" },
  { kind: "aed", label: () => "AED on", icon: HeartPulse, tone: "navy" },
  { kind: "shock", label: () => "Shock", icon: Zap, tone: "red" },
  { kind: "noshock", label: () => "No shock advised", icon: Ban, tone: "plain" },
  { kind: "adrenaline", label: () => "Adrenaline 1 mg", icon: Syringe, tone: "gold" },
  {
    kind: "amiodarone",
    label: (s) => {
      const dose = amiodaroneDose(s);
      return dose ? `Amiodarone ${dose} mg` : "Amiodarone given";
    },
    icon: Syringe,
    tone: "gold",
  },
  { kind: "airway", label: () => "i-gel in", icon: Wind, tone: "plain" },
  { kind: "rosc", label: () => "Signs of life", icon: Activity, tone: "plain" },
  { kind: "ambulance", label: () => "Ambulance here", icon: Ambulance, tone: "plain" },
];

const TONES: Record<Tone, string> = {
  red: "bg-danger-fill text-white",
  navy: "bg-navy text-on-navy",
  gold: "bg-gold text-on-gold",
  plain: "border border-line bg-paper text-heading",
};

function vibrate(pattern: number | number[]) {
  // browsers refuse it (and log an error) before the first tap on the page, e.g. after a reload
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // not supported
  }
}

const timeOfDay = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * A CPR clock for drills and moulages: it runs from the collapse, sounds the 2-minute rhythm check,
 * logs shocks, drugs and milestones with their times, and ends with the timings for the debrief.
 * The log stays on this device (so a reload or a phone call does not lose it) until it is cleared.
 */
export function ArrestTimer() {
  const [s, setS] = useState<ArrestSession | null>(null);
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [beat, setBeat] = useState(false);
  const [alarm, setAlarm] = useState(false);
  const [note, setNote] = useState("");
  const [voice, setVoice] = useState(true);
  const cued = useRef(0);
  const adrenalineCued = useRef<number | null>(null);
  const running = Boolean(s && !s.endedAt);

  useEffect(() => {
    const t = Date.now();
    let saved: ArrestSession | null = null;
    try {
      saved = parseSession(localStorage.getItem(KEY), t);
    } catch {
      // storage blocked
    }
    if (saved) {
      setS(saved);
      cued.current = checksDue(saved, t);
      // a reminder already due before the reload is not spoken again
      const dose = latest(saved, "adrenaline");
      if (dose && t - dose.at >= ADRENALINE_EVERY_MS) adrenalineCued.current = dose.at;
    }
    try {
      setVoice(localStorage.getItem(VOICE_KEY) !== "off");
    } catch {
      // storage blocked: the voice stays on
    }
    setNow(t);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s));
      else localStorage.removeItem(KEY);
    } catch {
      // storage blocked: the timer still runs, it just is not kept
    }
  }, [s, ready]);

  useWakeLock(running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  // every 2 minutes: a whistle, a buzz, a banner — and Black calling the rhythm check
  useEffect(() => {
    if (!s || !running) return;
    const due = checksDue(s, now);
    if (due > cued.current) {
      sfx("whistle", 0.6);
      vibrate([200, 100, 200]);
      setAlarm(true);
      if (voice) window.setTimeout(() => void say("black-s2"), 900);
    }
    cued.current = due;
  }, [s, now, running, voice]);

  // 3 minutes after each adrenaline dose (for trained teams), a spoken reminder — once per dose
  useEffect(() => {
    if (!s || !running) return;
    const last = latest(s, "adrenaline");
    if (!last || now - last.at < ADRENALINE_EVERY_MS || adrenalineCued.current === last.at) return;
    adrenalineCued.current = last.at;
    if (voice) void say("black-s3");
  }, [s, now, running, voice]);

  useEffect(() => {
    if (!alarm) return;
    const id = window.setTimeout(() => setAlarm(false), 12_000);
    return () => window.clearTimeout(id);
  }, [alarm]);

  useEffect(() => {
    if (beat && running) startMetronome(110, true);
    else stopMetronome();
    return () => stopMetronome();
  }, [beat, running]);

  function start() {
    const t = Date.now();
    sfx("whistle", 0.5);
    vibrate(40);
    cued.current = 0;
    setAlarm(false);
    setNote("");
    setS({ startedAt: t, events: [] });
    setNow(t);
  }

  function log(kind: ArrestEventKind) {
    if (!s || s.endedAt) return;
    if (ONCE.includes(kind) && first(s, kind)) return;
    if (kind === "amiodarone" && amiodaroneDose(s) === null) return;
    const t = Date.now();
    vibrate(25);
    if (kind === "shock") sfx("shock", 0.45);
    else tap();
    setS({ ...s, events: [...s.events, { kind, at: t }] });
    setNow(t);
  }

  function undo() {
    if (!s || s.endedAt || !s.events.length) return;
    tap();
    setS({ ...s, events: s.events.slice(0, -1) });
  }

  function stop() {
    if (!s) return;
    tap();
    setBeat(false);
    setAlarm(false);
    setS({ ...s, endedAt: Date.now() });
  }

  function clear() {
    if (running && !window.confirm(translateText("Stop and clear this timer and its log?"))) return;
    tap();
    setBeat(false);
    setAlarm(false);
    setNote("");
    setS(null);
  }

  async function share() {
    if (!s) return;
    tap();
    const r = await shareOrCopy({ title: "Arrest timer log", text: logText(s, Date.now(), timeOfDay) });
    setNote(r === "copied" ? "Log copied — paste it into your notes or the team chat." : r === "failed" ? "Sharing is not available on this device." : "");
  }

  if (!s)
    return (
      <Panel>
        <div className="flex flex-col gap-3.5 px-3.5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-danger/12 text-danger">
              <Timer className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold leading-tight tracking-wide text-heading">Arrest timer</h1>
              <p className="text-sm leading-snug text-muted">CPR clock, 2-minute rhythm checks and a timed log of shocks and drugs.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-16 w-full items-center justify-center gap-2.5 rounded-xl bg-danger-fill font-display text-lg font-bold tracking-wide text-white shadow-card active:scale-[0.98]"
          >
            <Play className="size-6" fill="currentColor" aria-hidden />
            Start — player collapsed
          </button>
          <ul className="flex flex-col gap-1.5 text-sm leading-snug">
            {[
              "The clock runs from the collapse. Tap each step as it happens.",
              "Every 2 minutes a whistle, a buzz and Black's voice call the rhythm check — swap the person compressing.",
              "At the end you get the timings for the debrief, ready to share. The screen stays on while it runs.",
              "Need to look something up mid-arrest? The clock follows you to every page, and the rhythm check still sounds.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    );

  const tips = running ? prompts(s, now) : [];
  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="sr-only">Arrest timer</h1>
      <Panel>
        <div className="flex items-center gap-3 bg-navy px-3.5 py-3.5 text-on-navy">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-gold">{running ? "SINCE THE COLLAPSE" : "TIMER STOPPED"}</p>
            <p role="timer" className="font-display text-[3.25rem] font-bold leading-none tabular-nums">
              {clock((s.endedAt ?? now) - s.startedAt)}
            </p>
            <p className="mt-1 text-xs text-gold-soft">Collapse at {timeOfDay(s.startedAt)}</p>
          </div>
          {running ? <CheckRing left={nextCheckIn(s, now)} /> : null}
        </div>
        {alarm && running ? (
          <p role="alert" className="caption-in flex items-center gap-2 bg-gold px-3.5 py-2.5 font-display text-sm font-bold leading-snug text-on-gold">
            <BellRing className="size-5 shrink-0" aria-hidden />
            Rhythm check — hands off while the AED analyses. Swap the person compressing.
          </p>
        ) : null}
        {tips.length ? (
          <ul aria-live="polite" className="flex flex-col gap-1.5 border-b border-line bg-note px-3.5 py-2.5 text-sm leading-snug">
            {tips.map((t) => (
              <li key={t} className="flex gap-2">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        ) : null}
        {running ? (
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <div className="grid grid-cols-2 gap-2">
              {BUTTONS.map((b) => {
                const once = ONCE.includes(b.kind);
                const at = once ? first(s, b.kind) : undefined;
                const n = count(s, b.kind);
                const off = Boolean(at) || (b.kind === "amiodarone" && amiodaroneDose(s) === null);
                const label = b.label(s);
                return (
                  <button
                    key={b.kind}
                    type="button"
                    disabled={off}
                    onClick={() => log(b.kind)}
                    aria-label={at ? `${label}, logged at ${clock(at.at - s.startedAt)}` : !once && n ? `${label}, ${n} logged` : label}
                    className={cn(
                      "flex min-h-14 items-center gap-2 rounded-xl px-3 text-left font-display text-sm font-semibold leading-tight tracking-wide transition-transform duration-150 active:scale-95 disabled:active:scale-100",
                      off ? "border border-line bg-cream text-muted" : TONES[b.tone],
                    )}
                  >
                    <b.icon className="size-5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">{label}</span>
                    {at ? (
                      <span className="shrink-0 text-xs font-bold tabular-nums">{clock(at.at - s.startedAt)}</span>
                    ) : !once && n ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-black/20 text-xs font-bold tabular-nums">{n}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!s.events.length}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper font-display text-xs font-semibold tracking-wide text-heading active:scale-95 disabled:opacity-50"
              >
                <Undo2 className="size-4" aria-hidden />
                Undo
              </button>
              <button
                type="button"
                onClick={() => {
                  tap();
                  setBeat((b) => !b);
                }}
                aria-pressed={beat}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl font-display text-xs font-semibold tracking-wide active:scale-95",
                  beat ? "bg-navy text-gold" : "border border-line bg-paper text-heading",
                )}
              >
                <Activity className={cn("size-4", beat && "sound-wave")} aria-hidden />
                Beat 110
              </button>
              <button
                type="button"
                onClick={() => {
                  tap();
                  setVoice((v) => {
                    try {
                      localStorage.setItem(VOICE_KEY, v ? "off" : "on");
                    } catch {
                      // storage blocked
                    }
                    return !v;
                  });
                }}
                aria-pressed={voice}
                aria-label={voice ? "Spoken prompts on" : "Spoken prompts off"}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl font-display text-xs font-semibold tracking-wide active:scale-95",
                  voice ? "bg-navy text-gold" : "border border-line bg-paper text-heading",
                )}
              >
                <MessageCircle className="size-4" aria-hidden />
                Voice
              </button>
              <button
                type="button"
                onClick={stop}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-navy font-display text-xs font-semibold tracking-wide text-on-navy active:scale-95"
              >
                <CircleStop className="size-4" aria-hidden />
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <SectionLabel>DEBRIEF</SectionLabel>
            <dl className="flex flex-col divide-y divide-line text-sm">
              {summary(s, now).map((r) => (
                <div key={r.label} className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className={cn("font-semibold tabular-nums text-heading", r.target === "met" && "text-[#1A7F45] dark:text-[#4cc47f]", r.target === "missed" && "text-danger")}>
                    {r.value}
                    {r.target ? <span className="ml-1 text-xs font-medium">{r.target === "met" ? "· within 3 min" : "· over 3 min"}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={share}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold font-display text-sm font-semibold tracking-wide text-on-gold active:scale-95"
              >
                <Share2 className="size-4" aria-hidden />
                Share log
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
              >
                <RotateCcw className="size-4" aria-hidden />
                New timer
              </button>
            </div>
            <p className="min-h-4 text-center text-xs text-muted" aria-live="polite">
              {note}
            </p>
          </div>
        )}
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 px-3.5 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>LOG</SectionLabel>
            {running ? (
              <button type="button" onClick={clear} className="min-h-9 px-2 text-xs font-medium text-muted underline underline-offset-2">
                Clear
              </button>
            ) : null}
          </div>
          <ol className="flex flex-col divide-y divide-line text-sm">
            <li className="flex gap-3 py-1.5">
              <span className="w-12 shrink-0 font-semibold tabular-nums text-heading">0:00</span> Collapse
            </li>
            {s.events.map((e, i) => (
              <li key={`${e.kind}${e.at}`} className="flex gap-3 py-1.5">
                <span className="w-12 shrink-0 font-semibold tabular-nums text-heading">{clock(e.at - s.startedAt)}</span> {eventLabel(s, i)}
              </li>
            ))}
            {s.endedAt ? (
              <li className="flex gap-3 py-1.5 text-muted">
                <span className="w-12 shrink-0 font-semibold tabular-nums">{clock(s.endedAt - s.startedAt)}</span> Timer stopped
              </li>
            ) : null}
          </ol>
        </div>
      </Panel>
    </div>
  );
}

const R = 30;
const CIRC = 2 * Math.PI * R;

/** The countdown to the next 2-minute rhythm check. */
function CheckRing({ left }: { left: number }) {
  const soon = left <= 10_000;
  return (
    <div className="relative grid size-[5.5rem] shrink-0 place-items-center" aria-label={`Rhythm check in ${clock(left)}`} role="img">
      <svg viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - left / CYCLE_MS)}
        />
      </svg>
      <span className="text-center">
        <span className={cn("block font-display text-lg font-bold leading-none tabular-nums", soon && "text-gold")}>{clock(left)}</span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wider text-gold-soft">to check</span>
      </span>
    </div>
  );
}
