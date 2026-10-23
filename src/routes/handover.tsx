import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Clock, HeartPulse, RotateCcw, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ScenePicture } from "@/components/scene-picture";
import { AppShell, Panel, SectionLabel } from "@/components/workshop";
import { ARREST_KEY, type ArrestSession, count, parseSession } from "@/lib/arrest-log";
import { AVPU, EMPTY_HANDOVER, type Handover, handoverLines, INJURIES, isEmpty, MECHANISMS, TREATMENTS } from "@/lib/handover";
import { translateText } from "@/lib/i18n";
import { HANDOVER_PIC } from "@/lib/scene-images";
import { shareOrCopy } from "@/lib/share";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/handover")({
  component: HandoverPage,
  head: () => ({ meta: [{ title: "Handover to the ambulance crew · Pitchside Emergency Care" }] }),
});

const timeOfDay = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
/** "15:42" for the time box, in the 24-hour form it needs. */
const boxTime = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Kept in memory only, never saved: it survives moving between pages and is gone when the app closes. */
let draft: Handover = EMPTY_HANDOVER;

function savedArrest(): ArrestSession | null {
  try {
    return parseSession(localStorage.getItem(ARREST_KEY), Date.now());
  } catch {
    return null; // storage blocked: no run was kept
  }
}

/** Which ATMIST letter a handover line belongs to. */
const LETTERS: [string, string][] = [
  ["Age:", "A"],
  ["Time:", "T"],
  ["Mechanism:", "M"],
  ["Injuries:", "I"],
  ["Signs:", "S"],
  ["Treatment:", "T"],
  ["Also:", "+"],
];

const INPUT = "min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink outline-none focus-visible:border-gold-ink";

function Letter({ l, title, children }: { l: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy font-display text-lg font-bold text-gold" aria-hidden="true" translate="no">
        {l}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-sm font-semibold tracking-wide text-heading">{title}</h2>
        <div className="mt-1.5">{children}</div>
      </div>
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        tap();
        onClick();
      }}
      className={cn(
        "min-h-10 rounded-full border px-3 text-[13px] font-medium leading-tight transition-colors active:scale-[0.97]",
        on ? "border-gold bg-gold text-on-gold" : "border-line bg-paper text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Chips({ options, picked, onToggle }: { options: string[]; picked: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o} on={picked.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

function Field({ label, unit, value, onChange, wide }: { label: string; unit?: string; value: string; onChange: (v: string) => void; wide?: boolean }) {
  return (
    <label className={cn("flex flex-col gap-1", wide && "col-span-2")}>
      <span className="text-xs font-semibold text-muted">
        {label}
        {unit ? (
          <span className="font-normal" translate="no">
            {" "}
            ({unit})
          </span>
        ) : null}
      </span>
      <input inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value.slice(0, 6))} className={INPUT} />
    </label>
  );
}

