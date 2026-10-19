import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Timer } from "lucide-react";
import { CprTrainer } from "@/components/cpr-trainer";
import { DashTimer } from "@/components/dash-timer";
import { AppShell, Panel, SayLine, SectionLabel, Tiles } from "@/components/workshop";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/timer")({
  component: TimerPage,
  head: () => ({ meta: [{ title: "Match-day tools · Pitchside Emergency Care" }] }),
});

function TimerPage() {
  return (
    <AppShell tab="timer" heading="Match-day tools: match plan, arrest timer, carry timer and CPR rhythm trainer">
      <div className="flex flex-col gap-3.5">
        <Tiles
          items={[
            { to: "/plan", icon: ClipboardCheck, tint: "#E3F2E8", ink: "#1A7F45", title: "Match plan", sub: "FIFA PEAP on your phone · names, hospital, checklist", wide: true },
            { to: "/arrest", icon: Timer, tint: "#FBE9E7", ink: "#C0392B", title: "Arrest timer", sub: "CPR clock · 2-minute checks · shock and drug log", wide: true },
          ]}
        />
        <Panel>
          <div className="px-3.5 pt-4">
            <SectionLabel>10-SECOND CARRY TIMER · LAST RESORT</SectionLabel>
            <p className="mt-2 text-sm leading-snug text-muted">
              First choice: the ambulance or a buggy comes onto the pitch to the player, with a mechanical CPR device (LUCAS) where
              available. Carry only when neither can reach the player.
            </p>
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
