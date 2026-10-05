import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { LockedList } from "@/components/locked-list";
import { isNewCode } from "@/lib/access-gate";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { simulation, stations } from "@/lib/stations";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/stations")({ component: Stations });

function Stations() {
  return (
    <AppShell tab="stations">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">Sunday 4 Oct · </span>
          Skill stations 8.30 AM – 1.00 PM, then scenario simulation {simulation.time}.
        </Note>
        <SectionLabel>SKILL STATIONS</SectionLabel>
        {stations.map((s) => (
          <Link
            key={s.id}
            to="/station/$id"
            params={{ id: s.id }}
            className="block active:scale-[0.99]"
          >
            <Panel>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-bold text-gold">
                  {s.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold tracking-[0.14em] text-navy">
                    STATION {s.id} · {s.short.toUpperCase()}
                  </p>
                  <p className="text-sm leading-snug">
                    {s.title.toLowerCase() === s.short.toLowerCase() ? s.subtitle : s.title}
                  </p>
                  {s.location ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3" />
                      {s.location}
                    </p>
                  ) : null}
                </div>
                <ChevronRight className="size-5 shrink-0 text-gold" />
              </div>
            </Panel>
          </Link>
        ))}

        <SectionLabel>SCENARIO SIMULATION</SectionLabel>
        <Panel>
          <div className="px-3.5 py-3.5">
            <p className="text-sm font-medium">{simulation.time}</p>
            <p className="mt-1 text-sm leading-snug text-muted">{simulation.note}</p>
          </div>
        </Panel>

        {simulation.scenarios.map((sc) => (
          <Panel key={sc.id}>
            <div className="px-3.5 py-3.5">
              <SectionLabel>{sc.title.toUpperCase()}</SectionLabel>
              <p className="mt-2 rounded-lg bg-cream px-2.5 py-2 text-sm italic leading-snug">
                {sc.story}
              </p>
              <p className="mt-3 font-display text-xs font-semibold tracking-[0.12em] text-navy">
                EXPECTED INTERVENTIONS
              </p>
              <LockedList payload={isNewCode() ? sc.lockedNext : sc.locked} />
            </div>
          </Panel>
        ))}
        <Note>{workshop.disclaimer}</Note>
      </div>
    </AppShell>
  );
}
