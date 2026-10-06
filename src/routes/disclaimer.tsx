import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell, Panel, SectionLabel } from "@/components/workshop";
import { disclaimer } from "@/lib/disclaimer";

export const Route = createFileRoute("/disclaimer")({ component: Disclaimer });

function Disclaimer() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1.5 self-start font-display text-sm font-semibold tracking-wide text-navy"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Home
        </Link>
        <Panel>
          <div className="flex flex-col gap-3 px-3.5 py-3.5">
            <SectionLabel>DISCLAIMER</SectionLabel>
            {disclaimer.paragraphs.map((p) => (
              <p key={p} className="text-sm leading-snug">
                {p}
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
