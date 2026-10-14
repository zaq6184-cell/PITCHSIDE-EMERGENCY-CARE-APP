import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PositionDiagram } from "@/components/position-diagram";
import { roleIcons } from "@/components/role-icon";
import { AppShell, Note, Panel, SayLine, SectionLabel } from "@/components/workshop";
import { getRole, isRoleId } from "@/lib/workshop";
import { FIFA_ROLE_CARDS_PDF, fifaRoleCards } from "@/lib/fifa-roles";

export const Route = createFileRoute("/role/$id")({ component: RoleCard });

function RoleCard() {
  const { id } = Route.useParams();
  if (!isRoleId(id)) return <Navigate to="/" />;
  const r = getRole(id);
  if (!r) return <Navigate to="/" />;
  const RoleIcon = roleIcons[r.id];

  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          All colours
        </Link>
        <Panel>
          <div
            className="relative overflow-hidden px-3.5 py-3.5"
            style={{
              backgroundColor: r.color,
              backgroundImage: "linear-gradient(150deg, rgba(255,255,255,0.16), rgba(0,0,0,0.14))",
              color: r.text,
              boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.18)" : undefined,
            }}
          >
            <RoleIcon className="absolute -right-1 -top-2 size-20 opacity-25" strokeWidth={1.4} aria-hidden />
            <h2 className="font-display text-[1.7rem] font-bold leading-none tracking-[0.08em]">{r.name}</h2>
            <p className="mt-1 text-sm opacity-90">{r.role}</p>
          </div>
          <PositionDiagram highlight={r.id} />
          <div className="flex flex-col gap-3.5 px-3.5 py-3.5">
            <section>
              <SectionLabel>WHERE YOU STAND</SectionLabel>
              <p className="mt-2 text-sm leading-snug">{r.stand}</p>
            </section>
            <section>
              <SectionLabel>WHAT YOU BRING</SectionLabel>
              <p className="mt-2 text-sm leading-snug">{r.bring}</p>
              {r.id === "green" ? (
                <Link
                  to="/bag"
                  className="mt-2 inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold"
                >
                  Full FIFA bag list
                </Link>
              ) : null}
            </section>
            <section>
              <SectionLabel>WHAT YOU DO</SectionLabel>
              <ul className="mt-2 flex flex-col gap-1.5">
                {r.do.map((line) => (
                  <li key={line} className="text-sm leading-snug">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-1.5">
              <SectionLabel>WHAT YOU SAY</SectionLabel>
              {r.say.map((line) => (
                <SayLine key={line} text={`“${line}”`} />
              ))}
            </section>
            <p className="rounded-lg bg-navy px-2.5 py-2 text-center font-display text-xs font-semibold tracking-wide text-gold">
              If it is not your colour, do not reach in.
            </p>
            <Note>
              <span className="font-semibold text-navy">On the PEAP poster: </span>
              {r.fifa}
            </Note>
            {fifaRoleCards[r.id] ? <FifaCard id={r.id} /> : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function FifaCard({ id }: { id: keyof typeof fifaRoleCards }) {
  const c = fifaRoleCards[id];
  if (!c) return null;
  const groups: [string, string[] | undefined][] = [
    ["In trauma", c.trauma],
    ["In a log roll", c.logRoll],
    ["In cardiac arrest", c.arrest],
    ["Your role", c.general],
  ];
  return (
    <section className="rounded-lg border border-line bg-cream px-3 py-3">
      <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-navy">
        FROM FIFA'S ROLE CARD — SUMMARY
      </p>
      <p className="mt-1 text-sm font-medium leading-snug">{c.who}</p>
      {groups.map(([title, items]) =>
        items?.length ? (
          <div key={title} className="mt-2.5">
            <p className="text-xs font-semibold text-navy">{title}</p>
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-4 text-sm leading-snug marker:text-gold">
              {items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <a
        href={FIFA_ROLE_CARDS_PDF}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-navy underline underline-offset-2"
      >
        Open FIFA's role cards (PDF, on FIFA's website)
      </a>
    </section>
  );
}
