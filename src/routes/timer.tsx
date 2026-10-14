import { createFileRoute } from "@tanstack/react-router";
import { DashTimer } from "@/components/dash-timer";
import { AppShell, Panel, SayLine, SectionLabel } from "@/components/workshop";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/timer")({ component: TimerPage });

function TimerPage() {
  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="px-3.5 pt-4">
            <SectionLabel>10-SECOND DASH</SectionLabel>
          </div>
          <DashTimer />
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>DASH RULES</SectionLabel>
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
