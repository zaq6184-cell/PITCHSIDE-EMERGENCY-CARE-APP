import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, ClipboardList, ClipboardPen, Timer, Zap } from "lucide-react";
import { CprTrainer } from "@/components/cpr-trainer";
import { LightningTool } from "@/components/lightning-tool";
import { DashTimer } from "@/components/dash-timer";
import { AppShell, Panel, SayLine, SectionLabel, Tiles } from "@/components/workshop";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/timer")({
  component: TimerPage,
  head: () => ({ meta: [{ title: "Match-day tools · Pitchside Emergency Care" }] }),
});

function TimerPage() {
  return (
    <AppShell
      tab="timer"
      heading="Match-day tools: match plan, arrest timer, handover, carry timer, CPR rhythm trainer and lightning tool"
    >
      <div className="flex flex-col gap-3.5">
        <Tiles
          items={[
            { to: "/plan", icon: ClipboardCheck, tint: "#E3F2E8", ink: "#1A7F45", title: "Match plan", sub: "FIFA PEAP on your phone · names, hospital, checklist", wide: true },
            { to: "/arrest", icon: Timer, tint: "#FBE9E7", ink: "#C0392B", title: "Arrest timer", sub: "CPR clock · 2-minute checks · shock and drug log", wide: true },
            { to: "/handover", icon: ClipboardList, tint: "#EFE8F7", ink: "#6B3FA0", title: "Handover", sub: "ATMIST for the ambulance crew · from the arrest timer", wide: true },
            { to: "/aed", icon: Zap, tint: "#F6EFD6", ink: "#8A6D10", title: "AED pads trainer", sub: "Place the pads in 3D · everyone clear · shock", wide: true },
            { to: "/scorer", icon: ClipboardPen, tint: "#E3F2E8", ink: "#1A7F45", title: "Practical scorer", sub: "For instructors: time a team on the manikin, then debrief", wide: true },
          ]}
        />
        <Panel>
          <div className="px-3.5 pt-4">
            <SectionLabel>10-SECOND CARRY TIMER · LAST RESORT</SectionLabel>
            <p className="mt-2 text-sm leading-snug text-muted">
              First choice: the ambulance comes onto the pitch to the player, with a mechanical CPR device (LUCAS) where available.
              Carry only when the ambulance cannot reach the player.
            </p>
          </div>
          <DashTimer />
        </Panel>
        <section id="cpr-trainer" className="scroll-mt-24">
          <Panel>
            <div className="px-3.5 pb-2 pt-4">
              <SectionLabel>CPR RHYTHM TRAINER</SectionLabel>
              <p className="mt-2 text-sm leading-snug text-muted">
                Tap the red button as if compressing — or turn on Count by motion and compress on a manikin with the phone in your
                hands. The rate shows live: keep it between 100 and 120 a minute, and the voice coach tells you when to change.
              </p>
            </div>
            <CprTrainer />
          </Panel>
        </section>
        <section id="lightning" className="scroll-mt-24">
          <Panel>
            <div className="flex flex-col gap-3 px-3.5 py-4">
              <SectionLabel>LIGHTNING · THE 30/30 RULE</SectionLabel>
              <p className="text-sm leading-snug text-muted">
                Count from the flash to the thunder. Under 30 seconds the storm is within about 10 km: stop play. Resume only 30
                minutes after the last flash or thunder. Your competition's rules may be stricter.
              </p>
              <LightningTool />
              <ul className="flex flex-col gap-2 text-sm leading-snug">
                <li className="rounded-lg bg-note px-3 py-2">
                  <span className="font-semibold text-heading">Safe shelter: </span>a fully enclosed building with wiring and plumbing,
                  or a hard-topped vehicle with the windows shut. Not safe: dugouts, tents, open stands, under trees, or beside
                  floodlight poles and fences.
                </li>
                <li className="rounded-lg bg-note px-3 py-2">
                  <span className="font-semibold text-heading">Someone struck: </span>they carry no charge — go to them at once. Not
                  breathing normally means cardiac arrest: CPR and the AED. With several casualties, treat those who look lifeless
                  first (reverse triage); those who are breathing usually recover.
                </li>
              </ul>
              <p className="text-[11px] leading-snug text-muted">
                Sources: NATA position statement on lightning safety for athletics and recreation; Football NSW lightning policy.
              </p>
            </div>
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
