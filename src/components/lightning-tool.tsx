import { CloudLightning, RotateCcw, ShieldAlert, Volume2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flashToBang, mmss, parseStorm, resumeAt, RESUME_MINUTES, SOUND_KM_PER_S, STOP_SECONDS, waitLeft } from "@/lib/lightning";
import { countTick, haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const KEY = "pec-lightning";
const R_KM = 7.2; // radar scale: SVG units per km
const MAX_KM = 20;

type Result = ReturnType<typeof flashToBang> & { heardOnly?: boolean };

function save(lastStrike: number | null) {
  try {
    if (lastStrike) localStorage.setItem(KEY, String(lastStrike));
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the countdown still runs while the page is open
  }
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Match-day lightning tool: tap at the flash, tap at the thunder. The sound ring grows at the speed of sound
 * on the radar; under 30 seconds (about 10 km) play stops, and a 30-minute countdown starts — restarted by
 * every new flash or thunder.
 */
export function LightningTool() {
  const [flashAt, setFlashAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [lastStrike, setLastStrike] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastWhole = useRef(0);

  useEffect(() => {
    let saved: number | null = null;
    try {
      saved = parseStorm(localStorage.getItem(KEY), Date.now());
    } catch {
      // storage blocked
    }
    if (saved) setLastStrike(saved);
  }, []);

  // counting: the seconds since the flash, with a soft tick each second
  useEffect(() => {
    if (flashAt == null) return;
    let raf = 0;
    lastWhole.current = 0;
    const loop = () => {
      const s = (performance.now() - flashAt) / 1000;
      setElapsed(s);
      const whole = Math.floor(s);
      if (whole > lastWhole.current) {
        lastWhole.current = whole;
        countTick(whole === STOP_SECONDS);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [flashAt]);

  // the 30-minute countdown
  useEffect(() => {
    if (!lastStrike) return;
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [lastStrike]);

  const strike = () => {
    const t = Date.now();
    setLastStrike(t);
    setNow(t);
    save(t);
  };

  const flash = () => {
    haptic(20);
    tap();
    setResult(null);
    setElapsed(0);
    setFlashAt(performance.now());
    if (lastStrike) strike(); // any lightning restarts the 30 minutes
  };

  const thunder = () => {
    if (flashAt == null) return;
    const r = flashToBang((performance.now() - flashAt) / 1000);
    setFlashAt(null);
    setResult(r);
    if (r.stop) {
      sfx("whistle", 0.5);
      haptic([60, 40, 60]);
    } else tap();
    if (r.stop || lastStrike) strike(); // stop play, or restart the wait already running
  };

  const heardOnly = () => {
    tap();
    setFlashAt(null);
    setResult({ seconds: 0, km: 0, stop: true, heardOnly: true });
    sfx("whistle", 0.5);
    strike();
  };

  const clear = () => {
    tap();
    setLastStrike(null);
    setResult(null);
    setFlashAt(null);
    save(null);
  };

  const counting = flashAt != null;
  const left = lastStrike ? waitLeft(lastStrike, now) : 0;
  const waiting = lastStrike != null && left > 0;
  const done = lastStrike != null && left === 0;
  const ringKm = counting ? Math.min(MAX_KM, elapsed * SOUND_KM_PER_S) : 0;

  return (
    <div className="flex flex-col gap-3">
      <Radar ringKm={ringKm} counting={counting} result={result} />

      {counting ? (
        <div className="flex flex-col items-center gap-1" aria-live="polite">
          <p className="font-display text-5xl font-bold tabular-nums leading-none text-heading">{elapsed.toFixed(1)}</p>
          <p className="text-xs text-muted">seconds since the flash · the sound travels about 1 km every 3 seconds</p>
        </div>
      ) : result ? (
        <div
          className={cn(
            "caption-in flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm leading-snug",
            result.stop ? "bg-danger/12 text-ink" : "bg-[#d4a017]/15 text-ink",
          )}
          aria-live="polite"
        >
          {result.stop ? <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden /> : <CloudLightning className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />}
          <p>
            {result.heardOnly ? (
              <>
                <span className="font-semibold">Thunder heard — the storm is close enough to strike. </span>
                Stop play and get everyone to safe shelter now.
              </>
            ) : result.stop ? (
              <>
                <span className="font-semibold">
                  {result.seconds.toFixed(1)} s — about {result.km} km away. Stop play now.
                </span>{" "}
                Everyone off the pitch to safe shelter.
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {result.seconds.toFixed(1)} s — about {result.km} km away.
                </span>{" "}
                Not yet inside {STOP_SECONDS} seconds: warn the officials, get shelter ready and keep counting every flash.
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm leading-snug text-muted">Tap FLASH the moment you see lightning, then THUNDER when you hear it.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={flash}
          className="flex min-h-16 flex-col items-center justify-center rounded-2xl bg-[#f2c811] font-display text-lg font-bold tracking-[0.12em] text-[#0b1f3a] shadow-card transition-transform duration-150 active:scale-95"
        >
          <Zap className="size-5" aria-hidden />
          {counting ? "FLASH AGAIN" : "FLASH"}
        </button>
        <button
          type="button"
          onClick={thunder}
          disabled={!counting}
          className="flex min-h-16 flex-col items-center justify-center rounded-2xl bg-navy font-display text-lg font-bold tracking-[0.12em] text-on-navy shadow-card transition-all duration-150 active:scale-95 disabled:opacity-40"
        >
          <Volume2 className="size-5" aria-hidden />
          THUNDER
        </button>
      </div>
      {!counting ? (
        <button
          type="button"
          onClick={heardOnly}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-heading active:scale-[0.98]"
        >
          Heard thunder but saw no flash
        </button>
      ) : null}

      {lastStrike ? (
        <Countdown left={left} lastStrike={lastStrike} waiting={waiting} done={done} onClear={clear} />
      ) : null}
    </div>
  );
}

function Countdown({ left, lastStrike, waiting, done, onClear }: { left: number; lastStrike: number; waiting: boolean; done: boolean; onClear: () => void }) {
  const total = RESUME_MINUTES * 60_000;
  const k = 1 - left / total;
  const R = 38;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-3" role="timer" aria-live="off">
      <div className="relative grid size-[5.5rem] shrink-0 place-items-center">
        <svg viewBox="0 0 88 88" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="44" cy="44" r={R} fill="none" className="stroke-line" strokeWidth="6" />
          <circle cx="44" cy="44" r={R} fill="none" className={done ? "stroke-[#1A7F45]" : "stroke-gold"} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - k)} />
        </svg>
        <span className="font-display text-xl font-bold tabular-nums text-heading">{done ? "0:00" : mmss(left)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">{waiting ? "PLAY STOPPED" : "30 MINUTES CLEAR"}</p>
        <p className="mt-0.5 text-sm leading-snug text-ink">
          {waiting ? (
            <>
              Resume no earlier than <span className="font-semibold tabular-nums">{clock(resumeAt(lastStrike))}</span>. Every new flash or
              thunder restarts the {RESUME_MINUTES} minutes.
            </>
          ) : (
            <>No flash or thunder for {RESUME_MINUTES} minutes: play may resume if the officials agree.</>
          )}
        </p>
        <button type="button" onClick={onClear} className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-gold-ink active:scale-95">
          <RotateCcw className="size-3.5" aria-hidden />
          Clear the storm
        </button>
      </div>
    </div>
  );
}

/** The pitch at the bottom, rings every 5 km, the danger zone inside 10 km (30 s), the sound ring and the strike. */
function Radar({ ringKm, counting, result }: { ringKm: number; counting: boolean; result: Result | null }) {
  const cx = 160;
  const cy = 168;
  const stopR = STOP_SECONDS * SOUND_KM_PER_S * R_KM;
  const angle = -Math.PI / 2 + 0.55; // the storm, up and to the right
  const strikeKm = result && !result.heardOnly ? Math.min(MAX_KM, result.km) : null;
  const sx = strikeKm != null ? cx + Math.cos(angle) * strikeKm * R_KM : 0;
  const sy = strikeKm != null ? cy + Math.sin(angle) * strikeKm * R_KM : 0;
  const arc = (r: number) => `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <svg viewBox="0 0 320 184" className="block h-auto w-full" role="img" aria-label={strikeKm != null ? `The strike was about ${strikeKm} km away` : "Distance rings every 5 km; play stops inside 10 km"}>
      <path d={`${arc(stopR)} Z`} className="fill-danger" opacity={0.1} />
      {/* the rings, each named under its foot like a ruler */}
      {[5, 10, 15, 20].map((km) => (
        <g key={km}>
          <path d={arc(km * R_KM)} fill="none" className={Math.abs(km * R_KM - stopR) < 4 ? "stroke-danger" : "stroke-line"} strokeWidth={Math.abs(km * R_KM - stopR) < 4 ? 1.5 : 1} />
          <text x={cx - km * R_KM} y={cy + 12} textAnchor="middle" className="fill-muted text-[10.5px] tabular-nums">
            {km} km
          </text>
        </g>
      ))}
      <line x1={cx - MAX_KM * R_KM} x2={cx + MAX_KM * R_KM} y1={cy} y2={cy} className="stroke-line" strokeWidth={1} />
      <text textAnchor="middle" className="fill-danger text-[10px] font-semibold">
        <tspan x={cx} y={cy - stopR * 0.75}>
          STOP PLAY
        </tspan>
        <tspan x={cx} y={cy - stopR * 0.75 + 12}>
          UNDER 30 s
        </tspan>
      </text>
      {counting ? <path d={arc(Math.max(1, ringKm * R_KM))} fill="none" className="stroke-gold" strokeWidth={2.5} /> : null}
      {/* the pitch */}
      <rect x={cx - 13} y={cy - 8} width={26} height={12} rx={2} className="fill-[#2e7d32]" />
      <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 4} stroke="#f4f4f1" strokeWidth={1} />
      {strikeKm != null ? (
        <g className="caption-in">
          <circle cx={sx} cy={sy} r={13} className={result?.stop ? "fill-danger" : "fill-[#d4a017]"} opacity={0.18}>
            <animate attributeName="r" values="9;16;9" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <path d={`M${sx + 1} ${sy - 9} L${sx - 4} ${sy + 1} L${sx} ${sy + 1} L${sx - 2} ${sy + 9} L${sx + 5} ${sy - 2} L${sx + 1} ${sy - 2} Z`} className="fill-[#f2c811] stroke-[#0b1f3a]" strokeWidth={0.8} />
        </g>
      ) : null}
    </svg>
  );
}
