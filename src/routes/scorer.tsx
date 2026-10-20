import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardCheck, Flag, Hand, ImageDown, Play, RotateCcw, Settings2, Share2, Square, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import {
  CCF_TARGET,
  checks,
  compressionFraction,
  count,
  debriefText,
  DEFAULT_TARGETS,
  end,
  firstAt,
  flag,
  type FlagId,
  FLAGS,
  longestPause,
  mark,
  type MarkId,
  MARKS,
  mmss,
  newSession,
  parseSession,
  PAUSE_LIMIT,
  pausing,
  type Session,
  type Targets,
  togglePause,
} from "@/lib/scorer";
import { shareOrCopy } from "@/lib/share";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scorer")({
  component: ScorerPage,
  head: () => ({ meta: [{ title: "Practical scorer · Pitchside Emergency Care" }] }),
});

const KEY = "pec-scorer-session";
const TKEY = "pec-scorer-targets";
const SHORT: Record<MarkId, string> = { enter: "IN", call: "CALL", cpr: "CPR", aed: "AED", shock: "⚡", airway: "i-gel", oxygen: "O₂", transfer: "GO" };

function load<T>(key: string, parse: (raw: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key));
  } catch {
    return parse(null);
  }
}
function save(key: string, v: unknown) {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // storage blocked: the run still works while the page is open
  }
}

function ScorerPage() {
  const [s, setS] = useState<Session | null>(null);
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setS(load(KEY, parseSession));
    setTargets(load(TKEY, (raw) => (raw ? { ...DEFAULT_TARGETS, ...(JSON.parse(raw) as Targets) } : DEFAULT_TARGETS)));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) save(KEY, s);
  }, [s, ready]);

  const running = s != null && s.endedAt == null;
  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(iv);
  }, [running]);

  const now = s ? (s.endedAt ?? (nowMs - s.startedAt) / 1000) : 0;
  const update = (fn: (x: Session, at: number) => Session) => setS((x) => (x ? fn(x, (Date.now() - x.startedAt) / 1000) : x));

  const start = () => {
    tap();
    sfx("whistle", 0.45);
    const t = Date.now();
    setNowMs(t);
    setS(newSession(t));
    setNote("");
  };

  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">FOR INSTRUCTORS</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Practical scorer</h1>
            <p className="mt-1 text-sm text-gold-soft">
              Score a team running the cardiac arrest set piece on a manikin. Tap each event as it happens; the timeline is checked
              against the targets, and the debrief is ready the moment you stop.
            </p>
          </div>
        </Panel>

        {!s ? (
          <>
            <TargetsEditor targets={targets} onChange={(t) => {
              setTargets(t);
              save(TKEY, t);
            }} />
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-danger-fill font-display text-lg font-bold tracking-[0.1em] text-white shadow-card active:scale-[0.98]"
            >
              <Play className="size-5" aria-hidden />
              START — PLAYER COLLAPSES
            </button>
            <Note>
              Tap <span className="font-semibold text-heading">Hands off</span> whenever compressions stop and again when they restart —
              the compression fraction and the longest pause come from it. A reload keeps the run going.
            </Note>
          </>
        ) : running ? (
          <Live s={s} now={now} targets={targets} update={update} onEnd={() => {
            tap();
            sfx("whistle", 0.4);
            update((x, at) => end(x, at));
          }} />
        ) : (
          <Debrief s={s} targets={targets} note={note} setNote={setNote} onNew={() => {
            tap();
            setS(null);
          }} />
        )}
      </div>
    </AppShell>
  );
}

function TargetsEditor({ targets, onChange }: { targets: Targets; onChange: (t: Targets) => void }) {
  return (
    <details className="rounded-xl bg-paper px-3.5 shadow-card">
      <summary className="flex min-h-12 cursor-pointer items-center gap-2 font-display text-sm font-semibold tracking-wide text-heading">
        <Settings2 className="size-4 text-gold-ink" aria-hidden />
        Targets (seconds from the collapse)
      </summary>
      <div className="grid grid-cols-2 gap-2 pb-3.5">
        {MARKS.filter((m) => m.id !== "airway" && m.id !== "oxygen" && m.id !== "transfer").map((m) => (
          <label key={m.id} className="flex flex-col gap-1 text-xs text-muted">
            {m.id === "shock" ? "First shock" : m.label}
            <input
              type="number"
              name={`target-${m.id}`}
              inputMode="numeric"
              min={5}
              max={900}
              value={targets[m.id] ?? ""}
              onChange={(e) => onChange({ ...targets, [m.id]: e.target.value ? Number(e.target.value) : undefined })}
              className="min-h-10 rounded-lg border border-line bg-cream px-2.5 font-display text-base font-semibold text-heading"
            />
          </label>
        ))}
        <button type="button" onClick={() => onChange(DEFAULT_TARGETS)} className="col-span-2 min-h-10 rounded-lg border border-line text-xs font-semibold text-heading">
          Reset to this guide's targets
        </button>
      </div>
    </details>
  );
}