function HandoverPage() {
  const [h, setH] = useState<Handover>(draft);
  const [now, setNow] = useState(0);
  const [arrest, setArrest] = useState<ArrestSession | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setArrest(savedArrest());
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    draft = h;
  }, [h]);

  const set = (patch: Partial<Handover>) => setH((x) => ({ ...x, ...patch }));
  const toggle = (key: "mechanism" | "injuries" | "treatment", v: string) =>
    setH((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }));
  const lines = handoverLines(h, now, timeOfDay);
  const empty = isEmpty(h);
  const collapse = h.time ?? h.arrest?.startedAt ?? null;

  async function share() {
    tap();
    const r = await shareOrCopy({ title: "Handover to the ambulance crew", text: lines.join("\n") });
    setNote(r === "copied" ? "Handover copied — paste it into a message or read it out." : r === "failed" ? "Sharing is not available on this device." : "");
  }

  function setClock(value: string) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!m) return set({ time: null });
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    // a time later than now was yesterday evening
    set({ time: d.getTime() > Date.now() + 60_000 ? d.getTime() - 86_400_000 : d.getTime() });
  }

  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <ScenePicture pic={HANDOVER_PIC} />
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-note text-gold-ink">
                <ClipboardList className="size-6" aria-hidden />
              </span>
              <h1 className="font-display text-xl font-bold leading-tight tracking-wide text-heading">Handover to the ambulance crew</h1>
            </div>
            <p className="text-sm leading-snug">
              ATMIST: Age, Time, Mechanism, Injuries, Signs, Treatment. The same order every time, in under a minute. Tap what you
              know and the handover builds itself below, ready to read out or share.
            </p>
            <p className="text-xs leading-snug text-muted">Nothing is saved: it stays in the app only until you close it.</p>
          </div>
        </Panel>

        {arrest ? (
          <Panel>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <HeartPulse className="size-5 shrink-0 text-danger" aria-hidden />
              <p className="min-w-0 flex-1 text-sm leading-snug">
                <span className="block font-semibold text-heading">Arrest timer</span>
                <span className="block text-xs text-muted">
                  {[`Collapse at ${timeOfDay(arrest.startedAt)}`, count(arrest, "shock") === 1 ? "1 shock" : `${count(arrest, "shock")} shocks`].join(" · ")}
                </span>
              </p>
              {h.arrest ? (
                <button type="button" onClick={() => set({ arrest: null })} className="inline-flex min-h-10 items-center gap-1 px-1 text-xs font-semibold text-gold-ink underline underline-offset-2">
                  <X className="size-3.5" aria-hidden />
                  Take it out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    set({ arrest });
                  }}
                  className="min-h-10 shrink-0 rounded-lg bg-danger-fill px-3 font-display text-[13px] font-semibold tracking-wide text-white active:scale-[0.98]"
                >
                  Fill in from it
                </button>
              )}
            </div>
          </Panel>
        ) : null}

        <Panel>
          <div className="flex flex-col gap-4 px-3.5 py-3.5">
            <Letter l="A" title="Age">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="Age in years"
                  placeholder="Years"
                  value={h.age}
                  onChange={(e) => set({ age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  className={cn(INPUT, "w-24")}
                />
                <Chip on={h.sex === "male"} onClick={() => set({ sex: h.sex === "male" ? "" : "male" })}>
                  Male
                </Chip>
                <Chip on={h.sex === "female"} onClick={() => set({ sex: h.sex === "female" ? "" : "female" })}>
                  Female
                </Chip>
              </div>
            </Letter>
            <Letter l="T" title="Time of the injury or collapse">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    set({ time: Date.now() });
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-heading active:scale-[0.98]"
                >
                  <Clock className="size-4 text-gold-ink" aria-hidden />
                  Now
                </button>
                <input
                  type="time"
                  aria-label="Time of the injury or collapse"
                  value={collapse !== null ? boxTime(collapse) : ""}
                  onChange={(e) => setClock(e.target.value)}
                  className={cn(INPUT, "w-32")}
                />
                {collapse !== null && now ? (
                  <span className="text-xs text-muted">{`${Math.max(0, Math.floor((now - collapse) / 60_000))} min ago`}</span>
                ) : null}
              </div>
            </Letter>
            <Letter l="M" title="Mechanism">
              <Chips options={MECHANISMS} picked={h.mechanism} onToggle={(v) => toggle("mechanism", v)} />
            </Letter>
            <Letter l="I" title="Injuries or illness">
              <Chips options={INJURIES} picked={h.injuries} onToggle={(v) => toggle("injuries", v)} />
            </Letter>
            <Letter l="S" title="Signs">
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Responsiveness (AVPU)">
                  {AVPU.map((a) => (
                    <Chip key={a.id} on={h.avpu === a.id} onClick={() => set({ avpu: h.avpu === a.id ? "" : a.id })}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Pulse" unit="/min" value={h.hr} onChange={(hr) => set({ hr })} />
                  <Field label="Breathing" unit="/min" value={h.rr} onChange={(rr) => set({ rr })} />
                  <Field label="SpO₂" unit="%" value={h.spo2} onChange={(spo2) => set({ spo2 })} />
                  <Field label="Glucose" unit="mmol/L" value={h.glucose} onChange={(glucose) => set({ glucose })} />
                  <Field label="Blood pressure, top" unit="mmHg" value={h.sys} onChange={(sys) => set({ sys })} />
                  <Field label="Blood pressure, bottom" unit="mmHg" value={h.dia} onChange={(dia) => set({ dia })} />
                  <Field label="Temperature" unit="°C" value={h.temp} onChange={(temp) => set({ temp })} wide />
                </div>
              </div>
            </Letter>
            <Letter l="T" title="Treatment">
              <Chips options={TREATMENTS} picked={h.treatment} onToggle={(v) => toggle("treatment", v)} />
            </Letter>
            <label className="flex flex-col gap-1">
              <span className="font-display text-sm font-semibold tracking-wide text-heading">Anything else</span>
              <span className="text-xs text-muted">Allergies, medicines, the hospital, who is travelling with the player</span>
              <textarea
                rows={2}
                value={h.notes}
                onChange={(e) => set({ notes: e.target.value.slice(0, 280) })}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus-visible:border-gold-ink"
              />
            </label>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <SectionLabel>THE HANDOVER</SectionLabel>
            {empty ? (
              <p className="text-sm leading-snug text-muted">Tap what you know above and it appears here, in the ATMIST order.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lines.slice(1).map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-snug">
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-navy font-display text-xs font-bold text-gold" aria-hidden="true" translate="no">
                      {LETTERS.find(([p]) => line.startsWith(p))?.[1] ?? "·"}
                    </span>
                    <span className="min-w-0 flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={empty}
                onClick={() => void share()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-3.5 font-display text-sm font-semibold tracking-wide text-on-gold active:scale-[0.98] disabled:opacity-50"
              >
                <Share2 className="size-4" aria-hidden />
                Share the handover
              </button>
              <button
                type="button"
                disabled={empty}
                onClick={() => {
                  if (!window.confirm(translateText("Clear this handover and start again?"))) return;
                  setH(EMPTY_HANDOVER);
                  setNote("");
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3.5 text-sm font-semibold text-heading active:scale-[0.98] disabled:opacity-50"
              >
                <RotateCcw className="size-4" aria-hidden />
                Start again
              </button>
            </div>
            {note ? (
              <p role="status" className="text-xs leading-snug text-muted">
                {note}
              </p>
            ) : null}
          </div>
        </Panel>

        <p className="px-1 text-xs leading-snug text-muted">
          For a cardiac arrest, the{" "}
          <Link to="/arrest" className="font-semibold text-gold-ink underline underline-offset-2">
            arrest timer
          </Link>{" "}
          keeps the times of CPR, shocks and drugs; fill the handover in from it. The handover is a memory aid, not a medical record.
        </p>
      </div>
    </AppShell>
  );
}
