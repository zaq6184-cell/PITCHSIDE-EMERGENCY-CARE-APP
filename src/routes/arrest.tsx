import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ArrestTimer } from "@/components/arrest-timer";
import { AppShell, Note } from "@/components/workshop";

export const Route = createFileRoute("/arrest")({
  component: ArrestPage,
  head: () => ({ meta: [{ title: "Arrest timer · Pitchside Emergency Care" }] }),
});

function ArrestPage() {
  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Link to="/timer" className="inline-flex min-h-11 items-center gap-1.5 self-start font-display text-sm font-semibold tracking-wide text-gold-ink">
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          Tools
        </Link>
        <ArrestTimer />
        <Note>
          For drills, moulages and debriefs. Drug reminders are for teams trained in advanced life support. In a real
          emergency follow your protocol — the log is a memory aid, not a medical record. It stays on this device until you
          clear it.
        </Note>
      </div>
    </AppShell>
  );
}
