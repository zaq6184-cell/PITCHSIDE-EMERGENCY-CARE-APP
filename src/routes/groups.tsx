import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { groups } from "@/lib/groups";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/groups")({ component: GroupsPage });

function GroupsPage() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const hits = needle
    ? groups.flatMap((g) => g.members.filter((m) => m.toLowerCase().includes(needle)).map((m) => ({ g: g.id, m })))
    : [];

  return (
    <AppShell tab="stations">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">SUNDAY 4 OCT · PRACTICAL SESSION</p>
            <h2 className="mt-0.5 font-display text-xl font-bold leading-tight">Find your group</h2>
            <p className="mt-1 text-sm text-gold-soft">Six groups for the skill stations and the scenario simulation.</p>
          </div>
          <div className="px-3.5 py-3">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 focus-within:border-navy">
              <Search className="size-4 shrink-0 text-muted" />
              <span className="sr-only">Search your name</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type your name"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            {needle ? (
              hits.length ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {hits.map((h) => (
                    <li key={h.g + h.m}>
                      <a
                        href={`#group-${h.g}`}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-cream px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{h.m}</span>
                        <span className="shrink-0 rounded-full bg-navy px-2.5 py-0.5 font-display text-xs font-semibold tracking-wide text-gold">
                          GROUP {h.g}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-snug text-muted">
                  No match. Check the lists below, or ask at the registration desk.
                </p>
              )
            ) : null}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {groups.map((g) => (
            <section key={g.id} id={`group-${g.id}`} className="scroll-mt-24">
              <Panel className="h-full">
                <div className="flex items-center gap-3 bg-navy px-3.5 py-2.5 text-on-navy">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold font-display text-lg font-bold text-navy">
                    {g.id}
                  </span>
                  <p className="font-display text-sm font-semibold tracking-[0.12em]">GROUP {g.id}</p>
                  <p className="ml-auto text-xs text-gold-soft">{g.members.length} participants</p>
                </div>
                <ol className="divide-y divide-line px-3.5 py-1">
                  {g.members.map((m, i) => (
                    <li
                      key={m}
                      className={cn(
                        "flex items-baseline gap-2.5 py-2 text-sm leading-snug",
                        needle && m.toLowerCase().includes(needle) && "-mx-2 rounded bg-gold/25 px-2 font-semibold",
                      )}
                    >
                      <span className="w-5 shrink-0 text-right font-display text-xs font-semibold text-muted">{i + 1}</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </section>
          ))}
        </div>

        <Panel>
          <div className="flex flex-col gap-1 px-3.5 py-3.5">
            <SectionLabel>WHERE TO GO</SectionLabel>
            <Link to="/stations" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold">
              Skill stations and simulation timetable →
            </Link>
          </div>
        </Panel>

        <Note>Names are as written on the organisers' group cards. Tell a facilitator if yours is missing or misspelt.</Note>
      </div>
    </AppShell>
  );
}
