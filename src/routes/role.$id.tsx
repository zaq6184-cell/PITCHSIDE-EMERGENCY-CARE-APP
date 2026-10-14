import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { PositionDiagram } from "@/components/position-diagram";
import { roleIcons } from "@/components/role-icon";
import { AppShell, Note, Panel, SayLine, SectionLabel } from "@/components/workshop";
import { setTransitionDirection, useSwipe } from "@/lib/gestures";
import { roleImage } from "@/lib/role-images";
import { haptic } from "@/lib/sound";
import { getRole, isRoleId, workshop } from "@/lib/workshop";
import { FIFA_ROLE_CARDS_PDF, fifaRoleCards } from "@/lib/fifa-roles";

export const Route = createFileRoute("/role/$id")({
  component: RoleCard,
  head: ({ params }) => {
    const r = isRoleId(params.id) ? getRole(params.id) : undefined;
    return { meta: [{ title: r ? `${r.name.charAt(0)}${r.name.slice(1).toLowerCase()} · ${r.role} · Pitchside Emergency Care` : "Pitchside Emergency Care" }] };
  },
});

function RoleCard() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const roles = workshop.roles;
  const i = roles.findIndex((k) => k.id === id);
  const prev = roles[(i - 1 + roles.length) % roles.length];
  const next = roles[(i + 1) % roles.length];
  const go = (to: typeof next, dir: "forward" | "back") => {
    haptic(10);
    setTransitionDirection(dir);
    void navigate({ to: "/role/$id", params: { id: to.id } });
  };
  const swipe = useSwipe<HTMLDivElement>((d) => (d === "left" ? go(next, "forward") : go(prev, "back")));
  if (!isRoleId(id)) return <Navigate to="/" />;
  const r = getRole(id);
  if (!r) return <Navigate to="/" />;
  const RoleIcon = roleIcons[r.id];
  const pic = roleImage(r.id);

  return (
    <AppShell tab="home">
      <div ref={swipe} className="flex flex-col gap-3">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-gold-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          All colours
        </Link>
        <Panel>
          <div className="flare relative overflow-hidden bg-navy">
            <img
              key={pic.src}
              src={pic.src}
              alt={pic.alt}
              width={1280}
              height={720}
              className="kenburns img-in block aspect-video w-full object-cover outline-none"
            />
            <p className="absolute right-2 top-2 z-[1] rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
              AI-generated illustration
            </p>
          </div>
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
            <h1 className="font-display text-[1.7rem] font-bold leading-none tracking-[0.08em]">{r.name}</h1>
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
                  className="mt-2 inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink"
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
              {r.say.map((line, i) => (
                <SayLine key={line} text={`“${line}”`} voice={`${r.id}-${i + 1}`} />
              ))}
            </section>
            <p className="rounded-lg bg-navy px-2.5 py-2 text-center font-display text-xs font-semibold tracking-wide text-gold">
              If it is not your colour, do not reach in.
            </p>
            <Note>
              <span className="font-semibold text-heading">On the PEAP poster: </span>
              {r.fifa}
            </Note>
            {fifaRoleCards[r.id] ? <FifaCard id={r.id} /> : null}
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => go(prev, "back")}
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-paper px-3 py-2 text-left text-sm shadow-card active:scale-[0.98]"
          >
            <ChevronLeft className="size-4 shrink-0 text-gold-ink" aria-hidden />
            <span className="size-3 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: prev.color }} aria-hidden />
            <span className="truncate">{prev.name}</span>
          </button>
          <button
            type="button"
            onClick={() => go(next, "forward")}
            className="flex min-h-11 items-center justify-end gap-1.5 rounded-lg bg-paper px-3 py-2 text-right text-sm shadow-card active:scale-[0.98]"
          >
            <span className="truncate">{next.name}</span>
            <span className="size-3 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: next.color }} aria-hidden />
            <ChevronRight className="size-4 shrink-0 text-gold-ink" aria-hidden />
          </button>
        </div>
        <p className="text-center text-[11px] text-muted pointer-fine:hidden">Swipe left or right for the next colour.</p>
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
      <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-heading">
        FROM FIFA'S ROLE CARD — SUMMARY
      </p>
      <p className="mt-1 text-sm font-medium leading-snug">{c.who}</p>
      {groups.map(([title, items]) =>
        items?.length ? (
          <div key={title} className="mt-2.5">
            <p className="text-xs font-semibold text-heading">{title}</p>
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
        className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-heading underline underline-offset-2"
      >
        Open FIFA's role cards (PDF, on FIFA's website)
      </a>
    </section>
  );
}
