import { createFileRoute } from "@tanstack/react-router";
import { CprTrainer } from "@/components/cpr-trainer";
import { DashTimer } from "@/components/dash-timer";
import { AppShell, Panel, SayLine, SectionLabel } from "@/components/workshop";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/timer")({
  component: TimerPage,
  head: () => ({ meta: [{ title: "Carry timer and CPR trainer · Pitchside Emergency Care" }] }),
});

function TimerPage() {
  return (
    <AppShell tab="timer" heading="Carry timer and CPR rhythm trainer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="px-3.5 pt-4">
            <SectionLabel>10-SECOND CARRY TIMER</SectionLabel>
          </div>
          <DashTimer />
        </Panel>
        <section id="cpr-trainer" className="scroll-mt-24">
          <Panel>
            <div className="px-3.5 pb-2 pt-4">
              <SectionLabel>CPR RHYTHM TRAINER</SectionLabel>
              <p className="mt-2 text-sm leading-snug text-muted">
                Tap the red button as if compressing. The rate shows live — keep it between 100 and 120 a minute.
              </p>
            </div>
            <CprTrainer />
          </Panel>
        </section>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>CARRY RULES</SectionLabel>
            <ul className="flex flex-col gap-1.5">
              {workshop.dashRules.map((line) => (
                <li key={line} className="text-sm leading-snug">
                  {line}
                </li>
              ))}
            </ul>
            <SayLine text="Black: “Ready to lift. On three. One, two, three, LIFT.”" voice="black-3" />
            <SayLine text="Green: “Ten seconds!” — player down, CPR on." voice="green-3" />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
