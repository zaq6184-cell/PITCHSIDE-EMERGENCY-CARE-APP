import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { stations } from "@/lib/stations";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/stations")({ component: Stations });

function Stations() {
  return (
    <AppShell tab="stations">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">Five lessons. </span>
          Study notes for each part of the pitchside response, in the order a team would train them.
        </Note>
        <SectionLabel>LESSONS</SectionLabel>
        {stations.map((s) => (
          <Link key={s.id} to="/station/$id" params={{ id: s.id }} className="block active:scale-[0.99]">
            <Panel>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-bold text-gold">
                  {s.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-semibold tracking-[0.14em] text-navy">
                    LESSON {s.id} · {s.short.toUpperCase()}
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
