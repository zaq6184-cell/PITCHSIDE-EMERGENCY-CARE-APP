import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { LockedList } from "@/components/locked-list";
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
            <div className="-mx-3.5 mt-3 overflow-x-auto px-3.5">
              <table className="w-full min-w-[20rem] border-collapse text-center text-sm">
                <thead>
                  <tr>
                    {simulation.head.map((h) => (
                      <th
                        key={h}
                        className="bg-navy px-1.5 py-1.5 font-display text-[11px] font-semibold tracking-wide text-on-navy first:rounded-l-md last:rounded-r-md"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simulation.rows.map((row) => (
                    <tr key={row[0]} className="border-b border-line">
                      {row.map((cell, i) => (
                        <td
                          key={i}
                          className={i === 0 ? "whitespace-nowrap py-2 text-left text-xs text-muted" : "py-2 font-display font-semibold"}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm">{simulation.closing}</p>
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
              <LockedList payload={sc.locked} />
            </div>
          </Panel>
        ))}
        <Note>{workshop.disclaimer}</Note>
      </div>
    </AppShell>
  );
}