function Live({ s, now, targets, update, onEnd }: { s: Session; now: number; targets: Targets; update: (fn: (x: Session, at: number) => Session) => void; onEnd: () => void }) {
  const off = pausing(s);
  const open = s.pauses.find((p) => p.to == null);
  const pauseNow = open ? now - open.from : 0;
  const ccf = compressionFraction(s, now);
  const cprOn = firstAt(s, "cpr") != null;
  return (
    <>
      <Panel>
        <div className="flex flex-col gap-2 px-3.5 py-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-muted">SINCE THE COLLAPSE</p>
              <p className="font-display text-5xl font-bold tabular-nums leading-none text-heading">{mmss(now)}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-muted">HANDS ON</p>
              <p className={cn("font-display text-2xl font-bold tabular-nums leading-none", ccf == null ? "text-muted" : ccf >= CCF_TARGET ? "text-[#1A7F45]" : "text-danger")}>
                {ccf == null ? "—" : `${Math.round(ccf * 100)}%`}
              </p>
            </div>
          </div>
          <Timeline s={s} now={now} targets={targets} />
        </div>
      </Panel>

      <button
        type="button"
        disabled={!cprOn}
        onClick={() => {
          haptic(off ? 15 : [20, 30, 20]);
          tap();
          update((x, at) => togglePause(x, at));
        }}
        className={cn(
          "flex min-h-16 items-center justify-center gap-2.5 rounded-2xl font-display text-lg font-bold tracking-[0.08em] shadow-card transition-colors active:scale-[0.98] disabled:opacity-40",
          off ? (pauseNow >= PAUSE_LIMIT ? "bg-danger-fill text-white" : "bg-[#d4a017] text-[#0b1f3a]") : "bg-navy text-on-navy",
        )}
      >
        <Hand className="size-5" aria-hidden />
        {!cprOn ? "HANDS OFF — after the first compression" : off ? `HANDS OFF ${Math.floor(pauseNow)} s — tap when CPR restarts` : "HANDS OFF"}
      </button>

      <div className="grid grid-cols-2 gap-2">
        {MARKS.map((m) => {
          const at = firstAt(s, m.id);
          const n = count(s, m.id);
          const target = targets[m.id];
          const ok = at != null && target != null ? at <= target : null;
          const doneOnce = at != null && !m.repeat;
          return (
            <button
              key={m.id}
              type="button"
              disabled={doneOnce}
              onClick={() => {
                haptic(12);
                if (m.id === "shock") sfx("shock", 0.35);
                else tap();
                update((x, t) => mark(x, m.id, t));
              }}
              className={cn(
                "relative flex min-h-[4.25rem] flex-col justify-center rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98]",
                doneOnce ? (ok === false ? "border-danger/40 bg-danger/8" : "border-[#1A7F45]/40 bg-[#1A7F45]/10") : "border-line bg-paper shadow-card",
              )}
            >
              <span className="font-display text-sm font-bold leading-tight text-heading">
                {m.id === "shock" ? <Zap className="mr-1 inline size-4 text-gold-ink" aria-hidden /> : null}
                {m.label}
              </span>
              <span className="text-[11px] text-muted">
                {m.who}
                {target != null ? ` · target ${mmss(target)}` : ""}
              </span>
              {at != null ? (
                <span className={cn("mt-0.5 flex items-center gap-1 font-display text-sm font-bold tabular-nums", ok === false ? "text-danger" : "text-[#1A7F45]")}>
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  {mmss(at)}
                  {m.repeat && n > 1 ? ` · ${n} shocks` : ""}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Panel>
        <div className="flex flex-col gap-2 px-3.5 py-3">
          <p className="flex items-center gap-1.5 font-display text-xs font-semibold tracking-[0.14em] text-heading">
            <Flag className="size-3.5 text-danger" aria-hidden />
            FLAG FOR THE DEBRIEF
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FLAGS.map((f) => {
              const n = s.flags.filter((x) => x.id === f.id).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    tap();
                    haptic(10);
                    update((x, t) => flag(x, f.id as FlagId, t));
                  }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-xs font-semibold text-heading active:scale-95"
                >
                  {f.label}
                  {n ? <span className="grid size-5 place-items-center rounded-full bg-danger-fill text-[10px] font-bold text-white">{n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <button
        type="button"
        onClick={onEnd}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-heading font-display text-base font-semibold tracking-wide text-heading active:scale-[0.98]"
      >
        <Square className="size-4" aria-hidden />
        End the run — debrief
      </button>
    </>
  );
}

// a rough width for a 10 px label, enough to keep labels apart (the ⚡ is wider than one letter)
const labelW = (text: string) => Math.max(12, text.length * 6.2);

/**
 * Each label goes on the upper row, or the lower one when the upper is taken, the most important (lowest rank)
 * placed first; with no room on either row it is left out.
 */
function labelRows(items: { left: number; width: number; rank?: number }[]): (0 | 1 | null)[] {
  const taken: [number, number][][] = [[], []];
  const rows: (0 | 1 | null)[] = items.map(() => null);
  const order = items.map((_, i) => i).sort((a, b) => (items[a].rank ?? 0) - (items[b].rank ?? 0) || a - b);
  for (const i of order) {
    const { left, width } = items[i];
    const free = (r: 0 | 1) => taken[r].every(([a, b]) => left + width + 4 <= a || left >= b + 4);
    const row = free(0) ? 0 : free(1) ? 1 : null;
    if (row != null) taken[row].push([left, left + width]);
    rows[i] = row;
  }
  return rows;
}

// when event labels crowd, the times the debrief is about keep theirs
const RANK: Record<MarkId, number> = { cpr: 0, shock: 1, aed: 2, call: 3, enter: 4, airway: 5, oxygen: 6, transfer: 7 };

/** The run so far: target flags, the marks, and the hands-on bar with the pauses cut out. */
function Timeline({ s, now, targets }: { s: Session; now: number; targets: Targets }) {
  // about as wide as the panel on a 360 px phone, so the labels read at ~10 px
  const W = 310;
  const span = Math.max(240, Math.ceil((now + 30) / 60) * 60);
  const X0 = 60; // a gutter on the left for the lane names
  const X1 = 300;
  const xs = (t: number) => X0 + (Math.min(t, span) / span) * (X1 - X0);
  const cpr = firstAt(s, "cpr");
  const pauses = s.pauses.map((p) => [p.from, p.to ?? now] as const);
  const marks = checks(s, targets);
  // target flags, earliest first; a label that would run off the right edge sits on the left of its line
  const flags = (["cpr", "aed", "shock"] as MarkId[])
    .filter((id) => targets[id] != null)
    .map((id) => {
      const x = xs(targets[id] as number);
      const text = `${SHORT[id]} ${mmss(targets[id] as number)}`;
      const width = labelW(text);
      const flip = x + 2 + width > W;
      return { id, x, text, width, flip, left: flip ? x - 2 - width : x + 2 };
    })
    .sort((a, b) => a.x - b.x);
  const flagRow = labelRows(flags);
  // event labels sit under their dots (every time is also in the list below the timeline)
  const events = s.marks.map((m) => {
    const width = labelW(SHORT[m.id]);
    const x = Math.min(W - width / 2 - 1, xs(m.at));
    return { x, width, left: x - width / 2, rank: RANK[m.id] };
  });
  const eventRow = labelRows(events);
  return (
    <svg viewBox={`0 0 ${W} 112`} className="block h-auto w-full" role="img" aria-label={`Timeline of the run: ${marks.filter((m) => m.at != null).map((m) => `${m.label} at ${mmss(m.at as number)}`).join(", ") || "nothing marked yet"}.`}>
      {/* minute grid */}
      {Array.from({ length: span / 60 + 1 }, (_, i) => i).map((m) => (
        <g key={m}>
          <line x1={xs(m * 60)} x2={xs(m * 60)} y1={14} y2={92} className="stroke-line" strokeWidth={1} />
          <text x={xs(m * 60)} y={106} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
            {m}:00
          </text>
        </g>
      ))}
      {/* targets */}
      {flags.map((f) => (
        <line key={f.id} x1={f.x} x2={f.x} y1={12} y2={92} className="stroke-gold" strokeWidth={1.5} />
      ))}
      {flags.map((f, i) =>
        flagRow[i] == null ? null : (
          <text key={f.id} x={f.flip ? f.x - 2 : f.x + 2} y={flagRow[i] ? 22 : 10} textAnchor={f.flip ? "end" : "start"} className="chart-halo fill-gold-ink text-[10px] font-semibold">
            {f.text}
          </text>
        ),
      )}
      {/* marks */}
      <text x={2} y={47.5} className="fill-muted text-[10px] font-semibold tracking-wide">
        EVENTS
      </text>
      {s.marks.map((m, i) => {
        const c = marks.find((x) => x.id === m.id);
        const late = m.id === "shock" ? i === s.marks.findIndex((x) => x.id === "shock") && c?.ok === false : c?.ok === false;
        const row = eventRow[i];
        return (
          <g key={`${m.id}-${i}`}>
            <circle cx={xs(m.at)} cy={44} r={5} className={cn(late ? "fill-danger" : c?.target != null ? "fill-[#1A7F45]" : "fill-heading", "stroke-paper")} strokeWidth={2} />
            {row == null ? null : (
              <text x={events[i].x} y={row ? 71 : 60} textAnchor="middle" className="chart-halo fill-ink text-[10px] font-semibold">
                {SHORT[m.id]}
              </text>
            )}
          </g>
        );
      })}
      {/* hands on the chest */}
      <text x={2} y={85.5} className="fill-muted text-[10px] font-semibold tracking-wide">
        HANDS ON
      </text>
      {cpr != null ? <rect x={xs(cpr)} y={77} width={Math.max(0, xs(now) - xs(cpr))} height={10} rx={3} className="fill-chart-2" /> : null}
      {pauses.map(([a, b], i) => (
        <rect key={i} x={xs(a)} y={77} width={Math.max(1.5, xs(b) - xs(a))} height={10} className={b - a >= PAUSE_LIMIT ? "fill-danger" : "fill-[#d4a017]"} />
      ))}
      {/* now */}
      {s.endedAt == null ? <line x1={xs(now)} x2={xs(now)} y1={12} y2={92} className="stroke-heading" strokeWidth={1.5} /> : null}
    </svg>
  );
}

function Debrief({ s, targets, note, setNote, onNew }: { s: Session; targets: Targets; note: string; setNote: (n: string) => void; onNew: () => void }) {
  const t = s.endedAt ?? 0;
  const ccf = compressionFraction(s, t);
  const longest = longestPause(s, t);
  const rows = checks(s, targets).filter((c) => c.at != null || c.target != null);
  const text = useMemo(() => debriefText(s, targets), [s, targets]);
  return (
    <>
      <Panel>
        <div className="flex flex-col gap-3 px-3.5 py-3.5">
          <SectionLabel>DEBRIEF · RUN TIME {mmss(t)}</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Compression fraction" value={ccf == null ? "—" : `${Math.round(ccf * 100)}%`} ok={ccf == null ? null : ccf >= CCF_TARGET} note={`target ≥ ${Math.round(CCF_TARGET * 100)}%`} />
            <Tile label="Longest pause" value={`${Math.round(longest)} s`} ok={longest < PAUSE_LIMIT} note={`target < ${PAUSE_LIMIT} s`} />
          </div>
          <Timeline s={s} now={t} targets={targets} />
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-ink">{r.label}</span>
                <span className={cn("font-display font-bold tabular-nums", r.ok === false ? "text-danger" : r.ok ? "text-[#1A7F45]" : "text-muted")}>
                  {r.at == null ? "not done" : mmss(r.at)}
                  {r.target != null ? <span className="ml-1 text-xs font-medium text-muted">/ {mmss(r.target)}</span> : null}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink">Shocks</span>
              <span className="font-display font-bold text-heading">{count(s, "shock")}</span>
            </li>
          </ul>
          {s.flags.length ? (
            <div className="rounded-lg border-l-4 border-danger bg-danger/8 px-3 py-2 text-sm leading-snug">
              <p className="font-semibold text-heading">Points to discuss</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {s.flags.map((f, i) => (
                  <li key={i}>
                    <span className="font-display text-xs font-semibold text-muted">{mmss(f.at)} · </span>
                    {FLAGS.find((x) => x.id === f.id)?.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => {
            tap();
            const r = await shareOrCopy({ title: "Set piece debrief", text });
            setNote(r === "copied" ? "Debrief copied — paste it into the team chat." : r === "failed" ? "Sharing is not available here." : "");
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
        >
          <Share2 className="size-4" aria-hidden />
          Share as text
        </button>
        <button
          type="button"
          onClick={async () => {
            tap();
            const r = await shareImage(s, targets);
            setNote(r === "saved" ? "Image saved." : r === "failed" ? "The image could not be made here." : "");
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
        >
          <ImageDown className="size-4" aria-hidden />
          Save as image
        </button>
      </div>
      <p className="min-h-4 text-center text-xs text-muted" aria-live="polite">
        {note}
      </p>
      <button type="button" onClick={onNew} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-heading font-display text-base font-semibold tracking-wide text-heading active:scale-[0.98]">
        <RotateCcw className="size-4" aria-hidden />
        New run
      </button>
    </>
  );
}

function Tile({ label, value, ok, note }: { label: string; value: string; ok: boolean | null; note: string }) {
  return (
    <div className={cn("rounded-xl px-3 py-2.5", ok == null ? "bg-note" : ok ? "bg-[#1A7F45]/12" : "bg-danger/10")}>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {ok ? <ClipboardCheck className="size-3.5 text-[#1A7F45]" aria-hidden /> : null}
        {label}
      </p>
      <p className="mt-0.5 font-display text-2xl font-bold leading-none text-heading">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{note}</p>
    </div>
  );
}

/** Draw the debrief as a picture (1080 × 1350) and share it, or save it where sharing files is not possible. */
async function shareImage(s: Session, targets: Targets): Promise<"shared" | "saved" | "failed"> {
  try {
    const W = 1080;
    const H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");
    if (!x) return "failed";
    const t = s.endedAt ?? 0;
    x.fillStyle = "#fffcf7";
    x.fillRect(0, 0, W, H);
    x.fillStyle = "#0b1f3a";
    x.fillRect(0, 0, W, 200);
    x.fillStyle = "#c9a227";
    x.fillRect(0, 196, W, 8);
    x.fillStyle = "#c9a227";
    x.font = "600 30px 'Barlow Condensed', sans-serif";
    x.fillText("PITCHSIDE EMERGENCY CARE · PRACTICAL DEBRIEF", 60, 78);
    x.fillStyle = "#f7f4ee";
    x.font = "700 56px 'Barlow Condensed', sans-serif";
    x.fillText("Cardiac arrest set piece", 60, 146);
    x.font = "400 28px 'Source Sans 3', sans-serif";
    x.fillStyle = "#d4c9a8";
    x.fillText(`${new Date(s.startedAt).toLocaleString()} · run time ${mmss(t)}`, 60, 182);
    let y = 280;
    const ccf = compressionFraction(s, t);
    const longest = longestPause(s, t);
    const row = (label: string, value: string, ok: boolean | null) => {
      x.fillStyle = "#1b1b1b";
      x.font = "400 36px 'Source Sans 3', sans-serif";
      x.fillText(label, 60, y);
      x.font = "700 44px 'Barlow Condensed', sans-serif";
      x.fillStyle = ok === false ? "#c0392b" : ok ? "#1a7f45" : "#0b1f3a";
      const w = x.measureText(value).width;
      x.fillText(value, W - 60 - w, y);
      x.fillStyle = "#d6d1c4";
      x.fillRect(60, y + 22, W - 120, 2);
      y += 78;
    };
    for (const r of checks(s, targets).filter((c2) => c2.at != null || c2.target != null)) {
      row(r.label, r.at == null ? "not done" : `${mmss(r.at)}${r.target != null ? ` / ${mmss(r.target)}` : ""}`, r.ok);
    }
    row("Shocks", String(count(s, "shock")), null);
    row(`Compression fraction (≥ ${Math.round(CCF_TARGET * 100)}%)`, ccf == null ? "—" : `${Math.round(ccf * 100)}%`, ccf == null ? null : ccf >= CCF_TARGET);
    row(`Longest pause (< ${PAUSE_LIMIT} s)`, `${Math.round(longest)} s`, longest < PAUSE_LIMIT);
    if (s.flags.length) {
      y += 10;
      x.fillStyle = "#c0392b";
      x.font = "700 34px 'Barlow Condensed', sans-serif";
      x.fillText("POINTS TO DISCUSS", 60, y);
      y += 52;
      x.fillStyle = "#1b1b1b";
      x.font = "400 32px 'Source Sans 3', sans-serif";
      for (const f of s.flags.slice(0, 6)) {
        x.fillText(`${mmss(f.at)} · ${FLAGS.find((k) => k.id === f.id)?.label ?? f.id}`, 60, y);
        y += 46;
      }
    }
    x.fillStyle = "#5b6470";
    x.font = "400 24px 'Source Sans 3', sans-serif";
    x.fillText("Study aid — for training only.", 60, H - 50);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!blob) return "failed";
    const file = new File([blob], "set-piece-debrief.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Set piece debrief" });
        return "shared";
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return "shared"; // closed the share sheet
        // share sheet refused here: save the file instead
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "set-piece-debrief.png";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "saved";
  } catch (e) {
    return (e as Error)?.name === "AbortError" ? "shared" : "failed";
  }
}
