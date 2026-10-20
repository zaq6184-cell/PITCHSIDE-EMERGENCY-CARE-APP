import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ChevronRight, Droplets, Footprints, HeartPulse, Thermometer, Zap } from "lucide-react";
import { CoolingSimulator, WbgtDial } from "@/components/heat-tools";
import { AppShell, JumpChips, Panel, SectionLabel } from "@/components/workshop";

export const Route = createFileRoute("/heat")({
  component: HeatPage,
  head: () => ({ meta: [{ title: "Heat illness · cool first, transport second · Pitchside Emergency Care" }] }),
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Panel>
        <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
          <SectionLabel>{title}</SectionLabel>
          {children}
        </div>
      </Panel>
    </section>
  );
}

const SIGNS = [
  { icon: Brain, title: "Thinking changes", text: "Confused, irritable, aggressive, odd behaviour, not answering properly." },
  { icon: Footprints, title: "Staggering or collapse", text: "Unsteady, falls, or collapses — often late in a hot match or session." },
  { icon: Zap, title: "Seizure", text: "A fit or a fall in consciousness." },
  { icon: Thermometer, title: "Rectal temperature above 40 °C", text: "The only reliable reading after exercise. Oral, ear, forehead and armpit readings miss heat stroke." },
  { icon: HeartPulse, title: "Fast pulse, low blood pressure", text: "Breathing fast; the skin may still be sweating — wet skin does not rule it out." },
];

function HeatPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">HEAT ILLNESS</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Exertional heat stroke — cool first, transport second</h1>
            <p className="mt-1 text-sm text-gold-soft">The heat emergency that kills on the pitch — and is survivable when cold-water cooling starts at once.</p>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 px-3.5 py-3 pl-8 text-sm leading-snug marker:text-gold">
            <li>Suspect it in any player who collapses or behaves oddly in the heat.</li>
            <li>Measure a rectal temperature: above 40 °C with a change in thinking is heat stroke.</li>
            <li>Cool in stirred cold water until about 39 °C — then transport. Call the ambulance at once, but cooling comes first.</li>
          </ul>
        </Panel>

        <JumpChips
          items={[
            { id: "heat-risk", label: "Heat risk today" },
            { id: "heat-signs", label: "Spot it" },
            { id: "heat-cool", label: "Cool first" },
            { id: "heat-setup", label: "Set up the tub" },
            { id: "heat-dont", label: "Do not" },
          ]}
        />

        <Section id="heat-risk" title="HEAT RISK TODAY">
          <p className="text-sm leading-snug text-muted">
            WBGT combines air temperature, humidity, sun and wind. Measure it at the pitch before kick-off and again at half-time,
            then drag the reading.
          </p>
          <WbgtDial />
        </Section>

        <Section id="heat-signs" title="SPOT EXERTIONAL HEAT STROKE">
          <ul className="flex flex-col gap-2">
            {SIGNS.map((s) => (
              <li key={s.title} className="flex gap-3 rounded-lg bg-note px-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-chart-1/15 text-chart-1">
                  <s.icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 text-sm leading-snug">
                  <span className="block font-semibold text-heading">{s.title}</span>
                  {s.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="rounded-lg border-l-4 border-gold bg-cream px-3 py-2 text-sm leading-snug">
            <span className="font-semibold text-heading">Heat exhaustion: </span>tired, dizzy, sick or with cramps, but thinking clearly
            and a temperature below 40 °C — shade, cooling and fluids. Any change in thinking: treat it as heat stroke.
          </p>
        </Section>

        <Section id="heat-cool" title="COOL FIRST, TRANSPORT SECOND">
          <p className="text-sm leading-snug text-muted">
            The aim is below 39 °C within 30 minutes of the collapse; the time spent above 40.5 °C is what damages the brain, kidneys
            and liver. Pick a method and where cooling starts, then run the clock.
          </p>
          <CoolingSimulator />
        </Section>

        <Section id="heat-setup" title="SET UP COLD-WATER IMMERSION">
          <ol className="flex flex-col gap-2">
            {[
              "On hot days, before kick-off: a tub (or a tarp), water and plenty of ice at the pitch, a rectal thermometer, towels and a sheet.",
              "Call the ambulance — then cool. Take off the kit quickly and lower the player into the water up to the neck, head out, supported under the armpits with a sheet or towel.",
              "Ice water, about 2–15 °C. Keep stirring it and keep adding ice.",
              "Rectal temperature every 5 minutes; a probe left in place is best.",
              "Out of the water at about 39 °C, so the player does not overcool. Dry, keep checking, then transfer to hospital.",
              "No tub? Ice water in a tarp held around the player, or ice-water towels over the whole body, swapped every few minutes.",
            ].map((line, i) => (
              <li key={line} className="flex gap-2.5 text-sm leading-snug">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy font-display text-xs font-bold text-gold">{i + 1}</span>
                <span className="pt-0.5">{line}</span>
              </li>
            ))}
          </ol>
          <Link
            to="/station/$id"
            params={{ id: "5" }}
            hash="s-local-checklist-heat-environment"
            className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-gold/60 bg-note px-3 py-2 text-sm leading-snug"
          >
            <span>
              <span className="block font-display font-semibold tracking-wide text-heading">The heat kit for the bag</span>
              <span className="block text-muted">Module 5 · local checklist · heat and environment</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
          </Link>
        </Section>

        <Section id="heat-dont" title="DO NOT">
          <ul className="flex flex-col gap-1.5 text-sm leading-snug">
            {[
              "Wait for the ambulance before cooling.",
              "Trust an oral, ear, forehead or armpit temperature.",
              "Give paracetamol or ibuprofen — they do not lower the temperature in heat stroke and can do harm.",
              "Rely on ice packs at the neck, armpits and groin on their own — far too slow.",
              "Let the player go back on the same day.",
            ].map((line) => (
              <li key={line} className="flex gap-2 rounded-lg bg-danger/8 px-3 py-2">
                <Droplets className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        <p className="px-1 text-[11px] leading-snug text-muted">
          Sources: NATA position statement on exertional heat illnesses; ACSM expert consensus statement on exertional heat illness
          (2023); ILCOR first-aid review of cooling techniques; Society of Critical Care Medicine heat stroke guidance; FIFPRO heat
          guidelines (2023); FIFA's World Cup 2026 hydration breaks. A study aid — follow your competition's rules and local
          protocols.
        </p>
      </div>
    </AppShell>
  );
}
