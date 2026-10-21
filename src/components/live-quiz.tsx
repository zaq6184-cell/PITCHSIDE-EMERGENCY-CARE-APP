import { Check, ChevronRight, Crown, Loader2, Play, Trophy, Users, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { joinRoom } from "trystero";
import { Confetti } from "@/components/confetti";
import { QrCode } from "@/components/qr-code";
import { Panel, SectionLabel } from "@/components/workshop";
import {
  APP_ID,
  type Colour,
  counts,
  type HostMsg,
  joinUrl,
  leaderboard,
  type Player,
  type PlayerMsg,
  points,
  QUESTION_SECONDS,
  ROUND,
  roomCode,
  roomPassword,
  uniqueName,
} from "@/lib/live";
import { type Question, questionPool, shuffle } from "@/lib/quiz-questions";
import { siteUrl } from "@/lib/share";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { roleTag, workshop } from "@/lib/workshop";

type Room = ReturnType<typeof joinRoom>;

const ROLE = Object.fromEntries(workshop.roles.map((r) => [r.id, r])) as Record<Colour, (typeof workshop.roles)[number]>;
const ORDER: Colour[] = ["black", "orange", "red", "blue", "white", "green"];

// ------------------------------------------------------------------ the instructor's screen
type Phase = "lobby" | "question" | "reveal" | "end";

/**
 * The instructor's screen: a QR code to join, then each question with a countdown; the answers come in from
 * the phones, the reveal shows how the room split, and the leaderboard closes the round.
 */
export function LiveHost() {
  const [code] = useState(() => roomCode());
  const [phase, setPhase] = useState<Phase>("lobby");
  const [list, setList] = useState<Player[]>([]);
  const [questions] = useState<Question[]>(() => shuffle(questionPool()).slice(0, ROUND));
  const [n, setN] = useState(0);
  const [left, setLeft] = useState(QUESTION_SECONDS);
  const [burst, setBurst] = useState(0);
  const players = useRef(new Map<string, Player>());
  const live = useRef({ phase: "lobby" as Phase, n: 0, startedAt: 0 });
  const room = useRef<Room | null>(null);
  const send = useRef<((m: HostMsg, to?: string) => void) | null>(null);
  const url = useMemo(() => (typeof window === "undefined" ? "" : joinUrl(siteUrl(), code)), [code]);
  const sync = () => setList([...players.current.values()]);

  const question = (i: number) => questions[i];
  const reveal = () => {
    const i = live.current.n;
    if (live.current.phase !== "question") return;
    live.current.phase = "reveal";
    setPhase("reveal");
    sfx("whistle", 0.35);
    const board = leaderboard([...players.current.values()]);
    const q = question(i);
    board.forEach((p, rank) => {
      const a = p.answers[i];
      send.current?.({ t: "result", n: i, answer: q.answer, correct: a?.choice === q.answer, points: a?.points ?? 0, score: p.score, rank: rank + 1, players: board.length }, p.id);
    });
  };
  const ask = (i: number) => {
    const q = question(i);
    live.current = { phase: "question", n: i, startedAt: Date.now() };
    setN(i);
    setPhase("question");
    setLeft(QUESTION_SECONDS);
    send.current?.({ t: "q", n: i, total: questions.length, prompt: q.prompt, text: q.text, secs: QUESTION_SECONDS });
  };
  const finish = () => {
    live.current.phase = "end";
    setPhase("end");
    setBurst((b) => b + 1);
    sfx("cheer", 0.45);
    const board = leaderboard([...players.current.values()]);
    const podium = board.slice(0, 3).map((p) => ({ name: p.name, score: p.score }));
    board.forEach((p, rank) => send.current?.({ t: "end", score: p.score, rank: rank + 1, players: board.length, podium }, p.id));
  };

  useEffect(() => {
    const r = joinRoom({ appId: APP_ID, password: roomPassword(code) }, code);
    room.current = r;
    const host = r.makeAction<HostMsg>("host");
    const player = r.makeAction<PlayerMsg>("player");
    send.current = (m, to) => void host.send(m, to ? { target: to } : undefined).catch(() => {});
    player.onMessage = (msg, { peerId }) => {
      const cur = live.current;
      if (msg.t === "hello") {
        const taken = [...players.current.values()].filter((p) => p.id !== peerId).map((p) => p.name);
        const existing = players.current.get(peerId);
        const p: Player = existing ?? { id: peerId, name: uniqueName(msg.name, taken, players.current.size + 1), score: 0, answers: {} };
        players.current.set(peerId, p);
        sync();
        tap();
        send.current?.({ t: "welcome", name: p.name, players: players.current.size }, peerId);
        if (cur.phase === "question") {
          const q = question(cur.n);
          const secs = Math.max(1, Math.round(QUESTION_SECONDS - (Date.now() - cur.startedAt) / 1000));
          send.current?.({ t: "q", n: cur.n, total: questions.length, prompt: q.prompt, text: q.text, secs }, peerId);
        }
      } else if (msg.t === "answer") {
        const p = players.current.get(peerId);
        if (!p || cur.phase !== "question" || msg.n !== cur.n || p.answers[cur.n]) return;
        const ms = Date.now() - cur.startedAt;
        const pts = points(msg.choice === question(cur.n).answer, ms);
        p.answers[cur.n] = { choice: msg.choice, ms, points: pts };
        p.score += pts;
        sync();
        // everyone has answered: reveal straight away
        if ([...players.current.values()].every((x) => x.answers[cur.n])) window.setTimeout(reveal, 400);
      }
    };
    r.onPeerLeave = (id) => {
      players.current.delete(id);
      sync();
    };
    return () => {
      send.current = null;
      void r.leave();
    };
    // the room lives as long as this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // the question clock
  useEffect(() => {
    if (phase !== "question") return;
    const iv = window.setInterval(() => {
      const l = QUESTION_SECONDS - (Date.now() - live.current.startedAt) / 1000;
      setLeft(Math.max(0, l));
      if (l <= 0) {
        window.clearInterval(iv);
        reveal();
      }
    }, 200);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, n]);

  const answered = list.filter((p) => p.answers[n]).length;
  const q = questions[n];
  const board = leaderboard(list);

  if (phase === "lobby")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
          <SectionLabel>SCAN TO JOIN</SectionLabel>
          {url ? <QrCode text={url} className="w-full max-w-[18rem] rounded-xl shadow-card" /> : <div className="aspect-square w-full max-w-[18rem] rounded-xl bg-note" />}
          <p className="font-display text-4xl font-bold tracking-[0.3em] text-heading">{code}</p>
          <p className="text-xs leading-snug text-muted">
            Or open <span className="font-semibold text-heading">Live class quiz</span> in the app and type the code.
          </p>
          <div className="flex min-h-12 flex-wrap justify-center gap-1.5" aria-live="polite">
            {list.length ? (
              list.map((p) => (
                <span key={p.id} className="caption-in rounded-full bg-note px-3 py-1.5 text-sm font-semibold text-heading">
                  {p.name}
                </span>
              ))
            ) : (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Waiting for players…
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!list.length}
            onClick={() => {
              tap();
              sfx("whistle", 0.4);
              ask(0);
            }}
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-navy font-display text-lg font-bold tracking-wide text-gold shadow-card active:scale-[0.98] disabled:opacity-40"
          >
            <Play className="size-5" aria-hidden />
            Start · {list.length} {list.length === 1 ? "player" : "players"}
          </button>
        </div>
      </Panel>
    );

  if (phase === "end")
    return (
      <Panel>
        <div className="relative flex flex-col items-center gap-4 px-4 py-6">
          <Confetti key={burst} count={60} spread={1.6} />
          <SectionLabel>FINAL LEADERBOARD</SectionLabel>
          <div className="flex w-full max-w-md items-end justify-center gap-2">
            {[1, 0, 2].map((i) => {
              const p = board[i];
              if (!p) return <div key={i} className="flex-1" />;
              const h = i === 0 ? "h-36" : i === 1 ? "h-28" : "h-20";
              return (
                <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                  {i === 0 ? <Crown className="size-6 text-gold" aria-hidden /> : null}
                  <p className="max-w-full truncate font-display text-base font-bold text-heading">{p.name}</p>
                  <p className="text-xs tabular-nums text-muted">{p.score}</p>
                  <div className={cn("w-full rounded-t-xl bg-gradient-to-b from-gold to-[#a8841a] text-center font-display text-2xl font-bold text-on-gold", h)}>{i + 1}</div>
                </div>
              );
            })}
          </div>
          <ol className="flex w-full max-w-md flex-col divide-y divide-line">
            {board.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="mr-2 font-display font-bold text-muted">{i + 1}</span>
                  {p.name}
                </span>
                <span className="font-display font-bold tabular-nums text-heading">{p.score}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>
    );

  const c = counts(list, n);
  const max = Math.max(1, ...Object.values(c));
  return (
    <Panel>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
            QUESTION {n + 1} OF {questions.length}
          </p>
          <p className="flex items-center gap-1.5 font-display text-xs font-semibold tracking-[0.14em] text-heading">
            <Users className="size-3.5" aria-hidden />
            {answered} / {list.length} ANSWERED
          </p>
        </div>
        <div className="rounded-xl bg-note px-4 py-4">
          <p className="font-display text-sm font-semibold tracking-[0.14em] text-heading">{q.prompt.toUpperCase()}</p>
          <p className="mt-1 text-xl font-semibold leading-snug text-ink sm:text-2xl">{q.text}</p>
        </div>
        {phase === "question" ? (
          <>
            <div className="h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className={cn("h-full rounded-full", left < 5 ? "bg-danger" : "bg-gold")} style={{ width: `${(left / QUESTION_SECONDS) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ORDER.map((id) => (
                <span
                  key={id}
                  className="flex min-h-12 items-center justify-center rounded-xl font-display text-base font-bold tracking-wide"
                  style={{ backgroundColor: ROLE[id].color, color: ROLE[id].text, boxShadow: id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
                >
                  {roleTag(ROLE[id])}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl font-bold tabular-nums text-heading">{Math.ceil(left)} s</p>
              <button
                type="button"
                onClick={() => {
                  tap();
                  reveal();
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
              >
                Reveal now
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-6 items-end gap-2" style={{ height: "11rem" }} role="img" aria-label={`Answers: ${ORDER.map((id) => `${roleTag(ROLE[id])} ${c[id]}`).join(", ")}. Right answer: ${roleTag(ROLE[q.answer])}.`}>
              {ORDER.map((id) => {
                const right = id === q.answer;
                return (
                  <div key={id} className="flex h-full flex-col items-center justify-end gap-1">
                    <span className="font-display text-sm font-bold tabular-nums text-heading">{c[id]}</span>
                    <div
                      className={cn("w-full max-w-12 rounded-t-[4px] transition-[height] duration-700 ease-out", !right && "opacity-35")}
                      style={{ height: `${(c[id] / max) * 70 + 4}%`, backgroundColor: ROLE[id].color, boxShadow: id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.3)" : undefined }}
                    />
                    <span className={cn("grid size-6 place-items-center rounded-full", right ? "bg-[#1A7F45] text-white" : "text-transparent")}>
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm">
              Right answer: <span className="font-display text-base font-bold text-heading">{roleTag(ROLE[q.answer])}</span> · {ROLE[q.answer].role}
            </p>
            {board.length ? (
              <ol className="flex flex-col gap-1">
                {board.slice(0, 3).map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-note px-3 py-1.5 text-sm">
                    <span>
                      <span className="mr-2 font-display font-bold text-gold-ink">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="font-display font-bold tabular-nums">{p.score}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            <button
              type="button"
              onClick={() => {
                tap();
                if (n + 1 >= questions.length) finish();
                else ask(n + 1);
              }}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-navy font-display text-lg font-bold tracking-wide text-gold active:scale-[0.98]"
            >
              {n + 1 >= questions.length ? "Final leaderboard" : "Next question"}
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------ a trainee's phone
type PlayerView =
  | { v: "join" }
  | { v: "connecting" }
  | { v: "waiting"; name: string }
  | { v: "question"; q: Extract<HostMsg, { t: "q" }>; until: number; picked: Colour | null }
  | { v: "result"; r: Extract<HostMsg, { t: "result" }> }
  | { v: "end"; e: Extract<HostMsg, { t: "end" }> }
  | { v: "gone" };

/** A trainee's phone: join with a name, tap a colour for each question, see the result and the final rank. */
export function LivePlayer({ code }: { code: string }) {
  const [view, setView] = useState<PlayerView>({ v: "join" });
  const [name, setName] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [slow, setSlow] = useState(false);
  const [burst, setBurst] = useState(0);
  const room = useRef<Room | null>(null);
  const answer = useRef<((m: PlayerMsg) => void) | null>(null);

  useEffect(() => () => void room.current?.leave(), []);
  useEffect(() => {
    if (view.v !== "question") return;
    const iv = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(iv);
  }, [view.v]);
  useEffect(() => {
    if (view.v !== "connecting") return;
    setSlow(false);
    const t = window.setTimeout(() => setSlow(true), 15_000);
    return () => window.clearTimeout(t);
  }, [view.v]);

  const join = () => {
    tap();
    setView({ v: "connecting" });
    // passive: this phone connects to the instructor's screen only, never to the other phones
    const r = joinRoom({ appId: APP_ID, password: roomPassword(code), passive: true }, code);
    room.current = r;
    const host = r.makeAction<HostMsg>("host");
    const player = r.makeAction<PlayerMsg>("player");
    answer.current = (m) => void player.send(m).catch(() => {});
    r.onPeerJoin = () => answer.current?.({ t: "hello", name });
    r.onPeerLeave = () => setView({ v: "gone" });
    host.onMessage = (m) => {
      if (m.t === "welcome") setView({ v: "waiting", name: m.name });
      else if (m.t === "q") {
        sfx("whoosh", 0.3);
        haptic(20);
        setNow(Date.now());
        setView({ v: "question", q: m, until: Date.now() + m.secs * 1000, picked: null });
      } else if (m.t === "result") {
        if (m.correct) {
          sfx("correct");
          setBurst((b) => b + 1);
          haptic(25);
        } else {
          sfx("wrong", 0.4);
          haptic([40, 50, 40]);
        }
        setView({ v: "result", r: m });
      } else if (m.t === "end") {
        sfx("cheer", 0.45);
        setBurst((b) => b + 1);
        setView({ v: "end", e: m });
      }
    };
  };

  const pick = (c: Colour) => {
    if (view.v !== "question" || view.picked) return;
    tap();
    haptic(15);
    answer.current?.({ t: "answer", n: view.q.n, choice: c });
    setView({ ...view, picked: c });
  };

  if (view.v === "join")
    return (
      <Panel>
        <form
          className="flex flex-col gap-3 px-4 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <SectionLabel>JOIN · ROOM {code}</SectionLabel>
          <label className="flex flex-col gap-1 text-sm font-medium text-heading">
            Your name on the leaderboard
            <input
              name="nickname"
              autoComplete="nickname"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name or a nickname"
              className="min-h-12 rounded-xl border border-line bg-cream px-3 text-base text-ink outline-none focus:border-gold"
            />
          </label>
          <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-navy font-display text-lg font-bold tracking-wide text-gold active:scale-[0.98]">
            Join the quiz
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <p className="text-xs leading-snug text-muted">Your name and answers go only to the instructor's screen for this quiz. Nothing is stored.</p>
        </form>
      </Panel>
    );

  if (view.v === "connecting")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <Loader2 className="size-8 animate-spin text-gold-ink" aria-hidden />
          <p className="font-display text-lg font-bold text-heading">Finding the instructor's screen…</p>
          {slow ? (
            <p className="max-w-xs text-sm leading-snug text-muted">
              Still looking. Check the room code on the screen; some networks block direct connections — try mobile data instead of the
              Wi-Fi.
            </p>
          ) : null}
        </div>
      </Panel>
    );

  if (view.v === "waiting")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <Wifi className="size-8 text-[#1A7F45]" aria-hidden />
          <p className="font-display text-xl font-bold text-heading">You're in, {view.name}</p>
          <p className="text-sm text-muted">Watch the screen — the first question is coming.</p>
        </div>
      </Panel>
    );

  if (view.v === "question") {
    const left = Math.max(0, (view.until - now) / 1000);
    return (
      <Panel>
        <div className="flex flex-col gap-3 px-3.5 py-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
              QUESTION {view.q.n + 1} OF {view.q.total}
            </p>
            <p className="font-display text-sm font-bold tabular-nums text-heading">{Math.ceil(left)} s</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className={cn("h-full rounded-full", left < 5 ? "bg-danger" : "bg-gold")} style={{ width: `${(left / view.q.secs) * 100}%` }} />
          </div>
          <div className="rounded-xl bg-note px-3.5 py-3">
            <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-heading">{view.q.prompt.toUpperCase()}</p>
            <p className="mt-1 text-[15px] font-medium leading-snug text-ink">{view.q.text}</p>
          </div>
          {view.picked ? (
            <p className="caption-in flex items-center justify-center gap-2 rounded-xl bg-note px-3 py-4 font-display text-lg font-bold text-heading">
              <Check className="size-5 text-[#1A7F45]" strokeWidth={3} aria-hidden />
              Answer sent: {roleTag(ROLE[view.picked])}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={left <= 0}
                  onClick={() => pick(id)}
                  className="flex min-h-20 flex-col items-center justify-center rounded-2xl font-display text-xl font-bold tracking-[0.08em] shadow-card transition-transform active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: ROLE[id].color, color: ROLE[id].text, boxShadow: id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined }}
                >
                  {roleTag(ROLE[id])}
                  <span className="text-xs font-medium tracking-normal">{ROLE[id].role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Panel>
    );
  }

  if (view.v === "result")
    return (
      <Panel>
        <div className="relative flex flex-col items-center gap-2 px-4 py-7 text-center">
          {view.r.correct ? <Confetti key={burst} count={36} /> : null}
          <span className={cn("grid size-16 place-items-center rounded-full", view.r.correct ? "bg-[#1A7F45] text-white" : "bg-danger-fill text-white")}>
            {view.r.correct ? <Check className="size-9" strokeWidth={3} aria-hidden /> : <X className="size-9" strokeWidth={3} aria-hidden />}
          </span>
          <p className="font-display text-2xl font-bold text-heading">{view.r.correct ? `+${view.r.points}` : "Not this time"}</p>
          <p className="text-sm text-muted">
            It was <span className="font-semibold text-heading">{roleTag(ROLE[view.r.answer])}</span> · {ROLE[view.r.answer].role}
          </p>
          <p className="mt-1 font-display text-sm font-semibold tracking-[0.12em] text-heading">
            {view.r.score} POINTS · #{view.r.rank} OF {view.r.players}
          </p>
        </div>
      </Panel>
    );

  if (view.v === "end")
    return (
      <Panel>
        <div className="relative flex flex-col items-center gap-2 px-4 py-7 text-center">
          <Confetti key={burst} count={50} spread={1.5} />
          <Trophy className="size-12 text-gold-ink" aria-hidden />
          <p className="font-display text-3xl font-bold text-heading">
            #{view.e.rank} <span className="text-lg text-muted">of {view.e.players}</span>
          </p>
          <p className="font-display text-base font-semibold text-heading">{view.e.score} points</p>
          <ol className="mt-2 flex w-full max-w-xs flex-col gap-1">
            {view.e.podium.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex items-center justify-between rounded-lg bg-note px-3 py-1.5 text-sm">
                <span>
                  <span className="mr-2 font-display font-bold text-gold-ink">{i + 1}</span>
                  {p.name}
                </span>
                <span className="font-display font-bold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>
    );

  return (
    <Panel>
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <WifiOff className="size-8 text-muted" aria-hidden />
        <p className="font-display text-lg font-bold text-heading">The quiz has ended</p>
        <p className="text-sm text-muted">The instructor's screen has left the room.</p>
      </div>
    </Panel>
  );
}
