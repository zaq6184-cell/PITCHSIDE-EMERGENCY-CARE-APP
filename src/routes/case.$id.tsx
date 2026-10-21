import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { CasePlayer } from "@/components/case-player";
import { ScenePicture } from "@/components/scene-picture";
import { AppShell, Panel } from "@/components/workshop";
import { getCase } from "@/lib/cases";
import { CASE_PICS } from "@/lib/scene-images";

export const Route = createFileRoute("/case/$id")({
  component: CasePage,
  head: ({ params }) => {
    const c = getCase(params.id);
    return { meta: [{ title: c ? `Case: ${c.title} · Pitchside Emergency Care` : "Case simulator · Pitchside Emergency Care" }] };
  },
});

function CasePage() {
  const { id } = Route.useParams();
  const c = getCase(id);
  if (!c) return <Navigate to="/cases" />;
  return (
    <AppShell tab="drill">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <ScenePicture pic={CASE_PICS[c.id]} />
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">CASE · {c.short.toUpperCase()}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">{c.title}</h1>
            <p className="mt-1 text-sm text-gold-soft">{c.setting}</p>
          </div>
        </Panel>
        <CasePlayer key={c.id} c={c} />
        <Link to="/cases" className="inline-flex min-h-11 items-center gap-1 self-start font-display text-sm font-semibold tracking-wide text-gold-ink">
          <ChevronLeft className="size-4" aria-hidden />
          All cases
        </Link>
      </div>
    </AppShell>
  );
}
