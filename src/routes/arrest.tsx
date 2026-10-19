import { createFileRoute } from "@tanstack/react-router";
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
