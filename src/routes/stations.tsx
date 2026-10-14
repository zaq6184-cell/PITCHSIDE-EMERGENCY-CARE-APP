import { createFileRoute, Link } from "@tanstack/react-router";
import { Bandage, BriefcaseMedical, ChevronRight, HeartPulse, Stethoscope, Users } from "lucide-react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { stations } from "@/lib/stations";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/stations")({ component: Stations });

const moduleLook: Record<string, { icon: typeof Users; tint: string; ink: string }> = {
  "1": { icon: Users, tint: "#F6EFD6", ink: "#8A6D10" },
  "2": { icon: HeartPulse, tint: "#FBE9E7", ink: "#C0392B" },
  "3": { icon: Stethoscope, tint: "#E4EFF8", ink: "#1F6AA5" },
  "4": { icon: Bandage, tint: "#EFE8F7", ink: "#6B3FA0" },
  "5": { icon: BriefcaseMedical, tint: "#E3F2E8", ink: "#1E8A4C" },
};

function ModuleBadge({ id }: { id: string }) {
  const look = moduleLook[id];
  const Icon = look.icon;
  return (
    <span className="relative grid size-12 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: look.tint, color: look.ink }}>
      <Icon className="size-6" strokeWidth={1.9} aria-hidden />
      <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-navy font-display text-[11px] font-bold text-gold">
        {id}
      </span>
    </span>
  );
}

function Stations() {
  return (
    <AppShell tab="stations">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">Five skill modules. </span>
          Study notes for each part of the pitchside response, in the order a team would train them.
        </Note>
        <SectionLabel>SKILL MODULES</SectionLabel>
        {stations.map((s) => (
          <Link key={s.id} to="/station/$id" params={{ id: s.id }} className="block active:scale-[0.99]">
            <Panel>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <ModuleBadge id={s.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold tracking-[0.14em] text-navy">
                    MODULE {s.id} · {s.short.toUpperCase()}
                  </p>
                  <p className="text-sm leading-snug">
                    {s.title.toLowerCase() === s.short.toLowerCase() ? s.subtitle : s.title}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-gold" />
              </div>
            </Panel>
          </Link>
        ))}
        <Note>{workshop.disclaimer}</Note>
      </div>
    </AppShell>
  );
}
