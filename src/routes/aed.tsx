import { createFileRoute, Link } from "@tanstack/react-router";
import { AedTrainer } from "@/components/aed-trainer";
import { AppShell, Note, Panel, SayLine, SectionLabel } from "@/components/workshop";

export const Route = createFileRoute("/aed")({
  component: AedPage,
  head: () => ({ meta: [{ title: "AED pads trainer · Pitchside Emergency Care" }] }),
});

const more = "inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink";

function AedPage() {
  return (
    <AppShell tab="drill" heading="AED pads trainer">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-heading">Practise the AED as Green 6. </span>
          Expose the chest, place both pads, hands off for the analysis, call everyone clear, then shock — against the clock, with
          the AED talking you through it.
        </Note>
        <Panel>
          <AedTrainer />
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <SectionLabel>WHERE THE PADS GO</SectionLabel>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-snug marker:text-gold">
              <li>One pad below the right collarbone, beside the breastbone.</li>
              <li>The other below the left armpit, in the mid-axillary line (anterolateral position).</li>
              <li>Apply the AED as soon as it arrives — do not wait for the current 30-count. Red keeps compressing while the pads go on.</li>
            </ul>
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <SectionLabel>SAFE DEFIBRILLATION</SectionLabel>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-snug marker:text-gold">
              <li>Analysis: hands off.</li>
              <li>
                Shock advised: Green checks that everyone is clear and that oxygen is removed — it can stay on a closed loop such as an
                i-gel — then shocks.
              </li>
              <li>After the shock: no pulse check. Restart compressions at once. Rhythm check every 2 minutes; swap the person compressing.</li>
            </ul>
            <SayLine text="Green: “I'm clear, you're clear, everyone's clear!”" voice="green-1" />
            <SayLine text="Green: “Shock delivered.”" voice="green-2" />
          </div>
        </Panel>
        <Panel>
          <div className="flex flex-col px-3.5 py-2">
            <Link to="/drill" className={more}>
              The whole team drill in 3D →
            </Link>
            <Link to="/fifa" className={more}>
              Sudden cardiac arrest — FIFA's key points →
            </Link>
            <Link to="/role/$id" params={{ id: "green" }} className={more}>
              Green 6 · equipment, bag and AED →
            </Link>
          </div>
        </Panel>
        <Note>
          A practice aid, not a real defibrillator: the rhythm, timings and prompts are simplified. Follow your own AED's prompts and
          FIFA's current documents.
        </Note>
      </div>
    </AppShell>
  );
}
