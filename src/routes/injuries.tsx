import { createFileRoute } from "@tanstack/react-router";
import { InjuryMap } from "@/components/injury-map";
import { AppShell, Panel } from "@/components/workshop";

export const Route = createFileRoute("/injuries")({
  component: InjuriesPage,
  head: () => ({ meta: [{ title: "Injury map · tap where it hurts · Pitchside Emergency Care" }] }),
});

function InjuriesPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">PITCHSIDE INJURIES</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Tap where it hurts</h1>
            <p className="mt-1 text-sm text-gold-soft">
              What to check, what to do on the pitch and when the player comes off — with the Ottawa rules for the knee, ankle and
              foot, and a clock for a knocked-out tooth.
            </p>
          </div>
          <div className="px-3.5 py-3.5">
            <InjuryMap />
          </div>
        </Panel>
        <p className="px-1 text-[11px] leading-snug text-muted">
          Sources: the FIFA Emergency Care Manual, chapter 6 (trauma emergencies); Ottawa ankle and knee rules (Stiell et al.),
          validated in sports medicine (Leddy et al., 1998); International Association of Dental Traumatology guidelines (2020);
          IFAB Laws of the Game, Law 5. A study aid: always follow your training and local protocols. Primary survey first —
          A-c-B-C-D-E — for any player who is down.
        </p>
      </div>
    </AppShell>
  );
}
