import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bone, Headphones, HeartPulse, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LoopClip } from "@/components/loop-clip";
import { AppShell, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { cardClip, cardPicture } from "@/lib/ar";
import { asset } from "@/lib/asset";
import { translateText } from "@/lib/i18n";
import { durationsFor, heardAt, type ListenDrill, listenPlan, listenTrack, nextStart, prevStart, stepAt } from "@/lib/listen";
import { record, step as did } from "@/lib/progress";
import { holdMusic, tap } from "@/lib/sound";
import { type DrillStep, spineCallouts, spineSteps } from "@/lib/spine-drill";
import { cn } from "@/lib/utils";
import { callouts, drillCallouts } from "@/lib/voice";
import { VOICE_SECONDS } from "@/lib/voice-durations";
import { voiceFile } from "@/lib/voice-files";
import { workshop } from "@/lib/workshop";

type Search = { drill?: "spine" };

const noSubscribe = () => () => {};

export const Route = createFileRoute("/listen")({
  component: ListenPage,
  validateSearch: (s: Record<string, unknown>): Search => (s.drill === "spine" ? { drill: "spine" } : {}),
  head: () => ({ meta: [{ title: "Listen mode · Pitchside Emergency Care" }] }),
});

const DRILLS: Record<ListenDrill, { name: string; steps: readonly DrillStep[]; script: Record<number, readonly string[]> }> = {
  arrest: { name: "Cardiac arrest drill", steps: workshop.steps, script: drillCallouts },
  spine: { name: "Neck injury drill", steps: spineSteps, script: spineCallouts },
};
const SOUNDS: Record<string, string> = { "sfx:shock": "The AED delivers the shock", "sfx:siren": "The ambulance leaves" };

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function ListenPage() {
  const search = Route.useSearch();
  // the page is built without the query: the drill named in it switches on once the page has hydrated
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const drill: ListenDrill = ready && search.drill === "spine" ? "spine" : "arrest";
  const navigate = useNavigate({ from: "/listen" });
  const d = DRILLS[drill];
  const plan = useMemo(() => listenPlan(d.script, d.steps, durationsFor(d.script, VOICE_SECONDS, voiceFile)), [d]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const repeatRef = useRef(repeat);
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  // one audio element per drill; the lock screen shows the drill and the step, with play, pause and skip
  useEffect(() => {
    const el = new Audio(asset(listenTrack(drill)));
    el.preload = "metadata";
    audio.current = el;
    setT(0);
    setPlaying(false);
    let raf = 0;
    const tick = () => {
      setT(el.currentTime * 1000);
      if (!el.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      holdMusic(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      holdMusic(false);
      cancelAnimationFrame(raf);
      setT(el.currentTime * 1000);
    };
    const onEnded = () => {
      record(did.listened, drill);
      if (repeatRef.current) {
        el.currentTime = 0;
        void el.play().catch(() => {});
      }
    };
    const onTime = () => setT(el.currentTime * 1000); // still runs with the screen off, where frames do not
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTime);
    const ms = navigator.mediaSession;
    if (ms) {
      const seek = (to: number) => {
        el.currentTime = Math.max(0, to / 1000);
        setT(to);
      };
      const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ["play", () => void el.play().catch(() => {})],
        ["pause", () => el.pause()],
        ["previoustrack", () => seek(prevStart(plan, el.currentTime * 1000))],
        ["nexttrack", () => {
          const n = nextStart(plan, el.currentTime * 1000);
          if (n !== null) seek(n);
        }],
        ["seekbackward", () => seek(el.currentTime * 1000 - 10_000)],
        ["seekforward", () => seek(Math.min(plan.length, el.currentTime * 1000 + 10_000))],
        ["seekto", (e) => seek((e.seekTime ?? 0) * 1000)],
      ];
      for (const [action, handler] of handlers) {
        try {
          ms.setActionHandler(action, handler);
        } catch {
          // this browser has no such lock-screen button
        }
      }
    }
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTime);
      if (!el.paused) holdMusic(false);
      el.pause();
      el.removeAttribute("src");
      el.load();
      audio.current = null;
      if (ms) ms.metadata = null; // nothing left playing: the lock screen lets go of the drill
      if (ms) for (const action of ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[]) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          // not supported
        }
      }
    };
  }, [drill, plan]);

  const step = stepAt(plan, t);
  const current = d.steps.find((s) => s.n === step);
  const heard = heardAt(plan, t);
  const line = heard && !heard.id.startsWith("sfx:") ? callouts[heard.id] : undefined;
  const title = translateText(current ? current.title : "The team in place");

  // the lock screen's title follows the step
  useEffect(() => {
    const ms = navigator.mediaSession;
    if (!ms || typeof MediaMetadata === "undefined") return;
    ms.metadata = new MediaMetadata({
      title,
      artist: translateText(d.name),
      album: "Pitchside Emergency Care",
      artwork: [192, 512].map((s) => ({ src: new URL(asset(`/icons/icon-${s}.png`), window.location.href).href, sizes: `${s}x${s}`, type: "image/png" })),
    });
  }, [title, d.name]);
  useEffect(() => {
    const ms = navigator.mediaSession;
    if (!ms?.setPositionState || !plan.length) return;
    try {
      ms.setPositionState({ duration: plan.length / 1000, position: Math.min(plan.length, t) / 1000, playbackRate: 1 });
    } catch {
      // the position is outside what the browser accepts while the file loads
    }
    // the position only needs updating when a step changes or playback starts or stops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, playing, plan.length]);

  const seekTo = (ms: number, play = false) => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = Math.max(0, ms / 1000);
    setT(ms);
    if (play && el.paused) void el.play().catch(() => {});
  };
  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    tap();
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };
  const pick = (to: ListenDrill) => {
    if (to === drill) return;
    tap();
    void navigate({ search: to === "spine" ? { drill: "spine" } : {}, replace: true, resetScroll: false });
  };

  return (
    <AppShell tab="drill" heading="Listen mode">
      <div className="flex flex-col gap-3.5">
        <div role="tablist" aria-label="Which drill" className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-card">
          {(
            [
              ["arrest", "Cardiac arrest", HeartPulse],
              ["spine", "Neck injury", Bone],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={drill === id}
              onClick={() => pick(id)}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-1 font-display text-sm font-semibold tracking-wide transition-colors",
                drill === id ? "bg-navy text-gold" : "text-heading",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <Panel>
          <div className="relative aspect-[3/2] overflow-hidden bg-[#447a3c]">
            <img
              key={`${drill}-${step}`}
              src={asset(cardPicture(drill, step))}
              alt={current ? `Step ${current.n}: ${current.title}, from the app's own 3D drill` : "The team in place around the player, from the app's own 3D drill"}
              width={720}
              height={480}
              className="img-in block h-full w-full object-cover"
            />
            <LoopClip key={`${drill}-${step}-clip`} src={asset(cardClip(drill, step))} />
            <p className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-[#0b1f3a] px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-gold">
              {current ? `STEP ${current.n} · ${current.title.toUpperCase()}` : "THE TEAM IN PLACE"}
            </p>
            {heard ? (
              <div key={heard.at} className="caption-in absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-[#0b1f3a]/85 px-2.5 py-2 backdrop-blur-sm" aria-live="polite">
                {line ? <RoleChip id={line.role} /> : null}
                <p className="min-w-0 text-[13px] font-medium italic leading-snug text-[#f7f4ee]">{line ? `“${line.text}”` : SOUNDS[heard.id]}</p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <input
              type="range"
              min={0}
              max={plan.length}
              step={100}
              value={Math.min(plan.length, Math.round(t))}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="Position in the drill"
              aria-valuetext={`${clock(t)} of ${clock(plan.length)}`}
              className="w-full accent-[var(--color-gold)]"
            />
            <div className="flex items-center justify-between font-display text-xs font-semibold tabular-nums text-muted">
              <span>{clock(t)}</span>
              <span>{clock(plan.length)}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  tap();
                  seekTo(prevStart(plan, t));
                }}
                aria-label="Back a step"
                className="grid size-12 place-items-center rounded-full bg-note text-heading active:scale-95"
              >
                <SkipBack className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="grid size-16 place-items-center rounded-full bg-navy text-gold shadow-card active:scale-95"
              >
                {playing ? <Pause className="size-7" aria-hidden /> : <Play className="size-7 translate-x-0.5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => {
                  tap();
                  const n = nextStart(plan, t);
                  if (n !== null) seekTo(n);
                }}
                aria-label="Next step"
                className="grid size-12 place-items-center rounded-full bg-note text-heading active:scale-95"
              >
                <SkipForward className="size-5" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                tap();
                setRepeat((r) => !r);
              }}
              aria-pressed={repeat}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-1.5 self-center rounded-full px-4 font-display text-xs font-semibold tracking-wide active:scale-95",
                repeat ? "bg-gold text-on-gold" : "bg-note text-heading",
              )}
            >
              <Repeat className="size-4" aria-hidden />
              {repeat ? "Repeat on" : "Repeat off"}
            </button>
          </div>
        </Panel>

        <Panel>
          <div className="px-3.5 pt-3">
            <SectionLabel>STEPS</SectionLabel>
          </div>
          <ol className="flex flex-col px-1.5 py-1.5">
            {d.steps.map((s) => {
              const start = plan.chapters.find((c) => c.step === s.n)?.start ?? 0;
              const on = s.n === step;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      seekTo(start, true);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={cn("flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left active:scale-[0.99]", on && "bg-note")}
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold", on ? "bg-gold text-on-gold" : "bg-navy text-gold")}>{s.n}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold text-ink">{s.title}</span>
                      <span className="text-muted"> · {s.time}</span>
                    </span>
                    <span className="font-display text-xs font-semibold tabular-nums text-muted">{clock(start)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Note>
          <span className="font-semibold text-heading">
            <Headphones className="mr-1 inline size-4 align-[-3px]" aria-hidden />
            Rehearse with the screen off.{" "}
          </span>
          The whole drill plays as sound — every call-out in order, the AED's shock and the siren — and keeps playing when the phone
          locks; the lock screen has play, pause and skip. Say each line with the team, or before it. "Save everything" in the
          download menu keeps both drills for offline use.
        </Note>
      </div>
    </AppShell>
  );
}
