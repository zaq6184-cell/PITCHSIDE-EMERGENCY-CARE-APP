import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bone, HeartPulse, PlayCircle, Zap } from "lucide-react";
import { AppShell, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { DrillPlayer3D, SpinePlayer3D } from "@/components/set-piece-3d";
import { spineSteps } from "@/lib/spine-drill";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { type Step, workshop } from "@/lib/workshop";

type Search = { case?: "neck" };

export const Route = createFileRoute("/drill")({
  component: Drill,
  validateSearch: (s: Record<string, unknown>): Search => (s.case === "neck" ? { case: "neck" } : {}),
  head: () => ({ meta: [{ title: "Team drills in 3D · Pitchside Emergency Care" }] }),
});

function Drill() {
  const search = Route.useSearch();
  // the page is built without the query, so the neck drill switches on once the page is running —
  // the first render matches the built page (no hydration mismatch)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const neck = ready && search.case === "neck";
  const navigate = useNavigate({ from: "/drill" });
  const [arrestStep, setArrestStep] = useState(1);
  const [neckStep, setNeckStep] = useState(1);
  const step = neck ? neckStep : arrestStep;
  const setStep = neck ? setNeckStep : setArrestStep;
  const steps: readonly Step[] = neck ? spineSteps : workshop.steps;
  const pick = (toNeck: boolean) => {
    if (toNeck === neck) return;
    tap();
    void navigate({ search: toNeck ? { case: "neck" } : {}, replace: true, resetScroll: false });
  };

  return (
    <AppShell tab="drill" heading={neck ? "Neck injury team drill" : "Sudden cardiac arrest team drill"}>
      <div className="flex flex-col gap-3.5">
        <div role="tablist" aria-label="Which drill" className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-card">
          {[
            { on: !neck, label: "Cardiac arrest", icon: HeartPulse, to: false },
            { on: neck, label: "Neck injury", icon: Bone, to: true },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={t.on}
              onClick={() => pick(t.to)}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full font-display text-sm font-semibold tracking-wide transition-colors",
                t.on ? "bg-navy text-gold" : "text-heading",
              )}
            >
              <t.icon className="size-4" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
        <Note>
          {neck ? (
            <>
              <span className="font-semibold text-heading">Suspected cervical spine injury — the team drill. </span>
              Seven steps from holding the head to the basket lift, each tagged with the colours that act. Watch each step in 3D,
              or play them all.
            </>
          ) : (
            <>
              <span className="font-semibold text-heading">Sudden cardiac arrest — the team drill. </span>
              Six steps, each tagged with the colours that act. Watch each step in 3D, or play them all.
            </>
          )}
        </Note>
        <Panel>
          {neck ? <SpinePlayer3D key="neck" step={step} onStep={setStep} /> : <DrillPlayer3D key="arrest" step={step} onStep={setStep} />}
        </Panel>
        {neck ? (
          <Link to="/cspine" className="block active:scale-[0.99]">
            <div className="reveal flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#174f7d] to-[#1F6AA5] px-3.5 py-3 text-white shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
                <Bone className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold tracking-wide">Cervical spine injury in full</span>
                <span className="block text-xs text-white/85">Clearing the spine · collar sizing · log roll · FIFA film and poster</span>
              </span>
            </div>
          </Link>
        ) : (
          <div className="grid gap-2.5">
            <Link to="/aed" className="block active:scale-[0.99]">
              <div className="reveal flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#8a6d10] to-[#c9a227] px-3.5 py-3 text-white shadow-card">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
                  <Zap className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-bold tracking-wide">AED pads trainer</span>
                  <span className="block text-xs text-white/90">Place the pads in 3D, call everyone clear, shock — against the clock</span>
                </span>
              </div>
            </Link>
            <Link to="/timer" hash="cpr-trainer" className="block active:scale-[0.99]">
              <div className="reveal flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#a32a20] to-[#d8443a] px-3.5 py-3 text-white shadow-card">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
                  <PlayCircle className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-bold tracking-wide">Practise the compression rhythm</span>
                  <span className="block text-xs text-white/85">Tap-along trainer: 100–120 a minute, 30:2 or continuous</span>
                </span>
              </div>
            </Link>
          </div>
        )}
        <Panel>
          <div className="px-3.5 py-2">
            {steps.map((st, i) => (
              <article
                key={st.n}
                className={cn(
                  "-mx-2 flex gap-3 rounded-lg px-2 py-3.5",
                  i === steps.length - 1 ? "" : "border-b border-line",
                  st.n === step ? "bg-note" : "",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep(st.n);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-label={`Show step ${st.n} in 3D`}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition-transform duration-150 active:scale-95",
                    st.n === step ? "bg-gold text-on-gold" : "bg-navy text-gold",
                  )}
                >
                  {st.n}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-ink">{st.title}</span>
                    <span className="text-muted"> · {st.time}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {st.who.map((id) => (
                      <RoleChip key={id} id={id} />
                    ))}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {st.lines.map((line) => (
                      <li key={line} className="text-sm leading-snug text-ink">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>EXTRICATION TEAM</SectionLabel>
            <p className="text-sm leading-snug">{workshop.stretcherNote}</p>
          </div>
        </Panel>
        <SectionLabel>SEQUENCE</SectionLabel>
        <p className="text-xs leading-snug text-muted">
          {neck
            ? "Hold the head (MILS) → airway with the neck held → breathing, circulation, disability → collar → log roll or tilt onto the scoop → straps, blocks, tape → release → basket and lift with six."
            : "Recognise → compressions → AED and shock → airway and oxygen → prepare the transfer (ambulance or buggy to the player) → carry only as a last resort."}
        </p>
        <Link to="/guides" className="block active:scale-[0.99]">
          <Panel>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
                <PlayCircle className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-semibold tracking-[0.14em] text-heading">FIFA GUIDELINE FILMS</p>
                <p className="text-sm leading-snug">{neck ? "Watch FIFA's skill zone films, including the cervical spine set piece" : "Watch official SCA, CPR and AED films"}</p>
              </div>
            </div>
          </Panel>
        </Link>
      </div>
    </AppShell>
  );
}
