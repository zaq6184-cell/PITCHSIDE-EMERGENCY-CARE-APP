import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ChevronRight, Hand, HeartPulse, type LucideIcon, Snowflake, Stethoscope, ThermometerSnowflake, ThermometerSun, Wind } from "lucide-react";
import { AltitudePlanner } from "@/components/altitude-planner";
import { CareCardView } from "@/components/care-card";
import { ScenePicture } from "@/components/scene-picture";
import { AppShell, JumpChips, Panel, SectionLabel } from "@/components/workshop";
import { ALTITUDE, COLD, type EnvId, SHELTER } from "@/lib/environment";
import { MEDICAL_RULE } from "@/lib/medical";
import { ENVIRONMENT_PIC } from "@/lib/scene-images";

export const Route = createFileRoute("/environment")({
  component: EnvironmentPage,
  head: () => ({ meta: [{ title: "Cold and altitude · Pitchside Emergency Care" }] }),
});

const ICONS: Record<EnvId, LucideIcon> = {
  hypothermia: ThermometerSnowflake,
  frostbite: Hand,
  coldallergy: Snowflake,
  ams: Brain,
  hace: Brain,
  hape: Wind,
};

const ROW = "flex items-center gap-3 px-3.5 py-3 active:bg-cream";

function EnvironmentPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <ScenePicture pic={ENVIRONMENT_PIC} />
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <h1 className="font-display text-xl font-bold tracking-wide text-heading">Cold and altitude</h1>
            <p className="text-sm leading-snug">
              Chapter 9 of the FIFA Emergency Care Manual: cold injuries, and the illnesses of playing high above sea level. Heat illness
              has its own page.
            </p>
            <p className="flex items-start gap-2.5 rounded-lg bg-danger-fill px-3 py-2.5 text-sm font-semibold leading-snug text-white">
              <HeartPulse className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>{MEDICAL_RULE}</span>
            </p>
          </div>
        </Panel>
        <JumpChips
          items={[
            { id: "env-shelter", label: "Prevent cold injury" },
            { id: "env-hypothermia", label: "Hypothermia" },
            { id: "env-frostbite", label: "Frostbite" },
            { id: "env-planner", label: "Altitude planner" },
            { id: "env-ams", label: "Mountain sickness" },
            { id: "env-hace", label: "HACE" },
            { id: "env-hape", label: "HAPE" },
          ]}
        />

        <section id="env-shelter" className="scroll-mt-24">
          <Panel>
            <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
              <SectionLabel>PREVENT COLD INJURY · S.H.E.L.T.E.R.</SectionLabel>
              <ul className="flex flex-col gap-1.5">
                {SHELTER.map((s, i) => (
                  <li key={`${s.letter}${i}`} className="flex gap-2.5 text-sm leading-snug">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy font-display text-xs font-bold text-gold" translate="no">
                      {s.letter}
                    </span>
                    <span className="pt-0.5">{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </section>
        {COLD.map((c) => (
          <CareCardView key={c.id} c={c} anchor={`env-${c.id}`} icon={ICONS[c.id]} />
        ))}

        <section id="env-planner" className="scroll-mt-24">
          <Panel>
            <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
              <SectionLabel>ALTITUDE PLANNER</SectionLabel>
              <p className="text-sm leading-snug text-muted">Drag to the venue's altitude, or pick a city.</p>
              <AltitudePlanner />
            </div>
          </Panel>
        </section>
        {ALTITUDE.map((c) => (
          <CareCardView key={c.id} c={c} anchor={`env-${c.id}`} icon={ICONS[c.id]} />
        ))}

        <Panel>
          <ul className="divide-y divide-line">
            <li>
              <Link to="/heat" className={ROW}>
                <ThermometerSun className="size-5 shrink-0 text-gold-ink" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold tracking-wide text-heading">Heat illness</span>
                  <span className="block text-xs leading-snug text-muted">Heat risk · cool first, transport second</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
              </Link>
            </li>
            <li>
              <Link to="/medical" hash="med-anaphylaxis" className={ROW}>
                <Stethoscope className="size-5 shrink-0 text-gold-ink" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold tracking-wide text-heading">Medical emergencies</span>
                  <span className="block text-xs leading-snug text-muted">Anaphylaxis and asthma cards</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
              </Link>
            </li>
          </ul>
        </Panel>
        <p className="px-1 text-[11px] leading-snug text-muted">
          Sources: the FIFA Emergency Care Manual, chapter 9 (environmental emergencies: altitude illness and cold emergencies); FIFA
          consensus statement on playing football at different altitudes (2008); European Resuscitation Council Guidelines 2021. A
          study aid: follow your training and local protocols.
        </p>
      </div>
    </AppShell>
  );
}
