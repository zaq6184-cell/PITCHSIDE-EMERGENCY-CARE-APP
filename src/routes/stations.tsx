import { createFileRoute, Link } from "@tanstack/react-router";
import { Bandage, Brain, BriefcaseMedical, ChevronRight, HeartPulse, Stethoscope, Users } from "lucide-react";
import { LoopClip } from "@/components/loop-clip";
import { SearchBar } from "@/components/search";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { moduleCover } from "@/lib/module-covers";
import { stations } from "@/lib/stations";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/stations")({
  component: Stations,
  head: () => ({ meta: [{ title: "Skill modules · Pitchside Emergency Care" }] }),
});

const moduleLook: Record<string, { icon: typeof Users; tint: string; ink: string }> = {
  "1": { icon: Users, tint: "#F6EFD6", ink: "#8A6D10" },
  "2": { icon: HeartPulse, tint: "#FBE9E7", ink: "#C0392B" },
  "3": { icon: Stethoscope, tint: "#E4EFF8", ink: "#1F6AA5" },
  "4": { icon: Bandage, tint: "#EFE8F7", ink: "#6B3FA0" },
  "5": { icon: BriefcaseMedical, tint: "#E3F2E8", ink: "#1A7F45" },
  "6": { icon: Brain, tint: "#EFE8F7", ink: "#6B3FA0" },
};

function ModuleBadge({ id }: { id: string }) {
  const look = moduleLook[id];
  const Icon = look.icon;
  return (
    <span
      className="tint-chip relative grid size-12 shrink-0 place-items-center rounded-xl"
      style={{ "--tint": look.tint, "--ink": look.ink } as React.CSSProperties}
    >
      <Icon className="size-6" strokeWidth={1.9} aria-hidden />
      <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-navy font-display text-[11px] font-bold text-gold">
        {id}
      </span>
    </span>
  );
}

function ModuleCover({ id }: { id: string }) {
  const cover = moduleCover(id);
  if (!cover) return null;
  // each card's slow drift starts at its own point; the loop drifts with its picture
  const drift = { animationDelay: `-${Number(id) * 5}s` };
  return (
    <div className="relative overflow-hidden">
      <img
        src={cover.small}
        alt=""
        width={720}
        height={405}
        loading={id === "1" ? "eager" : "lazy"}
        className="kenburns block aspect-[12/5] w-full object-cover object-[50%_72%] outline-none"
        style={drift}
      />
      <LoopClip src={cover.video} className="kenburns object-[50%_72%]" style={drift} />
    </div>
  );
}

function Stations() {
  return (
    <AppShell tab="stations" heading="Skill modules">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-heading">Six skill modules. </span>
          Study notes for each part of the pitchside response, in the order a team would train them.
        </Note>
        <SearchBar label="Search every module…" />
        <SectionLabel>SKILL MODULES</SectionLabel>
        {stations.map((s) => (
          <Link key={s.id} to="/station/$id" params={{ id: s.id }} className="block active:scale-[0.99]">
            <Panel>
              <ModuleCover id={s.id} />
              <div className="flex items-center gap-3 px-3.5 py-3">
                <ModuleBadge id={s.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold tracking-[0.14em] text-heading">
                    MODULE {s.id} · {s.short.toUpperCase()}
                  </p>
                  <p className="text-sm leading-snug">
                    {s.title.toLowerCase() === s.short.toLowerCase() ? s.subtitle : s.title}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-gold-ink" />
              </div>
            </Panel>
          </Link>
        ))}
        <Note>{workshop.disclaimer}</Note>
      </div>
    </AppShell>
  );
}
