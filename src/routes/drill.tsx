import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { AppShell, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { DrillPlayer3D } from "@/components/set-piece-3d";
import { cn } from "@/lib/utils";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/drill")({ component: Drill });

function Drill() {
  const [step, setStep] = useState(1);
  return (
    <AppShell tab="drill">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">Sudden cardiac arrest — the team drill. </span>
          Six steps, each tagged with the colours that act. Watch each step in 3D, or play them all.
        </Note>
        <Panel>
          <DrillPlayer3D step={step} onStep={setStep} />
        </Panel>
        <Panel>
          <div className="px-3.5 py-2">
            {workshop.steps.map((st, i) => (
              <article
                key={st.n}
                className={cn(
                  "-mx-2 flex gap-3 rounded-lg px-2 py-3.5",
                  i === workshop.steps.length - 1 ? "" : "border-b border-line",
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
                    st.n === step ? "bg-gold text-navy" : "bg-navy text-gold",
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
            <SectionLabel>STRETCHER TEAM</SectionLabel>
            <p className="text-sm leading-snug">{workshop.stretcherNote}</p>
          </div>
        </Panel>
        <SectionLabel>SEQUENCE</SectionLabel>
        <p className="text-xs leading-snug text-muted">
          Recognise → compressions → AED and shock → airway and oxygen → prepare the transfer → stop-and-start carry.
        </p>
        <Link to="/guides" className="block active:scale-[0.99]">
          <Panel>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
                <PlayCircle className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-semibold tracking-[0.14em] text-navy">
                  FIFA GUIDELINE FILMS
                </p>
                <p className="text-sm leading-snug">Watch official SCA, CPR and AED films</p>
              </div>
            </div>
          </Panel>
        </Link>
      </div>
    </AppShell>
  );
}
