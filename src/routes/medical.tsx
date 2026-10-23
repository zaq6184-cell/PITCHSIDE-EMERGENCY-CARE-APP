import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Briefcase, Candy, ChevronRight, ClipboardList, Hand, HeartPulse, type LucideIcon, Phone, Syringe, Wind } from "lucide-react";
import { AppShell, JumpChips, Note, Panel } from "@/components/workshop";
import { MEDICAL, MEDICAL_INTRO, MEDICAL_RULE, MEDICAL_TEAM, type MedicalCard, type MedicalId } from "@/lib/medical";

export const Route = createFileRoute("/medical")({
  component: MedicalPage,
  head: () => ({ meta: [{ title: "Medical emergencies · Pitchside Emergency Care" }] }),
});

const ICONS: Record<MedicalId, LucideIcon> = { anaphylaxis: Syringe, asthma: Wind, hypo: Candy, seizure: Activity, choking: Hand };
const CHIPS: Record<MedicalId, string> = { anaphylaxis: "Anaphylaxis", asthma: "Asthma", hypo: "Low blood sugar", seizure: "Seizure", choking: "Choking" };

const ROW = "flex items-center gap-3 px-3.5 py-3 active:bg-cream";

function RowBody({ Icon, label, sub }: { Icon: LucideIcon; label: string; sub: string }) {
  return (
    <>
      <Icon className="size-5 shrink-0 text-gold-ink" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold tracking-wide text-heading">{label}</span>
        <span className="block text-xs leading-snug text-muted">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
    </>
  );
}

/** A card's own small heading, styled like the section labels. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs font-semibold tracking-[0.14em] text-heading">
      {children}
      <span className="mt-1 block h-[3px] w-8 rounded-full bg-gold" aria-hidden="true" />
    </h3>
  );
}

function Card({ c }: { c: MedicalCard }) {
  const Icon = ICONS[c.id];
  return (
    <section id={`med-${c.id}`} className="scroll-mt-24">
      <Panel>
        <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-note text-gold-ink">
            <Icon className="size-6" aria-hidden />
          </span>
          <span className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-tight tracking-wide text-heading">{c.title}</h2>
            <span className="block text-xs leading-snug text-muted">{c.sub}</span>
          </span>
        </div>
        <div className="flex flex-col gap-3.5 px-3.5 py-3.5">
          <div>
            <Label>RECOGNISE</Label>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug marker:text-gold">
              {c.recognise.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <Label>WHAT TO DO</Label>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm leading-snug marker:font-semibold marker:text-gold-ink">
              {c.steps.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg bg-note px-3 py-2.5">
            <Label>IF TRAINED</Label>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug marker:text-gold">
              {c.trained.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 px-3 py-2 text-sm leading-snug">
            <Phone className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <span>
              <b>Call the ambulance:</b> {c.call}
            </span>
          </p>
          <Note>
            <b className="text-heading">In football:</b> {c.football}
          </Note>
          <p className="text-[11px] leading-snug text-muted">
            <span className="font-semibold">Source:</span> {c.source}
          </p>
        </div>
      </Panel>
    </section>
  );
}

function MedicalPage() {
  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <h1 className="font-display text-xl font-bold tracking-wide text-heading">Medical emergencies</h1>
            <p className="text-sm leading-snug">{MEDICAL_INTRO}</p>
            <p className="flex items-start gap-2.5 rounded-lg bg-danger-fill px-3 py-2.5 text-sm font-semibold leading-snug text-white">
              <HeartPulse className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>{MEDICAL_RULE}</span>
            </p>
            <p className="text-xs leading-snug text-muted">{MEDICAL_TEAM}</p>
          </div>
        </Panel>
        <JumpChips items={MEDICAL.map((c) => ({ id: `med-${c.id}`, label: CHIPS[c.id] }))} />
        {MEDICAL.map((c) => (
          <Card key={c.id} c={c} />
        ))}
        <Panel>
          <ul className="divide-y divide-line">
            <li>
              <Link to="/station/$id" params={{ id: "5" }} className={ROW}>
                <RowBody Icon={Briefcase} label="The drugs in the FIFA emergency bag" sub="Module 5 · emergency care bag" />
              </Link>
            </li>
            <li>
              <Link to="/handover" className={ROW}>
                <RowBody Icon={ClipboardList} label="Handover to the ambulance crew" sub="ATMIST, ready to read out or share" />
              </Link>
            </li>
            <li>
              <Link to="/arrest" className={ROW}>
                <RowBody Icon={HeartPulse} label="Arrest timer" sub="CPR clock · 2-minute checks · shock and drug log" />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
