import { Loader2, Megaphone, RefreshCw, Smartphone, Volume2, VolumeX, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { joinRoom } from "trystero";
import { PositionDiagram } from "@/components/position-diagram";
import { QrCode } from "@/components/qr-code";
import { Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { dayKey } from "@/lib/day";
import { record, step as did } from "@/lib/progress";
import { siteUrl } from "@/lib/share";
import { haptic, say, stopVoice, tap } from "@/lib/sound";
import { spineSteps } from "@/lib/spine-drill";
import { BUZZ, canClaim, linesFor, ORDER, type PhoneMsg, roomCode, type ScreenMsg, takenRoles, TEAM_APP_ID, type TeamDrill, teamJoinUrl, teamPassword } from "@/lib/team";
import { lastStep, listen, setPhones } from "@/lib/team-bus";
import { cn } from "@/lib/utils";
import { callouts } from "@/lib/voice";
import { VOICE_SECONDS } from "@/lib/voice-durations";
import { voiceFile } from "@/lib/voice-files";
import { useWakeLock } from "@/lib/wake-lock";
import { type RoleId, roleTag, type Step, workshop } from "@/lib/workshop";

type Room = ReturnType<typeof joinRoom>;

const ROLE = Object.fromEntries(workshop.roles.map((r) => [r.id, r])) as Record<RoleId, (typeof workshop.roles)[number]>;
const chip = (id: RoleId) => ({ backgroundColor: ROLE[id].color, color: ROLE[id].text, boxShadow: id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined });

// ------------------------------------------------------------------ the drill screen
/**
 * On the drill screen, under the 3D drill: a QR code for the phones, the colours that have joined, and the drill passed
 * on to them as it plays — the step, and each line as it is said. The colours with a phone say their own lines; this
 * screen keeps the others' voices, the AED and the siren.
 */
export function TeamHost({ onEnd }: { onEnd: () => void }) {
  const [code] = useState(() => roomCode());
  const [taken, setTaken] = useState<RoleId[]>([]);
  const [phones, setPhoneCount] = useState(0);
  const roster = useRef(new Map<string, RoleId | null>());
  const send = useRef<((m: ScreenMsg, to?: string) => void) | null>(null);
  const url = useMemo(() => (typeof window === "undefined" ? "" : teamJoinUrl(siteUrl(), code)), [code]);

  useEffect(() => {
    const r = joinRoom({ appId: TEAM_APP_ID, password: teamPassword(code) }, code);
    const screen = r.makeAction<ScreenMsg>("screen");
    const phone = r.makeAction<PhoneMsg>("phone");
    send.current = (m, to) => void screen.send(m, to ? { target: to } : undefined).catch(() => {});
    const sync = () => {
      const t = takenRoles(roster.current);
      setTaken(t);
      setPhoneCount(roster.current.size);
      setPhones(t);
      send.current?.({ t: "roster", taken: t });
    };
    phone.onMessage = (msg, { peerId }) => {
      if (msg.t === "hello") {
        if (!roster.current.has(peerId)) roster.current.set(peerId, null);
        sync();
        const now = lastStep();
        if (now) send.current?.(now, peerId);
      } else if (msg.t === "claim") {
        if (!canClaim(roster.current, peerId, msg.role)) {
          send.current?.({ t: "taken", role: msg.role }, peerId);
          return;
        }
        roster.current.set(peerId, msg.role);
        tap();
        send.current?.({ t: "claimed", role: msg.role }, peerId);
        sync();
      } else if (msg.t === "release") {
        roster.current.set(peerId, null);
        sync();
      }
    };
    r.onPeerLeave = (id) => {
      roster.current.delete(id);
      sync();
    };
    const stop = listen((e) => send.current?.(e));
    return () => {
      stop();
      send.current?.({ t: "end" });
      send.current = null;
      setPhones([]);
      void r.leave();
    };
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-3 px-3.5 py-4 text-center">
      <SectionLabel>SCAN TO JOIN THE TEAM DRILL</SectionLabel>
      {url ? <QrCode text={url} className="w-full max-w-[15rem] rounded-xl shadow-card" /> : <div className="aspect-square w-full max-w-[15rem] rounded-xl bg-note" />}
      <p translate="no" className="font-display text-3xl font-bold tracking-[0.3em] text-heading">{code}</p>
      <p className="max-w-sm text-xs leading-snug text-muted">
        Or open <span className="font-semibold text-heading">Team drill</span> in the app on each phone and type the code.
      </p>
      <div className="grid w-full max-w-sm grid-cols-3 gap-1.5" aria-live="polite">
        {ORDER.map((id) => {
          const on = taken.includes(id);
          return (
            <span
              key={id}
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl font-display text-sm font-bold tracking-wide"
              // an open colour is an outline; a colour with a phone is filled in
              style={on ? chip(id) : { boxShadow: `inset 0 0 0 2px ${id === "white" ? "#9aa3ad" : ROLE[id].color}`, color: "var(--color-heading)" }}
            >
              {on ? <Smartphone className="size-3.5" aria-hidden /> : null}
              {roleTag(ROLE[id])}
              <span className="sr-only">{on ? "has a phone" : "no phone yet"}</span>
            </span>
          );
        })}
      </div>
      <p className="text-sm leading-snug text-heading">
        {phones === 1 ? "1 phone connected" : `${phones} phones connected`} · {taken.length === 1 ? "1 colour taken" : `${taken.length} colours taken`}
      </p>
      <p className="max-w-sm text-xs leading-snug text-muted">
        Play the drill above. Each phone shows its colour's part, buzzes when its line is due and says it; this screen keeps the
        other voices, the AED and the siren.
      </p>
      <button
        type="button"
        onClick={() => {
          tap();
          onEnd();
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-paper px-4 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
      >
        <X className="size-4" aria-hidden />
        End the team drill
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ a trainee's phone
type View = { v: "ready" } | { v: "connecting" } | { v: "pick" } | { v: "in"; role: RoleId } | { v: "gone" };

const STEPS: Record<TeamDrill, readonly Step[]> = { arrest: workshop.steps, spine: spineSteps };
const DRILL_NAME: Record<TeamDrill, string> = { arrest: "Cardiac arrest drill", spine: "Neck injury drill" };
const SOUNDS: Record<string, string> = { shock: "The AED delivers the shock", siren: "The ambulance leaves" };
const lineMs = (id: string) => Math.max(2300, Math.round((VOICE_SECONDS[voiceFile(id)] ?? 0) * 1000));

/**
 * A trainee's phone: take a colour, then follow the drill from the screen — the step, this colour's part in it, a buzz
 * and the line to say when it is due (said aloud by the phone too, unless switched off), and what the others say.
 */
export function TeamPhone({ code, onJoin }: { code: string; onJoin?: () => void }) {
  const [view, setView] = useState<View>({ v: "ready" });
  const [taken, setTaken] = useState<RoleId[]>([]);
  const [now, setNow] = useState<{ drill: TeamDrill; step: number } | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const [other, setOther] = useState<{ id: string; role?: RoleId; n: number } | null>(null);
  const [aloud, setAloud] = useState(true);
  const [notice, setNotice] = useState("");
  const [slow, setSlow] = useState(false);
  const room = useRef<Room | null>(null);
  const tell = useRef<((m: PhoneMsg) => void) | null>(null);
  const role = useRef<RoleId | null>(null);
  const loud = useRef(aloud);
  useWakeLock(view.v === "in");
  useEffect(() => {
    loud.current = aloud;
    if (!aloud) stopVoice();
  }, [aloud]);
  useEffect(
    () => () => {
      stopVoice();
      void room.current?.leave();
    },
    [],
  );
  useEffect(() => {
    if (view.v !== "connecting") return;
    setSlow(false);
    const t = window.setTimeout(() => setSlow(true), 15_000);
    return () => window.clearTimeout(t);
  }, [view.v]);
  // the line to say stays up while it is said, and a moment after
  useEffect(() => {
    if (!mine) return;
    const t = window.setTimeout(() => setMine(null), lineMs(mine) + 1500);
    return () => window.clearTimeout(t);
  }, [mine]);
  useEffect(() => {
    if (!other) return;
    const t = window.setTimeout(() => setOther((o) => (o?.n === other.n ? null : o)), 3500);
    return () => window.clearTimeout(t);
  }, [other]);

  const join = () => {
    tap();
    onJoin?.();
    setView({ v: "connecting" });
    // passive: this phone connects to the drill screen only, never to the other phones
    const r = joinRoom({ appId: TEAM_APP_ID, password: teamPassword(code), passive: true }, code);
    room.current = r;
    const screen = r.makeAction<ScreenMsg>("screen");
    const phone = r.makeAction<PhoneMsg>("phone");
    tell.current = (m) => void phone.send(m).catch(() => {});
    r.onPeerJoin = () => {
      tell.current?.({ t: "hello" });
      setView((v) => (v.v === "connecting" ? { v: "pick" } : v));
    };
    r.onPeerLeave = () => {
      stopVoice();
      setView({ v: "gone" });
    };
    let n = 0;
    screen.onMessage = (m) => {
      if (m.t === "roster") setTaken(m.taken);
      else if (m.t === "claimed") {
        role.current = m.role;
        setNotice("");
        haptic(40);
        setView({ v: "in", role: m.role });
      } else if (m.t === "taken") setNotice("That colour has just been taken. Pick another.");
      else if (m.t === "step") {
        setNow({ drill: m.drill, step: m.step });
        setMine(null);
        if (role.current && m.step > 0) record(did.team, { d: dayKey(new Date()), drill: m.drill, role: role.current });
      } else if (m.t === "say") {
        if (m.role === role.current) {
          setMine(m.id);
          haptic(BUZZ);
          if (loud.current) void say(m.id, true);
        } else setOther({ id: m.id, role: m.role, n: ++n });
      } else if (m.t === "sfx") setOther({ id: `sfx:${m.name}`, n: ++n });
      else if (m.t === "end") {
        stopVoice();
        setView({ v: "gone" });
      }
    };
  };

  const claim = (id: RoleId) => {
    tap();
    setNotice("");
    tell.current?.({ t: "claim", role: id });
  };

  if (view.v === "ready")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <SectionLabel>
            TEAM DRILL · ROOM <span translate="no">{code}</span>
          </SectionLabel>
          <p className="max-w-xs text-sm leading-snug text-muted">
            Join, take your colour, and keep the phone with you: it buzzes and shows your line when it is your turn to speak.
          </p>
          <button
            type="button"
            onClick={join}
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-navy font-display text-lg font-bold tracking-wide text-gold active:scale-[0.98]"
          >
            <Smartphone className="size-5" aria-hidden />
            Join the team drill
          </button>
          <p className="max-w-xs text-xs leading-snug text-muted">Only your colour goes to the drill screen, for this drill. Nothing is stored there.</p>
        </div>
      </Panel>
    );

  if (view.v === "connecting")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <Loader2 className="size-8 animate-spin text-gold-ink" aria-hidden />
          <p className="font-display text-lg font-bold text-heading">Finding the drill screen…</p>
          {slow ? (
            <p className="max-w-xs text-sm leading-snug text-muted">
              Still looking. Check the room code on the screen; some networks block direct connections — try mobile data instead of the
              Wi-Fi.
            </p>
          ) : null}
        </div>
      </Panel>
    );

  if (view.v === "gone")
    return (
      <Panel>
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <WifiOff className="size-8 text-muted" aria-hidden />
          <p className="font-display text-lg font-bold text-heading">The team drill has ended</p>
          <p className="text-sm text-muted">The drill screen has left the room.</p>
        </div>
      </Panel>
    );

  if (view.v === "pick")
    return (
      <Panel>
        <div className="flex flex-col gap-3 px-3.5 py-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-heading">
            <Wifi className="size-4 text-[#1A7F45]" aria-hidden />
            Connected · pick your colour
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ORDER.map((id) => {
              const gone = taken.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={gone}
                  onClick={() => claim(id)}
                  className="flex min-h-20 flex-col items-center justify-center rounded-2xl font-display text-xl font-bold tracking-[0.08em] shadow-card transition-transform active:scale-95 disabled:opacity-30"
                  style={chip(id)}
                >
                  {roleTag(ROLE[id])}
                  <span className="text-xs font-medium tracking-normal">{gone ? "Taken" : ROLE[id].role}</span>
                </button>
              );
            })}
          </div>
          {notice ? (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-ink" role="status">
              {notice}
            </p>
          ) : null}
        </div>
      </Panel>
    );

  const r = ROLE[view.role];
  const step = now ? STEPS[now.drill].find((s) => s.n === now.step) : undefined;
  const on = step ? step.who.includes(view.role) : false;
  const part = step ? linesFor(step.lines, r.name) : [];
  const said = mine ? callouts[mine] : undefined;
  const heard = other?.id.startsWith("sfx:") ? null : other ? callouts[other.id] : undefined;
  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <div className="flex items-center gap-3 px-3.5 py-3" style={chip(view.role)}>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-2xl font-bold leading-none tracking-[0.1em]">{roleTag(r)}</span>
            <span className="mt-1 block text-xs font-medium">{r.role}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              tap();
              setAloud((a) => !a);
            }}
            aria-pressed={aloud}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-3 font-display text-xs font-semibold tracking-wide active:scale-95"
          >
            {aloud ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
            {aloud ? "Phone says my lines" : "I say my lines"}
          </button>
        </div>
        <div className="flex flex-col gap-2 px-3.5 py-3" aria-live="polite">
          {step && now ? (
            <>
              <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-muted">{DRILL_NAME[now.drill].toUpperCase()}</p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-base font-bold tracking-wide text-heading">
                  STEP {step.n} · {step.title.toUpperCase()}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 font-display text-[11px] font-bold tracking-[0.12em]", on ? "bg-[#1A7F45] text-white" : "bg-note text-muted")}>
                  {on ? "YOU'RE ON" : "STAND BY"}
                </span>
              </p>
              {part.length ? (
                <ul className="flex flex-col gap-1">
                  {part.map((l) => (
                    <li key={l} className="text-sm leading-snug text-ink">
                      {l}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-snug text-muted">{on ? step.lines[0] : "Nothing for you in this step: stay in place and watch the team."}</p>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Waiting for the drill to start on the screen…
            </p>
          )}
        </div>
      </Panel>
      {said ? (
        <div key={mine} className="caption-in rounded-2xl border-4 border-gold bg-navy px-4 py-4 text-on-navy shadow-card" role="alert">
          <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[0.16em] text-gold">
            <Megaphone className="size-4" aria-hidden />
            SAY IT NOW
          </p>
          <p className="mt-1.5 text-xl font-semibold leading-snug">“{said.text}”</p>
        </div>
      ) : null}
      {other ? (
        <div key={other.n} className="caption-in flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 shadow-card">
          {heard ? (
            <>
              <RoleChip id={heard.role} />
              <p className="min-w-0 text-sm italic leading-snug text-ink">“{heard.text}”</p>
            </>
          ) : (
            <p className="text-sm font-semibold leading-snug text-heading">{SOUNDS[other.id.slice(4)] ?? ""}</p>
          )}
        </div>
      ) : null}
      <Panel>
        <div className="px-3.5 pt-3">
          <SectionLabel>WHERE YOU STAND</SectionLabel>
          <p className="mt-1.5 text-sm leading-snug">{r.stand}</p>
        </div>
        <PositionDiagram highlight={view.role} />
      </Panel>
      <button
        type="button"
        onClick={() => {
          tap();
          role.current = null;
          tell.current?.({ t: "release" });
          stopVoice();
          setMine(null);
          setView({ v: "pick" });
        }}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 self-center rounded-xl border border-line bg-paper px-4 font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
      >
        <RefreshCw className="size-4" aria-hidden />
        Change colour
      </button>
    </div>
  );
}
