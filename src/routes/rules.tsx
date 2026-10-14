import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/rules")({
  component: Rules,
  head: () => ({ meta: [{ title: "Golden rules · Pitchside Emergency Care" }] }),
});

function Rules() {
  return (
    <AppShell tab="rules" heading="Golden rules">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>GOLDEN RULES</SectionLabel>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
              {workshop.timings.map((t, i) => (
                <div key={`${t.tag}-${i}`} className="contents">
                  <dt className="whitespace-nowrap rounded-full bg-navy px-2.5 py-1 text-center font-display text-[11px] font-semibold tracking-wide text-on-navy">
                    {t.tag}
                  </dt>
                  <dd className="text-sm leading-snug">{t.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>FIFA KEY POINTS</SectionLabel>
            {workshop.fifaNotes.map((line) => (
              <p key={line} className="text-sm leading-snug">
                {line}
              </p>
            ))}
            <Link
              to="/guides"
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold tracking-wide text-gold-ink"
            >
              <PlayCircle className="size-4" strokeWidth={2.2} />
              FIFA films and downloads
            </Link>
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>SOURCES</SectionLabel>
            <ul className="flex flex-col gap-1.5">
              {workshop.sources.map((s) => (
                <li key={s} className="text-sm leading-snug">
                  {s}
                </li>
              ))}
            </ul>
            <Note>{workshop.disclaimer}</Note>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
